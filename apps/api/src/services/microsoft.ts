import { ConfidentialClientApplication, InteractionRequiredAuthError } from "@azure/msal-node";
import { AppError } from "../lib/AppError";
import { requiredEnv } from "../lib/config";
import { database } from "../lib/database";
import { decrypt, encrypt } from "../lib/encryption";

export const microsoftScopes = ["openid", "profile", "offline_access", "User.Read", "Calendars.ReadWrite"];

export function microsoftClient() {
  const tenant = requiredEnv("MICROSOFT_TENANT_ID");
  if (!/^[0-9a-f-]{36}$/i.test(tenant)) throw new AppError(503, "Configure a specific Microsoft tenant GUID.");
  return new ConfidentialClientApplication({ auth: {
    clientId: requiredEnv("MICROSOFT_CLIENT_ID"),
    authority: `https://login.microsoftonline.com/${tenant}`,
    clientSecret: requiredEnv("MICROSOFT_CLIENT_SECRET"),
  } });
}

export class GraphError extends AppError {
  constructor(public readonly graphStatus: number) {
    super(graphStatus === 401 ? 401 : graphStatus === 403 ? 403 : graphStatus === 429 ? 429 : 502,
      graphStatus === 401 ? "Reconnect your Microsoft account." :
      graphStatus === 403 ? "Microsoft denied calendar access. Check consent and calendar sharing with IT." :
      graphStatus === 429 ? "Microsoft is busy. Try again shortly." : "Microsoft could not complete the calendar request. Retry to reconcile its status.");
  }
}

export async function graphRequest<T>(token: string, path: string, method = "GET", body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Prefer: 'outlook.timezone="UTC", IdType="ImmutableId"' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new AppError(502, "Microsoft did not respond. Retry the saved operation to check or complete it.");
  }
  if (!response.ok) throw new GraphError(response.status);
  const text = await response.text();
  return text ? JSON.parse(text) as T : undefined as T;
}

export async function accessToken(employeeId: number): Promise<string> {
  const connection = await database().microsoftAccount.findUnique({ where: { employeeId } });
  if (!connection?.connected || !connection.encryptedCache) throw new AppError(401, "Connect your Microsoft account first.");
  const client = microsoftClient();
  client.getTokenCache().deserialize(decrypt(connection.encryptedCache));
  const account = await client.getTokenCache().getAccountByHomeId(connection.homeAccountId);
  if (!account) throw new AppError(401, "Reconnect your Microsoft account.");
  try {
    const result = await client.acquireTokenSilent({ account, scopes: microsoftScopes });
    await database().microsoftAccount.updateMany({
      where: { employeeId, connected: true, homeAccountId: connection.homeAccountId },
      data: { encryptedCache: encrypt(client.getTokenCache().serialize()) },
    });
    return result.accessToken;
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) throw new AppError(401, "Microsoft requires you to reconnect your account.");
    throw error;
  }
}
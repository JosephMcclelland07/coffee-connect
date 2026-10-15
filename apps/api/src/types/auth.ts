export type AppRole = "employee" | "hr_admin";

export interface AuthUser {
  id: string;
  role: AppRole;
}

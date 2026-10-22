"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
	const router = useRouter();
	const [pending, setPending] = useState(false);
	const [error, setError] = useState("");

	async function logout() {
		setPending(true);
		setError("");
		try {
			const response = await fetch("/api/auth", { method: "DELETE" });
			if (!response.ok) throw new Error("Unable to log out.");
			router.push("/login");
			router.refresh();
		} catch {
			setError("Unable to log out. Please try again.");
		} finally {
			setPending(false);
		}
	}

	return (
		<div>
			<button className="button-light" type="button" onClick={logout} disabled={pending}>
				{pending ? "Logging out…" : "Log out"}
			</button>
			{error && <p role="alert">{error}</p>}
		</div>
	);
}

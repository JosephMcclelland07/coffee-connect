"use client";

import { useEffect, useState, type FormEvent } from "react";
import styles from "./login.module.css";

type Account = { id: number; name: string; email: string };

export default function LoginPage() {
	const [mode, setMode] = useState<"login" | "register">("login");
	const [account, setAccount] = useState<Account | null>(null);
	const [pending, setPending] = useState(false);
	const [error, setError] = useState("");
	const [message, setMessage] = useState("");

	useEffect(() => {
		const controller = new AbortController();
		fetch("/api/auth", { signal: controller.signal })
			.then(async (response) => {
				if (response.ok) setAccount((await response.json()).account);
			})
			.catch(() => {});
		return () => controller.abort();
	}, []);

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = event.currentTarget;
		const fields = new FormData(form);
		const password = String(fields.get("password") || "");
		setError("");
		setMessage("");
		if (new TextEncoder().encode(password).length > 72) {
			setError("Password must be at most 72 UTF-8 bytes.");
			return;
		}
		setPending(true);
		try {
			const response = await fetch("/api/auth", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ mode, name: fields.get("name"), email: fields.get("email"), password }),
			});
			const result = await response.json();
			if (!response.ok) throw new Error(result.error || "Unable to submit.");
			form.reset();
			if (mode === "register") {
				setMode("login");
				setMessage("Account created. Log in to continue.");
			} else {
				setAccount(result.account);
			}
		} catch (failure) {
			setError(failure instanceof Error ? failure.message : "Unable to submit. Please try again.");
		} finally {
			setPending(false);
		}
	}

	async function logout() {
		setPending(true);
		setError("");
		try {
			const response = await fetch("/api/auth", { method: "DELETE" });
			if (!response.ok) throw new Error("Unable to log out.");
			setAccount(null);
		} catch {
			setError("Unable to log out. Please try again.");
		} finally {
			setPending(false);
		}
	}

	return (
		<main className={styles.page}>
			<header className={styles.header}>
				<p className={styles.brandName}>Coffee Connect</p>
				<div className={styles.logo} role="img" aria-label="PA logo with upside-down lettering">
					<span className={styles.disc} aria-hidden="true">
						<span className={styles.letters}>PA</span>
					</span>
					<span className={styles.bubbleLarge} aria-hidden="true" />
					<span className={styles.bubbleMedium} aria-hidden="true" />
					<span className={styles.bubbleSmall} aria-hidden="true" />
				</div>
			</header>
			<section className={styles.loginPanel} aria-labelledby="login-title">
				<div className={styles.formWrap}>
					<p className={styles.kicker}>YOUR ACCOUNT</p>
					<h1 id="login-title">{account ? `Welcome, ${account.name}` : mode === "register" ? "Create account" : "Log in"}</h1>
					{error && <p role="alert">{error}</p>}
					{message && <p role="status">{message}</p>}
					{account ? (
						<>
							<p className={styles.intro}>{account.email}</p>
							<button className={styles.submitButton} type="button" disabled={pending} onClick={logout}>Log out</button>
						</>
					) : (
					<>
					<p className={styles.intro}>{mode === "register" ? "Join Coffee Connect." : "Welcome back. Sign in to continue."}</p>
					<form className={styles.form} method="post" onSubmit={submit}>
						{mode === "register" && (
							<label className={styles.field}>
								Name
								<input name="name" autoComplete="name" maxLength={200} required disabled={pending} />
							</label>
						)}
						<label className={styles.field}>
							Email
							<input
								id="email"
								name="email"
								type="email"
								autoComplete="email"
								pattern="[^\s@]+@[pP][aA][cC][oO][nN][sS][uU][lL][tT][iI][nN][gG][.][cC][oO][mM]"
								title="Use your @paconsulting.com email address"
								maxLength={255}
								disabled={pending}
								required
							/>
						</label>
						<label className={styles.field}>
							Password
							<input
								id="password"
								name="password"
								type="password"
								autoComplete={mode === "register" ? "new-password" : "current-password"}
								minLength={12}
								disabled={pending}
								required
							/>
						</label>
						<button className={styles.submitButton} type="submit" disabled={pending}>
							{pending ? "Please wait..." : mode === "register" ? "Create account" : "Log in"}
						</button>
					</form>
					<button className={styles.modeButton} type="button" disabled={pending} onClick={() => {
						setMode(mode === "login" ? "register" : "login");
						setError("");
						setMessage("");
					}}>{mode === "login" ? "Create account" : "Back to log in"}</button>
					</>
					)}
				</div>
			</section>
		</main>
	);
}
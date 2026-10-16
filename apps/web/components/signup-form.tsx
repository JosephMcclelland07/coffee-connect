"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import styles from "../app/login/login.module.css";
import { PROFILE_SETUP_PENDING_KEY } from "../lib/profile-flow";

export default function SignupForm() {
	const router = useRouter();
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [errorMessage, setErrorMessage] = useState("");
	const [pending, setPending] = useState(false);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setErrorMessage("");
		if (password !== confirmPassword) {
			setErrorMessage("Your passwords do not match.");
			return;
		}
		if (password.length < 12 || new TextEncoder().encode(password).length > 72) {
			setErrorMessage("Password must be at least 12 characters and at most 72 UTF-8 bytes.");
			return;
		}
		const fields = new FormData(event.currentTarget);

		setPending(true);
		try {
			const response = await fetch("/api/auth", {
				method: "POST", headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ mode: "register", name: fields.get("name"), email: fields.get("email"), password }),
			});
			const result = await response.json();
			if (!response.ok) throw new Error(result.error || "Account creation failed.");
			window.localStorage.setItem(PROFILE_SETUP_PENDING_KEY, "true");
			router.push("/login?registered=1");
		} catch (failure) {
			setErrorMessage(failure instanceof Error ? failure.message : "Account creation failed. Please try again.");
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
			<section className={styles.loginPanel} aria-labelledby="signup-title">
				<div className={styles.formWrap}>
					<p className={styles.kicker}>YOUR ACCOUNT</p>
					<h1 id="signup-title">Create an account</h1>
					<p className={styles.intro}>Sign up, then set up your Coffee Connect profile.</p>
					<form className={styles.form} onSubmit={handleSubmit}>
						<label className={styles.field}>
							Name
							<input
								id="name"
								name="name"
								type="text"
								autoComplete="name"
								maxLength={200}
								disabled={pending}
								required
							/>
						</label>
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
								autoComplete="new-password"
								minLength={12}
								disabled={pending}
								required
								value={password}
								onChange={(event) => setPassword(event.target.value)}
							/>
						</label>
						<label className={styles.field}>
							Confirm password
							<input
								id="confirm-password"
								name="confirmPassword"
								type="password"
								autoComplete="new-password"
								minLength={12}
								disabled={pending}
								required
								value={confirmPassword}
								onChange={(event) => setConfirmPassword(event.target.value)}
							/>
						</label>
						{errorMessage && (
							<p className={styles.errorMessage} role="alert">{errorMessage}</p>
						)}
						<button className={styles.submitButton} type="submit" disabled={pending}>
							{pending ? "Creating account..." : "Sign up"}
						</button>
					</form>
					<Link className={styles.signupLink} href="/login">
						Already a member? Log in
					</Link>
				</div>
			</section>
		</main>
	);
}
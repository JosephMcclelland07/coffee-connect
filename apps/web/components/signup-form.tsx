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

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (password !== confirmPassword) {
			setErrorMessage("Your passwords do not match.");
			return;
		}

		try {
			window.localStorage.setItem(PROFILE_SETUP_PENDING_KEY, "true");
			router.push("/profile/setup");
		} catch {
			setErrorMessage("Could not start profile setup in this browser.");
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
								minLength={8}
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
								minLength={8}
								required
								value={confirmPassword}
								onChange={(event) => setConfirmPassword(event.target.value)}
							/>
						</label>
						{errorMessage && (
							<p className={styles.errorMessage} role="alert">{errorMessage}</p>
						)}
						<button className={styles.submitButton} type="submit">
							Sign up
						</button>
					</form>
					<p className={styles.prototypeNote}>
						Preview flow only. Account creation will be connected when authentication is ready;
						your password is not stored.
					</p>
					<Link className={styles.signupLink} href="/login">
						Already a member? Log in
					</Link>
				</div>
			</section>
		</main>
	);
}
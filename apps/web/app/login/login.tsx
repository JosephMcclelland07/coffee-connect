import Link from "next/link";
import styles from "./login.module.css";

export default function LoginPage() {
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
					<h1 id="login-title">Log in</h1>
					<p className={styles.intro}>Welcome back. Sign in to continue.</p>
					<a className={styles.submitButton} href="/api/coffee/auth/microsoft/connect">
						Sign in with Microsoft
					</a>
					<Link className={styles.signupLink} href="/signup">
						Not a member? Sign up!
					</Link>
				</div>
			</section>
		</main>
	);
}
import Link from "next/link";
import { headers } from "next/headers";

const validAuthRoles = new Set(["employee", "hr_admin"]);

type SiteHeaderProps = {
	activePage: "home" | "meetups" | "personal";
};

export async function SiteHeader({ activePage }: SiteHeaderProps) {
	const isHome = activePage === "home";
	const isMeetups = activePage === "meetups";
	const isPersonal = activePage === "personal";
	const requestHeaders = await headers();
	const userId = requestHeaders.get("x-user-id");
	const userRole = requestHeaders.get("x-user-role");
	const isLoggedIn = Boolean(userId && userRole && validAuthRoles.has(userRole));

	return (
		<header className="site-header">
			<div className="page-width header-inner">
				<Link className="wordmark" href={isHome ? "#home" : "/"}>
					Coffee Connect
				</Link>
				<nav className="site-nav" aria-label="Main navigation">
					<Link
						className="nav-link"
						href={isHome ? "#home" : "/"}
						aria-current={isHome ? "page" : undefined}
					>
						Home
					</Link>
					<Link
						className="nav-link"
						href={isMeetups ? "#meetups" : "/meetups"}
						aria-current={isMeetups ? "page" : undefined}
					>
						Meetups
					</Link>
					<Link
						className="nav-link"
						href={isPersonal ? "#personal" : "/personal"}
						aria-current={isPersonal ? "page" : undefined}
					>
						Personal
					</Link>
					<Link className="signup-link" href={isLoggedIn ? "/login" : "/signup"}>
						{isLoggedIn ? "Sign out" : "Sign up"}
					</Link>
				</nav>
			</div>
		</header>
	);
}

export function SiteFooter() {
	return (
		<footer className="site-footer">
			<div className="page-width footer-inner">
				<Link className="wordmark" href="/">
					Coffee Connect
				</Link>
				<p>Make time for a good cup and a good conversation.</p>
			</div>
		</footer>
	);
}
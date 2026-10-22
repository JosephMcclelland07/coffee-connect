import Link from "next/link";
import BrandLogo from "../components/brand-logo";

type SiteHeaderProps = {
	activePage: "home" | "meetups" | "accounts";
};

export async function SiteHeader({ activePage }: SiteHeaderProps) {
	const isHome = activePage === "home";
	const isMeetups = activePage === "meetups";

	return (
		<header className="site-header">
			<div className="page-width header-inner">
				<Link className="brand-logo-link" href={isHome ? "#home" : "/"} aria-label="Coffee Connect home">
					<BrandLogo />
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
					<Link className="signup-link" href="/accounts">
						Accounts
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
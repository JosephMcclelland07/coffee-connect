import Link from "next/link";

type SiteHeaderProps = {
	activePage: "home" | "meetups";
};

export function SiteHeader({ activePage }: SiteHeaderProps) {
	const isHome = activePage === "home";
	const isMeetups = activePage === "meetups";

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
					<Link className="nav-link" href={isMeetups ? "#personal" : "/meetups#personal"}>
						Personal
					</Link>
					<Link className="signup-link" href={isHome ? "#join" : "/#join"}>
						Sign up
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
import Link from "next/link";
import { SiteFooter, SiteHeader } from "../site-chrome";

export default function MeetupsPage() {
	return (
		<>
			<SiteHeader activePage="meetups" />
			<main>
				<section className="meetups-section" id="meetups">
					<div className="page-width">
						<div className="section-heading meetup-page-heading">
							<p className="eyebrow">Coffee Connect</p>
							<h1>Meetups</h1>
						</div>
						<div className="meetups-layout">
							<div className="meetups-overview">
								<h2>What are they?</h2>
								<p>
									Meetups bring people together for a relaxed conversation over
									a cup of coffee. The name wheel will select participants once
									names are added for an event.
								</p>
								<Link className="text-link" href="/#how-it-works">
									How it works <span aria-hidden="true">→</span>
								</Link>
							</div>
							<div
								className="wheel-panel"
								role="img"
								aria-label="An empty spin wheel; meetup names will be added later"
							>
								<div className="name-wheel" aria-hidden="true">
									<div className="wheel-center">CC</div>
								</div>
								<p className="wheel-caption">Names will appear here when a meetup is set up.</p>
							</div>
						</div>
					</div>
				</section>

				<section className="personal-section" id="personal">
					<div className="page-width personal-inner">
						<div>
							<p className="eyebrow">A more personal kind of meetup</p>
							<h2>Your coffee. Your kind of conversation.</h2>
						</div>
						<p>
							Bring your interests and curiosity. Leave room for a new connection.
						</p>
					</div>
				</section>

				<section className="meetups-join page-width">
					<p className="eyebrow">Ready when you are</p>
					<h2>Find your next coffee conversation.</h2>
					<Link className="button-primary" href="/#join">Join Coffee Connect</Link>
				</section>
			</main>
			<SiteFooter />
		</>
	);
}
import Link from "next/link";
import { SiteFooter, SiteHeader } from "../site-chrome";
import SpinWheel from "../../components/spin-wheel";

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
                                    This is where you will select the next person to meet up with. Spin now to find your next person with similar interests
								</p>
								<Link className="text-link" href="/#how-it-works">
									How it works <span aria-hidden="true">→</span>
								</Link>
							</div>
							<div className="wheel-panel">
								<SpinWheel />
								<p className="wheel-caption" id="wheel-caption">
									Click the wheel to spin a preview. Names will be added later.
								</p>
							</div>
						</div>
					</div>
				</section>

				<section className="upcoming-section" id="upcoming-meetups">
					<div className="page-width">
						<div className="upcoming-heading">
							<p className="eyebrow">Your schedule</p>
							<h2>Upcoming meetups</h2>
						</div>
						<div className="upcoming-empty" role="status">
							<p className="upcoming-empty-title">No upcoming meetups yet</p>
							<p>
								When you have a meetup scheduled, its details will appear here.
							</p>
						</div>
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
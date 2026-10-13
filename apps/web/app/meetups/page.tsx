import Link from "next/link";
import { headers } from "next/headers";
import { SiteFooter, SiteHeader } from "../site-chrome";
import SpinWheel from "../../components/spin-wheel";
import MeetupChat from "../../components/meetup-chat";

	const validAuthRoles = new Set(["employee", "hr_admin"]);

const demoMeetup = {
	otherPersonName: "Jordan Lee",
	date: "Saturday, 24 October 2026",
	time: "10:30 am",
	location: "Example Coffee House, Sample Street",
	messages: [
		{
			id: "demo-1",
			from: "contact" as const,
			text: "Looking forward to meeting up. Does 10:30 still work for you?",
			time: "9:14 am",
		},
		{
			id: "demo-2",
			from: "you" as const,
			text: "Yes, see you there!",
			time: "9:21 am",
		},
	],
};

export default async function MeetupsPage() {
	const requestHeaders = await headers();
	const userId = requestHeaders.get("x-user-id");
	const userRole = requestHeaders.get("x-user-role");
	const isLoggedIn = Boolean(userId && userRole && validAuthRoles.has(userRole));

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
						<div className="upcoming-meetup">
							<div className="meetup-details">
								<p className="eyebrow">Demo meetup</p>
								<h3 className="meetup-person-name">
									{demoMeetup.otherPersonName}
								</h3>
								<dl className="meetup-facts">
									<div>
										<dt>Date</dt>
										<dd>{demoMeetup.date}</dd>
									</div>
									<div>
										<dt>Time</dt>
										<dd>{demoMeetup.time}</dd>
									</div>
									<div className="meetup-fact-location">
										<dt>Location</dt>
										<dd>{demoMeetup.location}</dd>
									</div>
								</dl>
							</div>
							<MeetupChat
								contactName={demoMeetup.otherPersonName}
								initialMessages={demoMeetup.messages}
							/>
						</div>
					</div>
				</section>

				{!isLoggedIn && (
					<section className="meetups-join page-width">
						<p className="eyebrow">Ready when you are</p>
						<h2>Find your next coffee conversation.</h2>
						<Link className="button-primary" href="/signup">Join Coffee Connect</Link>
					</section>
				)}
			</main>
			<SiteFooter />
		</>
	);
}
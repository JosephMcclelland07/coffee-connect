import Link from "next/link";
import { headers } from "next/headers";
import { SiteFooter, SiteHeader } from "../site-chrome";
import OutlookCalendar from "../../components/outlook-calendar";

const validAuthRoles = new Set(["employee", "hr_admin"]);

const demoPreviousMeetups = [
	{
		id: "past-1",
		personName: "Maya Patel",
		date: "Saturday, 12 September 2026",
		location: "Greenhouse Cafe",
	},
	{
		id: "past-2",
		personName: "Chris Morgan",
		date: "Saturday, 15 August 2026",
		location: "Northstar Coffee",
	},
	{
		id: "past-3",
		personName: "Priya Shah",
		date: "Saturday, 18 July 2026",
		location: "Corner Cup",
	},
];

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
							<h1>Your Meetups</h1>
						</div>
					</div>
				</section>

				<section className="meetups-dashboard-section" id="outlook-calendar">
					<div className="page-width">
						<div className="meetups-dashboard-heading">
							<div>
								<h2>Find time for a coffee</h2>
								<p>View your Outlook calendar, find a free slot, and book a coffee meetup with someone new.</p>
							</div>
						</div>
						<OutlookCalendar />
					</div>
				</section>

				<section className="previous-section" id="previous-meetups">
					<div className="page-width">
						<div className="past-meetups-heading">
							<div>
								<h2>Past Meetups</h2>
								<p>Who you’ve met with</p>
							</div>
						</div>
						<ul className="previous-meetups-list">
							{demoPreviousMeetups.map((meetup) => (
								<li className="previous-meetup" key={meetup.id}>
									<div>
										<p className="eyebrow">Completed</p>
										<h3>{meetup.personName}</h3>
									</div>
									<dl className="previous-meetup-facts">
										<div>
											<dt>Date</dt>
											<dd>{meetup.date}</dd>
										</div>
										<div>
											<dt>Location</dt>
											<dd>{meetup.location}</dd>
										</div>
									</dl>
								</li>
							))}
						</ul>
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
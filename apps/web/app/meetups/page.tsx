import { SiteFooter, SiteHeader } from "../site-chrome";
import OutlookCalendar from "../../components/outlook-calendar";
import SpinWheel from "../../components/spin-wheel";
import MeetupChat from "../../components/meetup-chat";

const validAuthRoles = new Set(["employee", "hr_admin"]);

const demoPeople = [
	{
		id: "employee-1",
		name: "Jordan Lee",
		interests: ["Hiking", "Board games", "AI", "Coffee"],
	},
	{
		id: "employee-2",
		name: "Priya Shah",
		interests: ["Running", "Travel", "Coffee", "Design"],
	},
	{
		id: "employee-3",
		name: "Sam Osei",
		interests: ["AI", "Travel", "Cooking", "Coffee"],
	},
	{
		id: "employee-4",
		name: "Alex Chen",
		interests: ["Photography", "Travel", "Hiking", "Film"],
	},
	{
		id: "employee-5",
		name: "Maya Patel",
		interests: ["Books", "Yoga", "Cooking", "Design"],
	},
	{
		id: "employee-6",
		name: "Chris Morgan",
		interests: ["Music", "Football", "Podcasts", "Coffee"],
	},
	{
		id: "employee-7",
		name: "Nina Rossi",
		interests: ["Cycling", "AI", "Travel", "Books"],
	},
	{
		id: "employee-8",
		name: "Leo Turner",
		interests: ["Gaming", "Board games", "Film", "Cooking"],
	},
	{
		id: "employee-9",
		name: "You",
		interests: ["Coffee", "AI", "Travel", "Board games"],
	},
];

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

	const currentUser = demoPeople.find((person) => person.id === userId) ?? demoPeople[demoPeople.length - 1];
	const wheelPeople = demoPeople.filter((person) => person.id !== currentUser.id);

export default function MeetupsPage() {
	return (
		<>
			<SiteHeader activePage="meetups" />
			<main className="page-width" id="meetups">
				<div className="section-heading meetup-page-heading">
					<p className="eyebrow">Coffee Connect</p>
					<h1>Meetups</h1>
				</div>
				<OutlookCalendar />
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
								<SpinWheel
									currentUserId={currentUser.id}
									currentUserInterests={currentUser.interests}
									people={[currentUser, ...wheelPeople]}
								/>
								<p className="wheel-caption" id="wheel-caption">
									Rigged to stop on the person with the most shared interests. If top
									matches tie, the winner is selected with secure randomness.
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

				<section className="previous-section" id="previous-meetups">
					<div className="page-width">
						<div className="upcoming-heading">
							<p className="eyebrow">Your history</p>
							<h2>Previous meetups</h2>
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
import { SiteFooter, SiteHeader } from "../site-chrome";
import OutlookCalendar from "../../components/outlook-calendar";

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
			</main>
			<SiteFooter />
		</>
	);
}
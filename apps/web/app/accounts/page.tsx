import { SiteFooter, SiteHeader } from "../site-chrome";
import InterestProfile from "../../components/interest-profile";
import LogoutButton from "../../components/logout-button";

export const metadata = {
	title: "Accounts | Coffee Connect",
	description: "Manage your Coffee Connect interests and account profile.",
};

export default function AccountsPage() {
	return (
		<>
			<SiteHeader activePage="accounts" />
			<main className="personal-page page-width" id="accounts">
				<header className="personal-page-heading">
					<p className="eyebrow">Your profile</p>
					<h1>Your interests</h1>
					<p>
						Select the hobbies you enjoy and add anything missing. Your interests
						can help shape future meetup matches.
					</p>
					<LogoutButton />
				</header>
				<InterestProfile />
			</main>
			<SiteFooter />
		</>
	);
}
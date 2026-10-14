import { SiteFooter, SiteHeader } from "../site-chrome";
import InterestProfile from "../../components/interest-profile";

export const metadata = {
	title: "Your interests | Coffee Connect",
	description: "Choose interests for your Coffee Connect meetup profile.",
};

export default function PersonalPage() {
	return (
		<>
			<SiteHeader activePage="personal" />
			<main className="personal-page page-width" id="personal">
				<header className="personal-page-heading">
					<p className="eyebrow">Your profile</p>
					<h1>Your interests</h1>
					<p>
						Select the hobbies you enjoy and add anything missing. Your interests
						can help shape future meetup matches.
					</p>
				</header>
				<InterestProfile />
			</main>
			<SiteFooter />
		</>
	);
}
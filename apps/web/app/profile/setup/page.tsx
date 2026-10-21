import InterestProfile from "../../../components/interest-profile";
import BrandLogo from "../../../components/brand-logo";

export const metadata = {
	title: "Create your profile | Coffee Connect",
	description: "Set up your Coffee Connect interests and availability.",
};

export default function ProfileSetupPage() {
	return (
		<>
			<header className="profile-setup-header page-width">
				<BrandLogo />
				<span>Profile setup</span>
			</header>
			<main className="personal-page page-width" id="personal">
				<header className="personal-page-heading">
					<p className="eyebrow">One last step</p>
					<h1>Create your profile</h1>
					<p>
						Add a few interests and your usual availability so Coffee Connect can
						help find people you may enjoy meeting.
					</p>
				</header>
				<InterestProfile mode="setup" />
			</main>
		</>
	);
}
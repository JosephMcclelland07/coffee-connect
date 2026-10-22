import Link from "next/link";
import { cookies } from "next/headers";
import { Coffee, MessageCircle, UsersRound } from "lucide-react";
import HomeSpinGate from "../components/home-spin-gate";
import HomeSpinButton from "../components/home-spin-button";
import { SiteFooter, SiteHeader } from "./site-chrome";

type HomeWheelPerson = { id: string; name: string; interests: string[]; categories: string[] };
type HomeWheelData = { accountId: string; people: HomeWheelPerson[] };

async function loadHomeWheelData(): Promise<HomeWheelData | null> {
	try {
		const cookieStore = await cookies();
		const sessionCookie = cookieStore.get("cc.sid")?.value;
		const token = cookieStore.get("coffee_connect_session")?.value;
		const apiHeaders = new Headers();
		if (sessionCookie) apiHeaders.set("cookie", `cc.sid=${sessionCookie}`);
		if (token) apiHeaders.set("authorization", `Bearer ${token}`);

		const apiOrigin = process.env.API_ORIGIN || process.env.API_URL || "http://127.0.0.1:4000";
		const accountResponse = await fetch(`${apiOrigin}/me`, { headers: apiHeaders, cache: "no-store" });
		if (!accountResponse.ok) return null;
		const accountPayload = await accountResponse.json() as { account?: { id?: number } };
		if (!accountPayload.account?.id) return null;

		const peopleResponse = await fetch(`${apiOrigin}/scheduler/people`, { headers: apiHeaders, cache: "no-store" });
		if (!peopleResponse.ok) return null;
		const people = await peopleResponse.json() as HomeWheelPerson[];
		if (!Array.isArray(people)) return null;

		return { accountId: String(accountPayload.account.id), people };
	} catch {
		return null;
	}
}

export default async function HomePage() {
	const homeWheelData = await loadHomeWheelData();
	const currentPerson = homeWheelData?.people.find((person) => person.id === homeWheelData.accountId);
	const canSpinOnHome = Boolean(homeWheelData && currentPerson);

	return (
		<>
			<SiteHeader activePage="home" />

			<main>
				<section className="hero page-width" id="home">
					<div className="hero-copy">
						<p className="eyebrow">Coffee Connect</p>
						<h1>Good coffee.<br />Great conversations.</h1>
						<p className="hero-description">
							Take a spin and meet someone new. Coffee Connect pairs you with another person for an easy, informal coffee chat, turning unfamiliar faces into new connections.
						</p>
						<div className="hero-actions">
							<HomeSpinButton className="button-primary" canSpin={canSpinOnHome}>Spin the wheel</HomeSpinButton>
							<Link className="text-link" href="#how-it-works">See how it works <span aria-hidden="true">↓</span></Link>
						</div>
					</div>
					<div className="hero-wheel-wrap" id="home-wheel">
						{homeWheelData && currentPerson ? (
							<>
								<HomeSpinGate
									currentUserId={homeWheelData.accountId}
									currentUserInterests={currentPerson.interests}
									currentUserCategories={currentPerson.categories}
									people={homeWheelData.people}
								/>
								<Link className="hero-spin-link" href="/meetups">Your meetups</Link>
							</>
						) : (
							<div className="home-wheel-empty">
								<p>Sign in to see your colleagues and spin.</p>
								<Link className="hero-spin-link" href="/login">Sign in</Link>
							</div>
						)}
					</div>
				</section>

				<section className="steps-band" id="how-it-works">
					<div className="page-width steps-section">
						<div className="section-heading">
							<p className="eyebrow">How it works</p>
							<h2>Three steps. One new connection.</h2>
							<p>No awkward intros. Just spin, match and grab a coffee.</p>
						</div>
						<div className="steps-grid">
							<article className="step-item">
								<span className="step-number">01</span>
								<Coffee className="step-icon" aria-hidden="true" />
								<h3>Spin the wheel</h3>
								<p>Let Coffee Connect choose who you meet.</p>
							</article>
							<article className="step-item">
								<span className="step-number">02</span>
								<UsersRound className="step-icon" aria-hidden="true" />
								<h3>Meet your match</h3>
								<p>See your match and learn a little about them first.</p>
							</article>
							<article className="step-item">
								<span className="step-number">03</span>
								<MessageCircle className="step-icon" aria-hidden="true" />
								<h3>Grab a coffee</h3>
								<p>Arrange a meetup, pick a drink and start the conversation.</p>
							</article>
						</div>
					</div>
				</section>

				<section className="join-section" id="join">
					<div className="page-width join-inner">
						<div>
							<p className="eyebrow">Ready to meet someone new?</p>
							<h2>Your next great conversation could be one spin away.</h2>
						</div>
						<HomeSpinButton className="button-light" canSpin={canSpinOnHome}>Spin the wheel <span aria-hidden="true">→</span></HomeSpinButton>
					</div>
				</section>
			</main>

			<SiteFooter />
		</>
	);
}
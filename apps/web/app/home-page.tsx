import Image from "next/image";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "./site-chrome";

export default function HomePage() {
	return (
		<>
			<SiteHeader activePage="home" />

			<main>
				<section className="hero page-width" id="home">
					<div className="hero-copy">
						<p className="eyebrow">Good coffee. Good company.</p>
						<h1>Welcome to Coffee Connect!</h1>
						<p className="hero-description">
							Find your next favourite conversation, one cup at a time.
						</p>
						<Link className="button-primary" href="/meetups">Meet up Now!</Link>
					</div>
					<div className="hero-image-wrap">
						<Image
							className="hero-image"
							src="/coffee-hero.jpg"
							alt="A cup of coffee surrounded by roasted coffee beans"
							width={1800}
							height={940}
							priority
							sizes="(max-width: 760px) 100vw, 1320px"
						/>
					</div>
				</section>

				<section className="steps-section page-width" id="how-it-works">
					<div className="section-heading">
						<p className="eyebrow">How it works</p>
						<h2>Three steps to a better coffee break.</h2>
					</div>
					<div className="steps-grid">
						<article className="step-item">
							<span className="step-number">01</span>
							<h3>Fill in your interests</h3>
							<p>Make your interests known so the wheel can find your next coffee companion.</p>
						</article>
						<article className="step-item">
							<span className="step-number">02</span>
							<h3>Spin the wheel</h3>
							<p>Spin the wheel to find your next coffee companion.</p>
						</article>
						<article className="step-item">
							<span className="step-number">03</span>
							<h3>Meet over coffee</h3>
							<p>Show up, settle in, and enjoy a real conversation, make new friends.</p>
						</article>
					</div>
				</section>

				<section className="join-section" id="join">
					<div className="page-width join-inner">
						<div>
							<p className="eyebrow">Your next coffee is waiting</p>
							<h2>Good coffee is even better shared.</h2>
						</div>
						<Link className="button-light" href="/meetups">Explore meetups</Link>
					</div>
				</section>
			</main>

			<SiteFooter />
		</>
	);
}
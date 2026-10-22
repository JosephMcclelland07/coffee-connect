"use client";

import Link from "next/link";

type Props = {
	className: string;
	canSpin: boolean;
	children: React.ReactNode;
};

const HOME_SPIN_EVENT = "coffee-connect:spin-home-wheel";

export default function HomeSpinButton({ className, canSpin, children }: Props) {
	if (!canSpin) {
		return (
			<Link className={className} href="/login">
				{children}
			</Link>
		);
	}

	return (
		<button
			type="button"
			className={className}
			onClick={() => {
				document.getElementById("home-wheel")?.scrollIntoView({ behavior: "smooth", block: "center" });
				window.dispatchEvent(new Event(HOME_SPIN_EVENT));
			}}
		>
			{children}
		</button>
	);
}

export { HOME_SPIN_EVENT };

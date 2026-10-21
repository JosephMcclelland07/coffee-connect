"use client";

import { type CSSProperties, type TransitionEvent, useMemo, useState } from "react";
import { selectWeightedPerson, sharedCategoryCount, sharedInterestCount, topMatchPeople } from "@coffee-connect/matching";

type WheelPerson = {
	id: string;
	name: string;
	interests: string[];
	categories?: string[];
};

type SpinWheelProps = {
	currentUserId: string;
	currentUserInterests: string[];
	currentUserCategories?: string[];
	people: WheelPerson[];
	resolveWinner?: () => Promise<string>;
};

type SpinResult = {
	name: string;
	sharedInterests: number;
	sharedCategories: number;
};

const MAX_VISIBLE_WHEEL_PEOPLE = 8;
const WHEEL_SEGMENT_COLORS = [
	{ background: "#c96c49", label: "#fffaf4" },
	{ background: "#899273", label: "#39271f" },
	{ background: "#e6c4a1", label: "#39271f" },
	{ background: "#755043", label: "#fffaf4" },
	{ background: "#d98965", label: "#39271f" },
	{ background: "#dce2d1", label: "#39271f" },
	{ background: "#edcfad", label: "#39271f" },
	{ background: "#886052", label: "#fffaf4" },
];

const CONFETTI_COLORS = ["#c92f2b", "#e78b0b", "#0968b0", "#2f7d63", "#6f1daa"];
const showWheelDebugPercentages = process.env.NEXT_PUBLIC_SHOW_WHEEL_DEBUG_PERCENTAGES === "1";
const CONFETTI_PIECES = Array.from({ length: 36 }, (_, index) => ({
	id: index,
	color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
	driftX: `${((index * 53) % 361) - 180}px`,
	driftY: `${70 + ((index * 29) % 151)}px`,
	rotation: `${((index * 113) % 720) - 360}deg`,
	delay: `${(index % 8) * 18}ms`,
}));

export default function SpinWheel({ currentUserId, currentUserInterests, currentUserCategories = [], people, resolveWinner }: SpinWheelProps) {
	const [rotation, setRotation] = useState(0);

	const [spinResult, setSpinResult] = useState<SpinResult | null>(null);
	const [pendingSpinResult, setPendingSpinResult] = useState<SpinResult | null>(null);
	const [isSpinning, setIsSpinning] = useState(false);
	const [error, setError] = useState("");
	const [confettiBurst, setConfettiBurst] = useState(0);

	const candidatePeople = useMemo(
		() => people.filter((person) => person.id !== currentUserId),
		[currentUserId, people],
	);
	const visiblePeople = useMemo(
		() => topMatchPeople(people, currentUserId, currentUserInterests, currentUserCategories, MAX_VISIBLE_WHEEL_PEOPLE),
		[currentUserCategories, currentUserId, currentUserInterests, people],
	);

	const wheelSegments = useMemo(() => {
		const segmentSize = 360 / visiblePeople.length;

		return visiblePeople.map((person, index) => {
			const angle = segmentSize / 2 + index * segmentSize;
			const radialTextAngle = angle - 90;
			const readableTextAngle =
				radialTextAngle > 90
					? radialTextAngle - 180
					: radialTextAngle < -90
						? radialTextAngle + 180
						: radialTextAngle;

			return {
				...person,
				angle,
				segmentColor: WHEEL_SEGMENT_COLORS[index % WHEEL_SEGMENT_COLORS.length],
				textRotation: readableTextAngle - angle,
			};
		});
	}, [visiblePeople]);
	const wheelBackground = wheelSegments.length
		? `conic-gradient(${wheelSegments.map(({ segmentColor }, index) => {
			const segmentSize = 360 / wheelSegments.length;
			return `${segmentColor.background} ${index * segmentSize}deg ${(index + 1) * segmentSize}deg`;
		}).join(", ")})`
		: "#ead9ca";
	const debugPercentages = useMemo(() => {
		const weighted = visiblePeople.map((person) => {
			const sharedInterests = sharedInterestCount(currentUserInterests, person.interests);
			const weight = 1 + sharedInterests;
			return { id: person.id, name: person.name, sharedInterests, weight };
		});
		const totalWeight = weighted.reduce((sum, person) => sum + person.weight, 0);
		if (totalWeight < 1) return [];
		return weighted.map((person) => ({
			...person,
			percentage: (person.weight / totalWeight) * 100,
		}));
	}, [currentUserInterests, visiblePeople]);

	async function spinWheel() {
		if (wheelSegments.length === 0 || isSpinning) {
			return;
		}

		const winner = selectWeightedPerson(visiblePeople, currentUserId, currentUserInterests, undefined, currentUserCategories);
		if (!winner) return;
		setIsSpinning(true);
		setError("");
		let winningCandidate = winner;
		if (resolveWinner) {
			try {
				const winnerId = await resolveWinner();
				const serverWinner = visiblePeople.find((candidate) => candidate.id === winnerId);
				if (!serverWinner) throw new Error("The colleague list changed. Refresh and spin again.");
				winningCandidate = {
					person: serverWinner,
					sharedInterests: sharedInterestCount(currentUserInterests, serverWinner.interests),
					sharedCategories: sharedCategoryCount(currentUserCategories, serverWinner.categories ?? []),
					weight: winner.weight,
				};
			} catch (caught) {
				setError(caught instanceof Error ? caught.message : "Could not save your match.");
				setIsSpinning(false);
				return;
			}
		}

		const peopleForSpin = visiblePeople;
		const winnerIndex = peopleForSpin.findIndex((person) => person.id === winningCandidate.person.id);
		if (winnerIndex < 0) {
			setError("The selected colleague is no longer on the wheel. Refresh and spin again.");
			setIsSpinning(false);
			return;
		}

		setSpinResult(null);

		const turnsBeforeStop = 5;
		setRotation((currentRotation) => {
			const normalizedCurrentRotation = ((currentRotation % 360) + 360) % 360;
			const segmentSize = 360 / peopleForSpin.length;
			const winnerAngle = segmentSize / 2 + winnerIndex * segmentSize;
			const targetStopRotation = (360 - winnerAngle) % 360;
			const finalTurnAmount =
				turnsBeforeStop * 360 +
				((targetStopRotation - normalizedCurrentRotation + 360) % 360);

			return currentRotation + finalTurnAmount;
		});

		setPendingSpinResult({
			name: winningCandidate.person.name,
			sharedInterests: winningCandidate.sharedInterests,
			sharedCategories: winningCandidate.sharedCategories,
		});
	}

	function handleWheelTransitionEnd(event: TransitionEvent<HTMLSpanElement>) {
		if (event.target !== event.currentTarget || event.propertyName !== "transform" || !isSpinning) {
			return;
		}

		setSpinResult(pendingSpinResult);
		if (pendingSpinResult) {
			setConfettiBurst((currentBurst) => currentBurst + 1);
		}
		setPendingSpinResult(null);
		setIsSpinning(false);
	}

	return (
		<>
			<button
				type="button"
				className="spin-wheel-control"
				aria-label="Spin the meetup wheel"
				aria-describedby={spinResult ? "wheel-caption" : undefined}
				onClick={spinWheel}
				disabled={isSpinning || candidatePeople.length === 0}
			>
				<span className="spin-wheel-pointer" aria-hidden="true" />
				<span
					className="name-wheel"
					aria-hidden="true"
					style={{ transform: `rotate(${rotation}deg)`, background: wheelBackground }}
					onTransitionEnd={handleWheelTransitionEnd}
				>
					{wheelSegments.map(({ id, name, angle, segmentColor, textRotation }) => (
						<span
							key={id}
							className="wheel-name"
							style={{
								color: segmentColor.label,
								transform: `rotate(${angle}deg) translateY(-31cqw) rotate(${textRotation}deg) translate(-50%, -50%)`,
							}}
						>
							{name}
						</span>
					))}
					<span className="wheel-center">CC</span>
				</span>
				{confettiBurst > 0 && (
					<span className="wheel-confetti" key={confettiBurst} aria-hidden="true">
						{CONFETTI_PIECES.map((piece) => (
							<span
								className="wheel-confetti-piece"
								key={piece.id}
								style={{
									backgroundColor: piece.color,
									animationDelay: piece.delay,
									"--confetti-drift-x": piece.driftX,
									"--confetti-drift-y": piece.driftY,
									"--confetti-rotation": piece.rotation,
								} as CSSProperties}
							/>
						))}
					</span>
				)}
			</button>
			{spinResult && (
				<p className="wheel-caption" id="wheel-caption" role="status">
					Matched with <strong>{spinResult.name}</strong> ({spinResult.sharedInterests} shared interest{spinResult.sharedInterests === 1 ? "" : "s"}, {spinResult.sharedCategories} shared categor{spinResult.sharedCategories === 1 ? "y" : "ies"}).
				</p>
			)}
			{candidatePeople.length > MAX_VISIBLE_WHEEL_PEOPLE && (
				<p className="wheel-caption">Showing your top {visiblePeople.length} closest colleagues.</p>
			)}
			{candidatePeople.length === 0 && <p className="wheel-caption">No other active colleagues are available yet.</p>}
			{showWheelDebugPercentages && debugPercentages.length > 0 && (
				<div>
					<p className="wheel-caption"><strong>Debug only:</strong> weighted spin percentages (shared interests only)</p>
					<ul>
						{debugPercentages.map((person) => (
							<li key={person.id}>
								{person.name}: {person.percentage.toFixed(2)}% ({person.sharedInterests} shared interest{person.sharedInterests === 1 ? "" : "s"})
							</li>
						))}
					</ul>
				</div>
			)}
			{error && <p role="alert">{error}</p>}
		</>
	);
}

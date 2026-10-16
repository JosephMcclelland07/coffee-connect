"use client";

import { type CSSProperties, type TransitionEvent, useMemo, useState } from "react";

type WheelPerson = {
	id: string;
	name: string;
	interests: string[];
};

type SpinWheelProps = {
	currentUserId: string;
	currentUserInterests: string[];
	people: WheelPerson[];
};

type SpinResult = {
	name: string;
	sharedInterests: number;
	wasTieBreak: boolean;
};

const CONFETTI_COLORS = ["#c92f2b", "#e78b0b", "#0968b0", "#2f7d63", "#6f1daa"];
const CONFETTI_PIECES = Array.from({ length: 36 }, (_, index) => ({
	id: index,
	color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
	driftX: `${((index * 53) % 361) - 180}px`,
	driftY: `${70 + ((index * 29) % 151)}px`,
	rotation: `${((index * 113) % 720) - 360}deg`,
	delay: `${(index % 8) * 18}ms`,
}));

function getCryptographicRandomIndex(size: number) {
	if (size <= 1) {
		return 0;
	}

	const maxUint32 = 2 ** 32 - 1;
	const moduloBiasThreshold = maxUint32 - ((maxUint32 + 1) % size);
	const randomBuffer = new Uint32Array(1);

	while (true) {
		crypto.getRandomValues(randomBuffer);
		const randomValue = randomBuffer[0];

		if (randomValue <= moduloBiasThreshold) {
			return randomValue % size;
		}
	}
}

function normaliseInterest(interest: string) {
	return interest.trim().toLowerCase();
}

export default function SpinWheel({ currentUserId, currentUserInterests, people }: SpinWheelProps) {
	const [rotation, setRotation] = useState(0);
	const [spinResult, setSpinResult] = useState<SpinResult | null>(null);
	const [pendingSpinResult, setPendingSpinResult] = useState<SpinResult | null>(null);
	const [isSpinning, setIsSpinning] = useState(false);
	const [confettiBurst, setConfettiBurst] = useState(0);

	const candidatePeople = useMemo(
		() => people.filter((person) => person.id !== currentUserId),
		[currentUserId, people],
	);

	const wheelSegments = useMemo(() => {
		const segmentSize = 360 / candidatePeople.length;

		return candidatePeople.map((person, index) => {
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
				isOrangeSegment: index % 4 === 2,
				textRotation: readableTextAngle - angle,
			};
		});
	}, [candidatePeople]);

	function spinWheel() {
		if (wheelSegments.length === 0 || isSpinning) {
			return;
		}

		const currentInterests = new Set(currentUserInterests.map(normaliseInterest));
		const scoredPeople = wheelSegments.map((person) => {
			const sharedInterests = person.interests.reduce((count, interest) => {
				return currentInterests.has(normaliseInterest(interest)) ? count + 1 : count;
			}, 0);

			return { person, sharedInterests };
		});

		const bestSharedInterestCount = Math.max(...scoredPeople.map((score) => score.sharedInterests));
		const topMatches = scoredPeople.filter(
			(score) => score.sharedInterests === bestSharedInterestCount,
		);
		const winningCandidate = topMatches[getCryptographicRandomIndex(topMatches.length)];

		setSpinResult(null);
		setIsSpinning(true);

		const turnsBeforeStop = 5;
		setRotation((currentRotation) => {
			const normalizedCurrentRotation = ((currentRotation % 360) + 360) % 360;
			const targetStopRotation = (360 - winningCandidate.person.angle) % 360;
			const finalTurnAmount =
				turnsBeforeStop * 360 +
				((targetStopRotation - normalizedCurrentRotation + 360) % 360);

			return currentRotation + finalTurnAmount;
		});

		setPendingSpinResult({
			name: winningCandidate.person.name,
			sharedInterests: winningCandidate.sharedInterests,
			wasTieBreak: topMatches.length > 1,
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
				aria-describedby="wheel-caption"
				onClick={spinWheel}
				disabled={isSpinning}
			>
				<span className="spin-wheel-pointer" aria-hidden="true" />
				<span
					className="name-wheel"
					aria-hidden="true"
					style={{ transform: `rotate(${rotation}deg)` }}
					onTransitionEnd={handleWheelTransitionEnd}
				>
					{wheelSegments.map(({ id, name, angle, isOrangeSegment, textRotation }) => (
						<span
							key={id}
							className={`wheel-name${isOrangeSegment ? " wheel-name--dark" : ""}`}
							style={{
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
				<p className="wheel-caption">
					Matched with <strong>{spinResult.name}</strong> ({spinResult.sharedInterests} shared
					 interest{spinResult.sharedInterests === 1 ? "" : "s"})
					{spinResult.wasTieBreak ? " • tie broken with secure random selection" : ""}.
				</p>
			)}
		</>
	);
}

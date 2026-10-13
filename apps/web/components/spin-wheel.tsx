"use client";

import { useState } from "react";

export default function SpinWheel() {
	const [rotation, setRotation] = useState(0);
	const names = Array.from({ length: 8 }, (_, index) => ({
		label: `Name ${index + 1}`,
		angle: 22.5 + index * 45,
		isOrangeSegment: index % 4 === 2,
	})).map((name) => {
		const radialTextAngle = name.angle - 90;
		const readableTextAngle =
			radialTextAngle > 90
				? radialTextAngle - 180
				: radialTextAngle < -90
					? radialTextAngle + 180
					: radialTextAngle;

		return { ...name, textRotation: readableTextAngle - name.angle };
	});

	function spinWheel() {
		setRotation((currentRotation) => currentRotation + 1800 + Math.random() * 360);
	}

	return (
		<button
			type="button"
			className="spin-wheel-control"
			aria-label="Spin the meetup wheel preview"
			aria-describedby="wheel-caption"
			onClick={spinWheel}
		>
			<span className="spin-wheel-pointer" aria-hidden="true" />
			<span
				className="name-wheel"
				aria-hidden="true"
				style={{ transform: `rotate(${rotation}deg)` }}
			>
				{names.map(({ label, angle, isOrangeSegment, textRotation }) => (
					<span
						key={label}
						className={`wheel-name${isOrangeSegment ? " wheel-name--dark" : ""}`}
						style={{
							transform: `rotate(${angle}deg) translateY(-108px) rotate(${textRotation}deg)`,
						}}
					>
						{label}
					</span>
				))}
				<span className="wheel-center">CC</span>
			</span>
		</button>
	);
}
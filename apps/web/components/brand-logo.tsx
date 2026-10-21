import Image from "next/image";

type BrandLogoProps = {
	size?: "navigation" | "account";
};

export default function BrandLogo({ size = "navigation" }: BrandLogoProps) {
	return (
		<span className={`brand-lockup brand-lockup--${size}`}>
			<Image
				className={`bright-media-logo bright-media-logo--${size}`}
				src="/bright-media-logo.svg"
				alt="Bright Media"
				width={768}
				height={768}
				priority
			/>
			<span className="brand-lockup-name">Coffee Connect</span>
		</span>
	);
}

"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PROFILE_SETUP_PENDING_KEY, PROFILE_STORAGE_KEY } from "../lib/profile-flow";
const MAX_INTERESTS = 3;

const SUGGESTED_INTERESTS = [
	"Coffee & cafes",
	"Books & reading",
	"Walking & hiking",
	"Live music",
	"Food & cooking",
	"Art & museums",
	"Board games",
	"Films & cinema",
	"Gaming",
	"Fitness & sports",
	"Photography",
	"Travel",
];

const OFFICE_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

type SavedInterestProfile = {
	interests: string[];
	customInterests: string[];
	officeDays: string[];
	availableFrom: string;
	availableUntil: string;
	profileComplete: boolean;
};

type InterestProfileProps = {
	mode?: "setup" | "edit";
};

export default function InterestProfile({ mode = "edit" }: InterestProfileProps) {
	const router = useRouter();
	const [interests, setInterests] = useState<string[]>([]);
	const [customInterests, setCustomInterests] = useState<string[]>([]);
	const [officeDays, setOfficeDays] = useState<string[]>([]);
	const [availableFrom, setAvailableFrom] = useState("");
	const [availableUntil, setAvailableUntil] = useState("");
	const [customInterest, setCustomInterest] = useState("");
	const [statusMessage, setStatusMessage] = useState("");
	const [isLoaded, setIsLoaded] = useState(false);

	useEffect(() => {
		try {
			if (mode === "setup" && window.localStorage.getItem(PROFILE_SETUP_PENDING_KEY) !== "true") {
				router.replace("/login");
				return;
			}

			const savedProfile = window.localStorage.getItem(PROFILE_STORAGE_KEY);
			if (savedProfile) {
				const parsed = JSON.parse(savedProfile) as Partial<SavedInterestProfile>;
				if (Array.isArray(parsed.interests)) {
					setInterests(parsed.interests.slice(0, MAX_INTERESTS));
				}
				if (Array.isArray(parsed.customInterests)) {
					setCustomInterests(parsed.customInterests);
				}
				if (Array.isArray(parsed.officeDays)) {
					setOfficeDays(parsed.officeDays.filter((day) => typeof day === "string"));
				}
				if (typeof parsed.availableFrom === "string") {
					setAvailableFrom(parsed.availableFrom);
				}
				if (typeof parsed.availableUntil === "string") {
					setAvailableUntil(parsed.availableUntil);
				}
			}
		} catch {
			setStatusMessage("Saved interests could not be loaded.");
		} finally {
			setIsLoaded(true);
		}
	}, [mode, router]);

	function toggleInterest(interest: string) {
		if (!interests.includes(interest) && interests.length >= MAX_INTERESTS) {
			setStatusMessage(`You can select up to ${MAX_INTERESTS} interests.`);
			return;
		}

		setInterests((current) =>
			current.includes(interest)
				? current.filter((item) => item !== interest)
				: [...current, interest],
		);
		setStatusMessage("");
	}

	function toggleOfficeDay(day: string) {
		setOfficeDays((current) =>
			current.includes(day)
				? current.filter((item) => item !== day)
				: [...current, day],
		);
		setStatusMessage("");
	}

	function addCustomInterest() {
		const value = customInterest.trim();
		if (!value) return;
		if (interests.length >= MAX_INTERESTS) {
			setStatusMessage(`You can select up to ${MAX_INTERESTS} interests.`);
			return;
		}

		const exists = [...SUGGESTED_INTERESTS, ...customInterests].some(
			(interest) => interest.toLowerCase() === value.toLowerCase(),
		);
		if (exists) {
			setStatusMessage("That interest is already listed.");
			return;
		}

		setCustomInterests((current) => [...current, value]);
		setInterests((current) => [...current, value]);
		setCustomInterest("");
		setStatusMessage("");
	}

	function saveProfile(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (mode === "setup" && interests.length === 0) {
			setStatusMessage("Choose at least one interest to finish your profile.");
			return;
		}

		if (Boolean(availableFrom) !== Boolean(availableUntil)) {
			setStatusMessage("Enter both available times, or leave both blank.");
			return;
		}
		if (availableFrom && availableUntil <= availableFrom) {
			setStatusMessage("Your end time must be later than your start time.");
			return;
		}

		const profile: SavedInterestProfile = {
			interests,
			customInterests,
			officeDays,
			availableFrom,
			availableUntil,
			profileComplete: interests.length > 0,
		};

		try {
			window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
			if (mode === "setup") {
				window.localStorage.removeItem(PROFILE_SETUP_PENDING_KEY);
				router.push("/meetups");
			} else {
				setStatusMessage("Profile saved in this browser. Calendar syncing can be connected later.");
			}
		} catch {
			setStatusMessage("Interests could not be saved in this browser.");
		}
	}

	const allInterests = [...SUGGESTED_INTERESTS, ...customInterests];

	return (
		<form className="interest-form" onSubmit={saveProfile}>
			<fieldset className="interest-fieldset" disabled={!isLoaded}>
				<legend>Hobbies and interests</legend>
				<p className="interest-help">Choose up to {MAX_INTERESTS} interests.</p>
				<div className="interest-options">
					{allInterests.map((interest, index) => {
						const inputId = `interest-${index}`;
						const isSelected = interests.includes(interest);
						return (
							<label
								className={`interest-option${isSelected ? " is-selected" : ""}`}
								key={interest}
								htmlFor={inputId}
							>
								<input
									id={inputId}
									type="checkbox"
									checked={isSelected}
									disabled={!isSelected && interests.length >= MAX_INTERESTS}
									onChange={() => toggleInterest(interest)}
								/>
								<span>{interest}</span>
							</label>
						);
					})}
				</div>
			</fieldset>

			<fieldset className="availability-fieldset" disabled={!isLoaded}>
				<legend>Office days</legend>
				<p className="interest-help">Choose the weekdays you are usually in the office.</p>
				<div className="availability-days">
					{OFFICE_DAYS.map((day) => {
						const inputId = `office-day-${day.toLowerCase()}`;
						const isSelected = officeDays.includes(day);
						return (
							<label
								className={`availability-day${isSelected ? " is-selected" : ""}`}
								key={day}
								htmlFor={inputId}
							>
								<input
									id={inputId}
									type="checkbox"
									checked={isSelected}
									onChange={() => toggleOfficeDay(day)}
								/>
								<span>{day.slice(0, 3)}</span>
							</label>
						);
					})}
				</div>
			</fieldset>

			<section className="availability-hours" aria-labelledby="availability-hours-title">
				<h2 id="availability-hours-title">Available hours</h2>
				<p className="interest-help">Set a usual time window for meeting up.</p>
				<div className="availability-time-controls">
					<label htmlFor="available-from">
						From
						<input
							id="available-from"
							type="time"
							value={availableFrom}
							disabled={!isLoaded}
							onChange={(event) => {
								setAvailableFrom(event.target.value);
								setStatusMessage("");
							}}
						/>
					</label>
					<span aria-hidden="true">to</span>
					<label htmlFor="available-until">
						Until
						<input
							id="available-until"
							type="time"
							value={availableUntil}
							disabled={!isLoaded}
							onChange={(event) => {
								setAvailableUntil(event.target.value);
								setStatusMessage("");
							}}
						/>
					</label>
				</div>
			</section>

			<div className="custom-interest">
				<label htmlFor="custom-interest-input">Add another interest</label>
				<div className="custom-interest-controls">
					<input
						id="custom-interest-input"
						value={customInterest}
						onChange={(event) => setCustomInterest(event.target.value)}
						maxLength={40}
						disabled={!isLoaded || interests.length >= MAX_INTERESTS}
						placeholder="e.g. pottery"
					/>
					<button
						type="button"
						onClick={addCustomInterest}
						disabled={!isLoaded || interests.length >= MAX_INTERESTS || !customInterest.trim()}
					>
						Add
					</button>
				</div>
			</div>

			<footer className="interest-form-footer">
				<p aria-live="polite" role="status">
					{statusMessage || `${interests.length} of ${MAX_INTERESTS} interests selected`}
				</p>
				<button className="button-primary" type="submit" disabled={!isLoaded}>
					{mode === "setup" ? "Save and continue" : "Save interests"}
				</button>
			</footer>
		</form>
	);
}
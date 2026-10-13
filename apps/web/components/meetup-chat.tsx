"use client";

import { useState, type FormEvent } from "react";

type MeetupMessage = {
	id: string;
	from: "contact" | "you";
	text: string;
	time: string;
};

type MeetupChatProps = {
	contactName: string;
	initialMessages: MeetupMessage[];
};

export default function MeetupChat({ contactName, initialMessages }: MeetupChatProps) {
	const [messages, setMessages] = useState(initialMessages);
	const [draft, setDraft] = useState("");

	function sendMessage(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const text = draft.trim();

		if (!text) return;

		setMessages((currentMessages) => [
			...currentMessages,
			{ id: `local-${Date.now()}`, from: "you", text, time: "Now" },
		]);
		setDraft("");
	}

	return (
		<section className="meetup-chat" aria-label={`Chat with ${contactName}`}>
			<header className="meetup-chat-header">
				<div>
					<p className="eyebrow">Meetup chat</p>
					<h3>{contactName}</h3>
				</div>
				<span className="demo-badge">Demo</span>
			</header>
			<div className="meetup-chat-messages" role="log" aria-live="polite">
				{messages.map((message) => (
					<article
						className={`meetup-message meetup-message--${message.from}`}
						key={message.id}
					>
						<p>{message.text}</p>
						<time>{message.time}</time>
					</article>
				))}
			</div>
			<form className="meetup-chat-form" onSubmit={sendMessage}>
				<label className="meetup-chat-label" htmlFor="meetup-message">
					Message
				</label>
				<input
					id="meetup-message"
					value={draft}
					onChange={(event) => setDraft(event.target.value)}
					maxLength={240}
					placeholder="Write an update"
				/>
				<button type="submit" disabled={!draft.trim()}>
					Send
				</button>
			</form>
		</section>
	);
}
"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import SpinWheel from "./spin-wheel";
import { HOME_SPIN_EVENT } from "./home-spin-button";

type Person = { id: string; name: string; interests: string[]; categories: string[] };
type Props = {
  currentUserId: string;
  currentUserInterests: string[];
  currentUserCategories: string[];
  people: Person[];
};

type Winner = { id: string; name: string; sharedInterests: number; sharedCategories: number };

export default function HomeSpinGate({ currentUserId, currentUserInterests, currentUserCategories, people }: Props) {
  const router = useRouter();
  const [winner, setWinner] = useState<Winner | null>(null);
  const [navigating, setNavigating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const spinRootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function triggerSpinFromHero() {
      if (winner || navigating) return;
      spinRootRef.current?.querySelector<HTMLButtonElement>(".spin-wheel-control")?.click();
    }

    window.addEventListener(HOME_SPIN_EVENT, triggerSpinFromHero);
    return () => {
      window.removeEventListener(HOME_SPIN_EVENT, triggerSpinFromHero);
    };
  }, [winner, navigating]);

  return (
    <div ref={spinRootRef}>
      <SpinWheel
        currentUserId={currentUserId}
        currentUserInterests={currentUserInterests}
        currentUserCategories={currentUserCategories}
        people={people}
        disabled={Boolean(winner) || navigating}
        onSpinCompleteAction={(result) => setWinner(result)}
      />
      {mounted && winner && createPortal(
        <div className="home-spin-overlay" role="presentation">
          <section className="home-spin-modal" role="dialog" aria-modal="true" aria-labelledby="spin-match-title">
            <p className="eyebrow">Coffee match found</p>
            <h3 id="spin-match-title">{winner.name}</h3>
            <p>{winner.sharedInterests} shared interest{winner.sharedInterests === 1 ? "" : "s"}, {winner.sharedCategories} shared categor{winner.sharedCategories === 1 ? "y" : "ies"}.</p>
            <p>Accept this match and schedule your meetup?</p>
            <div className="hero-actions">
              <button className="button-primary" type="button" disabled={navigating} onClick={() => {
                setNavigating(true);
                router.push(`/meetups?candidateId=${encodeURIComponent(winner.id)}&candidateName=${encodeURIComponent(winner.name)}`);
              }}>{navigating ? "Opening meetups..." : "Accept and schedule"}</button>
              <button className="home-spin-decline" type="button" disabled={navigating} onClick={() => setWinner(null)}>Decline</button>
            </div>
          </section>
        </div>,
        document.body,
      )}
    </div>
  );
}

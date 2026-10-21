"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SpinWheel from "./spin-wheel";

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

  return (
    <>
      <SpinWheel
        currentUserId={currentUserId}
        currentUserInterests={currentUserInterests}
        currentUserCategories={currentUserCategories}
        people={people}
        disabled={Boolean(winner) || navigating}
        onSpinCompleteAction={(result) => setWinner(result)}
      />
      {winner && (
        <div className="home-spin-empty" role="dialog" aria-modal="true" aria-labelledby="spin-match-title">
          <p className="eyebrow">Coffee match found</p>
          <h3 id="spin-match-title">{winner.name}</h3>
          <p>{winner.sharedInterests} shared interest{winner.sharedInterests === 1 ? "" : "s"}, {winner.sharedCategories} shared categor{winner.sharedCategories === 1 ? "y" : "ies"}.</p>
          <div className="hero-actions">
            <button className="button-primary" type="button" disabled={navigating} onClick={() => {
              setNavigating(true);
              router.push(`/meetups?candidateId=${encodeURIComponent(winner.id)}&candidateName=${encodeURIComponent(winner.name)}`);
            }}>{navigating ? "Opening meetups..." : "Accept and schedule"}</button>
            <button className="text-link" type="button" disabled={navigating} onClick={() => setWinner(null)}>Decline</button>
          </div>
        </div>
      )}
    </>
  );
}

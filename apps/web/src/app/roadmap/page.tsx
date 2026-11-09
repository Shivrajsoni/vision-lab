import { ROADMAP } from "@visionlab/registry";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Roadmap",
  description: "Six levels from pixels and filters to multimodal models and current research.",
};

export default function RoadmapPage() {
  return (
    <div className="mx-auto max-w-[76rem] px-4 py-12 sm:px-6">
      <h1 className="text-5xl font-extrabold">Roadmap</h1>
      <p className="mt-4 max-w-[64ch] text-lg text-muted">
        Six levels, each building on the one before. Written lessons arrive with build phase 6. One exhibit is live
        today: the{" "}
        <Link href="/#bench-title" className="text-text underline decoration-accent decoration-2 underline-offset-4">
          filter bench
        </Link>{" "}
        for level 1.
      </p>

      <ol className="mt-12 border-t border-line">
        {ROADMAP.map((level) => (
          <li key={level.level} className="grid gap-x-8 gap-y-3 border-b border-line py-8 md:grid-cols-[5rem_18rem_minmax(0,1fr)]">
            <span className="tnum font-display text-6xl font-extrabold leading-none text-accent [font-stretch:88%]">
              {level.level}
            </span>
            <div>
              <h2 className="text-2xl font-bold">{level.title}</h2>
              <p className="mt-2 text-muted">{level.goal}</p>
            </div>
            <ul className="flex flex-wrap content-start gap-2">
              {level.topics.map((topic) => (
                <li key={topic} className="rounded-sm border border-line px-2.5 py-1 text-[0.95rem]">
                  {topic}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}

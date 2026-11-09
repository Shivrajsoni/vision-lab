import type { Metadata } from "next";
import { StatusBoard } from "@/components/StatusBoard";

export const metadata: Metadata = {
  title: "Status",
  description: "Which ways of running models are working right now.",
};

export default function StatusPage() {
  return (
    <div className="mx-auto max-w-[76rem] px-4 py-12 sm:px-6">
      <h1 className="text-5xl font-extrabold">Status</h1>
      <p className="mt-4 max-w-[64ch] text-lg text-muted">
        The lab runs on free services, and free allowances run out. This page shows what is working now, so a
        missing result is never a mystery.
      </p>
      <div className="mt-10">
        <StatusBoard />
      </div>
    </div>
  );
}

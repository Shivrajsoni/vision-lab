import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[76rem] px-4 py-24 sm:px-6">
      <h1 className="text-5xl font-extrabold">This page does not exist</h1>
      <p className="mt-4 text-lg text-muted">The address may be mistyped, or the page has not been built yet.</p>
      <p className="mt-8">
        <Link href="/" className="rounded-sm bg-accent px-4 py-2.5 font-medium text-on-accent">
          Go to the start page
        </Link>
      </p>
    </div>
  );
}

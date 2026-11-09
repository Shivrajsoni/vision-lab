import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex max-w-[76rem] flex-wrap justify-between gap-x-10 gap-y-3 px-4 py-8 text-sm text-muted sm:px-6">
        <p className="max-w-[52ch]">
          Images you load stay on your device unless a model says it sends them elsewhere. Nothing is stored.
        </p>
        <p>
          <Link href="/status" className="underline underline-offset-4 hover:text-text">
            What is running right now
          </Link>
        </p>
      </div>
    </footer>
  );
}

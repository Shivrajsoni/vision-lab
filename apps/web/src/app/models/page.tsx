import { groupedModels } from "@visionlab/registry";
import type { Metadata } from "next";
import { PROVIDER_LABEL, statusLabel } from "@/lib/labels";

export const metadata: Metadata = {
  title: "Models",
  description: "Every model the lab covers, its paper, where it runs and whether it is live.",
};

export default function ModelsPage() {
  return (
    <div className="mx-auto max-w-[76rem] px-4 py-12 sm:px-6">
      <h1 className="text-5xl font-extrabold">Models</h1>
      <p className="mt-4 max-w-[64ch] text-lg text-muted">
        A model is marked live only after it has run end to end on this site. Until then it is listed as planned,
        with the build phase that brings it online.
      </p>

      {groupedModels().map(({ category, models }) => (
        <section key={category.id} aria-labelledby={`cat-${category.id}`} className="mt-14">
          <h2 id={`cat-${category.id}`} className="text-2xl font-bold">
            {category.name}
          </h2>
          <p className="mt-1 text-muted">{category.question}</p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[46rem] border-collapse text-left text-[0.95rem]">
              <thead>
                <tr className="border-y border-line text-sm text-muted">
                  <th scope="col" className="w-[13rem] py-2 pr-4 font-medium">Model</th>
                  <th scope="col" className="py-2 pr-4 font-medium">What it does</th>
                  <th scope="col" className="w-[6rem] py-2 pr-4 font-medium">Parameters</th>
                  <th scope="col" className="w-[9rem] py-2 pr-4 font-medium">Runs on</th>
                  <th scope="col" className="w-[10rem] py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {models.map((m) => (
                  <tr key={m.id} id={m.id} className="border-b border-line align-top">
                    <th scope="row" className="py-3 pr-4 font-semibold">
                      {m.name}
                      <a
                        href={m.paper.url}
                        rel="noreferrer"
                        target="_blank"
                        className="mt-0.5 block text-sm font-normal text-muted underline underline-offset-4 hover:text-text"
                      >
                        Paper, {m.paper.year}
                        <span className="sr-only">: {m.paper.title} (opens in a new tab)</span>
                      </a>
                    </th>
                    <td className="py-3 pr-4">
                      {m.summary}
                      {m.note && <span className="mt-1 block text-sm text-muted">{m.note}</span>}
                    </td>
                    <td className="tnum py-3 pr-4 text-muted">{m.params ?? "—"}</td>
                    <td className="py-3 pr-4">{m.providers.map((p) => PROVIDER_LABEL[p]).join(", then ")}</td>
                    <td className={`py-3 ${m.status === "live" ? "font-semibold text-accent" : "text-muted"}`}>
                      {statusLabel(m)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}

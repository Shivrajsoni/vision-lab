import { MODELS, ROADMAP, groupedModels } from "@visionlab/registry";
import Link from "next/link";
import { ConvolutionBench } from "@/components/ConvolutionBench";

const wrap = "mx-auto max-w-[76rem] px-4 sm:px-6";
const primary = "rounded-sm bg-accent px-4 py-2.5 font-medium text-on-accent hover:opacity-90";
const secondary = "rounded-sm border border-line px-4 py-2.5 font-medium hover:border-muted";

const TIERS = [
  {
    name: "On your device",
    body: "Most models download once and then run in this browser tab, on your GPU when the browser allows it. Your image never leaves the device and there is no daily limit.",
  },
  {
    name: "On a shared GPU",
    body: "Models too large for a browser run on a free shared GPU. Each visitor gets a few minutes of GPU time a day, so results can queue or run out.",
  },
  {
    name: "Through a hosted model",
    body: "A last resort for a few large models. The free allowance is shared by every visitor, and the lab says so plainly when it is used up.",
  },
];

export default function Home() {
  const live = MODELS.filter((m) => m.status === "live").length;

  return (
    <>
      <section className={`${wrap} grid gap-x-12 gap-y-10 pb-16 pt-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:pt-16`}>
        <div className="lg:pt-4">
          <h1 className="text-[clamp(2.6rem,6.2vw,4.6rem)] font-extrabold leading-[0.95]">
            See what a vision model sees.
          </h1>
          <p className="mt-6 max-w-[46ch] text-lg text-muted">
            Load a photo, run real pretrained models on it, and follow the image through every layer, from single
            pixels to models that answer questions about the scene.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/playground" className={primary}>
              Open the playground
            </Link>
            <Link href="/roadmap" className={secondary}>
              Start at level 1
            </Link>
          </div>
          <p className="mt-8 max-w-[46ch] border-l-2 border-signal pl-4 text-[0.95rem]">
            The lab is being built in stages. {live === 0 ? "No pretrained model is live yet" : `${live} models are live`}
            ; the filter bench here is real and running now, and image classification is next.
          </p>
        </div>
        <ConvolutionBench />
      </section>

      <section className="border-y border-line bg-surface">
        <div className={`${wrap} py-14`}>
          <h2 className="text-3xl font-bold">Six questions you can ask of an image</h2>
          <p className="mt-3 max-w-[62ch] text-muted">
            Each one is a family of models. Every model gets an experiment mode to run it and a learn mode that
            shows what happens inside.
          </p>
          <div className="mt-8 divide-y divide-line border-y border-line">
            {groupedModels().map(({ category, models }) => (
              <div key={category.id} className="grid gap-x-8 gap-y-1 py-4 md:grid-cols-[16rem_minmax(0,1fr)_9rem]">
                <h3 className="text-xl font-semibold">{category.question}</h3>
                <p>
                  <span className="text-muted">{category.name}: </span>
                  {models.map((m) => m.name).join(", ")}
                </p>
                <p className="text-sm text-muted md:text-right">
                  {models.some((m) => m.status === "live")
                    ? "Live"
                    : `Planned, phase ${Math.min(...models.map((m) => m.phase))}`}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-6">
            <Link href="/models" className="underline decoration-accent decoration-2 underline-offset-[6px]">
              See every model, its paper and where it runs
            </Link>
          </p>
        </div>
      </section>

      <section className={`${wrap} py-14`}>
        <h2 className="text-3xl font-bold">Where the models run</h2>
        <p className="mt-3 max-w-[62ch] text-muted">
          The lab costs nothing to use, which shapes how it works. Every result names which of these produced it.
        </p>
        <dl className="mt-8 grid gap-x-10 gap-y-8 md:grid-cols-3">
          {TIERS.map((tier) => (
            <div key={tier.name} className="border-t-2 border-accent pt-4">
              <dt className="font-display text-xl font-semibold [font-stretch:88%]">{tier.name}</dt>
              <dd className="mt-2 text-[0.97rem] text-muted">{tier.body}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="border-t border-line">
        <div className={`${wrap} py-14`}>
          <h2 className="text-3xl font-bold">A path from pixels to multimodal models</h2>
          <ol className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {ROADMAP.map((level) => (
              <li key={level.level} className="flex gap-4">
                <span className="tnum font-display text-4xl font-extrabold leading-none text-accent [font-stretch:88%]">
                  {level.level}
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{level.title}</h3>
                  <p className="mt-1 text-[0.95rem] text-muted">{level.goal}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-8">
            <Link href="/roadmap" className={secondary}>
              View the roadmap
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}

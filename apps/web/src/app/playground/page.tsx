import type { Metadata } from "next";
import { Playground } from "@/components/Playground";

export const metadata: Metadata = {
  title: "Playground",
  description: "Load an image, pick a pretrained model and run it.",
};

export default function PlaygroundPage() {
  return (
    <div className="mx-auto max-w-[76rem] px-4 py-12 sm:px-6">
      <h1 className="text-5xl font-extrabold">Playground</h1>
      <p className="mt-4 max-w-[64ch] text-lg text-muted">
        Load an image and choose a model. Image loading and the device check work today. The first models you can
        run, for image classification, arrive in the next build phase.
      </p>
      <div className="mt-10">
        <Playground />
      </div>
    </div>
  );
}

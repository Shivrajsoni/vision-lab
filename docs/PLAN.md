# Vision Lab — Implementation Plan

Interactive Computer Vision & Multimodal AI learning lab.
Plan date: 2026-11-10. Status: awaiting approval, no application code written yet.

Legend used throughout:

- **[verified]** — read from the provider's official docs on 2026-11-10.
- **[unverified]** — from third-party sources or prior knowledge; must be re-checked before we depend on it.

---

## 0. The finding that shapes everything

The spec assumes a FastAPI + PyTorch backend on free hosting. As of today that assumption does not hold:

| Assumption | Reality (2026-11-10) |
|---|---|
| Free Hugging Face Docker/Gradio Space runs our FastAPI backend | **[verified]** Creating a Gradio or Docker Space now requires a paid plan (PRO, $9/mo). Only Static Spaces are free. Exception: a free account in good standing (verified email, older than 30 days) may host up to 2 Gradio Spaces on ZeroGPU. |
| Free HF Inference API covers the models | **[verified]** Free users get **no** monthly Inference Providers credits; usage requires buying credits. |
| Free LLM/VLM APIs are generous | **[unverified]** Gemini free tier reportedly cut to roughly 20–250 requests/day depending on model; numbers conflict across sources. |

Conclusion: a server that runs every model for every visitor cannot be free. The architecture below therefore inverts the spec's default:

1. **Tier A — in-browser inference (primary).** Models run on the visitor's own device with Transformers.js / ONNX Runtime Web (WebGPU, WASM fallback). No server, no quota, no API key, and uploaded images never leave the device.
2. **Tier B — ZeroGPU Space (heavy PyTorch).** One or two Gradio Spaces for models too big for a browser. Each visitor spends their own daily GPU quota.
3. **Tier C — free-tier hosted APIs behind our proxy (fallback).** Cloudflare Workers AI and similar, keys held server-side, quota errors surfaced honestly.

The Python/FastAPI inference service still exists in the repo as a pluggable provider (runs locally, in Colab, or on a paid Space), but the public site does not depend on it.

---

## 1. Product requirements

**Goal.** Anyone can upload an image, run real pretrained models, see real outputs, compare models, and learn how each one works, from pixels to VLMs.

**Users.** Students new to CV (need intuition), practitioners (need architecture detail and math), and curious visitors (need a fast, impressive first run).

**Must have**

- Upload / drag-drop / paste / webcam / sample images.
- Playground with Experiment and Learn modes per model.
- Comparison workspace: N models, same image, side by side.
- Roadmap with six levels; modular so content is added as data, not code.
- Model pages with paper, architecture, limitations, license, measured vs published numbers.
- Every output is real. Unavailable models are labelled unavailable with the reason.
- Zero recurring cost. Graceful behaviour when a quota runs out.

**Non-goals (for now).** User accounts, saved galleries on a server, training large models, video upload processing, mobile-first heavy models.

**Success criteria.** First classification result within ~10 s on a mid-range laptop on a cold cache; every listed model either runs or states why not; Lighthouse performance ≥ 85 on the landing page; no secret reachable from the client bundle.

---

## 2. Feature breakdown

| Area | Features |
|---|---|
| Playground | Image input, model picker filtered by task, parameter panel (top-k, score threshold, NMS IoU, steps, guidance, prompt), run, result canvas, timing + device badge, download result |
| Experiment mode | Real inference, parameter sweeps, run history kept in IndexedDB |
| Learn mode | Problem statement, why the architecture exists, interactive architecture diagram, the user's own image flowing through the pipeline (preprocessing → intermediate representation → head → post-processing), limitations, math toggle |
| Visualizers (reusable) | Box overlay, mask overlay, class-bar chart, feature-map grid, attention heat-map, CAM overlay, depth map (2D + 3D point cloud), embedding similarity matrix, denoising filmstrip, latent-space explorer |
| Comparison lab | Presets (ResNet vs ViT, YOLO-style vs DETR, SegFormer vs DeepLabV3, DDPM vs DDIM, CLIP vs captioner), synced overlays, metrics table with a strict split: **Measured on your device** vs **Published benchmark (cited)** |
| Roadmap | Six levels, lesson pages in MDX, each lesson links to a playground preset |
| Research explorer | Curated paper list as data (title, year, link, one-paragraph summary, linked model in the lab); optional live feed from the public arXiv API |
| Status | A public `/status` page showing which providers are up and which quotas are exhausted |

---

## 3. System architecture

```
                       ┌──────────────────────────────────────────┐
                       │ Browser                                  │
 image (stays local) ─▶│  Next.js UI ── InferenceProvider (iface) │
                       │        │                                 │
                       │        ├─ BrowserProvider ─▶ Web Worker  │
                       │        │     Transformers.js / ORT Web   │
                       │        │     WebGPU → WASM fallback      │
                       │        │     weights: HF Hub CDN → Cache │
                       │        ├─ SpaceProvider ──▶ ZeroGPU Space (Gradio API, visitor's quota)
                       │        └─ ProxyProvider ──▶ /api/infer/* │
                       └──────────────────────────────┬───────────┘
                                                      ▼
                        Vercel route handlers (keys in env, rate limit, validation)
                                 ├─▶ Cloudflare Workers AI (10k neurons/day)
                                 └─▶ other free-tier APIs (optional, swappable)
```

**Key rule.** UI code only talks to the `InferenceProvider` interface. A model's registry entry names its provider and fallbacks; swapping hosting later touches one adapter, not the UI.

**Repo layout (pnpm workspace)**

```
apps/web/                  Next.js app (UI, routes, API proxy)
packages/registry/         Typed model metadata: task, provider, size, license, paper, published benchmarks
packages/inference/        InferenceProvider interface + Browser / Space / Proxy adapters, worker code
packages/viz/              Reusable visualizers (Canvas/SVG/Three.js)
modules/classification/    Each module: runner config, result adapter, Learn content, presets
modules/detection/
modules/segmentation/
modules/generative/
modules/vlm/
modules/advanced/
content/                   Roadmap + lessons (MDX), papers.json
services/space-gpu/        Gradio ZeroGPU app (PyTorch, transformers, diffusers)
services/api/              FastAPI inference service (optional self-host provider)
services/exporter/         Python scripts that export "glass-box" ONNX models
notebooks/                 Reproducible experiments with "Open in Colab" badges
docs/                      Plan, setup, env vars, deployment, model limitations, free-tier table
```

Each module registers itself with the registry; the playground discovers modules, so adding a category is adding a folder.

---

## 4. Technology selection

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router), React, TypeScript | Spec's choice; static pages for content, route handlers for the proxy |
| Styling | Tailwind CSS, CSS variables for dark/light | Spec's choice |
| In-browser ML | `@huggingface/transformers` 4.x + `onnxruntime-web` 1.31 | Covers classification, detection, segmentation, depth, zero-shot, captioning, SAM, small VLMs; WebGPU with WASM fallback |
| Workers | Dedicated Web Worker per model session, Comlink-style RPC | Keeps the UI at 60 fps during inference and model download |
| Visualization | Canvas 2D for overlays, SVG + D3 for architecture diagrams, Recharts for metrics, Three.js only for depth point clouds and latent spaces | Lightest tool per job; Three.js is lazy-loaded |
| Content | MDX + KaTeX | Lessons as files; math depth behind a toggle |
| Heavy inference | Gradio on ZeroGPU, PyTorch, transformers, diffusers | The only free GPU that can be public-facing today |
| Proxy | Next.js route handlers, zod validation | Keys never reach the client |
| Rate limiting | Upstash Redis free tier **[unverified limits]** or Vercel WAF rules (3 custom rules on Hobby **[verified]**) | Protects shared quotas |
| Tests | Vitest (unit), Playwright (e2e incl. a real in-browser inference smoke test) | Real inference is the product; it must be tested for real |
| CI | GitHub Actions (free for public repos **[unverified]**) | Lint, typecheck, test, build |

Deviation from the spec: FastAPI is not on the request path of the public site. Justification is section 0. It remains as `services/api` behind the same provider interface.

---

## 5. Model selection and inference strategy

Exact ONNX repo ids are confirmed at build time; a model only enters the registry after it has run end to end.

### Classification

| Model | Tier | Notes |
|---|---|---|
| ResNet-50 | A | ~100 MB fp32, quantized variant smaller |
| ViT-B/16 | A | |
| ConvNeXt-Tiny | A | |
| EfficientNet-B0 | A | via timm ONNX export if no ready repo |
| MobileNetV4 | A | fast default for phones |
| VGG-16 | A (opt-in) / Learn-only | 528 MB fp32. Offered as an explicit "large download" or shown through Learn mode only. Honest limitation. |

### Object detection

| Model | Tier | Notes |
|---|---|---|
| DETR-ResNet-50 | A | |
| YOLOS-Tiny | A | Transformer detector, Apache-2.0 |
| RT-DETR | A | real-time DETR |
| "YOLO" | A | **Licence decision needed.** Ultralytics YOLOv5/8/11 are AGPL-3.0; shipping them makes the repo AGPL-bound. Default plan: YOLOX (Apache-2.0) as the YOLO-family representative. |
| Faster R-CNN | B | torchvision in the Space |

### Segmentation

| Model | Tier | Notes |
|---|---|---|
| SegFormer-B0 (ADE20K) | A | semantic |
| DeepLabV3 (MobileViT/MobileNet backbone) | A | semantic |
| SAM (SlimSAM / SAM 2 tiny) | A | click-to-segment; encoder runs once, decoder per click |
| Mask R-CNN | B | torchvision in the Space |
| U-Net | A | No canonical pretrained general-purpose U-Net exists. Plan: a U-Net-family salient-object model for Experiment mode, plus a small U-Net we export ourselves so Learn mode can show skip connections on real activations. |

### Generative

| Model | Tier | Notes |
|---|---|---|
| VAE | A | Tiny VAE (trained in a Colab notebook in minutes, exported to ONNX) for the latent-space explorer; plus TAESD to encode/decode the user's own image |
| GAN | A | Small pretrained generator exported to ONNX; latent interpolation |
| DDPM / DDIM | A | `google/ddpm-cifar10-32` U-Net exported to ONNX; **both samplers written in TypeScript**, so every denoising step is visible and DDPM-vs-DDIM is a true same-network comparison |
| Stable Diffusion | B, then C | SD-Turbo / SDXL-Turbo in the ZeroGPU Space; fallback FLUX.1-schnell on Cloudflare Workers AI; optional in-browser SD-Turbo for desktop WebGPU (multi-GB download, experimental) |

### Vision-language

| Model | Tier | Notes |
|---|---|---|
| CLIP ViT-B/16 | A | zero-shot labels, image-text similarity matrix |
| SigLIP | A | contrast with CLIP's softmax loss |
| Captioner (BLIP if an ONNX build runs; else ViT-GPT2 / Florence-2) | A | BLIP support in Transformers.js **[unverified]** |
| Florence-2-base | A (WebGPU) | caption, detection, OCR from one model |
| SmolVLM-256M/500M | A (WebGPU) | in-browser visual question answering |
| LLaVA-OneVision / Qwen2-VL (small) | B | Space; larger variants are documented as not hosted |
| Llama 3.2 11B Vision | C | Cloudflare Workers AI fallback |
| BLIP-2 | B or Learn-only | ~15 GB class model; hosted only if Space quota allows |

### Advanced

Depth Anything V2 Small (A), Swin2SR ×2 super-resolution (A), face detection via a small ONNX detector (A), ViTPose pose estimation (A), optical flow via RAFT-small export (A, phase 8, needs two frames), restoration (phase 8).

### Glass-box models for Learn mode

Standard ONNX exports only return final outputs. `services/exporter` re-exports a few models with intermediate tensors as extra outputs (ResNet stage feature maps, ViT attention weights, U-Net skip tensors) and uploads them to a public HF model repo (free). This gives real feature maps, exact CAM for ResNet (class weights × last conv features, no gradients needed), and attention rollout for ViT, all on the user's image.

---

## 6. Free hosting and deployment comparison

| Service | What we can host | Free limits | GPU | CPU / RAM | Sleep / cold start | Rate limits | Key needed | Role here |
|---|---|---|---|---|---|---|---|---|
| **Visitor's browser** (Transformers.js) | Any ONNX model that fits device memory | None | Visitor's GPU via WebGPU | Visitor's | First run downloads weights (20–350 MB typical), then cached | None | No | **Tier A, primary** |
| **Vercel Hobby** **[verified]** | Next.js site + proxy functions | 100 GB data transfer, 1M function invocations, 4 CPU-hrs active CPU, 100 deployments/day; function max duration 300 s; **non-commercial use only**; exceeding a limit pauses the feature up to 30 days | No | 2 GB function memory **[unverified]**; ~4.5 MB request body **[unverified]** | Function cold starts (sub-second typical) | Platform DDoS protection | No (deploy token) | Frontend + proxy |
| **HF Spaces – Static** **[verified]** | Static files | Free for everyone | No | n/a | None | — | No | Backup static host |
| **HF Spaces – Gradio/Docker on CPU Basic** **[verified]** | Python apps | Hardware itself is $0 (2 vCPU, 16 GB, 50 GB disk) but **creating one requires a paid plan** | No | 2 vCPU / 16 GB | Sleeps when unused | — | — | Not available at $0 |
| **HF ZeroGPU Spaces** **[verified]** | Gradio apps only; PyTorch 2.8+ | Free account ≥30 days old, verified email: host up to **2** Spaces. Visitor quota per day: 2 min unauthenticated, 5 min free account, 40 min PRO. Default 60 s per call | Half an RTX Pro 6000 (48 GB VRAM) per call | — | Queue wait; quota resets 24 h after first use | Daily GPU seconds per visitor | Visitor needs none; HF login raises quota | **Tier B** |
| **HF Inference Providers** **[verified]** | Hosted model API | **No free credits** for free users | Provider-side | — | — | — | Yes (and paid credits) | Not used |
| **HF Hub (model repos)** | Our exported ONNX weights | Free public hosting **[unverified storage caps]** | — | — | CDN | — | No for public reads | Weight hosting |
| **Cloudflare Workers AI** **[verified]** | Hosted models: FLUX.1-schnell, Llama 3.2 11B Vision, ResNet-50, others | **10,000 neurons/day**, resets 00:00 UTC, shared across all models and all our visitors; requests fail once exhausted | Cloudflare-side | — | None | The neuron pool | Yes (server-side token) | **Tier C** |
| **Cloudflare Workers / Pages** **[verified]** | Static site + edge functions | 100,000 requests/day, 10 ms CPU per request (network wait excluded), static asset requests free and unlimited | No | 128 MB | None | Daily request cap | No | Alternative to Vercel if commercial use is ever needed |
| **GitHub Pages** **[unverified]** | Static only | ~1 GB site, ~100 GB/month soft bandwidth | No | — | None | — | No | Could host a static-only build (Tier A works without any server) |
| **Google Colab** **[unverified]** | Notebooks, not a server | Free GPU not guaranteed; sessions time out; serving public traffic is against intended use | T4 when available | ~12 GB | Session ends on idle | — | Google account | "Open in Colab" reproducible notebooks; exporter scripts |
| **Kaggle Notebooks** **[unverified]** | Notebooks | Weekly GPU hour quota | T4 / P100 | ~30 GB | Session-bound | Weekly hours | Kaggle account | Same role as Colab |
| **Gemini API free tier** **[unverified]** | VLM calls | Reported 20–250 requests/day per model, repeatedly reduced | Google-side | — | — | RPM/TPM/RPD, HTTP 429 | Yes | Optional Tier C adapter, off by default |
| **OpenRouter `:free` models** **[unverified]** | VLM calls | 50 requests/day (1,000 after a one-time $10 purchase), 20/min; free catalogue rotates | — | — | — | As stated | Yes | Optional Tier C adapter |
| **Groq free tier** **[unverified]** | Fast LLM/VLM calls | ~30 RPM, ~1,000 RPD reported; vision support unconfirmed | — | — | — | As stated | Yes | Optional Tier C adapter |

Rules we hold ourselves to:

- No service is assumed permanently free. Each provider adapter has a kill switch (env flag) and a health check feeding `/status`.
- Quota exhaustion maps to one normalized error (`QUOTA_EXHAUSTED`, with `retryAfter` when known). The UI then says so and offers the best in-browser alternative for the same task.
- Nothing paid is introduced silently. The only paid item worth knowing about is HF PRO at $9/month, which would unlock CPU/Docker Spaces (the original FastAPI design), 40 min/day ZeroGPU, and 10 ZeroGPU Spaces. It is optional.

---

## 7. API and data-flow design

**Provider interface (TypeScript, shared by all tiers)**

```ts
interface InferenceProvider {
  id: 'browser' | 'space' | 'proxy';
  isAvailable(model: ModelSpec): Promise<Availability>;   // device checks, health, quota state
  load?(model: ModelSpec, onProgress: (p: LoadProgress) => void): Promise<void>;
  run<T extends Task>(req: InferenceRequest<T>, signal: AbortSignal): Promise<InferenceResult<T>>;
}
```

`InferenceResult` always carries `timings` (load, preprocess, inference, postprocess), `device` (`webgpu` / `wasm` / `zerogpu` / `remote`), and `provenance` (model id, revision, provider). Results are a discriminated union per task (labels, boxes, masks, depth, text, image, embeddings) so visualizers are type-checked against tasks.

**Tier A flow.** Image → `createImageBitmap` → downscale → worker → Transformers.js pipeline → typed result → visualizer. No network except the one-time weight download from the HF Hub CDN.

**Tier B flow.** Browser → `@gradio/client` → Space endpoint directly, so GPU quota is charged to the visitor, not pooled on our server.

**Tier C flow.** Browser → `POST /api/infer/{provider}/{task}` → validation → rate limit → upstream call with server-side key → normalized response.

**Proxy endpoints**

| Endpoint | Purpose |
|---|---|
| `POST /api/infer/cf/text-to-image` | FLUX.1-schnell fallback |
| `POST /api/infer/cf/vqa` | Llama 3.2 Vision fallback |
| `GET /api/status` | Provider health and quota state (cached 60 s) |
| `GET /api/papers` | Cached arXiv feed for the research explorer (optional) |

Error envelope: `{ error: { code, message, retryAfter? } }` with codes `QUOTA_EXHAUSTED`, `RATE_LIMITED`, `PROVIDER_DOWN`, `INVALID_INPUT`, `TOO_LARGE`, `UNSUPPORTED_DEVICE`.

---

## 8. Database and storage

No database and no server-side image storage.

| Data | Where | Why |
|---|---|---|
| Uploaded images | Browser memory only (sent upstream only for Tier B/C runs, with an explicit notice) | Privacy, zero cost |
| Model weights | Browser Cache API (managed by Transformers.js), with a "manage downloaded models" panel | Avoid re-download |
| Run history, comparison sessions | IndexedDB | Local-only persistence |
| Lessons, roadmap, papers, model registry | Files in the repo | Versioned, reviewable, no CMS |
| Rate-limit counters | Upstash Redis free tier or in-memory per instance | Only state the server needs |

---

## 9. Security

- **Secrets.** Keys live only in Vercel / Space environment variables. No `NEXT_PUBLIC_` secret. CI greps the client bundle for key patterns.
- **Uploads.** Client decodes and re-encodes via canvas (drops EXIF/GPS, defeats polyglot files), caps the long side (default 1024 px) and bytes. Proxy re-validates type and size with zod and magic bytes.
- **Abuse of shared quota.** Per-IP rate limit on every proxy route, optional Cloudflare Turnstile on generation, daily budget guard that trips the kill switch before the provider does.
- **Generated content.** Safety checker enabled in the Space; prompt length caps; no storage of outputs.
- **Headers.** CSP restricting script/connect sources to self, the HF Hub CDN, the Space, and the proxy; `COOP`/`COEP: credentialless` to enable multi-threaded WASM.
- **Prompt injection.** VLM output is rendered as text, never as HTML or instructions.
- **Supply chain.** Pinned dependency versions, pinned model revisions (commit hashes) in the registry, Dependabot.
- **Licences.** Every registry entry records the model licence; AGPL/non-commercial models are flagged in the UI and kept out of the default set.
- **Privacy notice.** Clear per-run indicator: "runs on your device" vs "image is sent to <provider>".

---

## 10. Phases and milestones

| Phase | Scope | Done when |
|---|---|---|
| 1. Foundation + deploy | Monorepo, Next.js shell, design system, dark mode, registry + provider interface, CI, first production deploy | Public URL serves the landing page; CI green |
| 2. Upload + classification | Image input, worker runtime, ResNet/ViT/ConvNeXt/EfficientNet/MobileNet, top-k chart, timings | A photo classifies in-browser on the live site; Playwright runs a real inference |
| 3. Detection + segmentation | DETR, YOLOS, RT-DETR, YOLO-family; SegFormer, DeepLabV3, SAM click-to-segment; overlays | Boxes and masks render on user images; thresholds adjustable live |
| 4. Generative | TS DDPM/DDIM samplers on exported U-Net, VAE + GAN latent explorers, ZeroGPU Space with SD-Turbo, Cloudflare fallback | Denoising filmstrip works offline-of-server; text-to-image works with quota handling |
| 5. Vision-language | CLIP/SigLIP similarity, captioning, Florence-2, SmolVLM VQA, Space-hosted LLaVA/Qwen-VL | Ask-a-question works in-browser on WebGPU and via Space otherwise |
| 6. Educational visualizations | Glass-box exports, feature maps, CAM, attention rollout, architecture diagrams, Level 1 convolution playground, roadmap levels 1–5 content | Every model has a Learn mode backed by real activations where feasible |
| 7. Comparison + benchmarking | Comparison workspace, presets, measured-vs-published table, device benchmark runner | Two models run on one image with a clearly split metrics table |
| 8. Research explorer + advanced | Papers explorer, depth, super-resolution, pose, face detection, optical flow, Level 6 content | All advanced tasks run or are labelled unavailable |
| 9. Hardening | Tests, accessibility, performance budget, docs (setup, env vars, deployment, model limitations, free-tier table), final deploy | All deliverables in spec section 10 exist |

Every phase ends with a deploy, so the site is always live and always real.

---

## 11. Infrastructure cost

| Item | Cost |
|---|---|
| Vercel Hobby | $0 (non-commercial) |
| HF Hub weights + up to 2 ZeroGPU Spaces | $0 |
| Cloudflare Workers AI | $0 up to 10,000 neurons/day; hard stop after (no card on the free plan, so no surprise bill) |
| GitHub repo + Actions (public) | $0 |
| Domain | $0 using `*.vercel.app`; custom domain optional (~$10–15/year) |
| **Total required** | **$0/month** |
| Optional: HF PRO | $9/month — unlocks the FastAPI-on-Space design and 8× ZeroGPU quota |

---

## 12. Technical limitations (known up front)

1. **First-run download.** Tier A models download 20–350 MB once. Mitigation: size badge before download, progress bar, small defaults, cache panel.
2. **Device variance.** Without WebGPU, WASM is 5–50× slower; small VLMs and SD-Turbo need WebGPU and several GB of memory. WebGPU ships in Chrome/Edge desktop, Chrome on Android 12+, Safari 26, Firefox on Windows and Apple-silicon macOS; Firefox on Linux/Android lacks it **[unverified]**.
3. **Models that will not run in a browser.** VGG-16 (size), Faster/Mask R-CNN, LLaVA, Qwen-VL, BLIP-2, full Stable Diffusion on phones. These rely on Tier B and inherit its quota.
4. **ZeroGPU quota.** 2 GPU-minutes/day for anonymous visitors. Enough for a handful of generations. Hosting needs an HF account older than 30 days.
5. **Shared Tier C pool.** 10,000 neurons/day is shared by all visitors. Rough estimate: a few hundred small VQA calls or on the order of 100–170 FLUX images per day in total.
6. **Accuracy cannot be measured on one user image.** The comparison lab shows published benchmark numbers (cited, labelled) next to measured latency, model size, memory, and confidence. It never presents published numbers as measured.
7. **Free tiers move.** Two of the spec's assumptions were already invalid on the day of planning. The provider abstraction, kill switches, and `/status` page exist for this reason.
8. **Vercel Hobby is non-commercial.** If the lab ever carries ads or sales, move the frontend to Cloudflare (static assets free and unlimited).
9. **YOLO licensing.** See section 5.
10. **Scale of content.** Six roadmap levels of accurate, illustrated lessons is the largest single piece of work; it lands incrementally from phase 6 on.

---

## 13. Decisions and inputs needed from the owner

1. Approve the browser-first architecture (section 0), or choose HF PRO to keep FastAPI on the request path.
2. YOLO: Apache-licensed YOLOX (recommended) or Ultralytics under AGPL.
3. Project name and where the repo lives on disk.
4. Accounts, which only the owner can create or sign in to: GitHub (`gh auth login`), Vercel, Hugging Face (ZeroGPU hosting needs the account to be older than 30 days), Cloudflare (for the Workers AI token). Keys go into environment variables by the owner; they are never pasted into chat or code.

## Sources

- Hugging Face Spaces overview — https://huggingface.co/docs/hub/spaces-overview
- Hugging Face ZeroGPU — https://huggingface.co/docs/hub/spaces-zerogpu
- Hugging Face Inference Providers pricing — https://huggingface.co/docs/inference-providers/pricing
- Transformers.js docs — https://huggingface.co/docs/transformers.js/index
- Vercel Hobby plan — https://vercel.com/docs/plans/hobby
- Cloudflare Workers AI pricing — https://developers.cloudflare.com/workers-ai/platform/pricing/
- Cloudflare Workers limits — https://developers.cloudflare.com/workers/platform/limits
- WebGPU browser support — https://web.dev/blog/webgpu-supported-major-browsers

# Vision Lab

An interactive lab for learning computer vision and multimodal AI: load an image, run real pretrained models on it, compare them, and see what happens inside.

**Status: phase 1 of 9.** The site shell, model registry, provider interface and one live exhibit (a real 3×3 convolution bench) exist. No pretrained model is wired up yet; image classification is phase 2. See [docs/PLAN.md](docs/PLAN.md) for the full plan, the free-hosting research behind it, and known limitations.

## How it works

Free GPU hosting for a public Python backend no longer exists, so the lab runs models in three tiers:

| Tier | Where | Limit |
|---|---|---|
| Your device | In the browser via Transformers.js (WebGPU, CPU fallback) | None; images never leave the device |
| Shared GPU | A Hugging Face ZeroGPU Space | A few GPU minutes per visitor per day |
| Hosted model | Cloudflare Workers AI behind a server-side proxy | 10,000 neurons/day shared by all visitors |

UI code only talks to the `InferenceProvider` interface in `packages/inference`, so a model can move between tiers without touching a component.

## Layout

```
apps/web/             Next.js 16 app: pages, components, /api/status
packages/registry/    Typed list of models, categories and roadmap levels
packages/inference/   Provider interface, device probe, provider selection
docs/PLAN.md          Implementation plan and free-tier comparison
```

## Setup

Requires Node 20.9+ and pnpm 10.

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

| Command | What it does |
|---|---|
| `pnpm dev` | Run the site locally |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript across all packages |
| `pnpm build` | Production build |

## Environment variables

All optional. With none set, everything that runs in the browser still works. Copy `.env.example` to `apps/web/.env.local`.

| Variable | Used for | Needed from |
|---|---|---|
| `SPACE_URL` | Shared-GPU tier | Phase 4 |
| `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` | Hosted-model tier | Phase 4 |

These are read only on the server. `/api/status` reports whether each is set, never its value, and CI fails if a secret's name appears in the client bundle.

## Deployment

The app deploys to Vercel with the project root set to `apps/web`. Vercel's Hobby plan is for non-commercial use only. Set the environment variables above in the Vercel project settings, not in code.

## Adding a model

Add an entry to `packages/registry/src/models.ts`. Keep `status: "planned"` until it has run end to end on the deployed site, then set `status: "live"` and fill in `license` after checking the exact weights repository. The registry tests enforce this.

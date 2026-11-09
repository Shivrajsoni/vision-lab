import { MODELS } from "@visionlab/registry";
import { connection } from "next/server";

export interface StatusResponse {
  providers: {
    space: { configured: boolean };
    proxy: { configured: boolean };
  };
  modelsLive: number;
  modelsTotal: number;
  checkedAt: string;
}

/**
 * Reports which hosting tiers are set up. It only ever returns booleans:
 * the values of the environment variables never leave the server.
 */
export async function GET() {
  // Read the environment per request, not once at build time.
  await connection();

  const body: StatusResponse = {
    providers: {
      space: { configured: Boolean(process.env.SPACE_URL) },
      proxy: {
        configured: Boolean(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN),
      },
    },
    modelsLive: MODELS.filter((m) => m.status === "live").length,
    modelsTotal: MODELS.length,
    checkedAt: new Date().toISOString(),
  };

  return Response.json(body, { headers: { "Cache-Control": "no-store" } });
}

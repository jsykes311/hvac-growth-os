import { NextResponse } from "next/server";
import { deployComfortGuardiansMetaTags, HighLevelSyncError } from "@/lib/server/highlevel";

export const runtime = "nodejs";

export async function POST() {
  try {
    return NextResponse.json(await deployComfortGuardiansMetaTags());
  } catch (error) {
    const status = error instanceof HighLevelSyncError ? error.status : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "HighLevel deployment failed." }, { status });
  }
}

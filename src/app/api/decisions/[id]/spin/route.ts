import { NextRequest, NextResponse } from "next/server";
import { spinDecision } from "@/lib/decisions";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await spinDecision(id);

    if (!result) {
      return NextResponse.json(
        { error: "Decision not found or expired." },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to execute spin";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

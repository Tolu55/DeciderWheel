import { NextRequest, NextResponse } from "next/server";
import { getDecision } from "@/lib/decisions";
import { ClientDecision } from "@/lib/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = req.nextUrl.searchParams.get("token");

    const decision = await getDecision(id);
    if (!decision) {
      return NextResponse.json(
        { error: "Decision not found or expired." },
        { status: 404 }
      );
    }

    const isCreator = Boolean(token && token === decision.creator_token);

    // If already spun, reveal everything
    if (decision.spun) {
      const clientData: ClientDecision = {
        id: decision.id,
        title: decision.title,
        spun: true,
        spun_at: decision.spun_at,
        winner_index: decision.winner_index,
        winner_choice: decision.winner_choice,
        options: decision.options,
        optionCount: decision.options.length,
        created_at: decision.created_at,
        isCreator,
      };
      return NextResponse.json(clientData);
    }

    // If NOT spun yet:
    // If user is creator, they can see options in their creator dashboard
    // If user is friend/visitor, options are strictly HIDDEN to preserve the mystery!
    const clientData: ClientDecision = {
      id: decision.id,
      title: decision.title,
      spun: false,
      spun_at: null,
      winner_index: null,
      winner_choice: null,
      optionCount: decision.options.length,
      created_at: decision.created_at,
      isCreator,
    };

    return NextResponse.json(clientData);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

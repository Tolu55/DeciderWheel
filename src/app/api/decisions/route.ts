import { NextRequest, NextResponse } from "next/server";
import { createDecision } from "@/lib/decisions";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, options } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "Title is required and must not be empty." },
        { status: 400 }
      );
    }

    if (!Array.isArray(options) || options.length < 2) {
      return NextResponse.json(
        { error: "At least 2 unique choices are required." },
        { status: 400 }
      );
    }

    if (options.length > 12) {
      return NextResponse.json(
        { error: "A maximum of 12 choices is permitted." },
        { status: 400 }
      );
    }

    const result = await createDecision(title, options);

    return NextResponse.json(
      {
        id: result.id,
        title: result.decision.title,
        creator_token: result.creator_token,
        optionCount: result.decision.options.length,
        created_at: result.decision.created_at,
        shareUrl: `/d/${result.id}`,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create decision";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

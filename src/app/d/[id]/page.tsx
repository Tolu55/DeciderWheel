import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDecision } from "@/lib/decisions";
import { ClientDecision } from "@/lib/types";
import { DecisionClientView } from "@/components/DecisionClientView";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const decision = await getDecision(id);

  if (!decision) {
    return {
      title: "Decision Not Found — Decider Wheel",
      description: "This mystery wheel decision link does not exist or has expired.",
    };
  }

  const titleText = `🔮 Help Decide: ${decision.title}`;
  const descText = `An anonymous mystery wheel with ${decision.options.length} hidden options! Spin to reveal the choices and select our fate.`;

  return {
    title: `${titleText} — Decider Wheel`,
    description: descText,
    openGraph: {
      title: titleText,
      description: descText,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: titleText,
      description: descText,
    },
  };
}

export default async function DecisionPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const isCreatorParam = Boolean(resolvedSearchParams.creator === "true");

  const decision = await getDecision(id);
  if (!decision) {
    notFound();
  }

  // Sanitize for client: if not spun and not creator, conceal options
  const clientData: ClientDecision = {
    id: decision.id,
    title: decision.title,
    spun: decision.spun,
    spun_at: decision.spun_at,
    winner_index: decision.winner_index,
    winner_choice: decision.winner_choice,
    optionCount: decision.options.length,
    created_at: decision.created_at,
    isCreator: isCreatorParam,
    ...(decision.spun || isCreatorParam ? { options: decision.options } : {}),
  };

  return (
    <main className="main-content">
      <DecisionClientView
        initialDecision={clientData}
        isCreatorParam={isCreatorParam}
      />
    </main>
  );
}

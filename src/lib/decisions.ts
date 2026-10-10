import { Decision, SpinResult } from "./types";
import { getSupabase, isSupabaseConfigured } from "./supabase";
import crypto from "crypto";

// Fallback in-memory store attached to globalThis to survive Next.js dev reloads
declare global {
  // eslint-disable-next-line no-var
  var __deciderMemoryStore: Map<string, Decision> | undefined;
}

if (!globalThis.__deciderMemoryStore) {
  globalThis.__deciderMemoryStore = new Map<string, Decision>();
}

const memoryStore = globalThis.__deciderMemoryStore;

// Pre-seed a sample demo decision for instant testing
if (memoryStore.size === 0) {
  const sampleId = "demo77";
  memoryStore.set(sampleId, {
    id: sampleId,
    title: "Where should we grab dinner tonight?",
    options: ["Pizza Margherita", "Sushi Boat", "Street Tacos", "Thai Green Curry"],
    creator_token: "demo-token-12345",
    spun: false,
    spun_at: null,
    winner_index: null,
    winner_choice: null,
    created_at: new Date().toISOString(),
  });
}

function generateShortId(length = 6): string {
  const chars = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
  let result = "";
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  return result;
}

function generateToken(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function sanitizeOptions(rawOptions: string[]): string[] {
  if (!Array.isArray(rawOptions)) return [];
  const trimmed = rawOptions
    .map((opt) => (typeof opt === "string" ? opt.trim() : ""))
    .filter((opt) => opt.length > 0)
    .slice(0, 12); // Max 12 options

  // Remove exact duplicates while preserving order
  const unique: string[] = [];
  for (const opt of trimmed) {
    if (!unique.some((u) => u.toLowerCase() === opt.toLowerCase())) {
      unique.push(opt);
    }
  }
  return unique;
}

export async function createDecision(
  title: string,
  rawOptions: string[]
): Promise<{ id: string; creator_token: string; decision: Decision }> {
  const cleanTitle = (title || "").trim();
  if (!cleanTitle) {
    throw new Error("Title is required.");
  }

  const options = sanitizeOptions(rawOptions);
  if (options.length < 2) {
    throw new Error("At least 2 unique choices are required.");
  }
  if (options.length > 12) {
    throw new Error("A maximum of 12 choices is allowed.");
  }

  const id = generateShortId();
  const creator_token = generateToken();
  const now = new Date().toISOString();

  const decision: Decision = {
    id,
    title: cleanTitle,
    options,
    creator_token,
    spun: false,
    spun_at: null,
    winner_index: null,
    winner_choice: null,
    created_at: now,
  };

  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from("decisions").insert({
      id: decision.id,
      title: decision.title,
      options: decision.options,
      creator_token: decision.creator_token,
      spun: false,
      spun_at: null,
      winner_index: null,
      winner_choice: null,
      created_at: decision.created_at,
    });

    if (error) {
      console.error("Supabase insert error, falling back to memory:", error.message);
      memoryStore.set(id, decision);
    }
  } else {
    memoryStore.set(id, decision);
  }

  return { id, creator_token, decision };
}

export async function getDecision(id: string): Promise<Decision | null> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("decisions")
      .select("*")
      .eq("id", id)
      .single();

    if (!error && data) {
      return {
        id: data.id,
        title: data.title,
        options: Array.isArray(data.options) ? data.options : JSON.parse(data.options || "[]"),
        creator_token: data.creator_token,
        spun: Boolean(data.spun),
        spun_at: data.spun_at,
        winner_index: data.winner_index,
        winner_choice: data.winner_choice,
        created_at: data.created_at,
      };
    }
  }

  return memoryStore.get(id) || null;
}

export async function spinDecision(id: string): Promise<SpinResult | null> {
  const existing = await getDecision(id);
  if (!existing) {
    return null;
  }

  // Already spun: One spin per decision lock!
  if (existing.spun && existing.winner_choice) {
    return {
      winner_index: existing.winner_index ?? 0,
      winner_choice: existing.winner_choice,
      options: existing.options,
      spun_at: existing.spun_at || new Date().toISOString(),
      already_spun: true,
    };
  }

  // Determine winner server-side at spin time
  const winnerIndex = Math.floor(Math.random() * existing.options.length);
  const winnerChoice = existing.options[winnerIndex];
  const spunAt = new Date().toISOString();

  const supabase = getSupabase();
  if (supabase) {
    // Atomic update: only update if spun is still false
    const { data, error } = await supabase
      .from("decisions")
      .update({
        spun: true,
        spun_at: spunAt,
        winner_index: winnerIndex,
        winner_choice: winnerChoice,
      })
      .eq("id", id)
      .eq("spun", false)
      .select();

    if (error || !data || data.length === 0) {
      // Another spin won the race, fetch updated row
      const refreshed = await getDecision(id);
      if (refreshed && refreshed.spun) {
        return {
          winner_index: refreshed.winner_index ?? winnerIndex,
          winner_choice: refreshed.winner_choice ?? winnerChoice,
          options: refreshed.options,
          spun_at: refreshed.spun_at ?? spunAt,
          already_spun: true,
        };
      }
    }
  }

  // Update memory store as well
  existing.spun = true;
  existing.spun_at = spunAt;
  existing.winner_index = winnerIndex;
  existing.winner_choice = winnerChoice;
  memoryStore.set(id, existing);

  return {
    winner_index: winnerIndex,
    winner_choice: winnerChoice,
    options: existing.options,
    spun_at: spunAt,
  };
}

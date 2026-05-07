import { useState } from "react";
import { supabase } from "@/services/supabaseClient";
import { toast } from "sonner";
import {
  generateBracket,
  getRecommendedSeeding,
  getTournamentMetadata,
  validateBracket,
  type TournamentParticipant,
} from "@/lib/bracketGenerator";

export function useTournamentCreation() {
  const [creating, setCreating] = useState(false);

  async function createTournament(
    name: string,
    topic: string,
    classId: string,
    participantIds: string[],
    seedingStrategy: "random" | "alphabetical" | "custom" = "random"
  ) {
    if (!supabase) {
      toast.error("Database not configured");
      return null;
    }

    // Validate participant count
    const metadata = getTournamentMetadata(participantIds.length);

    setCreating(true);
    try {
      // Step 1: Create tournament record (using existing schema fields)
      const { data: tournament, error: tournamentError } = await supabase
        .from("rt_tournaments")
        .insert({
          name,
          description: topic,
          topics: [topic],
          class_id: classId,
          total_rounds: metadata.rounds,
          status: "active",
          current_round: 1,
        })
        .select("id")
        .single();

      if (tournamentError || !tournament) {
        throw new Error("Failed to create tournament");
      }

      // Step 2: Generate bracket
      const participants: TournamentParticipant[] = getRecommendedSeeding(
        participantIds,
        seedingStrategy
      );
      const matches = generateBracket(participants, metadata.rounds, topic);

      // Validate bracket structure
      const validation = validateBracket(matches);
      if (!validation.valid) {
        throw new Error(`Invalid bracket: ${validation.errors.join(", ")}`);
      }

      // Step 3: Insert rounds with proper parent relationships
      // First, insert all rounds and get their real UUIDs
      const { data: insertedRounds, error: roundError } = await supabase
        .from("rt_tournament_rounds")
        .insert(
          matches.map((m) => ({
            tournament_id: tournament.id,
            round_number: m.round_number,
            match_number: m.match_number,
            topic_title: m.topic_title,
            persona_a: m.persona_a,
            persona_b: m.persona_b,
            winner_id: m.winner_id,
            votes_a: m.votes_a,
            votes_b: m.votes_b,
            status: m.status,
          }))
        )
        .select("id, round_number, match_number");

      if (roundError || !insertedRounds) {
        throw new Error("Failed to create rounds");
      }

      // Step 4: Update parent relationships
      // Map temp IDs to real UUIDs
      const idMap = new Map<string, string>();
      insertedRounds.forEach((r) => {
        const tempId = `temp-r${r.round_number}-m${r.match_number - 1}`;
        idMap.set(tempId, r.id);
      });

      // Update parent_match_a and parent_match_b for rounds 2+
      const updates = matches
        .filter((m) => m.round_number > 1)
        .map((m) => {
          const realRound = insertedRounds.find(
            (ir) => ir.round_number === m.round_number && ir.match_number === m.match_number
          );
          if (!realRound) return null;

          return {
            id: realRound.id,
            parent_match_a: m.parent_match_a ? idMap.get(m.parent_match_a) : null,
            parent_match_b: m.parent_match_b ? idMap.get(m.parent_match_b) : null,
          };
        })
        .filter(Boolean);

      // Batch update parent relationships
      for (const update of updates) {
        if (update) {
          await supabase
            .from("rt_tournament_rounds")
            .update({
              parent_match_a: update.parent_match_a,
              parent_match_b: update.parent_match_b,
            })
            .eq("id", update.id);
        }
      }

      toast.success(`Tournament "${name}" created with ${metadata.totalMatches} matches!`);
      return tournament.id;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create tournament";
      toast.error(message);
      return null;
    } finally {
      setCreating(false);
    }
  }

  return { createTournament, creating };
}

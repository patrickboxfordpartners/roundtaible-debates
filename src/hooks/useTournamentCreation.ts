import { useState } from "react";
import { dataCall } from "@/services/api";
import { toast } from "sonner";
import {
  generateBracket,
  getRecommendedSeeding,
  getTournamentMetadata,
  validateBracket,
  type TournamentParticipant,
} from "@/lib/bracketGenerator";

/** Expose bracket creation with submission state and success or failure notifications. */
export function useTournamentCreation() {
  const [creating, setCreating] = useState(false);

  /** Generate and validate a seeded bracket, save it through the API, and return its ID or null on submission failure. */
  async function createTournament(
    name: string,
    topic: string,
    classId: string,
    participantIds: string[],
    seedingStrategy: "random" | "alphabetical" | "custom" = "random"
  ) {
    // Validate participant count
    const metadata = getTournamentMetadata(participantIds.length);

    setCreating(true);
    try {
      // Step 1: Generate bracket
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

      // Step 2: Save tournament and all matches in one server call. The server
      // assigns real ids and links each match to the matches that feed it.
      const tournament = await dataCall<{ id: string }>("tournaments.create", {
        name,
        topic,
        classId,
        totalRounds: metadata.rounds,
        matches,
      });

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

// Tournament bracket generation for single-elimination tournaments

export interface BracketMatch {
  round_number: number;
  match_number: number;
  topic_title: string;
  persona_a: string | null;
  persona_b: string | null;
  parent_match_a: string | null; // UUID of match whose winner goes to persona_a
  parent_match_b: string | null; // UUID of match whose winner goes to persona_b
  winner_id: string | null;
  votes_a: number;
  votes_b: number;
  status: "pending" | "active" | "completed";
}

export interface TournamentParticipant {
  personaId: string;
  seed: number; // 1-based ranking (1 = strongest)
}

/**
 * Generate single-elimination bracket matches
 * @param participants Array of participants with seeding (must be power of 2)
 * @param rounds Number of rounds (e.g., 3 rounds = 8 participants)
 * @param topic Tournament topic (used for all matches)
 * @returns Array of matches with proper seeding and parent relationships
 */
export function generateBracket(
  participants: TournamentParticipant[],
  rounds: number,
  topic: string
): BracketMatch[] {
  const expectedParticipants = Math.pow(2, rounds);

  if (participants.length !== expectedParticipants) {
    throw new Error(
      `Expected ${expectedParticipants} participants for ${rounds} rounds, got ${participants.length}`
    );
  }

  // Sort by seed
  const sorted = [...participants].sort((a, b) => a.seed - b.seed);

  const matches: BracketMatch[] = [];
  const matchIds: string[][] = []; // matchIds[round][matchNumber] = temp ID

  // Generate Round 1 matches with standard seeding
  // Seeding pattern: 1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15 (for 16 participants)
  const round1Count = expectedParticipants / 2;
  matchIds[0] = [];

  for (let i = 0; i < round1Count; i++) {
    // Standard bracket seeding algorithm
    const topSeed = sorted[i];
    const bottomSeed = sorted[expectedParticipants - 1 - i];

    const matchId = `temp-r1-m${i}`;
    matchIds[0].push(matchId);

    matches.push({
      round_number: 1,
      match_number: i + 1,
      topic_title: topic,
      persona_a: topSeed.personaId,
      persona_b: bottomSeed.personaId,
      parent_match_a: null,
      parent_match_b: null,
      winner_id: null,
      votes_a: 0,
      votes_b: 0,
      status: i === 0 ? "active" : "pending", // First match starts active
    });
  }

  // Generate subsequent rounds (empty matches that fill from previous round)
  for (let round = 2; round <= rounds; round++) {
    const matchesThisRound = Math.pow(2, rounds - round);
    matchIds[round - 1] = [];

    for (let i = 0; i < matchesThisRound; i++) {
      const matchId = `temp-r${round}-m${i}`;
      matchIds[round - 1].push(matchId);

      // Determine which previous matches feed into this match
      const parentMatchAIndex = i * 2;
      const parentMatchBIndex = i * 2 + 1;
      const parentMatchA = matchIds[round - 2][parentMatchAIndex];
      const parentMatchB = matchIds[round - 2][parentMatchBIndex];

      matches.push({
        round_number: round,
        match_number: i + 1,
        topic_title: topic,
        persona_a: null, // Filled by winner of parentMatchA
        persona_b: null, // Filled by winner of parentMatchB
        parent_match_a: parentMatchA,
        parent_match_b: parentMatchB,
        winner_id: null,
        votes_a: 0,
        votes_b: 0,
        status: "pending",
      });
    }
  }

  return matches;
}

/**
 * Get seeding recommendations based on participant count
 */
export function getRecommendedSeeding(
  personaIds: string[],
  strategy: "random" | "alphabetical" | "custom"
): TournamentParticipant[] {
  const participants: TournamentParticipant[] = personaIds.map((id, index) => ({
    personaId: id,
    seed: index + 1,
  }));

  switch (strategy) {
    case "random":
      // Shuffle and re-seed
      return participants
        .sort(() => Math.random() - 0.5)
        .map((p, i) => ({ ...p, seed: i + 1 }));

    case "alphabetical":
      // Already in order, just return
      return participants;

    case "custom":
      // Return as-is, user will provide custom seeding
      return participants;

    default:
      return participants;
  }
}

/**
 * Calculate tournament metadata
 */
export function getTournamentMetadata(participantCount: number) {
  const rounds = Math.log2(participantCount);

  if (!Number.isInteger(rounds)) {
    throw new Error("Participant count must be a power of 2 (4, 8, 16, 32)");
  }

  const totalMatches = participantCount - 1; // Single elimination formula

  return {
    rounds,
    totalMatches,
    participantCount,
    round1Matches: participantCount / 2,
  };
}

/**
 * Validate bracket structure
 */
export function validateBracket(matches: BracketMatch[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check round 1 has all participants
  const round1 = matches.filter((m) => m.round_number === 1);
  const hasAllParticipants = round1.every(
    (m) => m.persona_a && m.persona_b && !m.parent_match_a && !m.parent_match_b
  );

  if (!hasAllParticipants) {
    errors.push("Round 1 matches must have both participants and no parent matches");
  }

  // Check later rounds have parent references
  const laterRounds = matches.filter((m) => m.round_number > 1);
  const hasAllParents = laterRounds.every((m) => m.parent_match_a && m.parent_match_b);

  if (!hasAllParents) {
    errors.push("Rounds 2+ must have parent match references");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

import { describe, it, expect, beforeEach, vi } from "vitest";
import { track, getSummary, clearAnalytics } from "./analytics";

// Mock supabaseClient
vi.mock("./supabaseClient", () => ({
  supabase: null,
}));

describe("analytics", () => {
  beforeEach(() => {
    clearAnalytics();
  });

  describe("track", () => {
    it("stores events in localStorage", () => {
      track({ event: "debate_start", topic: "AI rights", category: "Technology", personaCount: 3, mode: "standard" });
      const summary = getSummary();
      expect(summary.totalDebates).toBe(1);
    });

    it("stores multiple events", () => {
      track({ event: "debate_start", topic: "AI rights", category: "Technology", personaCount: 3, mode: "standard" });
      track({ event: "debate_start", topic: "Free will", category: "Philosophy", personaCount: 4, mode: "educational" });
      const summary = getSummary();
      expect(summary.totalDebates).toBe(2);
    });
  });

  describe("getSummary", () => {
    it("returns empty summary with no events", () => {
      const summary = getSummary();
      expect(summary.totalDebates).toBe(0);
      expect(summary.totalDuration).toBe(0);
      expect(summary.topTopics).toEqual([]);
      expect(summary.topPersonas).toEqual([]);
    });

    it("aggregates debate duration", () => {
      track({ event: "debate_end", topic: "Test", duration: 120, exchangeCount: 10, winnerId: null });
      track({ event: "debate_end", topic: "Test", duration: 60, exchangeCount: 5, winnerId: "p1" });
      expect(getSummary().totalDuration).toBe(180);
    });

    it("ranks top topics by count", () => {
      track({ event: "debate_start", topic: "AI rights", category: "Tech", personaCount: 3, mode: "standard" });
      track({ event: "debate_start", topic: "AI rights", category: "Tech", personaCount: 3, mode: "standard" });
      track({ event: "debate_start", topic: "Free will", category: "Phil", personaCount: 3, mode: "standard" });
      const { topTopics } = getSummary();
      expect(topTopics[0].topic).toBe("AI rights");
      expect(topTopics[0].count).toBe(2);
    });

    it("ranks top personas by votes", () => {
      track({ event: "vote", personaId: "edison" });
      track({ event: "vote", personaId: "edison" });
      track({ event: "vote", personaId: "twain" });
      const { topPersonas } = getSummary();
      expect(topPersonas[0].personaId).toBe("edison");
      expect(topPersonas[0].votes).toBe(2);
    });

    it("counts debates by mode", () => {
      track({ event: "debate_start", topic: "T1", category: "C", personaCount: 3, mode: "standard" });
      track({ event: "debate_start", topic: "T2", category: "C", personaCount: 3, mode: "educational" });
      track({ event: "debate_start", topic: "T3", category: "C", personaCount: 3, mode: "standard" });
      expect(getSummary().debatesByMode).toEqual({ standard: 2, educational: 1 });
    });

    it("counts events from today", () => {
      track({ event: "debate_start", topic: "T1", category: "C", personaCount: 3, mode: "standard" });
      expect(getSummary().eventsToday).toBeGreaterThanOrEqual(1);
    });
  });

  describe("clearAnalytics", () => {
    it("removes all events", () => {
      track({ event: "debate_start", topic: "T1", category: "C", personaCount: 3, mode: "standard" });
      clearAnalytics();
      expect(getSummary().totalDebates).toBe(0);
    });
  });
});

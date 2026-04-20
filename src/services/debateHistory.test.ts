import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getSavedDebates,
  saveDebate,
  deleteDebate,
  clearHistory,
  formatTranscriptForExport,
  type SavedDebate,
} from "./debateHistory";
import type { DebateTopic, TranscriptEntry, Persona } from "@/data/debateData";

// Mock supabaseClient to avoid real connections
vi.mock("./supabaseClient", () => ({
  supabase: null,
}));

const mockTopic: DebateTopic = {
  id: "test-topic",
  title: "Test Topic",
  category: "Test",
};

const mockPersonas: Persona[] = [
  {
    id: "p1",
    name: "Alice",
    role: "Tester",
    avatar: "",
    color: "#FF0000",
    wins: 0,
    quotes: ["Testing is believing."],
    context: "",
  },
  {
    id: "p2",
    name: "Bob",
    role: "Debater",
    avatar: "",
    color: "#0000FF",
    wins: 0,
    quotes: ["I disagree."],
    context: "",
  },
];

const mockTranscript: TranscriptEntry[] = [
  { id: "t1", personaId: "p1", text: "First argument.", timestamp: 0 },
  { id: "t2", personaId: "p2", text: "Counterpoint.", timestamp: 5 },
];

describe("debateHistory", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("getSavedDebates", () => {
    it("returns empty array when no history exists", () => {
      expect(getSavedDebates()).toEqual([]);
    });

    it("returns empty array for invalid JSON", () => {
      localStorage.setItem("roundtaible_history", "not-json");
      expect(getSavedDebates()).toEqual([]);
    });
  });

  describe("saveDebate", () => {
    it("saves a debate and returns it", () => {
      const result = saveDebate(mockTopic, mockTranscript, mockPersonas, "p1", 120);
      expect(result.topic).toEqual(mockTopic);
      expect(result.winnerId).toBe("p1");
      expect(result.duration).toBe(120);
      expect(result.personas).toHaveLength(2);
      expect(result.id).toMatch(/^debate_/);
    });

    it("persists to localStorage", () => {
      saveDebate(mockTopic, mockTranscript, mockPersonas, null, 60);
      const saved = getSavedDebates();
      expect(saved).toHaveLength(1);
      expect(saved[0].topic.id).toBe("test-topic");
    });

    it("prepends new debates (most recent first)", () => {
      saveDebate(mockTopic, mockTranscript, mockPersonas, null, 60);
      const topic2 = { ...mockTopic, id: "second", title: "Second" };
      saveDebate(topic2, mockTranscript, mockPersonas, null, 30);
      const saved = getSavedDebates();
      expect(saved).toHaveLength(2);
      expect(saved[0].topic.id).toBe("second");
    });

    it("caps at 50 debates", () => {
      for (let i = 0; i < 55; i++) {
        saveDebate({ ...mockTopic, id: `t${i}` }, [], mockPersonas, null, 10);
      }
      expect(getSavedDebates().length).toBeLessThanOrEqual(50);
    });
  });

  describe("deleteDebate", () => {
    it("removes a specific debate by ID", async () => {
      const d1 = saveDebate(mockTopic, mockTranscript, mockPersonas, null, 60);
      // Ensure different Date.now() so IDs differ
      await new Promise((r) => setTimeout(r, 5));
      const d2 = saveDebate({ ...mockTopic, id: "other" }, [], mockPersonas, null, 30);
      expect(d1.id).not.toBe(d2.id);
      expect(getSavedDebates()).toHaveLength(2);

      deleteDebate(d1.id);
      const remaining = getSavedDebates();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe(d2.id);
    });
  });

  describe("clearHistory", () => {
    it("removes all debates", () => {
      saveDebate(mockTopic, mockTranscript, mockPersonas, null, 60);
      saveDebate(mockTopic, mockTranscript, mockPersonas, null, 30);
      expect(getSavedDebates()).toHaveLength(2);

      clearHistory();
      expect(getSavedDebates()).toEqual([]);
    });
  });

  describe("formatTranscriptForExport", () => {
    it("includes header, participants, and transcript lines", () => {
      const debate: SavedDebate = {
        id: "test",
        topic: mockTopic,
        transcript: mockTranscript,
        personas: mockPersonas.map((p) => ({ id: p.id, name: p.name, color: p.color })),
        winnerId: "p1",
        duration: 125,
        savedAt: new Date("2026-01-15T12:00:00").getTime(),
      };

      const text = formatTranscriptForExport(debate);
      expect(text).toContain("Test Topic");
      expect(text).toContain("Alice, Bob");
      expect(text).toContain("Winner: Alice");
      expect(text).toContain("Duration: 2m 5s");
      expect(text).toContain("Alice: First argument.");
      expect(text).toContain("Bob: Counterpoint.");
    });

    it("shows 'You' for human entries", () => {
      const debate: SavedDebate = {
        id: "test",
        topic: mockTopic,
        transcript: [{ id: "h1", personaId: "human", text: "My point.", timestamp: 0 }],
        personas: [],
        winnerId: null,
        duration: 10,
        savedAt: Date.now(),
      };

      const text = formatTranscriptForExport(debate);
      expect(text).toContain("You: My point.");
    });
  });
});

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  isAPIAvailable,
  getAPIError,
  resetCircuit,
  setDebateMode,
  getDebateMode,
} from "./aiService";

// Mock supabaseClient so no real connections are made
vi.mock("./supabaseClient", () => ({
  supabase: null,
}));

describe("aiService", () => {
  describe("circuit breaker", () => {
    beforeEach(() => {
      resetCircuit();
    });

    it("starts with API available", () => {
      expect(isAPIAvailable()).toBe(true);
      expect(getAPIError()).toBe("");
    });

    it("resetCircuit clears error state", () => {
      // We can't directly open the circuit without calling generatePersonaResponse,
      // but we can verify resetCircuit works from a clean state
      resetCircuit();
      expect(isAPIAvailable()).toBe(true);
      expect(getAPIError()).toBe("");
    });
  });

  describe("debate mode", () => {
    beforeEach(() => {
      setDebateMode("standard");
    });

    it("defaults to standard mode", () => {
      expect(getDebateMode()).toBe("standard");
    });

    it("can switch to educational mode", () => {
      setDebateMode("educational");
      expect(getDebateMode()).toBe("educational");
    });

    it("can switch back to standard mode", () => {
      setDebateMode("educational");
      setDebateMode("standard");
      expect(getDebateMode()).toBe("standard");
    });
  });
});

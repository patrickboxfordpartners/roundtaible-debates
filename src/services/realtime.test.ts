import { describe, it, expect, beforeEach } from "vitest";
import {
  saveSession,
  loadSession,
  clearSession,
  generateRoomId,
  type SessionData,
} from "./realtime";

describe("realtime", () => {
  describe("session persistence", () => {
    beforeEach(() => {
      sessionStorage.clear();
    });

    it("loadSession returns null when no session exists", () => {
      expect(loadSession()).toBeNull();
    });

    it("saves and loads a session", () => {
      const data: SessionData = { role: "host", roomId: "abc123", guestName: "" };
      saveSession(data);
      expect(loadSession()).toEqual(data);
    });

    it("saves guest session with name", () => {
      const data: SessionData = { role: "guest", roomId: "xyz789", guestName: "Alice" };
      saveSession(data);
      const loaded = loadSession();
      expect(loaded?.role).toBe("guest");
      expect(loaded?.guestName).toBe("Alice");
    });

    it("clearSession removes the session", () => {
      saveSession({ role: "host", roomId: "abc123", guestName: "" });
      clearSession();
      expect(loadSession()).toBeNull();
    });

    it("loadSession returns null for corrupted data", () => {
      sessionStorage.setItem("roundtaible_mp_session", "not-json");
      expect(loadSession()).toBeNull();
    });
  });

  describe("generateRoomId", () => {
    it("generates a 6-character string", () => {
      const id = generateRoomId();
      expect(id).toHaveLength(6);
    });

    it("only contains allowed characters", () => {
      const allowed = "abcdefghjkmnpqrstuvwxyz23456789";
      for (let i = 0; i < 20; i++) {
        const id = generateRoomId();
        for (const char of id) {
          expect(allowed).toContain(char);
        }
      }
    });

    it("generates unique IDs", () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateRoomId());
      }
      // With 30^6 possible IDs, 100 should all be unique
      expect(ids.size).toBe(100);
    });
  });
});

import { describe, it, expect } from "vitest";
import { allPersonas, personas, rosterPersonas, debateTopics } from "./debateData";

describe("debateData", () => {
  describe("persona collections", () => {
    it("allPersonas contains all default and roster personas", () => {
      expect(allPersonas.length).toBe(personas.length + rosterPersonas.length);
    });

    it("personas (defaults) all have isDefault: true", () => {
      for (const p of personas) {
        expect(p.isDefault).toBe(true);
      }
    });

    it("every persona has required fields", () => {
      for (const p of allPersonas) {
        expect(p.id).toBeTruthy();
        expect(p.name).toBeTruthy();
        expect(p.role).toBeTruthy();
        expect(p.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(p.quotes.length).toBeGreaterThan(0);
        expect(typeof p.context).toBe("string");
      }
    });

    it("all persona IDs are unique", () => {
      const ids = allPersonas.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("default personas have avatars", () => {
      for (const p of personas) {
        expect(p.avatar).toBeTruthy();
      }
    });
  });

  describe("debate topics", () => {
    it("all topics have required fields", () => {
      for (const t of debateTopics) {
        expect(t.id).toBeTruthy();
        expect(t.title).toBeTruthy();
        expect(t.category).toBeTruthy();
      }
    });

    it("all topic IDs are unique", () => {
      const ids = debateTopics.map((t) => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("educational topics have a subject field", () => {
      const eduTopics = debateTopics.filter((t) => t.id.startsWith("edu-"));
      expect(eduTopics.length).toBeGreaterThan(0);
      for (const t of eduTopics) {
        expect(t.subject).toBeTruthy();
      }
    });

    it("standard topics do not have a subject field", () => {
      const standardTopics = debateTopics.filter((t) => !t.id.startsWith("edu-"));
      for (const t of standardTopics) {
        expect(t.subject).toBeUndefined();
      }
    });
  });
});

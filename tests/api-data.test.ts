// @vitest-environment node
// Runs every /api/data operation against a real in-memory Postgres (PGlite) using
// db/migrations/001_init.sql. No network or secrets needed.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeAll } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";

import path from "node:path";

const REPO = path.resolve(__dirname, "..");
const h = vi.hoisted(() => ({ sql: null as any, user: null as string | null }));
const pg = new PGlite();

// Fake neon(): tagged template -> lazy query, plus .transaction([...])
function makeSql() {
  const tag: any = (strings: TemplateStringsArray, ...values: unknown[]) => {
    let text = strings[0];
    values.forEach((_, i) => { text += `$${i + 1}` + strings[i + 1]; });
    const q: any = { text, params: values };
    q.run = async () => (await pg.query(text, values as any[])).rows;
    q.then = (res: any, rej: any) => q.run().then(res, rej);
    return q;
  };
  tag.transaction = async (qs: any[]) => {
    await pg.exec("BEGIN");
    try { const out = []; for (const q of qs) out.push(await q.run()); await pg.exec("COMMIT"); return out; }
    catch (e) { await pg.exec("ROLLBACK"); throw e; }
  };
  return tag;
}
h.sql = makeSql();

vi.mock("../api/_lib/db.ts", () => ({ db: () => h.sql }));
vi.mock("../api/_lib/email.ts", () => ({ sendWelcomeEmail: async () => {} }));
vi.mock("../api/_lib/auth.ts", () => ({
  getUserId: async () => h.user,
  requireUserId: async () => { if (!h.user) throw new Error("401"); return h.user; },
  getClerkUser: async (id: string) => ({ email: `${id}@example.com`, fullName: `Name ${id}` }),
}));

let POST: (r: Request) => Promise<Response>;
async function call(user: string | null, op: string, args: Record<string, unknown> = {}) {
  h.user = user;
  const res = await POST(new Request("https://x.test/api/data", { method: "POST", body: JSON.stringify({ op, args }), headers: { "x-forwarded-for": Math.random().toString() } }));
  return { status: res.status, body: await res.json() };
}

beforeAll(async () => {
  await pg.exec(readFileSync(REPO + "/db/migrations/001_init.sql", "utf8"));
  await pg.exec(readFileSync(REPO + "/db/migrations/001_init.sql", "utf8")); // idempotent
  ({ POST } = await import("../api/data.ts"));
});

describe("data api against real Postgres (PGlite)", () => {
  let classId = ""; let tournamentId = "";
  it("profiles", async () => {
    expect((await call(null, "profile.get")).status).toBe(401);
    const t = await call("user_teacher", "profile.get", { role: "teacher" });
    expect(t.status).toBe(200); expect(t.body.created).toBe(true); expect(t.body.profile.role).toBe("teacher");
    expect((await call("user_teacher", "profile.get")).body.created).toBe(false);
    const s = await call("user_student", "profile.get", { role: "student" });
    expect(s.body.profile.subscription_tier).toBe("free");
    await call("user_other", "profile.get", { role: "admin" });
  });
  it("classes", async () => {
    expect((await call("user_student", "classes.create", { name: "x" })).status).toBe(403);
    const c = await call("user_teacher", "classes.create", { name: "History 101", gradeLevel: "9-10" });
    expect(c.status).toBe(200); classId = c.body.class.id;
    const code = c.body.class.join_code;
    expect((await call("user_teacher", "classes.listTeacher")).body.classes.length).toBe(1);
    expect((await call("user_student", "classes.join", { joinCode: "nope00" })).body.code).toBe("invalid_code");
    expect((await call("user_student", "classes.join", { joinCode: code.toUpperCase() })).status).toBe(200);
    expect((await call("user_student", "classes.join", { joinCode: code })).body.code).toBe("already_member");
    const m = await call("user_student", "classes.listStudent");
    expect(m.body.memberships[0].rt_classes.name).toBe("History 101");
    const g = await call("user_teacher", "classes.get", { classId });
    expect(g.status).toBe(200); expect(g.body.students.length).toBe(1);
    expect((await call("user_student", "classes.get", { classId })).body.students.length).toBe(0);
    expect((await call("user_other", "classes.get", { classId })).status).toBe(403);
  });
  it("debates, limits, leaderboard, analytics", async () => {
    const d = { topic: { id: "t1", title: "AI?", category: "tech" }, transcript: [{ personaId: "edison", text: "hi" }], personas: [{ id: "edison", name: "Edison", color: "#fff" }], winnerId: "edison", duration: 120, classId };
    expect((await call(null, "debates.save", d)).status).toBe(200);
    expect((await call("user_student", "debates.save", d)).status).toBe(200);
    expect((await call("user_other", "debates.save", d)).status).toBe(200); // classId dropped for non-member
    expect((await call("user_student", "debates.monthlyCount")).body.count).toBe(1);
    expect((await call("user_student", "leaderboard.recordWin", { personaId: "edison", personaName: "Edison" })).status).toBe(200);
    await call("user_student", "leaderboard.recordWin", { personaId: "edison", personaName: "Edison" });
    expect((await pg.query("select wins from rt_leaderboards")).rows[0]).toEqual({ wins: 2 });
    const a = await call("user_student", "analytics.load");
    expect(a.body.debates.length).toBe(1); expect(a.body.debates[0].personas[0].name).toBe("Edison");
    const ta = await call("user_teacher", "analytics.load");
    expect(ta.body.classMembers[0].debate_count).toBe(1);
    expect(ta.body.classMembers[0].rt_profiles.full_name).toBe("Name user_student");
    expect((await call("user_teacher", "classes.get", { classId })).body.debates.length).toBe(1);
    expect((await pg.query("select count(*)::int c from rt_debates where class_id is not null")).rows[0]).toEqual({ c: 1 });
  });
  it("assignments", async () => {
    expect((await call("user_other", "assignments.create", { classId, topicTitle: "x" })).status).toBe(403);
    const c = await call("user_teacher", "assignments.create", { classId, topicTitle: "Was the telegraph good?", dueDate: "2026-11-01", instructions: "Go" });
    expect(c.status).toBe(200);
    const tl = await call("user_teacher", "assignments.list");
    expect(tl.body.assignments[0].rt_classes.name).toBe("History 101");
    expect(tl.body.assignments[0].total_students).toBe(1);
    expect(tl.body.classes.length).toBe(1);
    const sl = await call("user_student", "assignments.list");
    expect(sl.body.assignments[0].submitted).toBe(false);
    expect((await call("user_student", "assignments.submit", { assignmentId: c.body.assignment.id })).status).toBe(200);
    expect((await call("user_student", "assignments.list")).body.assignments[0].submitted).toBe(true);
    expect((await call("user_teacher", "assignments.list")).body.assignments[0].submission_count).toBe(1);
    await call("user_student", "assignments.deactivate", { id: c.body.assignment.id }); // not owner: no-op
    expect((await call("user_student", "assignments.list")).body.assignments.length).toBe(1);
    await call("user_teacher", "assignments.deactivate", { id: c.body.assignment.id });
    expect((await call("user_student", "assignments.list")).body.assignments.length).toBe(0);
  });
  it("tournaments", async () => {
    const { generateBracket, getRecommendedSeeding, getTournamentMetadata } = await import("../src/lib/bracketGenerator.ts");
    const ids = ["edison", "tesla", "twain", "adams"];
    const meta = getTournamentMetadata(4);
    const matches = generateBracket(getRecommendedSeeding(ids, "alphabetical"), meta.rounds, "Topic");
    expect((await call("user_student", "tournaments.create", { name: "T", topic: "Topic", classId, totalRounds: meta.rounds, matches })).status).toBe(403);
    const c = await call("user_teacher", "tournaments.create", { name: "T", topic: "Topic", classId, totalRounds: meta.rounds, matches });
    expect(c.status).toBe(200); tournamentId = c.body.id;
    const g = await call("user_student", "tournaments.get", { tournamentId });
    expect(g.body.rounds.length).toBe(3);
    const final = g.body.rounds.find((r: any) => r.round_number === 2);
    expect(final.parent_match_a).toBeTruthy(); expect(final.parent_match_b).toBeTruthy();
    expect((await call("user_other", "tournaments.get", { tournamentId })).status).toBe(403);
    const r1 = g.body.rounds.find((r: any) => r.round_number === 1 && r.match_number === 1);
    expect((await call("user_student", "tournaments.vote", { roundId: r1.id, personaId: "nobody" })).status).toBe(400);
    await call("user_student", "tournaments.vote", { roundId: r1.id, personaId: r1.persona_b });
    await call("user_student", "tournaments.vote", { roundId: r1.id, personaId: r1.persona_b });
    let rr = (await call("user_student", "tournaments.get", { tournamentId })).body;
    let x = rr.rounds.find((r: any) => r.id === r1.id);
    expect([x.votes_a, x.votes_b]).toEqual([0, 1]);
    expect(rr.votes[0].voted_for).toBe(r1.persona_b);
    await call("user_student", "tournaments.vote", { roundId: r1.id, personaId: r1.persona_a }); // change vote
    x = (await call("user_student", "tournaments.get", { tournamentId })).body.rounds.find((r: any) => r.id === r1.id);
    expect([x.votes_a, x.votes_b]).toEqual([1, 0]);
    expect((await call("user_student", "tournaments.advance", { roundId: r1.id })).status).toBe(403);
    const adv = await call("user_teacher", "tournaments.advance", { roundId: r1.id });
    expect(adv.body.winnerId).toBe(r1.persona_a);
    rr = (await call("user_teacher", "tournaments.get", { tournamentId })).body;
    const fin = rr.rounds.find((r: any) => r.round_number === 2);
    expect(fin.status).toBe("active"); expect(fin.persona_a).toBe(r1.persona_a);
    expect(rr.tournament.current_round).toBe(2);
    expect((await call("user_teacher", "classes.get", { classId })).body.tournaments.length).toBe(1);
  });
  it("rejects unknown ops and bad ids", async () => {
    expect((await call("user_teacher", "nope")).status).toBe(400);
    expect((await call("user_teacher", "__proto__")).status).toBe(400);
    expect((await call("user_teacher", "classes.get", { classId: "1; drop table x" })).status).toBe(400);
  });
});

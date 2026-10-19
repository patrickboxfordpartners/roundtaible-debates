/* eslint-disable @typescript-eslint/no-explicit-any -- request bodies are validated field by field */
// One endpoint for all database reads and writes from the app.
// The browser posts { op, args }; every op checks the signed-in Clerk user itself.
// This replaces the browser talking straight to Supabase with row-level security.

import { db } from "./_lib/db.js";
import { getClerkUser, getUserId } from "./_lib/auth.js";
import { HttpError, errorResponse, json, rateLimit, readJson } from "./_lib/http.js";
import { sendWelcomeEmail } from "./_lib/email.js";

type Args = Record<string, any>;
type Ctx = { userId: string | null; args: Args };
type Row = Record<string, any>;

/** Return the authenticated context user ID, or throw HTTP 401. */
function need(ctx: Ctx): string {
  if (!ctx.userId) throw new HttpError(401, "Unauthorized");
  return ctx.userId;
}

/** Require a nonblank string, trim it, and truncate it to the field limit. */
function str(v: unknown, field: string, max = 500): string {
  if (typeof v !== "string" || !v.trim()) throw new HttpError(400, `${field} is required`);
  return v.trim().slice(0, max);
}

/** Return trimmed, truncated optional text, or null for blank or non-string values. */
function optStr(v: unknown, max = 2000): string | null {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Require a UUID-shaped string, or throw HTTP 400 naming the invalid field. */
function uuid(v: unknown, field: string): string {
  if (typeof v !== "string" || !UUID_RE.test(v)) throw new HttpError(400, `${field} is invalid`);
  return v;
}

const JOIN_CODE_CHARS = "abcdefghjkmnpqrstuvwxyz23456789";
/** Generate a six-character class join code; callers handle database collisions. */
function joinCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) code += JOIN_CODE_CHARS[Math.floor(Math.random() * JOIN_CODE_CHARS.length)];
  return code;
}

/** Look up the stored profile role, returning null when no profile exists. */
async function getRole(userId: string): Promise<string | null> {
  const rows = await db()`SELECT role FROM rt_profiles WHERE id = ${userId}`;
  return rows[0]?.role ?? null;
}

/** Teacher who owns the class, or a student in it. */
async function classAccess(userId: string, classId: string): Promise<{ isOwner: boolean; isMember: boolean; cls: Row | null }> {
  const rows = await db()`
    SELECT c.*, EXISTS (
      SELECT 1 FROM rt_class_members m WHERE m.class_id = c.id AND m.student_id = ${userId}
    ) AS is_member
    FROM rt_classes c WHERE c.id = ${classId}`;
  const cls = rows[0] ?? null;
  if (!cls) return { isOwner: false, isMember: false, cls: null };
  const { is_member, ...rest } = cls;
  return { isOwner: cls.teacher_id === userId, isMember: !!is_member, cls: rest };
}

/** Return a public or authorized class tournament, rejecting missing records and unauthorized viewers. */
async function tournamentAccess(userId: string | null, tournamentId: string): Promise<Row> {
  const rows = await db()`SELECT * FROM rt_tournaments WHERE id = ${tournamentId}`;
  const t = rows[0];
  if (!t) throw new HttpError(404, "Tournament not found");
  if (t.class_id === null || t.created_by === userId) return t;
  if (!userId) throw new HttpError(401, "Unauthorized");
  const access = await classAccess(userId, t.class_id);
  if (!access.isOwner && !access.isMember) throw new HttpError(403, "Forbidden");
  return t;
}

const ops: Record<string, (ctx: Ctx) => Promise<unknown>> = {
  // ---- Profile ----
  /** Load the signed-in profile or create it from Clerk data, attempting a welcome email only after insertion. */
  async "profile.get"(ctx) {
    const userId = need(ctx);
    const sql = db();
    const existing = await sql`SELECT * FROM rt_profiles WHERE id = ${userId}`;
    if (existing[0]) return { profile: existing[0], created: false };

    const role = ctx.args.role === "teacher" ? "teacher" : "student";
    const { email, fullName } = await getClerkUser(userId);
    const inserted = await sql`
      INSERT INTO rt_profiles (id, email, full_name, role, subscription_tier, subscription_status)
      VALUES (${userId}, ${email}, ${fullName}, ${role}, 'free', 'active')
      ON CONFLICT (id) DO NOTHING
      RETURNING *`;
    if (!inserted[0]) {
      const again = await sql`SELECT * FROM rt_profiles WHERE id = ${userId}`;
      return { profile: again[0] ?? null, created: false };
    }
    try {
      await sendWelcomeEmail(email, fullName, role);
    } catch (err) {
      console.error("welcome email error", err);
    }
    return { profile: inserted[0], created: true };
  },

  // ---- Debates ----
  /** Save a bounded transcript and persona list, associating the session user and any authorized class. */
  async "debates.save"(ctx) {
    const a = ctx.args;
    const topic = a.topic || {};
    let classId: string | null = null;
    if (ctx.userId && typeof a.classId === "string" && UUID_RE.test(a.classId)) {
      const access = await classAccess(ctx.userId, a.classId);
      if (access.isOwner || access.isMember) classId = a.classId;
    }
    const transcript = Array.isArray(a.transcript) ? a.transcript.slice(0, 500) : [];
    const personas = Array.isArray(a.personas) ? a.personas.slice(0, 32) : [];
    const rows = await db()`
      INSERT INTO rt_debates (topic_id, topic_title, topic_category, transcript, personas, winner_id, duration, user_id, class_id, educational_mode)
      VALUES (
        ${str(topic.id, "topic.id", 200)}, ${str(topic.title, "topic.title", 500)}, ${optStr(topic.category, 200)},
        ${JSON.stringify(transcript)}::jsonb, ${JSON.stringify(personas)}::jsonb,
        ${optStr(a.winnerId, 200)}, ${Math.max(0, Math.min(86400, Number(a.duration) || 0))},
        ${ctx.userId}, ${classId}, ${!!a.educationalMode}
      )
      RETURNING id`;
    return { id: rows[0].id };
  },

  /** Count the signed-in user’s debates since the start of the database’s current calendar month. */
  async "debates.monthlyCount"(ctx) {
    const userId = need(ctx);
    const rows = await db()`
      SELECT COUNT(*)::int AS count FROM rt_debates
      WHERE user_id = ${userId} AND created_at >= date_trunc('month', NOW())`;
    return { count: rows[0]?.count ?? 0 };
  },

  /** Increment the signed-in user’s win count for the supplied persona, creating the entry if needed. */
  async "leaderboard.recordWin"(ctx) {
    const userId = need(ctx);
    const personaId = str(ctx.args.personaId, "personaId", 200);
    const personaName = str(ctx.args.personaName, "personaName", 200);
    await db()`
      INSERT INTO rt_leaderboards (user_id, persona_id, persona_name, wins, updated_at)
      VALUES (${userId}, ${personaId}, ${personaName}, 1, NOW())
      ON CONFLICT (user_id, persona_id)
      DO UPDATE SET wins = rt_leaderboards.wins + 1, persona_name = EXCLUDED.persona_name, updated_at = NOW()`;
    return { ok: true };
  },

  // ---- Analytics page ----
  /** Load recent personal debates and, for teachers, membership analytics for their own classes. */
  async "analytics.load"(ctx) {
    const userId = need(ctx);
    const sql = db();
    const debates = await sql`
      SELECT id, topic_title, topic_category, winner_id, duration, educational_mode, created_at, personas
      FROM rt_debates WHERE user_id = ${userId}
      ORDER BY created_at DESC LIMIT 200`;
    let classMembers: Row[] = [];
    if ((await getRole(userId)) === "teacher") {
      const rows = await sql`
        SELECT m.student_id, p.full_name, p.email,
          (SELECT COUNT(*)::int FROM rt_debates d WHERE d.user_id = m.student_id) AS debate_count
        FROM rt_class_members m
        JOIN rt_classes c ON c.id = m.class_id
        LEFT JOIN rt_profiles p ON p.id = m.student_id
        WHERE c.teacher_id = ${userId}`;
      classMembers = rows.map((r) => ({
        student_id: r.student_id,
        rt_profiles: r.full_name !== null || r.email !== null ? { full_name: r.full_name, email: r.email } : null,
        debate_count: r.debate_count,
      }));
    }
    return { debates, classMembers };
  },

  // ---- Classes ----
  /** List classes owned by the signed-in user, newest first. */
  async "classes.listTeacher"(ctx) {
    const userId = need(ctx);
    const classes = await db()`SELECT * FROM rt_classes WHERE teacher_id = ${userId} ORDER BY created_at DESC`;
    return { classes };
  },

  /** Create a class for a teacher, retrying join-code collisions up to five times. */
  async "classes.create"(ctx) {
    const userId = need(ctx);
    if ((await getRole(userId)) !== "teacher") throw new HttpError(403, "Only teachers can create classes");
    const a = ctx.args;
    const name = str(a.name, "name", 200);
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const rows = await db()`
          INSERT INTO rt_classes (teacher_id, name, description, grade_level, subject, join_code)
          VALUES (${userId}, ${name}, ${optStr(a.description)}, ${optStr(a.gradeLevel, 50)}, ${optStr(a.subject, 200)}, ${joinCode()})
          RETURNING *`;
        return { class: rows[0] };
      } catch (err: any) {
        if (err?.code !== "23505") throw err; // retry only on join-code collision
      }
    }
    throw new HttpError(500, "Could not generate a unique join code");
  },

  /** List the signed-in user’s class memberships with class details, newest first. */
  async "classes.listStudent"(ctx) {
    const userId = need(ctx);
    const rows = await db()`
      SELECT m.class_id, m.joined_at, c.id, c.name, c.description, c.grade_level, c.join_code
      FROM rt_class_members m JOIN rt_classes c ON c.id = m.class_id
      WHERE m.student_id = ${userId}
      ORDER BY m.joined_at DESC`;
    return {
      memberships: rows.map((r) => ({
        class_id: r.class_id,
        joined_at: r.joined_at,
        rt_classes: { id: r.id, name: r.name, description: r.description, grade_level: r.grade_level, join_code: r.join_code },
      })),
    };
  },

  /** Join an active class by code, reporting invalid codes and existing memberships as HTTP errors. */
  async "classes.join"(ctx) {
    const userId = need(ctx);
    const code = str(ctx.args.joinCode, "joinCode", 20).toLowerCase();
    const sql = db();
    const cls = await sql`SELECT id FROM rt_classes WHERE join_code = ${code} AND is_active = true`;
    if (!cls[0]) throw new HttpError(404, "Invalid join code", "invalid_code");
    const inserted = await sql`
      INSERT INTO rt_class_members (class_id, student_id) VALUES (${cls[0].id}, ${userId})
      ON CONFLICT (class_id, student_id) DO NOTHING RETURNING id`;
    if (!inserted[0]) throw new HttpError(409, "Already a member of this class", "already_member");
    return { classId: cls[0].id };
  },

  /** Load class activity for its owner or members, exposing the student roster only to the owner. */
  async "classes.get"(ctx) {
    const userId = need(ctx);
    const classId = uuid(ctx.args.classId, "classId");
    const access = await classAccess(userId, classId);
    if (!access.cls) throw new HttpError(404, "Class not found");
    if (!access.isOwner && !access.isMember) throw new HttpError(403, "Forbidden");
    const sql = db();
    const [debates, tournaments] = await Promise.all([
      sql`SELECT id, topic_title, topic_category, winner_id, duration, educational_mode, created_at, user_id
          FROM rt_debates WHERE class_id = ${classId} ORDER BY created_at DESC LIMIT 50`,
      sql`SELECT id, name, description, status, current_round, total_rounds, created_at
          FROM rt_tournaments WHERE class_id = ${classId} ORDER BY created_at DESC`,
    ]);
    const students = access.isOwner
      ? await sql`SELECT p.id, p.full_name, p.email FROM rt_class_members m
                  JOIN rt_profiles p ON p.id = m.student_id WHERE m.class_id = ${classId}`
      : [];
    return { class: access.cls, debates, tournaments, students };
  },

  // ---- Assignments ----
  /** List owned assignments and class options for teachers, or active assignments for a student’s classes. */
  async "assignments.list"(ctx) {
    const userId = need(ctx);
    const sql = db();
    if ((await getRole(userId)) === "teacher") {
      const [assignments, classes] = await Promise.all([
        sql`SELECT a.*, json_build_object('name', c.name) AS rt_classes,
              (SELECT COUNT(*)::int FROM rt_assignment_submissions s WHERE s.assignment_id = a.id) AS submission_count,
              (SELECT COUNT(*)::int FROM rt_class_members m WHERE m.class_id = a.class_id) AS total_students
            FROM rt_assignments a JOIN rt_classes c ON c.id = a.class_id
            WHERE a.teacher_id = ${userId} ORDER BY a.created_at DESC`,
        sql`SELECT id, name FROM rt_classes WHERE teacher_id = ${userId} AND is_active = true ORDER BY created_at DESC`,
      ]);
      return { assignments, classes };
    }
    const assignments = await sql`
      SELECT a.*, json_build_object('name', c.name) AS rt_classes,
        EXISTS (SELECT 1 FROM rt_assignment_submissions s WHERE s.assignment_id = a.id AND s.student_id = ${userId}) AS submitted
      FROM rt_assignments a
      JOIN rt_classes c ON c.id = a.class_id
      JOIN rt_class_members m ON m.class_id = a.class_id AND m.student_id = ${userId}
      WHERE a.is_active = true
      ORDER BY a.due_date ASC NULLS LAST`;
    return { assignments, classes: [] };
  },

  /** Validate and create an assignment in a class owned by the signed-in user. */
  async "assignments.create"(ctx) {
    const userId = need(ctx);
    const a = ctx.args;
    const classId = uuid(a.classId, "classId");
    const access = await classAccess(userId, classId);
    if (!access.isOwner) throw new HttpError(403, "You can only add assignments to your own classes");
    const due = typeof a.dueDate === "string" && a.dueDate ? new Date(a.dueDate) : null;
    if (due && isNaN(due.getTime())) throw new HttpError(400, "dueDate is invalid");
    const rows = await db()`
      INSERT INTO rt_assignments (class_id, teacher_id, topic_title, topic_category, due_date, instructions)
      VALUES (${classId}, ${userId}, ${str(a.topicTitle, "topicTitle", 500)}, ${optStr(a.topicCategory, 200)},
              ${due ? due.toISOString() : null}, ${optStr(a.instructions, 5000)})
      RETURNING *`;
    return { assignment: rows[0] };
  },

  /** Deactivate the specified assignment only if it belongs to the signed-in teacher. */
  async "assignments.deactivate"(ctx) {
    const userId = need(ctx);
    const id = uuid(ctx.args.id, "id");
    await db()`UPDATE rt_assignments SET is_active = false WHERE id = ${id} AND teacher_id = ${userId}`;
    return { ok: true };
  },

  /** Create or replace the signed-in class member’s assignment submission and optional debate reference. */
  async "assignments.submit"(ctx) {
    const userId = need(ctx);
    const assignmentId = uuid(ctx.args.assignmentId, "assignmentId");
    const debateId = ctx.args.debateId ? uuid(ctx.args.debateId, "debateId") : null;
    const sql = db();
    const ok = await sql`
      SELECT 1 FROM rt_assignments a JOIN rt_class_members m ON m.class_id = a.class_id
      WHERE a.id = ${assignmentId} AND m.student_id = ${userId}`;
    if (!ok[0]) throw new HttpError(403, "Not your assignment");
    await sql`
      INSERT INTO rt_assignment_submissions (assignment_id, student_id, debate_id)
      VALUES (${assignmentId}, ${userId}, ${debateId})
      ON CONFLICT (assignment_id, student_id) DO UPDATE SET debate_id = EXCLUDED.debate_id, submitted_at = NOW()`;
    return { ok: true };
  },

  // ---- Tournaments ----
  /** Create a class owner’s tournament and bracket in one transaction, replacing temporary match links with UUIDs. */
  async "tournaments.create"(ctx) {
    const userId = need(ctx);
    const a = ctx.args;
    const classId = uuid(a.classId, "classId");
    const access = await classAccess(userId, classId);
    if (!access.isOwner) throw new HttpError(403, "Only the class teacher can create tournaments");
    const name = str(a.name, "name", 200);
    const topic = str(a.topic, "topic", 500);
    const matches: Row[] = Array.isArray(a.matches) ? a.matches : [];
    if (matches.length < 1 || matches.length > 64) throw new HttpError(400, "matches is invalid");
    const totalRounds = Math.max(1, Math.min(10, Number(a.totalRounds) || 1));

    // Give every match a real id up front so parent links can be written in one go.
    const tempToReal = new Map<string, string>();
    const ids = matches.map((m) => {
      const id = crypto.randomUUID();
      tempToReal.set(`temp-r${m.round_number}-m${Number(m.match_number) - 1}`, id);
      return id;
    });
    const tournamentId = crypto.randomUUID();
    const sql = db();
    /** Truncate string match fields to 200 characters, returning null for other values. */
    const s = (v: unknown) => (typeof v === "string" ? v.slice(0, 200) : null);
    /** Normalize match status to active, completed, or the default pending state. */
    const status = (v: unknown) => (v === "active" || v === "completed" ? v : "pending");
    await sql.transaction([
      sql`INSERT INTO rt_tournaments (id, name, description, topics, class_id, created_by, total_rounds, status, current_round)
          VALUES (${tournamentId}, ${name}, ${topic}, ${JSON.stringify([topic])}::jsonb, ${classId}, ${userId}, ${totalRounds}, 'active', 1)`,
      ...matches.map((m, i) => sql`
          INSERT INTO rt_tournament_rounds (id, tournament_id, round_number, match_number, topic_title, persona_a, persona_b,
                                            winner_id, votes_a, votes_b, status)
          VALUES (${ids[i]}, ${tournamentId}, ${Number(m.round_number) || 1}, ${Number(m.match_number) || i + 1},
                  ${s(m.topic_title) || topic}, ${s(m.persona_a)}, ${s(m.persona_b)},
                  ${s(m.winner_id)}, 0, 0, ${status(m.status)})`),
      ...matches
        .map((m, i) => ({ m, id: ids[i] }))
        .filter(({ m }) => m.parent_match_a || m.parent_match_b)
        .map(({ m, id }) => sql`
          UPDATE rt_tournament_rounds
          SET parent_match_a = ${tempToReal.get(m.parent_match_a) ?? null},
              parent_match_b = ${tempToReal.get(m.parent_match_b) ?? null}
          WHERE id = ${id}`),
    ]);
    return { id: tournamentId };
  },

  /** Load an accessible tournament, its ordered matches, and the current user’s votes when signed in. */
  async "tournaments.get"(ctx) {
    const tournamentId = uuid(ctx.args.tournamentId, "tournamentId");
    const tournament = await tournamentAccess(ctx.userId, tournamentId);
    const sql = db();
    const rounds = await sql`
      SELECT * FROM rt_tournament_rounds WHERE tournament_id = ${tournamentId}
      ORDER BY round_number, match_number NULLS LAST`;
    const votes = ctx.userId
      ? await sql`SELECT v.round_id, v.voted_for FROM rt_tournament_votes v
                  JOIN rt_tournament_rounds r ON r.id = v.round_id
                  WHERE r.tournament_id = ${tournamentId} AND v.user_id = ${ctx.userId}`
      : [];
    return { tournament, rounds, votes };
  },

  /** Upsert an authorized user’s contestant vote and recalculate both match totals in one transaction. */
  async "tournaments.vote"(ctx) {
    const userId = need(ctx);
    const roundId = uuid(ctx.args.roundId, "roundId");
    const personaId = str(ctx.args.personaId, "personaId", 200);
    const sql = db();
    const round = (await sql`SELECT * FROM rt_tournament_rounds WHERE id = ${roundId}`)[0];
    if (!round) throw new HttpError(404, "Round not found");
    await tournamentAccess(userId, round.tournament_id);
    if (personaId !== round.persona_a && personaId !== round.persona_b) throw new HttpError(400, "Not a contestant in this match");
    await sql.transaction([
      sql`INSERT INTO rt_tournament_votes (round_id, user_id, voted_for) VALUES (${roundId}, ${userId}, ${personaId})
          ON CONFLICT (round_id, user_id) DO UPDATE SET voted_for = EXCLUDED.voted_for, created_at = NOW()`,
      sql`UPDATE rt_tournament_rounds r
          SET votes_a = (SELECT COUNT(*)::int FROM rt_tournament_votes v WHERE v.round_id = r.id AND v.voted_for = r.persona_a),
              votes_b = (SELECT COUNT(*)::int FROM rt_tournament_votes v WHERE v.round_id = r.id AND v.voted_for = r.persona_b)
          WHERE r.id = ${roundId}`,
    ]);
    return { ok: true };
  },

  /** Let the tournament creator resolve a match, propagate its winner, and activate the next round or finish. */
  async "tournaments.advance"(ctx) {
    const userId = need(ctx);
    const roundId = uuid(ctx.args.roundId, "roundId");
    const sql = db();
    const round = (await sql`SELECT * FROM rt_tournament_rounds WHERE id = ${roundId}`)[0];
    if (!round) throw new HttpError(404, "Round not found");
    const t = (await sql`SELECT * FROM rt_tournaments WHERE id = ${round.tournament_id}`)[0];
    if (!t || t.created_by !== userId) throw new HttpError(403, "Only the tournament creator can advance rounds");
    const winnerId = round.votes_a >= round.votes_b ? round.persona_a : round.persona_b;
    const next = (await sql`
      SELECT id, round_number FROM rt_tournament_rounds
      WHERE tournament_id = ${t.id} AND round_number = ${round.round_number + 1}
      ORDER BY match_number NULLS LAST LIMIT 1`)[0];
    await sql.transaction([
      sql`UPDATE rt_tournament_rounds SET winner_id = ${winnerId}, status = 'completed' WHERE id = ${roundId}`,
      // Send the winner on to the match this one feeds into.
      sql`UPDATE rt_tournament_rounds SET persona_a = ${winnerId} WHERE parent_match_a = ${roundId}`,
      sql`UPDATE rt_tournament_rounds SET persona_b = ${winnerId} WHERE parent_match_b = ${roundId}`,
      ...(next
        ? [
            sql`UPDATE rt_tournament_rounds SET status = 'active' WHERE id = ${next.id}`,
            sql`UPDATE rt_tournaments SET current_round = ${next.round_number}, updated_at = NOW() WHERE id = ${t.id}`,
          ]
        : [sql`UPDATE rt_tournaments SET status = 'completed', updated_at = NOW() WHERE id = ${t.id}`]),
    ]);
    return { ok: true, winnerId };
  },
};

// Ops that also work for signed-out visitors.
const PUBLIC_OPS = new Set(["debates.save", "tournaments.get"]);

/** Dispatch a named database operation with the verified session context and return JSON errors. */
export async function POST(req: Request): Promise<Response> {
  try {
    rateLimit(req, "data", 120);
    const body = await readJson<{ op?: string; args?: Args }>(req, 1024 * 1024);
    const op = typeof body.op === "string" ? body.op : "";
    const handler = Object.prototype.hasOwnProperty.call(ops, op) ? ops[op] : undefined;
    if (!handler) throw new HttpError(400, `Unknown op: ${op}`);
    const userId = await getUserId(req);
    if (!userId && !PUBLIC_OPS.has(op)) throw new HttpError(401, "Unauthorized");
    const result = await handler({ userId, args: body.args && typeof body.args === "object" ? body.args : {} });
    return json(result);
  } catch (err) {
    return errorResponse(err);
  }
}

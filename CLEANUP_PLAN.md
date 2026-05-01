# RoundtAIble Debates - Cleanup Plan
**Date**: 2026-05-01
**Goal**: Polish dual-use product (EdTech + Sales Demo) to production-ready state

---

## Status Summary

**✅ Working Well:**
- Demo mode (auto-start, auto-advance)
- ElevenLabs TTS via proxy with browser fallback
- Supabase Auth with role-based access
- Stripe subscription flow with debate quotas
- Analytics dashboard (clean, comprehensive)
- Assignments (creation/listing)

**⚠️ Incomplete/Rough:**
- EdTech mode (scaffolding done, logic missing)
- Socratic questioning (config defined, not implemented)
- Vocabulary highlights (config defined, not rendered)
- Tournament brackets (UI shell, no generation logic)
- Student submissions (no completion tracking)

**❌ Critical Gaps:**
- Pricing tier mismatch (3 tiers in UI, 2 in code)
- Silent TTS failures (no user notification)
- Production console logs (17 occurrences)
- ESLint disables (6 occurrences)

---

## Cleanup Tasks (Prioritized)

### PHASE 1: Critical Fixes (2-3 hours)

#### Task 1.1: Fix Pricing Tier Mismatch 🔴 HIGH
**Problem**: Pricing.tsx shows 3 tiers (Starter/Pro/Edu), but plans.ts only defines Pro/Edu

**Files**:
- `src/pages/Pricing.tsx` - Remove "Starter" tier or add to plans.ts
- `src/lib/plans.ts` - Add Starter tier if keeping, or verify Pro/Edu only
- `src/lib/debateLimits.ts` - Ensure quota logic matches plan structure

**Decision needed**: Keep 3 tiers or simplify to 2?
- Option A: Remove "Starter" from Pricing.tsx (simplify to Pro + Edu only)
- Option B: Add Starter tier to plans.ts with 10 debates/mo at $4.99/mo

**Recommendation**: Option A (remove Starter). Two tiers are cleaner, and free tier with 0 debates already creates urgency.

---

#### Task 1.2: Add Error Toast for TTS Failures 🟡 MEDIUM
**Problem**: Silent fallback to browser TTS when ElevenLabs fails

**File**: `src/services/ttsService.ts`

**Changes**:
```typescript
// Line 40: Add toast notification
if (!response.ok) {
  toast.warning('Premium voice unavailable, using browser fallback');
  // ... existing fallback logic
}

// Line 75: Add toast for Edge Function failures
} catch (error) {
  toast.warning('Voice service temporarily unavailable, using browser TTS');
  // ... existing fallback
}
```

**Why**: Users expect ElevenLabs quality; they should know when they're getting browser TTS.

---

#### Task 1.3: Remove Production Console Logs 🟡 MEDIUM
**Problem**: 17+ console.log/error statements in production

**Strategy**:
1. Replace `console.error()` with PostHog error capture or toast notifications
2. Remove `console.log()` debug statements
3. Add eslint rule: `no-console: ["error", { allow: ["warn", "error"] }]` with proper error service

**Files** (from grep search):
- `src/pages/Index.tsx`
- `src/services/aiService.ts`
- `src/services/ttsService.ts`
- `src/hooks/useDebate.ts`
- `src/hooks/useMultiplayer.ts`

**Action**: Replace with structured logging via PostHog or silent error tracking.

---

#### Task 1.4: Fix ESLint Exhaustive-Deps Disables 🟢 LOW
**Problem**: 6 `eslint-disable-next-line react-hooks/exhaustive-deps` without justification

**Files**:
- `src/pages/Index.tsx` (4 occurrences)
- `src/hooks/useMultiplayer.ts` (1 occurrence)
- `src/components/debate/PersonaContextDialog.tsx` (1 occurrence)

**Action**: 
- Review each disable
- Either add missing dependencies or document why intentional (e.g., "Only run on mount")
- Refactor to avoid disables where possible (extract stable callbacks)

---

### PHASE 2: EdTech Feature Completion (4-6 hours)

#### Task 2.1: Implement Vocabulary Highlights 🔴 HIGH
**Problem**: Config exists in DebateModeContext but not rendered in transcript

**File**: `src/components/debate/DebateTranscript.tsx`

**Implementation**:
```typescript
// Add vocabulary detection and tooltip rendering
function highlightVocabulary(text: string, gradeLevel: string): JSX.Element {
  const vocabWords = getVocabForGrade(gradeLevel); // New helper
  const parts = text.split(/\b/);
  
  return parts.map((part, i) => {
    const isVocab = vocabWords.includes(part.toLowerCase());
    return isVocab ? (
      <Tooltip key={i} content={definitions[part]}>
        <span className="underline decoration-dotted decoration-blue-500 cursor-help">
          {part}
        </span>
      </Tooltip>
    ) : part;
  });
}
```

**New File**: `src/lib/vocabulary.ts` - Grade-level vocabulary lists + definitions

**Data Source**: 
- Use existing academic word lists (e.g., AVL - Academic Vocabulary List)
- Or define custom per-grade vocabulary

---

#### Task 2.2: Implement Socratic Questioning Variations 🔴 HIGH
**Problem**: Socratic level passed to API but no differentiated prompting

**File**: `supabase/functions/ai-proxy/index.ts`

**Changes**:
```typescript
// Modify system prompt based on socraticlevel
const socraticPrompts = {
  low: "Ask 1-2 clarifying questions per turn to probe reasoning.",
  medium: "Challenge assumptions and ask follow-up questions. Use Socratic method to explore contradictions.",
  high: "Deep Socratic inquiry: question premises, examine logical consistency, explore edge cases. Push thinking to its limits."
};

const systemPrompt = `${basePersonaPrompt}\n\n${socraticPrompts[educationalConfig.socraticlevel]}`;
```

**Test**: Create debates at low/medium/high levels and verify question depth differs

---

#### Task 2.3: Add Grade-Level Vocabulary Filtering 🟡 MEDIUM
**Problem**: Grade level sent to API but no client-side simplification

**Approach**: Two options
- **Option A (Simple)**: AI prompt includes "Avoid words above grade X level"
- **Option B (Advanced)**: Client-side vocabulary analysis with replacement suggestions

**Recommendation**: Option A for now (prompt engineering), Option B as future enhancement

**File**: `supabase/functions/ai-proxy/index.ts`

```typescript
const gradePrompts = {
  "6-8": "Use vocabulary appropriate for middle school (grades 6-8). Avoid complex terminology.",
  "9-10": "Use vocabulary appropriate for high school freshmen/sophomores. Some advanced terms OK with context.",
  "11-12": "Use college-prep vocabulary. Advanced terms expected.",
  "college": "Use academic vocabulary freely. No simplification needed."
};

systemPrompt += `\n${gradePrompts[educationalConfig.gradelevel]}`;
```

---

#### Task 2.4: Add Student Assignment Completion Tracking 🔴 HIGH
**Problem**: Assignments created but no "submission" or "completion" concept

**Database Migration**:
```sql
-- New table
CREATE TABLE rt_assignment_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID REFERENCES rt_assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  debate_id UUID REFERENCES rt_debates(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  teacher_feedback TEXT,
  grade VARCHAR(10), -- A-F or numeric
  UNIQUE(assignment_id, student_id)
);

-- Add RLS policies for students/teachers
```

**UI Changes**:
- Students: "Submit" button after completing assigned debate
- Teachers: Submissions list with grading interface
- Analytics: Track completion rate per assignment

**Files**:
- `src/pages/Assignments.tsx` - Add submission list for teachers
- `src/pages/Index.tsx` - Add "Submit to Assignment" button if debate matches assignment
- `src/hooks/useAssignments.ts` - Add submitAssignment, gradeSubmission functions

---

### PHASE 3: Tournament Bracket Generation (3-4 hours)

#### Task 3.1: Implement Bracket Auto-Seeding 🟡 MEDIUM
**Problem**: Tournament UI exists but no match generation algorithm

**File**: `src/pages/Tournament.tsx`

**Implementation**:
```typescript
function generateBracket(
  participants: Array<{ personaId: string; seed: number }>,
  rounds: number
): BracketMatch[] {
  // Single-elimination bracket
  // Match 1: seed 1 vs seed 16
  // Match 2: seed 8 vs seed 9
  // ... etc
  
  const matches: BracketMatch[] = [];
  const participantCount = Math.pow(2, rounds); // 8, 16, 32
  
  for (let i = 0; i < participantCount / 2; i++) {
    matches.push({
      round: 1,
      match_number: i + 1,
      persona_a_id: participants[i].personaId,
      persona_b_id: participants[participantCount - 1 - i].personaId,
      winner_id: null,
      votes_a: 0,
      votes_b: 0,
    });
  }
  
  // Generate subsequent rounds with null personas (filled by winners)
  for (let round = 2; round <= rounds; round++) {
    const matchesThisRound = Math.pow(2, rounds - round);
    for (let i = 0; i < matchesThisRound; i++) {
      matches.push({
        round,
        match_number: i + 1,
        persona_a_id: null, // Filled by winner of match (i*2) from previous round
        persona_b_id: null, // Filled by winner of match (i*2+1) from previous round
        winner_id: null,
        votes_a: 0,
        votes_b: 0,
      });
    }
  }
  
  return matches;
}
```

**Database**:
```sql
-- Add tournament table
CREATE TABLE rt_tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255),
  topic TEXT,
  rounds INT, -- 3 = 8 participants, 4 = 16 participants
  status VARCHAR(20) DEFAULT 'active', -- active, completed
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Modify rt_tournament_matches to reference tournament
ALTER TABLE rt_tournament_matches
ADD COLUMN tournament_id UUID REFERENCES rt_tournaments(id) ON DELETE CASCADE;
```

**UI Flow**:
1. Teacher creates tournament (name, topic, rounds)
2. System auto-seeds participants (random or by analytics score)
3. Bracket displayed with empty later rounds
4. Students vote on each match
5. Winner advances to next round
6. Repeat until champion

---

### PHASE 4: Polish & Testing (2-3 hours)

#### Task 4.1: Add Session Invalidation on Subscription Change 🟢 LOW
**File**: `src/hooks/useProfile.ts`

**Implementation**:
```typescript
// Listen to rt_profiles changes via Realtime
useEffect(() => {
  const subscription = supabase
    .channel('profile-changes')
    .on('postgres_changes', 
      { event: 'UPDATE', schema: 'public', table: 'rt_profiles', filter: `id=eq.${user.id}` },
      (payload) => {
        // Refetch profile when subscription tier changes
        if (payload.new.subscription_tier !== profile?.subscription_tier) {
          fetchProfile();
          toast.success('Subscription updated!');
        }
      }
    )
    .subscribe();
    
  return () => subscription.unsubscribe();
}, [user.id]);
```

---

#### Task 4.2: Demo Mode Curated Topics 🟢 LOW
**File**: `src/lib/topics.ts`

**Implementation**:
```typescript
export const DEMO_TOPICS = [
  {
    title: "Should AI Replace Human Teachers?",
    category: "Education & Technology",
    personas: ["edison", "twain"], // Best for demo
  },
  {
    title: "Was the Industrial Revolution Good for Workers?",
    category: "Economics",
    personas: ["morgan", "carnegie"],
  },
  {
    title: "Is Direct Democracy Better Than Representative Democracy?",
    category: "Politics",
    personas: ["adams", "jefferson"],
  },
];
```

**File**: `src/pages/Index.tsx`

```typescript
// Line 81-88: Use DEMO_TOPICS instead of random selection
if (demoMode && !debateStarted) {
  const demoTopic = DEMO_TOPICS[Math.floor(Math.random() * DEMO_TOPICS.length)];
  startDebate(demoTopic.title, demoTopic.personas);
}
```

---

#### Task 4.3: Add Cost Tracking Dashboard 🟢 LOW
**File**: `src/pages/Analytics.tsx`

**New Section**:
```tsx
{isTeacher && (
  <Card>
    <CardHeader>
      <CardTitle>AI Cost Tracking</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="This Month" value={`$${aiCostThisMonth.toFixed(2)}`} />
        <StatCard label="Last Month" value={`$${aiCostLastMonth.toFixed(2)}`} />
        <StatCard label="Total Debates" value={totalDebates} />
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Estimated based on Grok API tokens + ElevenLabs characters
      </p>
    </CardContent>
  </Card>
)}
```

**Database**:
```sql
ALTER TABLE rt_debates
ADD COLUMN ai_cost_estimate DECIMAL(6,2) DEFAULT 0.00;

-- Update via Edge Function after each API call
```

---

## Implementation Timeline

| Phase | Tasks | Time Estimate | Priority |
|-------|-------|---------------|----------|
| Phase 1: Critical Fixes | 4 tasks | 2-3 hours | 🔴 HIGH |
| Phase 2: EdTech Features | 4 tasks | 4-6 hours | 🔴 HIGH |
| Phase 3: Tournament | 1 task | 3-4 hours | 🟡 MEDIUM |
| Phase 4: Polish | 3 tasks | 2-3 hours | 🟢 LOW |
| **Total** | **12 tasks** | **11-16 hours** | **2-3 days** |

---

## Success Criteria

After cleanup, RoundtAIble should:

1. ✅ Have consistent pricing across all surfaces (UI, code, Stripe)
2. ✅ Notify users when voice quality degrades (TTS fallback)
3. ✅ Have no production console logs (proper error tracking)
4. ✅ Render vocabulary highlights in EdTech mode
5. ✅ Vary Socratic questioning depth by level
6. ✅ Track student assignment submissions
7. ✅ Generate tournament brackets automatically
8. ✅ Invalidate sessions on subscription changes
9. ✅ Have curated demo topics for booth demos
10. ✅ Track AI API costs per debate

---

## Next Steps

**Immediate**:
1. User decision: Keep 3 pricing tiers or simplify to 2?
2. Start Phase 1 (critical fixes) - 2-3 hours
3. Deploy and test pricing consistency

**This Week**:
4. Complete Phase 2 (EdTech features) - 4-6 hours
5. Test with sample classes and assignments

**Next Week**:
6. Complete Phase 3 (tournaments) if time permits
7. Polish (Phase 4) as needed

---

## Open Questions

1. **Pricing**: Keep Starter tier ($4.99/mo, 10 debates) or simplify to Pro + Edu only?
2. **Vocabulary**: Build custom word lists or use academic vocabulary library?
3. **Tournaments**: Should seeding be random, by analytics score, or teacher-selected?
4. **Cost tracking**: Real-time or batch calculation (end of day)?
5. **Demo mode**: Auto-reset after X minutes of inactivity?

---

## Risk Assessment

**Low Risk**:
- Pricing tier fix (delete code or add tier)
- TTS error toasts (additive change)
- Console log removal (no behavioral change)

**Medium Risk**:
- Vocabulary highlights (new UI, performance concern with large transcripts)
- Socratic prompts (could affect debate quality)
- Assignment submissions (new table, migration required)

**High Risk**:
- Tournament bracket generation (complex algorithm, easy to introduce bugs)
- Session invalidation (could cause unexpected logouts)

**Mitigation**: Deploy to staging first, test each phase independently before merging.

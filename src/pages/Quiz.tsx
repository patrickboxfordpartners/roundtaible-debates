import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { allPersonas } from "@/data/debateData";
import { quizQuestions, calculateResult, personaMindsets, type QuizResult } from "@/data/quizData";

// Progress bar
function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="mb-8">
      <div className="flex justify-between text-sm text-muted-foreground mb-2">
        <span>Question {current} of {total}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// Single question card
function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
}: {
  question: (typeof quizQuestions)[0];
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (answerIndex: number) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    setTimeout(() => onAnswer(idx), 420);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      <ProgressBar current={questionNumber} total={totalQuestions} />

      <h2 className="font-playfair text-2xl md:text-3xl font-semibold text-foreground mb-8 leading-snug">
        {question.question}
      </h2>

      <div className="grid gap-3">
        {question.answers.map((answer, idx) => {
          const isSelected = selected === idx;
          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={selected !== null}
              className={[
                "w-full text-left px-5 py-4 rounded-lg border-2 transition-all duration-200",
                "font-lora text-base leading-relaxed",
                "disabled:cursor-not-allowed",
                isSelected
                  ? "border-primary bg-primary/20 text-foreground scale-[1.01]"
                  : selected !== null
                  ? "border-border bg-card/50 text-muted-foreground opacity-60"
                  : "border-border bg-card hover:border-primary/60 hover:bg-primary/10 hover:scale-[1.01] cursor-pointer",
              ].join(" ")}
            >
              <span className="inline-block w-6 h-6 rounded-full border-2 border-current mr-3 text-xs font-bold leading-5 text-center shrink-0 align-middle">
                {String.fromCharCode(65 + idx)}
              </span>
              {answer.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Result card
function ResultCard({ result, onRestart }: { result: QuizResult; onRestart: () => void }) {
  const navigate = useNavigate();
  const persona = allPersonas.find((p) => p.id === result.personaId);
  const runners = result.runners
    .map((r) => allPersonas.find((p) => p.id === r.personaId))
    .filter(Boolean);

  if (!persona) return null;

  const matchPct = Math.round((result.score / result.totalPossible) * 100);
  const quote = persona.quotes[0] || "";

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-2">
        <p className="text-sm uppercase tracking-widest text-primary font-semibold mb-4">
          Your Historical Match
        </p>
        <h2 className="font-playfair text-3xl md:text-4xl font-bold text-foreground mb-1">
          {persona.name}
        </h2>
        <p className="font-lora text-muted-foreground text-lg mb-6">{persona.role}</p>
      </div>

      {/* Avatar */}
      <div className="flex justify-center mb-6">
        <div
          className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 overflow-hidden shadow-lg"
          style={{ borderColor: persona.color }}
        >
          {persona.avatar ? (
            <img
              src={persona.avatar}
              alt={persona.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-5xl font-bold text-white"
              style={{ backgroundColor: persona.color }}
            >
              {persona.name.charAt(0)}
            </div>
          )}
        </div>
      </div>

      {/* Match % */}
      <div className="text-center mb-6">
        <span className="text-4xl font-bold" style={{ color: persona.color }}>
          {matchPct}%
        </span>
        <span className="text-muted-foreground text-sm ml-2">alignment</span>
      </div>

      {/* Mindset paragraph */}
      {personaMindsets[persona.id] && (
        <p className="font-lora text-sm text-foreground/80 leading-relaxed mb-5">
          {personaMindsets[persona.id]}
        </p>
      )}

      {/* Quote */}
      {quote && (
        <blockquote className="border-l-4 pl-4 mb-6 italic font-lora text-muted-foreground text-sm leading-relaxed"
          style={{ borderColor: persona.color }}>
          "{quote}"
          <footer className="mt-1 text-xs not-italic">,  {persona.name}</footer>
        </blockquote>
      )}

      {/* Runners-up */}
      {runners.length > 0 && (
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
            Also in you
          </p>
          <div className="flex gap-3">
            {runners.map((r) =>
              r ? (
                <div key={r.id} className="flex items-center gap-2 bg-card rounded-full px-3 py-1.5 text-sm border border-border">
                  <div
                    className="w-5 h-5 rounded-full overflow-hidden shrink-0"
                    style={{ backgroundColor: r.color }}
                  >
                    {r.avatar && (
                      <img src={r.avatar} alt={r.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <span className="font-lora text-foreground">{r.name.split(" ").pop()}</span>
                </div>
              ) : null
            )}
          </div>
        </div>
      )}

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => navigate(`/app?persona=${persona.id}`)}
          className="flex-1 py-3 px-6 rounded-lg font-semibold text-primary-foreground transition-all hover:opacity-90 hover:scale-[1.01]"
          style={{ backgroundColor: persona.color }}
        >
          Debate as {persona.name.split(" ")[0]}
        </button>
        <button
          onClick={onRestart}
          className="flex-1 py-3 px-6 rounded-lg font-semibold border-2 border-border bg-card text-foreground hover:border-primary/60 hover:bg-primary/10 transition-all"
        >
          Retake Quiz
        </button>
      </div>

      <div className="mt-4 text-center">
        <button
          onClick={() => navigate("/")}
          className="text-sm text-muted-foreground hover:text-primary underline transition-colors"
        >
          Back to Roundtaible
        </button>
      </div>
    </div>
  );
}

// Main quiz page
export default function Quiz() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [result, setResult] = useState<QuizResult | null>(null);
  const navigate = useNavigate();

  const currentQuestion = quizQuestions[currentIndex];

  const handleAnswer = useCallback(
    (answerIndex: number) => {
      const updated = { ...answers, [currentQuestion.id]: answerIndex };
      setAnswers(updated);

      if (currentIndex + 1 < quizQuestions.length) {
        setCurrentIndex((i) => i + 1);
      } else {
        setResult(calculateResult(updated));
      }
    },
    [answers, currentIndex, currentQuestion]
  );

  const handleRestart = useCallback(() => {
    setAnswers({});
    setCurrentIndex(0);
    setResult(null);
  }, []);

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/60 px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Home
        </button>
        <span className="font-playfair text-sm font-medium text-foreground">
          Which Historical Mind Are You?
        </span>
        <div className="w-24" /> {/* spacer */}
      </header>

      {/* Body */}
      <main className="flex-1 flex items-start justify-center px-4 py-12">
        <div className="w-full max-w-xl">
          {/* Intro (before first answer) */}
          {!result && currentIndex === 0 && Object.keys(answers).length === 0 && (
            <div className="text-center mb-10">
              <p className="font-lora text-muted-foreground text-base leading-relaxed">
                Seven questions. One historical archetype. Answer honestly, these minds have seen it all.
              </p>
            </div>
          )}

          {result ? (
            <ResultCard result={result} onRestart={handleRestart} />
          ) : (
            <QuestionCard
              key={currentQuestion.id}
              question={currentQuestion}
              questionNumber={currentIndex + 1}
              totalQuestions={quizQuestions.length}
              onAnswer={handleAnswer}
            />
          )}
        </div>
      </main>
    </div>
  );
}

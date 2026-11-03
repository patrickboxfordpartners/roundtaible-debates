import { useState } from "react";
import { Shuffle, Zap, FileText, GraduationCap, PenLine, Send, Vote, MoreHorizontal, X } from "lucide-react";
import { useDebateMode } from "@/contexts/DebateModeContext";
import { setDebateMode } from "@/services/aiService";
import { track } from "@/services/analytics";
import { toast } from "sonner";
import type { Persona } from "@/data/debateData";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MoreMenuProps {
  onSurpriseMe: () => void;
  onCustomTopic: (title: string) => void;
  onLightningRound: () => void;
  onSummarize: () => void;
  onVote: (personaId: string) => void;
  personasState: Persona[];
}

export function MoreMenu({
  onSurpriseMe,
  onCustomTopic,
  onLightningRound,
  onSummarize,
  onVote,
  personasState,
}: MoreMenuProps) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customTopicText, setCustomTopicText] = useState("");
  const { mode: debateMode, setMode, educationalConfig, updateEducationalConfig } = useDebateMode();

  const isEdu = debateMode === "educational";

  const toggleMode = () => {
    const next = debateMode === "standard" ? "educational" : "standard";
    setMode(next);
    setDebateMode(next); // keep module-level in sync for now
    track({ event: "mode_switch", mode: next });
    toast.info(next === "educational" ? "Educational mode: AI will cite sources, facts, and discussion questions" : "Standard mode: entertainment debate");
  };

  const votePersonas = personasState.filter(p => p.id !== "human");

  return (
    <div className="flex items-center gap-2">
      {/* Custom topic inline input, shown when requested from the menu */}
      {showCustomInput && (
        <form
          className="flex-1 flex items-center gap-1.5 min-w-0"
          onSubmit={(e) => {
            e.preventDefault();
            if (customTopicText.trim()) {
              onCustomTopic(customTopicText.trim());
              setShowCustomInput(false);
              setCustomTopicText("");
            }
          }}
        >
          <input
            autoFocus
            type="text"
            value={customTopicText}
            onChange={(e) => setCustomTopicText(e.target.value)}
            placeholder="Type your topic..."
            className="flex-1 min-w-0 px-3 py-1.5 text-sm font-body rounded-lg border border-primary bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            onKeyDown={(e) => e.key === "Escape" && (setShowCustomInput(false), setCustomTopicText(""))}
            aria-label="Custom topic"
          />
          <Button type="submit" size="sm" disabled={!customTopicText.trim()} aria-label="Set custom topic">
            <Send className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => (setShowCustomInput(false), setCustomTopicText(""))}
            aria-label="Cancel custom topic"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </form>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="font-display font-semibold" aria-label="More debate options">
            <MoreHorizontal className="w-4 h-4" /> More
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onSelect={() => onSurpriseMe()}>
            <Shuffle /> Surprise Me
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setShowCustomInput(true)}>
            <PenLine /> Custom Topic
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onLightningRound()}>
            <Zap /> Lightning Round
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => toggleMode()} aria-pressed={isEdu}>
            <GraduationCap /> Edu Mode {isEdu && "(Active)"}
          </DropdownMenuItem>
          {isEdu && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-sm">
                <GraduationCap /> Grade Level: {educationalConfig.gradeLevel || "None"}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-44">
                <DropdownMenuRadioGroup value={educationalConfig.gradeLevel}>
                  {(["", "6-8", "9-10", "11-12", "college"] as const).map((level) => (
                    <DropdownMenuRadioItem
                      key={level || "none"}
                      value={level}
                      onSelect={() => updateEducationalConfig({ gradeLevel: level })}
                    >
                      {level || "None"}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}
          <DropdownMenuItem onSelect={() => onSummarize()}>
            <FileText /> Summarize
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs font-display font-semibold uppercase tracking-wider">
            Vote for winner
          </DropdownMenuLabel>
          <div className="max-h-40 overflow-y-auto">
            {votePersonas.map((p) => (
              <DropdownMenuItem key={p.id} onSelect={() => onVote(p.id)} className="gap-2">
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                  style={{ backgroundColor: p.color }}
                  aria-hidden="true"
                >
                  {p.name[0]}
                </span>
                <span className="truncate">{p.name}</span>
                <Vote className="ml-auto w-3 h-3 text-muted-foreground" />
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

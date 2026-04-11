import { createContext, useContext, useState, type ReactNode } from "react";

export interface EducationalConfig {
  enabled: boolean;
  gradeLevel: "6-8" | "9-10" | "11-12" | "college" | "";
  socraticLevel: "low" | "medium" | "high";
  vocabularyHighlights: boolean;
}

interface DebateModeContextType {
  mode: "standard" | "educational";
  educationalConfig: EducationalConfig;
  setMode: (mode: "standard" | "educational") => void;
  updateEducationalConfig: (config: Partial<EducationalConfig>) => void;
}

const defaultConfig: EducationalConfig = {
  enabled: false,
  gradeLevel: "",
  socraticLevel: "medium",
  vocabularyHighlights: true,
};

const DebateModeContext = createContext<DebateModeContextType | null>(null);

export function DebateModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<"standard" | "educational">("standard");
  const [educationalConfig, setEducationalConfig] = useState<EducationalConfig>(defaultConfig);

  function setMode(newMode: "standard" | "educational") {
    setModeState(newMode);
    setEducationalConfig((prev) => ({ ...prev, enabled: newMode === "educational" }));
  }

  function updateEducationalConfig(updates: Partial<EducationalConfig>) {
    setEducationalConfig((prev) => ({ ...prev, ...updates }));
  }

  return (
    <DebateModeContext.Provider value={{ mode, educationalConfig, setMode, updateEducationalConfig }}>
      {children}
    </DebateModeContext.Provider>
  );
}

export function useDebateMode() {
  const context = useContext(DebateModeContext);
  if (!context) {
    throw new Error("useDebateMode must be used within a DebateModeProvider");
  }
  return context;
}

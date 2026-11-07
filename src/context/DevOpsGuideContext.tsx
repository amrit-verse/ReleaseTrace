"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface DevOpsGuideContextType {
  isGuideMode: boolean;
  toggleGuideMode: () => void;
  setGuideMode: (enabled: boolean) => void;
  isFlowModalOpen: boolean;
  setIsFlowModalOpen: (open: boolean) => void;
  isSimulatorModalOpen: boolean;
  setIsSimulatorModalOpen: (open: boolean) => void;
  isGlossaryModalOpen: boolean;
  setIsGlossaryModalOpen: (open: boolean) => void;
  activeGlossaryTerm: string | null;
  setActiveGlossaryTerm: (term: string | null) => void;
  openGlossary: (term?: string) => void;
}

const DevOpsGuideContext = createContext<DevOpsGuideContextType | undefined>(undefined);

export function DevOpsGuideProvider({ children }: { children: React.ReactNode }) {
  // Default to true so student developers and new users immediately see helpful guidance
  const [isGuideMode, setIsGuideMode] = useState<boolean>(true);
  const [isFlowModalOpen, setIsFlowModalOpen] = useState<boolean>(false);
  const [isSimulatorModalOpen, setIsSimulatorModalOpen] = useState<boolean>(false);
  const [isGlossaryModalOpen, setIsGlossaryModalOpen] = useState<boolean>(false);
  const [activeGlossaryTerm, setActiveGlossaryTerm] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("releasetrace_guide_mode");
      if (stored !== null) {
        setIsGuideMode(stored === "true");
      }
    } catch {
      // LocalStorage unavailable in SSR or private mode
    }
  }, []);

  const toggleGuideMode = () => {
    setIsGuideMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("releasetrace_guide_mode", String(next));
      } catch {}
      return next;
    });
  };

  const setGuideMode = (enabled: boolean) => {
    setIsGuideMode(enabled);
    try {
      localStorage.setItem("releasetrace_guide_mode", String(enabled));
    } catch {}
  };

  const openGlossary = (term?: string) => {
    if (term) {
      setActiveGlossaryTerm(term);
    }
    setIsGlossaryModalOpen(true);
  };

  return (
    <DevOpsGuideContext.Provider
      value={{
        isGuideMode,
        toggleGuideMode,
        setGuideMode,
        isFlowModalOpen,
        setIsFlowModalOpen,
        isSimulatorModalOpen,
        setIsSimulatorModalOpen,
        isGlossaryModalOpen,
        setIsGlossaryModalOpen,
        activeGlossaryTerm,
        setActiveGlossaryTerm,
        openGlossary,
      }}
    >
      {children}
    </DevOpsGuideContext.Provider>
  );
}

export function useDevOpsGuide() {
  const context = useContext(DevOpsGuideContext);
  if (!context) {
    throw new Error("useDevOpsGuide must be used within a DevOpsGuideProvider");
  }
  return context;
}

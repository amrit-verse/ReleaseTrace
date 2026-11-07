"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BrainCircuit,
  Search,
  Plus,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import { HindsightMemory } from "@/types";
import { mockMemories } from "@/data/mockData";
import { HindsightMemoryCard } from "@/components/ui/HindsightMemoryCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/ToastProvider";
import { getActiveMemories, retainNewMemory, resetMemoriesToDefault } from "@/lib/memoryEngine";
import {
  fadeInVariants,
  staggerContainer,
  modalVariants,
  backdropVariants,
  hoverSubtle,
  tapSubtle,
} from "@/lib/motion";

export default function MemoryExplorerPage() {
  const [memories, setMemories] = useState<HindsightMemory[]>(mockMemories);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState<string>("ALL");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { success, info } = useToast();

  // New Memory Modal State
  const [newTitle, setNewTitle] = useState("");
  const [newService, setNewService] = useState("order-service");
  const [newSeverity, setNewSeverity] = useState<"SEV-1" | "SEV-2">("SEV-1");
  const [newSymptoms, setNewSymptoms] = useState("");
  const [newRootCause, setNewRootCause] = useState("");
  const [newFailedApproaches, setNewFailedApproaches] = useState("");
  const [newResolution, setNewResolution] = useState("");
  const [newAuthor, setNewAuthor] = useState("amrit.lead@engineering.internal");
  const [newTicket, setNewTicket] = useState("INC-9912");

  useEffect(() => {
    setMemories(getActiveMemories());
  }, []);

  const handleCreateMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newRootCause || !newResolution) {
      alert("Please fill in the required fields: Title, Root Cause, and Resolution.");
      return;
    }

    const symptomsList = newSymptoms
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const failedList = newFailedApproaches
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const created = retainNewMemory({
      title: newTitle,
      service: newService,
      environment: "production",
      severity: newSeverity,
      incidentDate: new Date().toISOString(),
      symptoms: symptomsList.length > 0 ? symptomsList : ["Degraded throughput and latency anomaly."],
      rootCause: newRootCause,
      failedApproaches: failedList.length > 0 ? failedList : ["Standard pod restart did not clear lock state."],
      resolution: newResolution,
      provenance: {
        gitCommit: "commit-" + Math.random().toString(36).substring(2, 9),
        incidentTicket: newTicket || "INC-9912",
        runbookUrl: "https://runbooks.internal/incident/" + (newTicket || "INC-9912"),
        postMortemAuthor: newAuthor,
        signoffEngineer: "marcus.vance@engineering.internal",
        timestamp: new Date().toISOString(),
        serviceVersion: "v2.0.0",
        outageMinutes: 35,
      },
      tags: ["post-mortem", newService, "hindsight-retention"],
      source: "LOCAL_ENGINE",
    });

    setMemories(getActiveMemories());
    setIsModalOpen(false);
    success("Memory Retained", `Incident experience ${created.id} indexed into Hindsight memory bank.`);

    // Reset form
    setNewTitle("");
    setNewSymptoms("");
    setNewRootCause("");
    setNewFailedApproaches("");
    setNewResolution("");
  };

  const handleReset = () => {
    const defaultMems = resetMemoriesToDefault();
    setMemories(defaultMems);
    info("Memory Bank Reset", "Reset to canonical baseline fixtures.");
  };

  // Filter logic
  const filteredMemories = useMemo(() => {
    return memories.filter((mem) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        mem.title.toLowerCase().includes(q) ||
        mem.id.toLowerCase().includes(q) ||
        mem.rootCause.toLowerCase().includes(q) ||
        mem.service.toLowerCase().includes(q) ||
        mem.provenance.incidentTicket.toLowerCase().includes(q) ||
        mem.tags.some((t) => t.toLowerCase().includes(q));

      const matchesService =
        selectedService === "ALL" || mem.service.toLowerCase() === selectedService.toLowerCase();

      const matchesSeverity =
        selectedSeverity === "ALL" || mem.severity.toLowerCase() === selectedSeverity.toLowerCase();

      return matchesSearch && matchesService && matchesSeverity;
    });
  }, [memories, searchQuery, selectedService, selectedSeverity]);

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto w-full font-sans"
    >
      {/* Header */}
      <PageHeader
        title="Hindsight Memory Explorer"
        subtitle="Persistent engineering memories, failure signatures, confirmed root causes, and verified mitigations."
        badge={
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-elevated text-signal border border-surface-border">
            {memories.length} INDEXED
          </span>
        }
        actions={
          <div className="flex items-center space-x-2 font-mono text-xs">
            <motion.button
              whileHover={hoverSubtle}
              whileTap={tapSubtle}
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-full btn-catchy-primary font-semibold flex items-center space-x-1.5 transition-all shadow-md active:scale-95 text-xs"
            >
              <Plus className="w-3.5 h-3.5 text-amber-300" />
              <span>Retain New Incident</span>
            </motion.button>
            <motion.button
              whileHover={hoverSubtle}
              whileTap={tapSubtle}
              onClick={handleReset}
              className="px-3.5 py-2 rounded-full liquid-glass-pill text-text-secondary hover:text-text-primary flex items-center space-x-1 transition-all shadow-sm active:scale-95 text-xs"
              title="Reset to default fixtures"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Bank</span>
            </motion.button>
          </div>
        }
      />

      {/* Filter & Search Bar */}
      <div className="liquid-glass-card rounded-2xl p-4 grid grid-cols-1 md:grid-cols-4 gap-3 font-mono text-xs shadow-sm">
        <div className="md:col-span-2 relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search symptoms, root causes, tickets (INC-8842)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-elevated border border-surface-border rounded pl-8 pr-3 py-2 text-text-primary placeholder-text-muted focus:outline-none focus:border-signal/60 font-mono text-xs"
          />
        </div>

        <div>
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="w-full bg-surface-elevated border border-surface-border rounded px-3 py-2 text-text-secondary focus:outline-none focus:border-signal/60 font-mono text-xs"
          >
            <option value="ALL">Service: All Services</option>
            <option value="auth-gateway">auth-gateway</option>
            <option value="order-service">order-service</option>
            <option value="payment-vault">payment-vault</option>
            <option value="inventory-streamer">inventory-streamer</option>
            <option value="notification-broker">notification-broker</option>
          </select>
        </div>

        <div>
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="w-full bg-surface-elevated border border-surface-border rounded px-3 py-2 text-text-secondary focus:outline-none focus:border-signal/60 font-mono text-xs"
          >
            <option value="ALL">Severity: All</option>
            <option value="SEV-1">SEV-1 (Outage)</option>
            <option value="SEV-2">SEV-2 (Degradation)</option>
          </select>
        </div>
      </div>

      {/* Memory Cards Grid */}
      <div className="space-y-4">
        {filteredMemories.length === 0 ? (
          <EmptyState
            title="No memory records found"
            description="No historical incidents match your search query or filter criteria."
            action={{
              label: "Reset Search",
              onClick: () => {
                setSearchQuery("");
                setSelectedService("ALL");
                setSelectedSeverity("ALL");
              },
            }}
          />
        ) : (
          filteredMemories.map((mem) => (
            <motion.div key={mem.id} variants={fadeInVariants}>
              <HindsightMemoryCard memory={mem} compact={false} />
            </motion.div>
          ))
        )}
      </div>

      {/* Retain New Incident Modal with Motion AnimatePresence */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative z-10 bg-surface-elevated border border-surface-border rounded max-w-2xl w-full p-5 space-y-4 shadow-panel-elevated my-8"
            >
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <div className="flex items-center space-x-2 text-signal">
                  <BrainCircuit className="w-5 h-5" />
                  <h3 className="font-semibold text-sm text-text-primary">
                    Retain Incident into Hindsight Memory Engine
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-text-muted hover:text-text-primary"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateMemory} className="space-y-3.5 text-xs font-mono">
                <div>
                  <label className="text-text-muted block mb-1">Incident Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Postgres Connection Pool Starvation via Long Locking Alter Table"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-surface border border-surface-border p-2 rounded text-text-primary focus:outline-none focus:border-signal font-sans"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-text-muted block mb-1">Service *</label>
                    <select
                      value={newService}
                      onChange={(e) => setNewService(e.target.value)}
                      className="w-full bg-surface border border-surface-border p-2 rounded text-text-secondary"
                    >
                      <option value="auth-gateway">auth-gateway</option>
                      <option value="order-service">order-service</option>
                      <option value="payment-vault">payment-vault</option>
                      <option value="inventory-streamer">inventory-streamer</option>
                      <option value="notification-broker">notification-broker</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-text-muted block mb-1">Severity *</label>
                    <select
                      value={newSeverity}
                      onChange={(e) => setNewSeverity(e.target.value as "SEV-1" | "SEV-2")}
                      className="w-full bg-surface border border-surface-border p-2 rounded text-text-secondary"
                    >
                      <option value="SEV-1">SEV-1 (Outage)</option>
                      <option value="SEV-2">SEV-2 (Degradation)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-text-muted block mb-1">Incident Ticket</label>
                    <input
                      type="text"
                      value={newTicket}
                      onChange={(e) => setNewTicket(e.target.value)}
                      className="w-full bg-surface border border-surface-border p-2 rounded text-text-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-text-muted block mb-1">Observed Symptoms (one per line)</label>
                  <textarea
                    rows={2}
                    placeholder="Lock duration exceeded 120s&#10;Gateway 504 error spike&#10;Connection pool saturated"
                    value={newSymptoms}
                    onChange={(e) => setNewSymptoms(e.target.value)}
                    className="w-full bg-surface border border-surface-border p-2 rounded text-text-primary font-sans"
                  />
                </div>

                <div>
                  <label className="text-text-muted block mb-1">Root Cause Analysis *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Detailed technical explanation of the catastrophic failure mechanism..."
                    value={newRootCause}
                    onChange={(e) => setNewRootCause(e.target.value)}
                    className="w-full bg-surface border border-surface-border p-2 rounded text-text-primary font-sans"
                  />
                </div>

                <div>
                  <label className="text-risk-warning block mb-1">
                    Failed Approaches Tried During Incident (Do Not Repeat)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Tried increasing statement_timeout to 600s — made pool exhaustion worse."
                    value={newFailedApproaches}
                    onChange={(e) => setNewFailedApproaches(e.target.value)}
                    className="w-full bg-surface border border-surface-border p-2 rounded text-text-primary font-sans"
                  />
                </div>

                <div>
                  <label className="text-sage block mb-1">Permanent Verified Resolution *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Exact steps, architecture changes, and runbook solution verified in production..."
                    value={newResolution}
                    onChange={(e) => setNewResolution(e.target.value)}
                    className="w-full bg-surface border border-surface-border p-2 rounded text-text-primary font-sans"
                  />
                </div>

                <div>
                  <label className="text-text-muted block mb-1">Post-Mortem Author Email</label>
                  <input
                    type="email"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    className="w-full bg-surface border border-surface-border p-2 rounded text-text-primary"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-surface-border">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-1.5 rounded text-text-muted hover:text-text-primary border border-surface-border"
                  >
                    CANCEL
                  </button>
                  <motion.button
                    whileHover={hoverSubtle}
                    whileTap={tapSubtle}
                    type="submit"
                    className="px-4 py-1.5 rounded bg-signal text-canvas font-semibold flex items-center space-x-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>COMMIT TO HINDSIGHT</span>
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}


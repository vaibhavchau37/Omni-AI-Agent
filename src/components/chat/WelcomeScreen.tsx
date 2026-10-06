import {
  Sparkles,
  ArrowRight,
  Presentation,
  FileText,
  Table2,
  LayoutTemplate,
  ImagePlus,
  Mic,
  Pencil,
  History,
  MessageSquareQuote,
  ClipboardList,
  Bug,
  Scale,
} from "lucide-react";
import { ROLE_META, type AgentRoleId } from "@/lib/roles";

interface WelcomeScreenProps {
  onFeatureClick?: (action: string) => void;
  onOpenAnalytics?: () => void;
  role?: AgentRoleId;
  displayName?: string;
}

const CAPABILITIES = [
  { icon: Presentation, label: "Slide decks", hint: "Say “make a PPT on solar energy”" },
  { icon: FileText, label: "Word documents", hint: "Letters, notes, policies, SOPs" },
  { icon: Table2, label: "Spreadsheets", hint: "Budgets, trackers, reports" },
  { icon: LayoutTemplate, label: "Landing pages", hint: "A ready page for your idea" },
  { icon: ImagePlus, label: "Photos & files", hint: "Attach with the clip button" },
  { icon: Mic, label: "Talk to it", hint: "Speak instead of typing" },
];

const HOW_IT_WORKS = [
  { icon: Pencil, text: "Edit any message you sent and the answer is redone" },
  { icon: History, text: "History keeps every past chat on this device" },
  { icon: MessageSquareQuote, text: "Switch modes above for study, HR, support or admin help" },
];

const WORKFLOWS = [
  {
    icon: ClipboardList,
    label: "Plan & build",
    outcome: "Spec → plan → tasks → result",
    message:
      "Use the guided Plan & Build process. Step 1 (Spec): ask me what I want to build and why, who it is for, and what success looks like — one question at a time. Step 2 (Plan): propose a simple plan. Step 3 (Tasks): break it into a numbered checklist. Step 4 (Build): produce the first deliverable. Step 5 (Review): check it against the spec and list what is still missing. Start with Step 1.",
  },
  {
    icon: Bug,
    label: "Fix a problem",
    outcome: "Cause → scoped fix → verify",
    message:
      "Use the guided Fix a Problem process. Step 1 (Describe): ask what is going wrong, what should happen instead, and when it started. Step 2 (Diagnose): list the most likely causes, most likely first. Step 3 (Fix): give the smallest safe fix, step by step. Step 4 (Verify): tell me exactly how to confirm it is fixed and what to do if it is not. Start with Step 1.",
  },
  {
    icon: Scale,
    label: "Assess an idea",
    outcome: "Go, clarify, or stop decision",
    message:
      "Use the guided Idea Assessment process. Step 1: ask me to describe the idea, target users and budget. Step 2: evaluate problem, demand, competition (especially in India), cost and risks — say clearly when you lack real data instead of guessing. Step 3: give a clear verdict of GO, CLARIFY, or STOP with reasons and the next 3 actions. Start with Step 1.",
  },
];

export const WelcomeScreen = ({ onFeatureClick, role = "default", displayName = "" }: WelcomeScreenProps) => {
  const meta = ROLE_META[role] ?? ROLE_META.default;
  const RoleIcon = meta.icon;
  const name = displayName.trim();

  return (
    <div className="text-center py-6 sm:py-10 fade-in warm-surface rounded-3xl">
      {/* Hero */}
      <div className="relative inline-block mb-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20 flex items-center justify-center glow-primary">
          <RoleIcon className="w-8 h-8 text-primary" />
        </div>
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
          <Sparkles className="w-2 h-2 text-accent" />
        </div>
      </div>

      <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-1">
        {name ? (
          <>Welcome back, <span className="gradient-text">{name}</span></>
        ) : role === "default" ? (
          <>Welcome to <span className="gradient-text">{meta.title}</span></>
        ) : (
          <><span className="gradient-text">{meta.title}</span> mode</>
        )}
      </h2>
      <p className="text-sm text-muted-foreground mb-2 max-w-sm mx-auto">
        {name && role !== "default" ? `${meta.title} mode · ${meta.tagline}` : meta.tagline}
      </p>
      <p className="text-xs text-muted-foreground mb-8 max-w-md mx-auto">
        Ask in plain English or Hindi. It asks a question or two, then does the work — and hands
        you a real file when one is needed.
      </p>

      {/* Quick Actions */}
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground/90 mb-2">Start here</p>
      <div className="grid grid-cols-2 gap-2 max-w-xl mx-auto px-2 sm:px-4">
        {meta.quickActions.map((action) => { const ActionIcon = action.icon ?? RoleIcon; return (
          <button
            key={action.id}
            onClick={() => onFeatureClick?.(action.message)}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-card/60 border border-border/50 hover:border-primary/40 hover:bg-card/90 transition-all duration-200 text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
              <ActionIcon className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors flex-1">{action.label}</span>
            <ArrowRight className="w-3 h-3 text-muted-foreground/40 group-hover:text-primary transition-colors" />
          </button>
        ); })}
      </div>

      {/* Guided processes */}
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground/90 mt-8 mb-2">
        Guided processes
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 max-w-xl mx-auto px-2 sm:px-4">
        {WORKFLOWS.map(({ icon: Icon, label, outcome, message }) => (
          <button
            key={label}
            onClick={() => onFeatureClick?.(message)}
            className="p-3 rounded-xl bg-card/60 border border-border/50 hover:border-primary/40 hover:bg-card/90 transition-all text-left"
          >
            <Icon className="w-4 h-4 text-primary mb-1.5" />
            <p className="text-xs font-medium text-foreground/90">{label}</p>
            <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">{outcome}</p>
          </button>
        ))}
      </div>

      {/* What it can do */}
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground/90 mt-8 mb-2">
        What it can make for you
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-xl mx-auto px-2 sm:px-4">
        {CAPABILITIES.map(({ icon: Icon, label, hint }) => (
          <div
            key={label}
            className="p-3 rounded-xl bg-card/40 border border-border/40 text-left"
          >
            <Icon className="w-4 h-4 text-accent mb-1.5" />
            <p className="text-xs font-medium text-foreground/85">{label}</p>
            <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">{hint}</p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="max-w-xl mx-auto px-2 sm:px-4 mt-6 space-y-1.5">
        {HOW_IT_WORKS.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-2 text-left">
            <Icon className="w-3.5 h-3.5 text-muted-foreground/90 shrink-0" />
            <span className="text-[11px] text-foreground/75">{text}</span>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground/80 mt-6 max-w-sm mx-auto">
        If something isn’t known for sure, OmniAgent says so instead of guessing.
      </p>
    </div>
  );
};

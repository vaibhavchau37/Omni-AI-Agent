import { User, GraduationCap, Briefcase, HeadphonesIcon, Shield } from "lucide-react";

export type AgentRoleId =
  | "default"
  | "student_assistant"
  | "hr_assistant"
  | "customer_support"
  | "admin_agent";

export interface RoleQuickAction {
  id: string;
  label: string;
  message: string;
}

export interface RoleMeta {
  id: AgentRoleId;
  label: string;
  title: string;
  icon: React.ElementType;
  tagline: string;
  quickActions: RoleQuickAction[];
}

export const ROLE_META: Record<AgentRoleId, RoleMeta> = {
  default: {
    id: "default",
    label: "General",
    title: "OmniAgent",
    icon: User,
    tagline: "Your AI assistant for planning, scheduling, files and getting things done.",
    quickActions: [
      { id: "goal", label: "Plan a goal", message: "I want to plan a goal. Ask me what I'm working towards and build a step-by-step plan." },
      { id: "ppt", label: "Make a PPT", message: "Generate a PPT presentation on a topic I'll give you. Ask me the topic and audience first." },
      { id: "letter", label: "Draft a document", message: "Generate a Word document. Ask me what kind of letter or report I need." },
      { id: "landing", label: "Build a landing page", message: "Build a landing page for my idea. Ask me about the product and audience." },
    ],
  },
  student_assistant: {
    id: "student_assistant",
    label: "Student",
    title: "Study Buddy",
    icon: GraduationCap,
    tagline: "Exam prep, notes, assignments and project help — explained step by step.",
    quickActions: [
      { id: "explain", label: "Explain a topic", message: "Explain a topic to me simply with an example. Ask me the topic and my level first." },
      { id: "plan", label: "Study plan", message: "Make me a study plan. Ask me the exam, syllabus and how many days I have." },
      { id: "notes", label: "Make revision notes", message: "Create short revision notes as a Word document. Ask me the subject and chapter." },
      { id: "quiz", label: "Quiz me", message: "Quiz me with practice questions. Ask me the subject and difficulty level." },
    ],
  },
  hr_assistant: {
    id: "hr_assistant",
    label: "HR",
    title: "HR Assistant",
    icon: Briefcase,
    tagline: "Hiring, job descriptions, onboarding, policies and appraisal support.",
    quickActions: [
      { id: "jd", label: "Write a job description", message: "Write a job description. Ask me the role, experience level and location." },
      { id: "interview", label: "Interview questions", message: "Prepare interview questions and an evaluation rubric. Ask me the role first." },
      { id: "onboarding", label: "Onboarding checklist", message: "Create an onboarding checklist for a new joiner. Ask me the role and team." },
      { id: "policy", label: "Draft a policy", message: "Draft an HR policy as a Word document. Ask me which policy and company size." },
    ],
  },
  customer_support: {
    id: "customer_support",
    label: "Support",
    title: "Support Agent",
    icon: HeadphonesIcon,
    tagline: "Troubleshooting, refunds, complaints and ready-to-send replies.",
    quickActions: [
      { id: "issue", label: "Fix an issue", message: "I'm facing an issue. Ask me what's happening and troubleshoot it step by step." },
      { id: "refund", label: "Refund / order help", message: "Help me with a refund or order problem. Ask me for the details you need." },
      { id: "complaint", label: "Write a complaint", message: "Write a formal complaint email for me. Ask me what went wrong first." },
      { id: "reply", label: "Draft a customer reply", message: "Draft a polite reply to an unhappy customer. Ask me the situation." },
    ],
  },
  admin_agent: {
    id: "admin_agent",
    label: "Admin",
    title: "Admin Assistant",
    icon: Shield,
    tagline: "Operations, reports, SOPs, audits and system status — short and direct.",
    quickActions: [
      { id: "report", label: "Build a report", message: "Build an operations report as a spreadsheet. Ask me the metrics and period." },
      { id: "sop", label: "Create an SOP", message: "Create a standard operating procedure document. Ask me the process." },
      { id: "audit", label: "Run an audit checklist", message: "Give me an audit checklist. Ask me the area to audit." },
      { id: "status", label: "Status summary", message: "Summarise current status of my tasks. Ask me what to include." },
    ],
  },
};

export const ROLE_LIST = Object.values(ROLE_META);

import type { Artifact } from "@/lib/artifacts";
import type { UploadedFile } from "@/services/artifactService";

export interface StoredMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  intent?: string;
  confidence?: "high" | "medium" | "low";
  emotion?: "positive" | "neutral" | "negative" | "frustrated";
  selectedTool?: string;
  toolReason?: string;
  reasoning?: string;
  attachments?: UploadedFile[];
  artifact?: Artifact;
}

export interface ChatSession {
  id: string;
  title: string;
  role: string;
  createdAt: number;
  updatedAt: number;
  messages: StoredMessage[];
}

const KEY = "omniagent_chat_history";
const MAX_SESSIONS = 40;

const read = (): ChatSession[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as ChatSession[]) : [];
  } catch {
    return [];
  }
};

const write = (sessions: ChatSession[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(sessions.slice(0, MAX_SESSIONS)));
  } catch {
    // storage full — drop oldest half and retry once
    try {
      localStorage.setItem(KEY, JSON.stringify(sessions.slice(0, Math.floor(MAX_SESSIONS / 2))));
    } catch {
      /* ignore */
    }
  }
};

export const deriveTitle = (messages: StoredMessage[]): string => {
  const first = messages.find((m) => m.role === "user" && m.content.trim());
  const text = first?.content.trim() || "New conversation";
  return text.length > 48 ? `${text.slice(0, 48)}…` : text;
};

/** Strip heavy fields (base64 file payloads) before persisting. */
const slim = (messages: StoredMessage[]): StoredMessage[] =>
  messages
    .filter((m) => m.content?.trim())
    .map((m) => ({
      ...m,
      attachments: m.attachments?.map((a) => ({ ...a, dataUrl: "" })),
    }));

export const listSessions = (): ChatSession[] =>
  read().sort((a, b) => b.updatedAt - a.updatedAt);

export const getSession = (id: string): ChatSession | undefined =>
  read().find((s) => s.id === id);

export const saveSession = (
  id: string,
  messages: StoredMessage[],
  role: string
): ChatSession | null => {
  const cleaned = slim(messages);
  if (cleaned.length === 0) return null;

  const sessions = read();
  const existing = sessions.find((s) => s.id === id);
  const now = Date.now();

  if (existing) {
    existing.messages = cleaned;
    existing.role = role;
    existing.updatedAt = now;
    if (!existing.title || existing.title === "New conversation") {
      existing.title = deriveTitle(cleaned);
    }
    write(sessions);
    return existing;
  }

  const session: ChatSession = {
    id,
    title: deriveTitle(cleaned),
    role,
    createdAt: now,
    updatedAt: now,
    messages: cleaned,
  };
  write([session, ...sessions]);
  return session;
};

export const renameSession = (id: string, title: string) => {
  const sessions = read();
  const s = sessions.find((x) => x.id === id);
  if (!s) return;
  s.title = title.trim() || s.title;
  write(sessions);
};

export const deleteSession = (id: string) => {
  write(read().filter((s) => s.id !== id));
};

export const clearAllSessions = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
};

export const newSessionId = () =>
  `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const relativeTime = (ts: number): string => {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
};

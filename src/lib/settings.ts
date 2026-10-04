import type { AgentRoleId } from "@/lib/roles";

export type AppLanguage = "auto" | "en-US" | "hi-IN";
export type TextSize = "small" | "normal" | "large";

export interface AppSettings {
  displayName: string;
  defaultRole: AgentRoleId;
  language: AppLanguage;
  autoSpeak: boolean;
  textSize: TextSize;
  showReasoning: boolean;
}

const KEY = "omniagent_settings";

export const DEFAULT_SETTINGS: AppSettings = {
  displayName: "",
  defaultRole: "default",
  language: "auto",
  autoSpeak: false,
  textSize: "normal",
  showReasoning: false,
};

export const loadSettings = (): AppSettings => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (s: AppSettings) => localStorage.setItem(KEY, JSON.stringify(s));

const SIZE_PX: Record<TextSize, string> = { small: "15px", normal: "16px", large: "18px" };
export const applyTextSize = (size: TextSize) => {
  document.documentElement.style.fontSize = SIZE_PX[size];
};

export const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "ME";

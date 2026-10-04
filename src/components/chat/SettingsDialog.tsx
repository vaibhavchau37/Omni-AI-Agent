import { useState } from "react";
import { Settings2, Volume2, Database, Info, Download, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROLE_LIST, type AgentRoleId } from "@/lib/roles";
import type { AppSettings, AppLanguage, TextSize } from "@/lib/settings";
import { listSessions, clearAllSessions } from "@/lib/chatHistory";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export type SettingsTab = "general" | "voice" | "data" | "about";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  settings: AppSettings;
  onChange: (s: AppSettings) => void;
  onHistoryCleared: () => void;
  initialTab?: SettingsTab;
}

const TABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: "general", label: "General", icon: Settings2 },
  { id: "voice", label: "Voice", icon: Volume2 },
  { id: "data", label: "Data & privacy", icon: Database },
  { id: "about", label: "About", icon: Info },
];

const Row = ({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-4 py-3 border-b border-border/40 last:border-0">
    <div className="min-w-0">
      <p className="text-sm text-foreground">{title}</p>
      {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

export const exportChats = () => {
  const data = listSessions();
  if (!data.length) {
    toast({ title: "Nothing to export", description: "You have no saved chats yet." });
    return;
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `omniagent-chats-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast({ title: "Chats downloaded", description: `${data.length} chat(s) saved as a file.` });
};

export const SettingsDialog = ({ open, onOpenChange, settings, onChange, onHistoryCleared, initialTab = "general" }: Props) => {
  const [tab, setTab] = useState<SettingsTab>(initialTab);
  const [confirmClear, setConfirmClear] = useState(false);
  const set = <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => onChange({ ...settings, [k]: v });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o) setTab(initialTab);
        setConfirmClear(false);
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="font-display text-xl">Settings</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col sm:flex-row min-h-[380px]">
          <nav className="flex sm:flex-col gap-1 px-3 pb-3 sm:w-44 overflow-x-auto scrollbar-none border-b sm:border-b-0 sm:border-r border-border/40">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors",
                  tab === id ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>

          <div className="flex-1 px-5 pb-5 overflow-y-auto max-h-[60vh]">
            {tab === "general" && (
              <>
                <div className="py-3 border-b border-border/40 space-y-1.5">
                  <Label htmlFor="name">What should OmniAgent call you?</Label>
                  <Input
                    id="name"
                    value={settings.displayName}
                    maxLength={40}
                    placeholder="Your name"
                    onChange={(e) => set("displayName", e.target.value)}
                  />
                </div>
                <Row title="Default mode" hint="Used when you start a new chat">
                  <Select value={settings.defaultRole} onValueChange={(v) => set("defaultRole", v as AgentRoleId)}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROLE_LIST.map((r) => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Row>
                <Row title="Language" hint="For speaking and listening">
                  <Select value={settings.language} onValueChange={(v) => set("language", v as AppLanguage)}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="en-US">English</SelectItem>
                      <SelectItem value="hi-IN">हिंदी</SelectItem>
                    </SelectContent>
                  </Select>
                </Row>
                <Row title="Text size">
                  <Select value={settings.textSize} onValueChange={(v) => set("textSize", v as TextSize)}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </Row>
                <Row title="Show how it decided" hint="Adds the reasoning under each answer">
                  <Switch checked={settings.showReasoning} onCheckedChange={(v) => set("showReasoning", v)} />
                </Row>
              </>
            )}

            {tab === "voice" && (
              <Row title="Read answers aloud" hint="Speaks every reply automatically, even when you type">
                <Switch checked={settings.autoSpeak} onCheckedChange={(v) => set("autoSpeak", v)} />
              </Row>
            )}

            {tab === "data" && (
              <>
                <p className="text-xs text-muted-foreground py-3">
                  Your chats are stored only on this device. Nothing is shared unless you send it.
                </p>
                <Row title="Download my chats" hint="Save all chats as a file">
                  <Button variant="outline" size="sm" onClick={exportChats} className="gap-1.5">
                    <Download className="w-3.5 h-3.5" /> Download
                  </Button>
                </Row>
                <Row title="Delete all chats" hint="This cannot be undone">
                  <Button
                    variant={confirmClear ? "destructive" : "outline"}
                    size="sm"
                    className="gap-1.5"
                    onClick={() => {
                      if (!confirmClear) return setConfirmClear(true);
                      clearAllSessions();
                      setConfirmClear(false);
                      onHistoryCleared();
                      toast({ title: "All chats deleted" });
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> {confirmClear ? "Tap again to confirm" : "Delete"}
                  </Button>
                </Row>
              </>
            )}

            {tab === "about" && (
              <div className="py-3 space-y-3 text-sm text-muted-foreground">
                <p><span className="text-foreground font-medium">OmniAgent</span> — your everyday AI for India, in English and हिंदी.</p>
                <p>It makes slide decks, Word documents, spreadsheets and landing pages, reads your photos and files, and helps in Student, HR, Support and Admin modes.</p>
                <p>If something isn’t known for sure, it says so instead of guessing.</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

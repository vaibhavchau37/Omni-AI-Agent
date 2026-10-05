import { useEffect, useMemo, useState } from "react";
import {
  Check,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ROLE_META } from "@/lib/roles";
import type { AgentRoleId } from "@/lib/roles";
import {
  ChatSession,
  deleteSession,
  listSessions,
  relativeTime,
  renameSession,
} from "@/lib/chatHistory";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  desktopOpen: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
  activeSessionId: string;
  historyVersion: number;
  onSelect: (session: ChatSession) => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
}

export const ChatSidebar = ({
  desktopOpen,
  mobileOpen,
  onMobileClose,
  activeSessionId,
  historyVersion,
  onSelect,
  onNewChat,
  onOpenSettings,
}: ChatSidebarProps) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");

  const refresh = () => setSessions(listSessions());

  useEffect(() => {
    refresh();
  }, [desktopOpen, mobileOpen, historyVersion]);

  const filteredSessions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sessions;
    return sessions.filter((session) => {
      const role = ROLE_META[(session.role as AgentRoleId) ?? "default"]?.label ?? "";
      return `${session.title} ${role}`.toLowerCase().includes(query);
    });
  }, [search, sessions]);

  const createNewChat = () => {
    onNewChat();
    onMobileClose();
  };

  const openSettings = () => {
    onOpenSettings();
    onMobileClose();
  };

  const content = (
    <div className="flex h-full min-h-0 flex-col bg-card/50">
      <div className="px-4 pt-5 pb-4">
        <div className="mb-5 flex items-center gap-2 px-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
            <MessageSquare className="h-4 w-4" />
          </div>
          <span className="font-display text-base font-semibold text-foreground">OmniAgent</span>
        </div>
        <Button className="w-full justify-start gap-2" onClick={createNewChat}>
          <Plus className="h-4 w-4" />
          New chat
        </Button>
      </div>

      <div className="flex items-center justify-between px-5 pb-2">
        <p className="text-xs font-semibold text-muted-foreground">Recent chats</p>
        <span className="text-[10px] text-muted-foreground">{sessions.length}</span>
      </div>
      <div className="px-3 pb-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search chats"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search chats"
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      <div className="scrollbar-thin min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-3">
        {filteredSessions.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">
            {sessions.length ? "No chats match your search." : "Your chats will appear here."}
          </p>
        ) : (
          filteredSessions.map((session) => {
            const role = ROLE_META[(session.role as AgentRoleId) ?? "default"] ?? ROLE_META.default;
            const isActive = session.id === activeSessionId;
            const isEditing = editingId === session.id;
            return (
              <div
                key={session.id}
                className={cn(
                  "group rounded-md border border-transparent px-2 py-2 transition-colors",
                  isActive ? "border-primary/20 bg-primary/10" : "hover:bg-secondary/70",
                )}
              >
                {isEditing ? (
                  <div className="flex items-center gap-1">
                    <Input
                      autoFocus
                      aria-label="Chat name"
                      value={draftTitle}
                      onChange={(event) => setDraftTitle(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          renameSession(session.id, draftTitle);
                          setEditingId(null);
                          refresh();
                        }
                        if (event.key === "Escape") setEditingId(null);
                      }}
                      className="h-8 text-xs"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Save chat name"
                      onClick={() => {
                        renameSession(session.id, draftTitle);
                        setEditingId(null);
                        refresh();
                      }}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Cancel rename"
                      onClick={() => setEditingId(null)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-start gap-1">
                    <Button
                      variant="ghost"
                      className="h-auto min-w-0 flex-1 justify-start px-1.5 py-0.5 text-left hover:bg-transparent"
                      onClick={() => {
                        onSelect(session);
                        onMobileClose();
                      }}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5 truncate text-xs font-medium text-foreground">
                          <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="truncate">{session.title}</span>
                        </span>
                        <span className="mt-1 block truncate pl-5 text-[10px] text-muted-foreground">
                          {role.label} · {relativeTime(session.updatedAt)}
                        </span>
                      </span>
                    </Button>
                    <div className="flex shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        aria-label="Rename chat"
                        onClick={() => {
                          setEditingId(session.id);
                          setDraftTitle(session.title);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        aria-label="Delete chat"
                        onClick={() => {
                          deleteSession(session.id);
                          refresh();
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-border/50 p-3">
        <Button variant="ghost" className="w-full justify-start gap-2 text-sm" onClick={openSettings}>
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {desktopOpen && (
        <aside className="hidden h-full w-[272px] shrink-0 border-r border-border/50 md:flex">
          {content}
        </aside>
      )}
      <Sheet open={mobileOpen} onOpenChange={(open) => !open && onMobileClose()}>
        <SheetContent side="left" className="w-[280px] max-w-[85vw] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>OmniAgent navigation</SheetTitle>
            <SheetDescription>Start a chat, open saved conversations, or adjust settings.</SheetDescription>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    </>
  );
};
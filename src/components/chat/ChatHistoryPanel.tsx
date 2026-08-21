import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Trash2, Pencil, Check, X, Plus, History } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ChatSession,
  listSessions,
  deleteSession,
  renameSession,
  clearAllSessions,
  relativeTime,
} from "@/lib/chatHistory";
import { ROLE_META } from "@/lib/roles";
import type { AgentRoleId } from "@/lib/roles";

interface ChatHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeSessionId: string;
  onSelect: (session: ChatSession) => void;
  onNewChat: () => void;
}

export const ChatHistoryPanel = ({
  isOpen,
  onClose,
  activeSessionId,
  onSelect,
  onNewChat,
}: ChatHistoryPanelProps) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");

  const refresh = () => setSessions(listSessions());

  useEffect(() => {
    if (isOpen) refresh();
  }, [isOpen]);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-sm flex flex-col p-0">
        <SheetHeader className="px-4 pt-5 pb-3 border-b border-border/40">
          <SheetTitle className="flex items-center gap-2 text-base">
            <History className="w-4 h-4 text-primary" />
            Chat history
          </SheetTitle>
          <SheetDescription className="text-xs">
            Your previous conversations, saved on this device.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 py-3">
          <Button
            size="sm"
            className="w-full gap-2"
            onClick={() => {
              onNewChat();
              onClose();
            }}
          >
            <Plus className="w-4 h-4" />
            New chat
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-4 space-y-1">
          {sessions.length === 0 && (
            <p className="text-xs text-muted-foreground text-center px-4 py-10">
              No saved chats yet. Start a conversation and it will appear here.
            </p>
          )}

          {sessions.map((session) => {
            const meta = ROLE_META[(session.role as AgentRoleId) ?? "default"] ?? ROLE_META.default;
            const isActive = session.id === activeSessionId;
            const isEditing = editingId === session.id;

            return (
              <div
                key={session.id}
                className={cn(
                  "group rounded-lg border border-transparent px-2 py-2 transition-colors",
                  isActive ? "bg-primary/10 border-primary/20" : "hover:bg-muted/60"
                )}
              >
                {isEditing ? (
                  <div className="flex items-center gap-1">
                    <Input
                      autoFocus
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          renameSession(session.id, draftTitle);
                          setEditingId(null);
                          refresh();
                        }
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="h-8 text-xs"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        renameSession(session.id, draftTitle);
                        setEditingId(null);
                        refresh();
                      }}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingId(null)}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(session);
                        onClose();
                      }}
                      className="flex-1 text-left min-w-0"
                    >
                      <span className="flex items-center gap-1.5 text-xs font-medium text-foreground truncate">
                        <MessageSquare className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{session.title}</span>
                      </span>
                      <span className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{meta.label}</span>
                        <span>·</span>
                        <span>{session.messages.length} msgs</span>
                        <span>·</span>
                        <span>{relativeTime(session.updatedAt)}</span>
                      </span>
                    </button>

                    <div className="flex items-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
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
                        <Pencil className="w-3.5 h-3.5" />
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
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {sessions.length > 0 && (
          <div className="border-t border-border/40 p-3">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-destructive"
              onClick={() => {
                clearAllSessions();
                refresh();
              }}
            >
              Clear all history
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

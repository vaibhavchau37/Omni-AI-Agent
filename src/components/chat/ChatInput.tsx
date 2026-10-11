import { useState, KeyboardEvent, useRef, useEffect } from "react";
import { Send, Mic, MicOff, Paperclip, X, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { fileToUpload, UploadedFile } from "@/services/artifactService";

interface ChatInputProps {
  onSend: (message: string, attachments?: UploadedFile[]) => void;
  isListening: boolean;
  onVoiceToggle: () => void;
  disabled?: boolean;
}

const MAX_FILES = 4;
const MAX_SIZE = 8 * 1024 * 1024;

export const ChatInput = ({
  onSend,
  isListening,
  onVoiceToggle,
  disabled,
}: ChatInputProps) => {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  }, [input]);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const picked = Array.from(files).slice(0, MAX_FILES - attachments.length);
    const loaded: UploadedFile[] = [];
    for (const file of picked) {
      if (file.size > MAX_SIZE) {
        toast({ title: "File too large", description: `${file.name} is over 8 MB.`, variant: "destructive" });
        continue;
      }
      try {
        loaded.push(await fileToUpload(file));
      } catch {
        toast({ title: "Couldn't read file", description: file.name, variant: "destructive" });
      }
    }
    if (loaded.length) setAttachments((prev) => [...prev, ...loaded].slice(0, MAX_FILES));
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSend = () => {
    if ((input.trim() || attachments.length) && !disabled) {
      onSend(input.trim() || "Please read the attached file(s) and help me with them.", attachments);
      setInput("");
      setAttachments([]);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full space-y-2">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((f, i) => (
            <div key={`${f.name}_${i}`} className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg bg-muted/40 border border-border/50 max-w-[220px]">
              {f.mimeType.startsWith("image/") ? (
                <img src={f.dataUrl} alt={f.name} className="w-7 h-7 rounded object-cover" />
              ) : (
                <FileText className="w-4 h-4 text-primary shrink-0" />
              )}
              <span className="text-xs truncate">{f.name}</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 shrink-0"
                onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex min-w-0 items-end gap-1.5 rounded-2xl border border-border/60 bg-card p-1.5 shadow-lg sm:gap-2 sm:p-2">
        {/* Voice Button */}
        <Button
          onClick={onVoiceToggle}
          size="icon"
          aria-label={isListening ? "Stop voice input" : "Start voice input"}
          className={cn(
            "h-11 w-11 shrink-0 rounded-xl transition-all sm:h-10 sm:w-10",
            isListening 
              ? "bg-destructive text-destructive-foreground animate-pulse" 
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </Button>

        {/* Attach Button */}
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*,.pdf,.txt,.csv,.md"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button
          onClick={() => fileRef.current?.click()}
          size="icon"
          variant="outline"
          disabled={disabled || attachments.length >= MAX_FILES}
          title="Attach image or document"
          aria-label="Attach an image or document"
          className="h-11 w-11 shrink-0 rounded-xl sm:h-10 sm:w-10"
        >
          <Paperclip className="w-5 h-5" />
        </Button>
        
        {/* Input */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything in English or Hindi…"
          disabled={disabled}
          rows={1}
          aria-label="Message OmniAgent"
          className="min-w-0 flex-1 resize-none bg-transparent px-2 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50 scrollbar-thin sm:px-3 sm:text-sm"
          style={{ minHeight: "44px" }}
        />

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={(!input.trim() && !attachments.length) || disabled}
          size="icon"
          aria-label="Send message"
          className="h-11 w-11 shrink-0 rounded-xl sm:h-10 sm:w-10"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
      
      <p className="hidden text-center text-[10px] text-muted-foreground/50 sm:block">
        <kbd className="px-1 py-0.5 rounded bg-muted/30 text-muted-foreground/70">Enter</kbd> send
        <span className="mx-1.5">•</span>
        <kbd className="px-1 py-0.5 rounded bg-muted/30 text-muted-foreground/70">Shift+Enter</kbd> new line
        <span className="mx-1.5">•</span>
        <span className="inline-flex items-center gap-1"><ImageIcon className="w-2.5 h-2.5" /> attach images & docs</span>
      </p>
    </div>
  );
};

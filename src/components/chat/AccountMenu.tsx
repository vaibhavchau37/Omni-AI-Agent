import { Settings, Globe, HelpCircle, Download, Info, Trash2, Check } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger, DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import type { AppLanguage } from "@/lib/settings";
import { initials } from "@/lib/settings";
import type { SettingsTab } from "./SettingsDialog";
import { exportChats } from "./SettingsDialog";

interface Props {
  name: string;
  language: AppLanguage;
  onLanguage: (l: AppLanguage) => void;
  onOpenSettings: (tab: SettingsTab) => void;
  onGetHelp: () => void;
}

const LANGS: { id: AppLanguage; label: string }[] = [
  { id: "auto", label: "Auto" },
  { id: "en-US", label: "English" },
  { id: "hi-IN", label: "हिंदी" },
];

export const AccountMenu = ({ name, language, onLanguage, onOpenSettings, onGetHelp }: Props) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button
        aria-label="Account and settings"
        className="ml-0.5 h-11 w-11 shrink-0 rounded-full bg-secondary border border-border text-xs font-semibold text-foreground flex items-center justify-center hover:border-primary/50 transition-colors lg:ml-1 lg:h-8 lg:w-8"
      >
        {initials(name)}
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-60">
      <DropdownMenuLabel className="font-normal text-muted-foreground truncate">
        {name.trim() || "Guest · saved on this device"}
      </DropdownMenuLabel>
      <DropdownMenuItem onSelect={() => onOpenSettings("general")}>
        <Settings className="w-4 h-4 mr-2" /> Settings
        <DropdownMenuShortcut>Ctrl ,</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger><Globe className="w-4 h-4 mr-2" /> Language</DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          {LANGS.map((l) => (
            <DropdownMenuItem key={l.id} onSelect={() => onLanguage(l.id)}>
              <Check className={`w-4 h-4 mr-2 ${language === l.id ? "opacity-100" : "opacity-0"}`} /> {l.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuItem onSelect={onGetHelp}><HelpCircle className="w-4 h-4 mr-2" /> Get help</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={exportChats}><Download className="w-4 h-4 mr-2" /> Download my chats</DropdownMenuItem>
      <DropdownMenuItem onSelect={() => onOpenSettings("data")}><Trash2 className="w-4 h-4 mr-2" /> Delete chats</DropdownMenuItem>
      <DropdownMenuItem onSelect={() => onOpenSettings("about")}><Info className="w-4 h-4 mr-2" /> About OmniAgent</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

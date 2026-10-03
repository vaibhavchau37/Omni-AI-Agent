import { FlaskConical, Globe, MicOff, Radio } from "lucide-react";
import { ROLE_LIST, type AgentRoleId } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type AgentRole = AgentRoleId;

interface ControlBarProps {
  agentRole: AgentRole;
  onRoleChange: (role: AgentRole) => void;
  isSimulation: boolean;
  onSimulationToggle: () => void;
  currentLanguage: "en-US" | "hi-IN" | "auto";
  onLanguageChange: (lang: "en-US" | "hi-IN" | "auto") => void;
  isListening: boolean;
  continuousListening: {
    isEnabled: boolean;
    isListening: boolean;
    isWakeWordDetected: boolean;
    enable: () => void;
    disable: () => void;
  };
}

const roles = ROLE_LIST;

const languages = [
  { code: "auto" as const, label: "Auto", flag: "🌐" },
  { code: "en-US" as const, label: "EN", flag: "🇺🇸" },
  { code: "hi-IN" as const, label: "हिं", flag: "🇮🇳" },
];

export const ControlBar = ({
  agentRole,
  onRoleChange,
  isSimulation,
  onSimulationToggle,
  currentLanguage,
  onLanguageChange,
  isListening,
  continuousListening,
}: ControlBarProps) => {
  const currentLang = languages.find(l => l.code === currentLanguage) || languages[0];

  return (
    <div className="border-b border-border/30 px-3 sm:px-4 py-2">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Role Pills */}
        <div className="flex items-center gap-1 p-0.5 rounded-full bg-secondary/50 border border-border/40 overflow-x-auto scrollbar-none min-w-0">
          {roles.map((role) => {
            const Icon = role.icon;
            const isActive = agentRole === role.id;
            
            return (
              <Tooltip key={role.id}>
                <TooltipTrigger asChild>
                  <button
                    aria-pressed={isActive}
                    onClick={() => onRoleChange(role.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{role.label}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>{role.title} — {role.tagline}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
        
        {/* Right Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Sandbox Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isSimulation ? "default" : "ghost"}
                size="sm"
                onClick={onSimulationToggle}
                className={cn(
                  "h-8 px-2.5 text-xs rounded-lg",
                  isSimulation && "bg-warning/20 text-warning hover:bg-warning/30 border border-warning/30"
                )}
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span className="hidden sm:inline ml-1.5">Sandbox</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Test without saving data</TooltipContent>
          </Tooltip>

          <div className="h-5 w-px bg-border/50" />

          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="h-8 px-2.5 gap-1.5 text-xs rounded-lg"
                disabled={isListening}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{currentLang.flag}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[120px] bg-popover border border-border z-50">
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => onLanguageChange(lang.code)}
                  className={cn(
                    "cursor-pointer gap-2",
                    currentLanguage === lang.code && "bg-primary/10"
                  )}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Continuous Listening */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={continuousListening.isEnabled ? "default" : "ghost"}
                size="sm"
                onClick={() => continuousListening.isEnabled ? continuousListening.disable() : continuousListening.enable()}
                className={cn(
                  "h-8 w-8 p-0 rounded-lg",
                  continuousListening.isEnabled && "bg-primary/20 text-primary hover:bg-primary/30",
                  continuousListening.isWakeWordDetected && "bg-primary text-primary-foreground animate-pulse"
                )}
              >
                {continuousListening.isEnabled ? (
                  <Radio className="w-4 h-4" />
                ) : (
                  <MicOff className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {continuousListening.isEnabled ? "Always listening (say 'OmniGent')" : "Enable continuous listening"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};
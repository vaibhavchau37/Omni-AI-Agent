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
      <div className="mx-auto flex w-full max-w-4xl flex-col items-stretch gap-1 lg:flex-row lg:items-center lg:justify-between lg:gap-3">
        {/* Role Pills */}
        <div className="flex min-w-0 max-w-full items-center gap-1 overflow-x-auto rounded-full border border-border/40 bg-secondary/50 p-0.5 scrollbar-none">
          {roles.map((role) => {
            const Icon = role.icon;
            const isActive = agentRole === role.id;
            
            return (
              <Tooltip key={role.id}>
                <TooltipTrigger asChild>
                  <button
                    aria-pressed={isActive}
                    aria-label={role.label}
                    onClick={() => onRoleChange(role.id)}
                    className={cn(
                      "flex h-11 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition-all lg:h-8 lg:px-3",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                      <span className={cn("hidden md:inline", isActive && "inline")}>{role.label}</span>
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
                  "h-11 px-2.5 text-xs rounded-lg lg:h-8",
                  isSimulation && "bg-warning/20 text-warning hover:bg-warning/30 border border-warning/30"
                )}
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span className="hidden md:inline ml-1.5">Sandbox</span>
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
                className="h-11 px-2.5 gap-1.5 text-xs rounded-lg lg:h-8"
                disabled={isListening}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{currentLang.label}</span>
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
                  "h-11 w-11 p-0 rounded-lg lg:h-8 lg:w-8",
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
import { RoleSelector, AgentRole } from "./RoleSelector";
import { VoiceLanguageSelector } from "./VoiceLanguageSelector";
import { ContinuousListeningButton } from "./ContinuousListeningButton";
import { FlaskConical, Globe } from "lucide-react";

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
  detectedLanguage?: string | null;
  isVoiceMode?: boolean;
}

export const ControlBar = ({
  agentRole,
  onRoleChange,
  isSimulation,
  onSimulationToggle,
  currentLanguage,
  onLanguageChange,
  isListening,
  continuousListening,
  detectedLanguage,
  isVoiceMode,
}: ControlBarProps) => {
  return (
    <div className="border-b border-border/30 px-4 py-3 bg-secondary/30">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Left Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <RoleSelector 
              currentRole={agentRole}
              onRoleChange={onRoleChange}
              isSimulation={isSimulation}
              onSimulationToggle={onSimulationToggle}
            />
            
            <div className="h-5 w-px bg-border/50 hidden sm:block" />
            
            <VoiceLanguageSelector
              currentLanguage={currentLanguage}
              onLanguageChange={onLanguageChange}
              isListening={isListening}
            />
            
            <ContinuousListeningButton
              isEnabled={continuousListening.isEnabled}
              isListening={continuousListening.isListening}
              isWakeWordDetected={continuousListening.isWakeWordDetected}
              onToggle={() => continuousListening.isEnabled ? continuousListening.disable() : continuousListening.enable()}
              language={currentLanguage === "hi-IN" ? "hi" : "en"}
            />
          </div>
          
          {/* Right Status */}
          <div className="flex items-center gap-2">
            {detectedLanguage && isVoiceMode && (
              <div className="flex items-center gap-1.5 text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                <Globe className="w-3 h-3" />
                {detectedLanguage === "hi" ? "हिंदी" : "English"}
              </div>
            )}
            
            {isSimulation && (
              <div className="flex items-center gap-1.5 text-xs text-warning bg-warning/10 px-2.5 py-1 rounded-full border border-warning/20">
                <FlaskConical className="w-3 h-3" />
                Sandbox
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
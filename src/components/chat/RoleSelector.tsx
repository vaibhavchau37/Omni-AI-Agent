import { User, GraduationCap, Briefcase, HeadphonesIcon, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export type AgentRole = "default" | "student_assistant" | "hr_assistant" | "customer_support" | "admin_agent";

interface RoleSelectorProps {
  currentRole: AgentRole;
  onRoleChange: (role: AgentRole) => void;
  isSimulation: boolean;
  onSimulationToggle: () => void;
}

const roles = [
  { id: "default" as const, icon: User, label: "General", color: "text-primary" },
  { id: "student_assistant" as const, icon: GraduationCap, label: "Student", color: "text-blue-400" },
  { id: "hr_assistant" as const, icon: Briefcase, label: "HR", color: "text-green-400" },
  { id: "customer_support" as const, icon: HeadphonesIcon, label: "Support", color: "text-orange-400" },
  { id: "admin_agent" as const, icon: Shield, label: "Admin", color: "text-purple-400" },
];

export const RoleSelector = ({ currentRole, onRoleChange, isSimulation, onSimulationToggle }: RoleSelectorProps) => {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary/50 border border-border/50">
        {roles.map((role) => {
          const Icon = role.icon;
          const isActive = currentRole === role.id;
          
          return (
            <button
              key={role.id}
              onClick={() => onRoleChange(role.id)}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all",
                isActive 
                  ? "bg-primary/20 text-primary" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
              title={`${role.label} Assistant`}
            >
              <Icon className={cn("w-3.5 h-3.5", isActive && role.color)} />
              <span className="hidden sm:inline">{role.label}</span>
            </button>
          );
        })}
      </div>
      
      <button
        onClick={onSimulationToggle}
        className={cn(
          "px-2 py-1 rounded-md text-xs font-medium transition-all border",
          isSimulation
            ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
            : "text-muted-foreground hover:text-foreground border-border/50 hover:bg-secondary"
        )}
        title="Simulation/Sandbox Mode - Test without saving data"
      >
        {isSimulation ? "🧪 Sandbox" : "🧪"}
      </button>
    </div>
  );
};
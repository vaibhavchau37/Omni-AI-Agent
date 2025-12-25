import { Target, Calendar, AlertTriangle, ArrowRight } from "lucide-react";

interface DemoScenariosProps {
  onSelectDemo: (message: string) => void;
  disabled?: boolean;
}

const DEMOS = [
  {
    id: "goal",
    title: "Goal-Based AI",
    desc: "Multi-step planning",
    icon: Target,
    message: "Help me prepare for an AI engineer interview at a tech company",
    color: "from-blue-500/20 to-cyan-500/20 border-blue-500/30 hover:border-blue-400/60",
    iconBg: "bg-blue-500/15 text-blue-400",
  },
  {
    id: "workflow",
    title: "Workflow",
    desc: "Task scheduling",
    icon: Calendar,
    message: "Schedule a team meeting for next Monday at 2 PM and send calendar invites",
    color: "from-emerald-500/20 to-green-500/20 border-emerald-500/30 hover:border-emerald-400/60",
    iconBg: "bg-emerald-500/15 text-emerald-400",
  },
  {
    id: "recovery",
    title: "Recovery",
    desc: "Error handling",
    icon: AlertTriangle,
    message: "I tried to book a flight but the system crashed. Help me recover my booking",
    color: "from-amber-500/20 to-orange-500/20 border-amber-500/30 hover:border-amber-400/60",
    iconBg: "bg-amber-500/15 text-amber-400",
  },
];

export const DemoScenarios = ({ onSelectDemo, disabled }: DemoScenariosProps) => {
  return (
    <div className="space-y-3">
      <div className="text-center">
        <p className="text-xs text-muted-foreground">Try a demo</p>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {DEMOS.map((demo) => (
          <button
            key={demo.id}
            onClick={() => onSelectDemo(demo.message)}
            disabled={disabled}
            className={`group p-3 rounded-xl bg-gradient-to-br ${demo.color} border transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed text-left`}
          >
            <div className={`w-8 h-8 rounded-lg ${demo.iconBg} flex items-center justify-center mb-2`}>
              <demo.icon className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground">{demo.title}</p>
              <p className="text-[10px] text-muted-foreground">{demo.desc}</p>
            </div>
            <ArrowRight className="w-3 h-3 text-muted-foreground/50 group-hover:text-foreground mt-2 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
};
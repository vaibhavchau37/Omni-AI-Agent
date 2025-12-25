import { Target, Calendar, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DemoScenariosProps {
  onSelectDemo: (message: string) => void;
  disabled?: boolean;
}

const DEMO_SCENARIOS = [
  {
    id: "goal",
    title: "Goal-Based AI",
    description: "Multi-step planning",
    icon: Target,
    message: "Help me prepare for an AI engineer interview at a tech company",
    color: "from-blue-500/20 to-cyan-500/20 border-blue-500/30 hover:border-blue-500/50",
  },
  {
    id: "workflow",
    title: "Workflow Automation",
    description: "Task scheduling",
    icon: Calendar,
    message: "Schedule a team meeting for next Monday at 2 PM and send calendar invites to the engineering team",
    color: "from-green-500/20 to-emerald-500/20 border-green-500/30 hover:border-green-500/50",
  },
  {
    id: "recovery",
    title: "Failure Recovery",
    description: "Error handling",
    icon: AlertTriangle,
    message: "I tried to book a flight but the system crashed. Can you help me recover my booking? Booking reference: XYZ123",
    color: "from-orange-500/20 to-amber-500/20 border-orange-500/30 hover:border-orange-500/50",
  },
];

export const DemoScenarios = ({ onSelectDemo, disabled }: DemoScenariosProps) => {
  return (
    <div className="space-y-3">
      <div className="text-center">
        <h3 className="text-sm font-medium text-foreground">Try a Demo Scenario</h3>
        <p className="text-xs text-muted-foreground mt-1">Click to experience key AI capabilities</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {DEMO_SCENARIOS.map((demo) => (
          <Button
            key={demo.id}
            variant="outline"
            onClick={() => onSelectDemo(demo.message)}
            disabled={disabled}
            className={`h-auto py-4 px-4 flex flex-col items-center gap-2 bg-gradient-to-br ${demo.color} transition-all duration-300`}
          >
            <demo.icon className="w-6 h-6" />
            <div className="text-center">
              <div className="font-medium text-sm">{demo.title}</div>
              <div className="text-xs text-muted-foreground">{demo.description}</div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};

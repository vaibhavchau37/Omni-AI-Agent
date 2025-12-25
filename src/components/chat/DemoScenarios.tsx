import { Target, Calendar, AlertTriangle, Mic, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DemoScenariosProps {
  onSelectDemo: (message: string) => void;
  disabled?: boolean;
}

const DEMO_SCENARIOS_EN = [
  {
    id: "goal",
    title: "Goal-Based AI",
    description: "Multi-step planning & execution",
    icon: Target,
    message: "Help me prepare for an AI engineer interview at a tech company",
    gradient: "from-blue-500/15 to-cyan-500/15",
    border: "border-blue-500/25 hover:border-blue-400/50",
    iconColor: "text-blue-400",
  },
  {
    id: "workflow",
    title: "Workflow Automation",
    description: "Smart task scheduling",
    icon: Calendar,
    message: "Schedule a team meeting for next Monday at 2 PM and send calendar invites to the engineering team",
    gradient: "from-emerald-500/15 to-green-500/15",
    border: "border-emerald-500/25 hover:border-emerald-400/50",
    iconColor: "text-emerald-400",
  },
  {
    id: "recovery",
    title: "Failure Recovery",
    description: "Intelligent error handling",
    icon: AlertTriangle,
    message: "I tried to book a flight but the system crashed. Can you help me recover my booking? Booking reference: XYZ123",
    gradient: "from-amber-500/15 to-orange-500/15",
    border: "border-amber-500/25 hover:border-amber-400/50",
    iconColor: "text-amber-400",
  },
];

const DEMO_SCENARIOS_HI = [
  {
    id: "goal-hi",
    title: "लक्ष्य-आधारित AI",
    description: "चरण-दर-चरण योजना",
    icon: Target,
    message: "मुझे AI इंजीनियर इंटरव्यू की तैयारी में मदद करो",
    gradient: "from-blue-500/15 to-cyan-500/15",
    border: "border-blue-500/25 hover:border-blue-400/50",
    iconColor: "text-blue-400",
  },
  {
    id: "workflow-hi",
    title: "कार्य स्वचालन",
    description: "कार्य निर्धारण",
    icon: Calendar,
    message: "अगले सोमवार दोपहर 2 बजे टीम मीटिंग शेड्यूल करो",
    gradient: "from-emerald-500/15 to-green-500/15",
    border: "border-emerald-500/25 hover:border-emerald-400/50",
    iconColor: "text-emerald-400",
  },
  {
    id: "voice-hi",
    title: "वॉइस कमांड",
    description: "आवाज़ से नियंत्रण",
    icon: Mic,
    message: "मेरे कल के सभी काम बताओ और सबसे ज़रूरी काम पहले करो",
    gradient: "from-purple-500/15 to-pink-500/15",
    border: "border-purple-500/25 hover:border-purple-400/50",
    iconColor: "text-purple-400",
  },
];

export const DemoScenarios = ({ onSelectDemo, disabled }: DemoScenariosProps) => {
  return (
    <div className="space-y-4 slide-up">
      <div className="text-center">
        <h3 className="text-sm font-semibold text-foreground mb-1">
          Quick Start Demos
        </h3>
        <p className="text-xs text-muted-foreground">
          Click to experience AI capabilities
        </p>
      </div>
      
      <Tabs defaultValue="english" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[240px] mx-auto mb-4 h-9">
          <TabsTrigger value="english" className="text-xs font-medium">
            🇺🇸 English
          </TabsTrigger>
          <TabsTrigger value="hindi" className="text-xs font-medium">
            🇮🇳 हिंदी
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="english" className="mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {DEMO_SCENARIOS_EN.map((demo) => (
              <Button
                key={demo.id}
                variant="outline"
                onClick={() => onSelectDemo(demo.message)}
                disabled={disabled}
                className={`group h-auto py-5 px-4 flex flex-col items-center gap-3 bg-gradient-to-br ${demo.gradient} ${demo.border} transition-all duration-300 hover-lift`}
              >
                <div className={`p-2.5 rounded-xl bg-background/50 ${demo.iconColor}`}>
                  <demo.icon className="w-5 h-5" />
                </div>
                <div className="text-center space-y-1">
                  <div className="font-semibold text-sm text-foreground">{demo.title}</div>
                  <div className="text-xs text-muted-foreground">{demo.description}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
              </Button>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="hindi" className="mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {DEMO_SCENARIOS_HI.map((demo) => (
              <Button
                key={demo.id}
                variant="outline"
                onClick={() => onSelectDemo(demo.message)}
                disabled={disabled}
                className={`group h-auto py-5 px-4 flex flex-col items-center gap-3 bg-gradient-to-br ${demo.gradient} ${demo.border} transition-all duration-300 hover-lift`}
              >
                <div className={`p-2.5 rounded-xl bg-background/50 ${demo.iconColor}`}>
                  <demo.icon className="w-5 h-5" />
                </div>
                <div className="text-center space-y-1">
                  <div className="font-semibold text-sm text-foreground">{demo.title}</div>
                  <div className="text-xs text-muted-foreground">{demo.description}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
              </Button>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
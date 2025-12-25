import { Target, Calendar, AlertTriangle, Mic, Languages } from "lucide-react";
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

const DEMO_SCENARIOS_HI = [
  {
    id: "goal-hi",
    title: "लक्ष्य-आधारित AI",
    description: "चरण-दर-चरण योजना",
    icon: Target,
    message: "मुझे AI इंजीनियर इंटरव्यू की तैयारी में मदद करो",
    color: "from-blue-500/20 to-cyan-500/20 border-blue-500/30 hover:border-blue-500/50",
  },
  {
    id: "workflow-hi",
    title: "कार्य स्वचालन",
    description: "कार्य निर्धारण",
    icon: Calendar,
    message: "अगले सोमवार दोपहर 2 बजे टीम मीटिंग शेड्यूल करो और इंजीनियरिंग टीम को कैलेंडर इनवाइट भेजो",
    color: "from-green-500/20 to-emerald-500/20 border-green-500/30 hover:border-green-500/50",
  },
  {
    id: "voice-hi",
    title: "वॉइस कमांड",
    description: "आवाज़ से नियंत्रण",
    icon: Mic,
    message: "मेरे कल के सभी काम बताओ और सबसे ज़रूरी काम पहले करो",
    color: "from-purple-500/20 to-pink-500/20 border-purple-500/30 hover:border-purple-500/50",
  },
];

export const DemoScenarios = ({ onSelectDemo, disabled }: DemoScenariosProps) => {
  return (
    <div className="space-y-3">
      <div className="text-center">
        <h3 className="text-sm font-medium text-foreground flex items-center justify-center gap-2">
          <Languages className="w-4 h-4" />
          Try a Demo Scenario / डेमो आज़माएं
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Click to experience AI capabilities • AI क्षमताओं का अनुभव करें
        </p>
      </div>
      
      <Tabs defaultValue="english" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[300px] mx-auto">
          <TabsTrigger value="english" className="text-xs">🇺🇸 English</TabsTrigger>
          <TabsTrigger value="hindi" className="text-xs">🇮🇳 हिंदी</TabsTrigger>
        </TabsList>
        
        <TabsContent value="english" className="mt-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {DEMO_SCENARIOS_EN.map((demo) => (
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
        </TabsContent>
        
        <TabsContent value="hindi" className="mt-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {DEMO_SCENARIOS_HI.map((demo) => (
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

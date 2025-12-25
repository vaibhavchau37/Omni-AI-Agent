import { Globe, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type SupportedLanguage = "en-US" | "hi-IN" | "auto";

interface VoiceLanguageSelectorProps {
  currentLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  isListening: boolean;
}

const languages = [
  { 
    code: "auto" as const, 
    label: "Auto-Detect", 
    labelHi: "ऑटो-डिटेक्ट",
    flag: "🌐",
    description: "Hindi + English"
  },
  { 
    code: "en-US" as const, 
    label: "English", 
    labelHi: "अंग्रेज़ी",
    flag: "🇺🇸",
    description: "English only"
  },
  { 
    code: "hi-IN" as const, 
    label: "Hindi", 
    labelHi: "हिंदी",
    flag: "🇮🇳",
    description: "हिंदी केवल"
  },
];

export const VoiceLanguageSelector = ({ 
  currentLanguage, 
  onLanguageChange,
  isListening 
}: VoiceLanguageSelectorProps) => {
  const currentLang = languages.find(l => l.code === currentLanguage) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={cn(
            "gap-2 text-xs",
            isListening && "border-primary/50 bg-primary/10"
          )}
          disabled={isListening}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{currentLang.flag}</span>
          <span className="hidden sm:inline">{currentLang.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => onLanguageChange(lang.code)}
            className={cn(
              "flex items-center gap-2 cursor-pointer",
              currentLanguage === lang.code && "bg-primary/10"
            )}
          >
            <span className="text-lg">{lang.flag}</span>
            <div className="flex flex-col">
              <span className="font-medium">{lang.label}</span>
              <span className="text-[10px] text-muted-foreground">
                {lang.description}
              </span>
            </div>
            {currentLanguage === lang.code && (
              <Mic className="w-3 h-3 text-primary ml-auto" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

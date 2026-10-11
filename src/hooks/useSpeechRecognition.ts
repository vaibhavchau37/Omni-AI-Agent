import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

type SupportedLanguage = "en-US" | "hi-IN" | "auto";

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  detectedLanguage: "en" | "hi" | null;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  resetTranscript: () => void;
  setLanguage: (lang: SupportedLanguage) => void;
  currentLanguage: SupportedLanguage;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionType = any;

// Detect Hindi script in text
const detectHindiScript = (text: string): boolean => {
  const hindiPattern = /[\u0900-\u097F]/;
  return hindiPattern.test(text);
};

export const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [detectedLanguage, setDetectedLanguage] = useState<"en" | "hi" | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>("auto");
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  const languageRef = useRef<SupportedLanguage>("auto");

  const initRecognition = useCallback((lang: string) => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognitionAPI) {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (e) {
            // Ignore
          }
        }

        recognitionRef.current = new SpeechRecognitionAPI();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = lang;
        recognitionRef.current.maxAlternatives = 3;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = "";
          let interimTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              finalTranscript += result[0].transcript;
              
              // Detect language from final transcript
              if (detectHindiScript(result[0].transcript)) {
                setDetectedLanguage("hi");
              } else {
                setDetectedLanguage("en");
              }
            } else {
              interimTranscript += result[0].transcript;
            }
          }

          if (finalTranscript) {
            setTranscript((prev) => prev + finalTranscript);
          }
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
          
          if (event.error === "not-allowed") {
            toast({
              title: "माइक्रोफ़ोन एक्सेस अस्वीकृत / Microphone access denied",
              description: "कृपया वॉइस इनपुट का उपयोग करने के लिए माइक्रोफ़ोन अनुमतियाँ सक्षम करें। / Please enable microphone permissions.",
              variant: "destructive",
            });
          } else if (event.error === "no-speech") {
            toast({
              title: "कोई आवाज़ नहीं सुनाई दी / No speech detected",
              description: "कृपया फिर से बोलें। / Please try speaking again.",
            });
          }
        };

        recognitionRef.current.onend = () => {
          // Auto-restart for continuous listening in auto mode
          if (languageRef.current === "auto" && isListening) {
            // Don't restart automatically - let user control this
          }
          setIsListening(false);
        };
      }
    }
  }, [isListening]);

  useEffect(() => {
    // Default to auto mode which supports both languages
    initRecognition("en-US");
  }, []);

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setCurrentLanguage(lang);
    languageRef.current = lang;
    
    let recognitionLang = "en-US";
    if (lang === "hi-IN") {
      recognitionLang = "hi-IN";
    } else if (lang === "auto") {
      // Use multilingual mode - start with English, detect Hindi
      recognitionLang = "en-US";
    }
    
    initRecognition(recognitionLang);
    
  }, [initRecognition]);

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      setTranscript("");
      setDetectedLanguage(null);
      try {
        recognitionRef.current.start();
        setIsListening(true);
        
        toast({
          title: currentLanguage === "hi-IN" ? "🎤 सुन रहा हूं..." : "🎤 Listening...",
          description: currentLanguage === "auto" 
            ? "हिंदी या English में बोलें / Speak in Hindi or English"
            : currentLanguage === "hi-IN"
              ? "हिंदी में बोलें"
              : "Speak in English",
        });
      } catch (error) {
        console.error("Failed to start recognition:", error);
      }
    } else {
      toast({
        title: "Voice input not supported",
        description: "Your browser doesn't support speech recognition.",
        variant: "destructive",
      });
    }
  }, [currentLanguage]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setDetectedLanguage(null);
  }, []);

  return {
    isListening,
    transcript,
    detectedLanguage,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
    setLanguage,
    currentLanguage,
  };
};

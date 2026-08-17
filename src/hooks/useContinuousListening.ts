import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

type SupportedLanguage = "en-US" | "hi-IN" | "auto";

interface UseContinuousListeningReturn {
  isEnabled: boolean;
  isListening: boolean;
  isWakeWordDetected: boolean;
  transcript: string;
  detectedLanguage: "en" | "hi" | null;
  enable: () => void;
  disable: () => void;
  pauseListening: () => void;
  resumeListening: () => void;
  setLanguage: (lang: SupportedLanguage) => void;
  resetTranscript: () => void;
  currentLanguage: SupportedLanguage;
}

const WAKE_WORD = "omnigent";
const WAKE_WORD_VARIANTS = ["omnigent", "omni gent", "omni agent", "omnigent", "omni-gent", "hey omnigent", "okay omnigent", "ओम्नीजेंट", "ओमनी जेंट"];

// Detect Hindi script
const detectHindiScript = (text: string): boolean => {
  const hindiPattern = /[\u0900-\u097F]/;
  return hindiPattern.test(text);
};

export const useContinuousListening = (): UseContinuousListeningReturn => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isWakeWordDetected, setIsWakeWordDetected] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [detectedLanguage, setDetectedLanguage] = useState<"en" | "hi" | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>("auto");
  const [isPaused, setIsPaused] = useState(false);
  
  const recognitionRef = useRef<InstanceType<typeof window.SpeechRecognition> | null>(null);
  const wakeWordTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const langRef = useRef<SupportedLanguage>("auto");

  // Check for wake word in transcript
  const checkWakeWord = useCallback((text: string): boolean => {
    const lower = text.toLowerCase().trim();
    return WAKE_WORD_VARIANTS.some(variant => lower.includes(variant));
  }, []);

  // Extract command after wake word
  const extractCommand = useCallback((text: string): string => {
    const lower = text.toLowerCase();
    for (const variant of WAKE_WORD_VARIANTS) {
      const index = lower.indexOf(variant);
      if (index !== -1) {
        return text.substring(index + variant.length).trim();
      }
    }
    return text;
  }, []);

  // Initialize recognition
  const initRecognition = useCallback(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      console.warn("Speech recognition not supported");
      return null;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    
    // Set language based on preference
    if (langRef.current === "auto") {
      recognition.lang = "en-US";
    } else {
      recognition.lang = langRef.current;
    }

    recognition.onstart = () => {
      console.log("🎤 Continuous listening started");
      setIsListening(true);
    };

    recognition.onend = () => {
      console.log("🎤 Continuous listening ended");
      setIsListening(false);
      
      // Auto-restart if enabled and not paused
      if (isEnabled && !isPaused) {
        restartTimeoutRef.current = setTimeout(() => {
          if (recognitionRef.current && isEnabled && !isPaused) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.log("Recognition restart error:", e);
            }
          }
        }, 100);
      }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const fullText = finalTranscript || interimTranscript;
      
      // Detect language
      if (fullText && langRef.current === "auto") {
        setDetectedLanguage(detectHindiScript(fullText) ? "hi" : "en");
      }

      // Check for wake word in continuous mode
      if (!isWakeWordDetected) {
        if (checkWakeWord(fullText)) {
          console.log("🎯 Wake word detected!");
          setIsWakeWordDetected(true);
          
          // Extract any command said with wake word
          const command = extractCommand(fullText);
          if (command && command.length > 2) {
            setTranscript(command);
          }
          
          toast({
            title: langRef.current === "hi-IN" ? "🎯 OmniGent सक्रिय!" : "🎯 OmniGent Activated!",
            description: langRef.current === "hi-IN" 
              ? "मैं सुन रहा हूं... अपना अनुरोध बोलें" 
              : "I'm listening... speak your request",
          });

          // Set timeout to reset wake word after 15 seconds of silence
          wakeWordTimeoutRef.current = setTimeout(() => {
            if (isWakeWordDetected) {
              setIsWakeWordDetected(false);
              setTranscript("");
              toast({
                title: langRef.current === "hi-IN" ? "सुनना बंद" : "Listening stopped",
                description: langRef.current === "hi-IN" 
                  ? "फिर से सक्रिय करने के लिए 'OmniGent' कहें" 
                  : "Say 'OmniGent' to activate again",
              });
            }
          }, 15000);
        }
      } else {
        // We're in command capture mode
        if (finalTranscript) {
          setTranscript(prev => prev ? `${prev} ${finalTranscript}` : finalTranscript);
          
          // Reset wake word timeout on new speech
          if (wakeWordTimeoutRef.current) {
            clearTimeout(wakeWordTimeoutRef.current);
            wakeWordTimeoutRef.current = setTimeout(() => {
              setIsWakeWordDetected(false);
            }, 15000);
          }
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.log("Recognition error:", event.error);
      
      if (event.error === "no-speech") {
        // Silent, auto-restart handled by onend
      } else if (event.error === "audio-capture") {
        toast({
          title: "Microphone Error",
          description: "Please check your microphone access",
          variant: "destructive",
        });
      }
    };

    return recognition;
  }, [isEnabled, isPaused, isWakeWordDetected, checkWakeWord, extractCommand]);

  // Enable continuous listening
  const enable = useCallback(() => {
    if (isEnabled) return;
    
    const recognition = initRecognition();
    if (!recognition) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in this browser",
        variant: "destructive",
      });
      return;
    }

    recognitionRef.current = recognition;
    setIsEnabled(true);
    setIsPaused(false);
    
    try {
      recognition.start();
      toast({
        title: langRef.current === "hi-IN" ? "🎤 निरंतर सुनना सक्रिय" : "🎤 Continuous Listening Active",
        description: langRef.current === "hi-IN" 
          ? "सक्रिय करने के लिए 'OmniGent' कहें" 
          : "Say 'OmniGent' to activate",
      });
    } catch (e) {
      console.error("Failed to start recognition:", e);
    }
  }, [isEnabled, initRecognition]);

  // Disable continuous listening
  const disable = useCallback(() => {
    if (!isEnabled) return;
    
    setIsEnabled(false);
    setIsWakeWordDetected(false);
    setTranscript("");
    
    if (wakeWordTimeoutRef.current) {
      clearTimeout(wakeWordTimeoutRef.current);
    }
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
    }
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log("Stop error:", e);
      }
      recognitionRef.current = null;
    }
    
    toast({
      title: langRef.current === "hi-IN" ? "🔇 निरंतर सुनना बंद" : "🔇 Continuous Listening Disabled",
    });
  }, [isEnabled]);

  // Pause during execution
  const pauseListening = useCallback(() => {
    if (!isEnabled || isPaused) return;
    
    setIsPaused(true);
    setIsWakeWordDetected(false);
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log("Pause error:", e);
      }
    }
    
    console.log("⏸️ Continuous listening paused");
  }, [isEnabled, isPaused]);

  // Resume after execution
  const resumeListening = useCallback(() => {
    if (!isEnabled || !isPaused) return;
    
    setIsPaused(false);
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        console.log("▶️ Continuous listening resumed");
      } catch (e) {
        // Re-initialize if needed
        const recognition = initRecognition();
        if (recognition) {
          recognitionRef.current = recognition;
          recognition.start();
        }
      }
    }
  }, [isEnabled, isPaused, initRecognition]);

  // Set language
  const setLanguage = useCallback((lang: SupportedLanguage) => {
    langRef.current = lang;
    setCurrentLanguage(lang);
    
    if (lang !== "auto") {
      setDetectedLanguage(lang === "hi-IN" ? "hi" : "en");
    }
    
    // Restart recognition with new language
    if (isEnabled && recognitionRef.current) {
      recognitionRef.current.stop();
      setTimeout(() => {
        const recognition = initRecognition();
        if (recognition) {
          recognitionRef.current = recognition;
          if (!isPaused) {
            recognition.start();
          }
        }
      }, 100);
    }
  }, [isEnabled, isPaused, initRecognition]);

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setTranscript("");
    setIsWakeWordDetected(false);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (wakeWordTimeoutRef.current) {
        clearTimeout(wakeWordTimeoutRef.current);
      }
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return {
    isEnabled,
    isListening,
    isWakeWordDetected,
    transcript,
    detectedLanguage,
    enable,
    disable,
    pauseListening,
    resumeListening,
    setLanguage,
    resetTranscript,
    currentLanguage,
  };
};

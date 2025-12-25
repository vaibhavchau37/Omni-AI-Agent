import { useState, useCallback, useRef, useEffect } from "react";

type SupportedLanguage = "en" | "hi" | "auto";

interface UseTextToSpeechReturn {
  speak: (text: string, language?: SupportedLanguage) => void;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  setPreferredLanguage: (lang: SupportedLanguage) => void;
  preferredLanguage: SupportedLanguage;
  availableVoices: { en: SpeechSynthesisVoice[]; hi: SpeechSynthesisVoice[] };
}

// Detect if text contains Hindi script
const detectHindiScript = (text: string): boolean => {
  const hindiPattern = /[\u0900-\u097F]/;
  return hindiPattern.test(text);
};

// Detect language from text content
const detectLanguage = (text: string): "en" | "hi" => {
  // Check for Hindi script
  if (detectHindiScript(text)) {
    return "hi";
  }
  
  // Check for common Hindi words written in English
  const hindiWords = ["namaste", "dhanyavad", "kripya", "mujhe", "main", "hai", "hain", "aap", "kya", "kaise", "acha", "theek"];
  const lowerText = text.toLowerCase();
  const hindiWordCount = hindiWords.filter(word => lowerText.includes(word)).length;
  
  if (hindiWordCount >= 2) {
    return "hi";
  }
  
  return "en";
};

export const useTextToSpeech = (): UseTextToSpeechReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [preferredLanguage, setPreferredLanguage] = useState<SupportedLanguage>("auto");
  const [availableVoices, setAvailableVoices] = useState<{ en: SpeechSynthesisVoice[]; hi: SpeechSynthesisVoice[] }>({ en: [], hi: [] });
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  // Load available voices
  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      
      const englishVoices = voices.filter(v => v.lang.startsWith("en"));
      const hindiVoices = voices.filter(v => v.lang.startsWith("hi"));
      
      setAvailableVoices({
        en: englishVoices,
        hi: hindiVoices.length > 0 ? hindiVoices : englishVoices // Fallback to English if no Hindi
      });
      
      console.log("Available voices - English:", englishVoices.length, "Hindi:", hindiVoices.length);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, [isSupported]);

  const cleanTextForSpeech = (text: string): string => {
    return text
      // Remove markdown formatting
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/#{1,6}\s/g, "")
      .replace(/`{1,3}[^`]*`{1,3}/g, "")
      // Remove horizontal rules
      .replace(/^---+$/gm, "")
      // Remove bullet points and list markers
      .replace(/^[•\-\*]\s*/gm, "")
      .replace(/^\d+\.\s*/gm, "")
      // Keep emojis for context but they won't be spoken
      // Clean up extra whitespace
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  };

  const speak = useCallback((text: string, language?: SupportedLanguage) => {
    if (!isSupported) return;

    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    const cleanedText = cleanTextForSpeech(text);
    
    // Determine language
    let targetLang: "en" | "hi";
    if (language && language !== "auto") {
      targetLang = language;
    } else if (preferredLanguage !== "auto") {
      targetLang = preferredLanguage;
    } else {
      targetLang = detectLanguage(cleanedText);
    }

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    
    // Configure for natural speech
    utterance.rate = targetLang === "hi" ? 0.9 : 1.0; // Slightly slower for Hindi
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Select appropriate voice
    const voices = targetLang === "hi" ? availableVoices.hi : availableVoices.en;
    
    if (targetLang === "hi" && voices.length > 0) {
      // Prefer Google Hindi voice if available
      const googleHindi = voices.find(v => v.name.includes("Google") && v.lang.includes("hi"));
      const anyHindi = voices.find(v => v.lang.includes("hi"));
      utterance.voice = googleHindi || anyHindi || voices[0];
      utterance.lang = "hi-IN";
    } else {
      // English voice selection
      const preferredVoice = voices.find(
        (v) => v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha")
      ) || voices.find((v) => v.lang.startsWith("en")) || voices[0];
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      utterance.lang = "en-US";
    }

    console.log(`Speaking in ${targetLang} with voice:`, utterance.voice?.name);

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
      console.error("Speech synthesis error:", e);
      setIsSpeaking(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported, preferredLanguage, availableVoices]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  return {
    speak,
    stop,
    isSpeaking,
    isSupported,
    setPreferredLanguage,
    preferredLanguage,
    availableVoices,
  };
};

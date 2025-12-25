import { useState, useEffect, useCallback } from "react";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatInput } from "@/components/chat/ChatInput";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { toast } from "@/hooks/use-toast";
import { searchKnowledgeBase } from "@/lib/knowledgeBase";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  intent?: string;
}

// Intent Classification
type IntentType = 
  | "General Question"
  | "Information Request"
  | "Task Execution"
  | "Appointment / Scheduling"
  | "Support / Help"
  | "Unknown Intent";

const classifyIntent = (message: string): IntentType => {
  const lowerMessage = message.toLowerCase();
  
  if (
    lowerMessage.includes("schedule") ||
    lowerMessage.includes("appointment") ||
    lowerMessage.includes("book") ||
    lowerMessage.includes("meeting") ||
    lowerMessage.includes("calendar") ||
    lowerMessage.includes("remind")
  ) {
    return "Appointment / Scheduling";
  }
  
  if (
    lowerMessage.includes("create") ||
    lowerMessage.includes("execute") ||
    lowerMessage.includes("run") ||
    lowerMessage.includes("do ") ||
    lowerMessage.includes("make") ||
    lowerMessage.includes("generate") ||
    lowerMessage.includes("send") ||
    lowerMessage.includes("update") ||
    lowerMessage.includes("build") ||
    lowerMessage.includes("set up")
  ) {
    return "Task Execution";
  }
  
  if (
    lowerMessage.includes("help") ||
    lowerMessage.includes("support") ||
    lowerMessage.includes("issue") ||
    lowerMessage.includes("problem") ||
    lowerMessage.includes("trouble") ||
    lowerMessage.includes("fix") ||
    lowerMessage.includes("error")
  ) {
    return "Support / Help";
  }
  
  if (
    lowerMessage.includes("find") ||
    lowerMessage.includes("search") ||
    lowerMessage.includes("look up") ||
    lowerMessage.includes("get me") ||
    lowerMessage.includes("show me") ||
    lowerMessage.includes("list") ||
    lowerMessage.includes("tell me about")
  ) {
    return "Information Request";
  }
  
  if (
    lowerMessage.includes("what") ||
    lowerMessage.includes("how") ||
    lowerMessage.includes("why") ||
    lowerMessage.includes("when") ||
    lowerMessage.includes("where") ||
    lowerMessage.includes("who") ||
    lowerMessage.includes("can you") ||
    lowerMessage.includes("?")
  ) {
    return "General Question";
  }
  
  return "Unknown Intent";
};

// Voice mode generates shorter, conversational responses
const generateVoiceResponse = (intent: IntentType, userMessage: string): string => {
  const lowerMessage = userMessage.toLowerCase();
  
  if (intent === "Task Execution") {
    return "Got it! Let me break that down for you.\n\nFirst, I need to understand exactly what you're looking for.\n\nCan you tell me what the end goal is?\n\nOnce I know that, I'll walk you through each step.";
  }
  
  if (intent === "Appointment / Scheduling") {
    return "Sure, I can help you schedule that.\n\nWhat date works best for you?\n\nAnd do you have a preferred time?";
  }
  
  if (intent === "Support / Help") {
    return "I'm here to help.\n\nCan you tell me a bit more about what's going on?\n\nI'll do my best to find a solution for you.";
  }
  
  if (intent === "Information Request") {
    const knowledge = searchKnowledgeBase(userMessage);
    if (knowledge) {
      return `Here's what I found about ${knowledge.topic}.\n\n${knowledge.content}\n\nWant me to explain anything in more detail?`;
    }
    return "I don't have that information in my knowledge base.\n\nCould you try asking about something else?\n\nOr give me more details about what you need.";
  }
  
  if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey")) {
    return "Hey there! I'm OmniAgent.\n\nHow can I help you today?";
  }
  
  if (lowerMessage.includes("thank")) {
    return "You're welcome!\n\nIs there anything else you need?";
  }
  
  if (lowerMessage.includes("bye") || lowerMessage.includes("goodbye")) {
    return "Take care! Feel free to come back anytime.\n\nHave a great day!";
  }
  
  return "I hear you.\n\nCould you give me a bit more context?\n\nThat way I can help you better.";
};

// Text mode generates detailed, structured responses
const generateTextResponse = (intent: IntentType, userMessage: string, hasGreeted: boolean): string => {
  const lowerMessage = userMessage.toLowerCase();
  const knowledge = searchKnowledgeBase(userMessage);
  
  if (knowledge) {
    let response = `📚 **${knowledge.topic}**\n\n${knowledge.content}`;
    if (knowledge.followUpQuestions?.[0]) {
      response += `\n\n${knowledge.followUpQuestions[0]}`;
    }
    response += "\n\n---\nIs there anything else I can help you with?";
    return response;
  }
  
  if (intent === "Task Execution") {
    return `I'd be happy to help you with that task.

**Here's how we'll approach this:**

**Step 1: Understanding Requirements**
First, let me confirm exactly what you need done.

**Step 2: Gather Details**
Please provide:
• What is the specific task?
• What's the expected outcome?
• Any deadlines or constraints?

**Step 3: Execution Plan**
Once I have the details, I'll break it into actionable steps.

**Step 4: Confirmation**
I'll confirm completion and verify everything is correct.

---
What specific task would you like me to help with?`;
  }
  
  if (intent === "Appointment / Scheduling") {
    return `I can help you schedule that.

**To set up your appointment, I need:**
• Preferred date
• Preferred time
• Duration needed
• Any specific requirements

**Next steps:**
1. You provide the details
2. I'll check availability
3. Confirm the booking
4. Send you a reminder

---
What date and time work best for you?`;
  }
  
  if (intent === "Support / Help") {
    return `I'm here to help resolve your issue.

**Please describe:**
• What problem are you experiencing?
• When did this start?
• Any error messages?
• What have you tried so far?

I'll search our knowledge base and provide step-by-step guidance.

---
What issue can I help you with?`;
  }
  
  if (intent === "Information Request") {
    return `I searched my knowledge base but couldn't find specific information about that topic.

**I can only provide verified information.**

**Try asking about:**
• Pricing and plans
• Business hours
• Contact information
• Product features
• Account help

---
Is there something else I can help you find?`;
  }
  
  // General Question handling
  if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey")) {
    return `Hello! Welcome to OmniAgent.

I'm your intelligent AI assistant, here to help you with:
• Answering questions
• Executing tasks
• Scheduling appointments
• Providing support

**How can I assist you today?**`;
  }
  
  if (lowerMessage.includes("thank")) {
    return `You're very welcome! I'm glad I could help.

---
Is there anything else I can assist you with?`;
  }
  
  if (lowerMessage.includes("bye") || lowerMessage.includes("goodbye")) {
    return `Thank you for chatting with OmniAgent!

It was my pleasure to assist you. Have a wonderful day, and don't hesitate to reach out if you need help again!`;
  }
  
  return `I've received your message but need a bit more context to assist you properly.

**Could you:**
• Rephrase your question?
• Provide more specific details?
• Let me know what you're trying to accomplish?

---
I'm here to help!`;
};

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  
  const { isListening, transcript, toggleListening, resetTranscript } = useSpeechRecognition();
  const { speak, stop, isSpeaking } = useTextToSpeech();

  // Handle voice transcript
  useEffect(() => {
    if (!isListening && transcript) {
      setIsVoiceMode(true); // User used voice, so respond in voice mode
      handleSendMessage(transcript);
      resetTranscript();
    }
  }, [isListening, transcript]);

  // Sync speaking state
  useEffect(() => {
    if (!isSpeaking) {
      setSpeakingMessageId(null);
    }
  }, [isSpeaking]);

  const addAssistantMessage = useCallback((content: string, intent?: IntentType): string => {
    const id = Date.now().toString();
    const message: Message = {
      id,
      role: "assistant",
      content,
      intent,
    };
    setMessages((prev) => [...prev, message]);
    return id;
  }, []);

  const handleSpeak = useCallback((content: string) => {
    const message = messages.find(m => m.content === content);
    if (message) {
      if (speakingMessageId === message.id) {
        stop();
        setSpeakingMessageId(null);
      } else {
        stop();
        setSpeakingMessageId(message.id);
        speak(content);
      }
    }
  }, [messages, speakingMessageId, speak, stop]);

  const processConversationFlow = async (userMessage: string) => {
    const intent = classifyIntent(userMessage);
    
    // Greeting on first interaction
    if (!hasGreeted) {
      await new Promise((r) => setTimeout(r, 400));
      const greetingText = isVoiceMode 
        ? "Hi there! I'm OmniAgent. How can I help you?"
        : "Hello! 👋 Welcome to OmniAgent. I'm here to assist you today.";
      
      const greetingId = addAssistantMessage(greetingText);
      setHasGreeted(true);
      
      if (isVoiceMode) {
        setSpeakingMessageId(greetingId);
        speak(greetingText);
      }
      
      await new Promise((r) => setTimeout(r, 600));
    }

    // Generate response based on mode
    await new Promise((r) => setTimeout(r, isVoiceMode ? 400 : 600));
    
    const response = isVoiceMode 
      ? generateVoiceResponse(intent, userMessage)
      : generateTextResponse(intent, userMessage, hasGreeted);
    
    const messageId = addAssistantMessage(response, intent);
    
    // Auto-speak in voice mode
    if (isVoiceMode) {
      setSpeakingMessageId(messageId);
      speak(response);
    }
  };

  const handleSendMessage = async (content: string) => {
    // Text input = text mode
    if (!isVoiceMode) {
      setIsVoiceMode(false);
    }
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    await processConversationFlow(content);

    setIsTyping(false);
    setIsVoiceMode(false); // Reset after response
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      toggleListening();
      toast({
        title: "Processing your voice",
        description: "I'll respond in a moment...",
      });
    } else {
      stop(); // Stop any ongoing speech
      setSpeakingMessageId(null);
      toggleListening();
      toast({
        title: "Listening...",
        description: "Speak naturally. I'll respond conversationally.",
      });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <ChatHeader />
      <ChatContainer 
        messages={messages} 
        isTyping={isTyping}
        onSpeak={handleSpeak}
        speakingMessageId={speakingMessageId}
      />
      <div className="border-t border-border/50 p-4 pb-6">
        <div className="max-w-4xl mx-auto">
          <ChatInput
            onSend={handleSendMessage}
            isListening={isListening}
            onVoiceToggle={handleVoiceToggle}
            disabled={isTyping}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;

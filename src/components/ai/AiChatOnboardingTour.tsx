"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Volume2, VolumeX, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";

interface TourStep {
  id: number;
  title: string;
  content: string;
  targetId: string;
  position: "top" | "bottom" | "left" | "right";
}

interface AiChatOnboardingTourProps {
  userName: string;
  onComplete: () => void;
  onSkip: () => void;
}

export default function AiChatOnboardingTour({
  userName,
  onComplete,
  onSkip,
}: AiChatOnboardingTourProps) {
  const t = useTranslations("AiChatOnboarding");
  const locale = useLocale();
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [enableVoice, setEnableVoice] = useState(true);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load voices when component mounts
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  const tourSteps: TourStep[] = [
    {
      id: 1,
      title: t("step1.title"),
      content: t("step1.content", { userName }),
      targetId: "ai-chat-welcome",
      position: "left",
    },
    {
      id: 2,
      title: t("step2.title"),
      content: t("step2.content"),
      targetId: "ai-mode-selector",
      position: "right",
    },
    {
      id: 3,
      title: t("step3.title"),
      content: t("step3.content"),
      targetId: "ai-chat-input",
      position: "top",
    },
    {
      id: 4,
      title: t("step4.title"),
      content: t("step4.content"),
      targetId: "ai-preset-prompts",
      position: "top",
    },
    {
      id: 5,
      title: t("step5.title"),
      content: t("step5.content"),
      targetId: "ai-session-list",
      position: "right",
    },
    {
      id: 6,
      title: t("step6.title"),
      content: t("step6.content"),
      targetId: "ai-new-chat-button",
      position: "right",
    },
  ];

  const currentTourStep = tourSteps[currentStep];

  // Text-to-Speech
  const speak = useCallback((text: string) => {
    if (!enableVoice) return;

    // Stop current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set language based on locale
    const langMap: Record<string, string> = {
      vi: "vi-VN",
      en: "en-US",
      ja: "ja-JP",
    };
    utterance.lang = langMap[locale] || "vi-VN";
    utterance.rate = 0.9;
    utterance.pitch = 1.5;
    utterance.volume = 1.0;

    // Try to select a female voice
    const voices = window.speechSynthesis.getVoices();
    const langPrefix = utterance.lang.split("-")[0];
    
    let selectedVoice;
    
    if (locale === "vi") {
      selectedVoice = voices.find(
        (voice) =>
          voice.lang.startsWith("vi") &&
          (voice.name.toLowerCase().includes("female") ||
            voice.name.toLowerCase().includes("nữ") ||
            voice.name.toLowerCase().includes("linh") ||
            voice.name.toLowerCase().includes("chi"))
      );
      
      if (!selectedVoice) {
        selectedVoice = voices.find(
          (voice) =>
            voice.lang.startsWith("vi") &&
            voice.name.toLowerCase().includes("google")
        );
      }
      
      if (!selectedVoice) {
        selectedVoice = voices.find((voice) => voice.lang.startsWith("vi"));
      }
    } else if (locale === "en") {
      selectedVoice = voices.find(
        (voice) =>
          voice.lang.startsWith("en") &&
          (voice.name.toLowerCase().includes("female") ||
            voice.name.toLowerCase().includes("samantha") ||
            voice.name.toLowerCase().includes("karen") ||
            voice.name.toLowerCase().includes("victoria") ||
            voice.name.toLowerCase().includes("zira"))
      );
      
      if (!selectedVoice) {
        selectedVoice = voices.find(
          (voice) =>
            voice.lang.startsWith("en-US") ||
            voice.lang.startsWith("en-GB")
        );
      }
    } else if (locale === "ja") {
      selectedVoice = voices.find(
        (voice) =>
          voice.lang.startsWith("ja") &&
          (voice.name.toLowerCase().includes("female") ||
            voice.name.toLowerCase().includes("kyoko") ||
            voice.name.toLowerCase().includes("haruka") ||
            voice.name.toLowerCase().includes("misaki"))
      );
      
      if (!selectedVoice) {
        selectedVoice = voices.find((voice) => voice.lang.startsWith("ja"));
      }
    }
    
    if (!selectedVoice) {
      selectedVoice = voices.find((voice) => 
        voice.lang.startsWith(langPrefix)
      );
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    speechSynthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [enableVoice, locale]);

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  useEffect(() => {
    if (enableVoice && currentTourStep) {
      speak(currentTourStep.content);
    }

    // Scroll to target element
    const target = document.getElementById(currentTourStep.targetId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    return () => {
      stopSpeech();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, enableVoice, speak]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    stopSpeech();
    onSkip();
  };

  const getTargetRect = () => {
    const target = document.getElementById(currentTourStep.targetId);
    if (!target) return null;
    return target.getBoundingClientRect();
  };

  const getTooltipPosition = () => {
    const rect = getTargetRect();
    if (!rect) return {};

    const position = currentTourStep.position;

    switch (position) {
      case "top":
        return {
          top: rect.top - 20,
          left: rect.left + rect.width / 2,
          transform: "translate(-50%, -100%)",
        };
      case "bottom":
        return {
          top: rect.bottom + 20,
          left: rect.left + rect.width / 2,
          transform: "translate(-50%, 0)",
        };
      case "left":
        return {
          top: rect.top + rect.height / 2,
          left: rect.left - 20,
          transform: "translate(-100%, -50%)",
        };
      case "right":
        return {
          top: rect.top + rect.height / 2,
          left: rect.right + 20,
          transform: "translate(0, -50%)",
        };
      default:
        return {};
    }
  };

  const getHighlightStyle = () => {
    const rect = getTargetRect();
    if (!rect) return {};

    return {
      top: rect.top - 8,
      left: rect.left - 8,
      width: rect.width + 16,
      height: rect.height + 16,
      borderRadius: "8px",
    };
  };

  return (
    <>
      {/* Overlay with cut-out for highlighted element */}
      <div 
        className="fixed inset-0 z-[100] cursor-pointer"
        onClick={handleSkip}
      >
        <svg width="100%" height="100%" className="absolute inset-0">
          <defs>
            <mask id="spotlight-mask-ai">
              <rect width="100%" height="100%" fill="white" />
              {getTargetRect() && (
                <rect
                  x={getTargetRect()!.left - 8}
                  y={getTargetRect()!.top - 8}
                  width={getTargetRect()!.width + 16}
                  height={getTargetRect()!.height + 16}
                  rx="8"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.75)"
            mask="url(#spotlight-mask-ai)"
          />
        </svg>
      </div>

      {/* Highlight border with glow effect */}
      {getTargetRect() && (
        <div
          className="fixed z-[101] pointer-events-none border-4 border-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.8)] animate-pulse"
          style={getHighlightStyle()}
        />
      )}

      {/* Tour Card */}
      <Card
        className="fixed z-[102] w-96 p-6 shadow-2xl"
        style={getTooltipPosition()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold">
                <Image
                src="/ai/TechHub_Logo.png"
                alt="Student learning"
                width={80}
                height={80}
                className="object-cover rounded-full"
                priority
                />
              </div>
              <div>
                <h3 className="font-bold text-lg">{currentTourStep.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {t("stepOf", { current: currentStep + 1, total: tourSteps.length })}
                </p>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleSkip}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-sm mb-4 leading-relaxed">{currentTourStep.content}</p>

        {/* Voice Control */}
        <div className="flex items-center gap-2 mb-4 p-3 bg-muted rounded-lg">
          <Checkbox
            id="enable-voice-ai"
            checked={enableVoice}
            onCheckedChange={(checked) => {
              setEnableVoice(checked as boolean);
              if (!checked) {
                stopSpeech();
              } else {
                speak(currentTourStep.content);
              }
            }}
          />
          <label
            htmlFor="enable-voice-ai"
            className="text-sm font-medium cursor-pointer flex-1"
          >
            {t("enableVoice")}
          </label>
          {enableVoice && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (isPlaying ? stopSpeech() : speak(currentTourStep.content))}
            >
              {isPlaying ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            {t("previous")}
          </Button>

          <div className="flex gap-1">
            {tourSteps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full ${
                  index === currentStep ? "bg-pink-500" : "bg-muted"
                }`}
              />
            ))}
          </div>

          <Button
            size="sm"
            onClick={handleNext}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
          >
            {currentStep === tourSteps.length - 1 ? t("finish") : t("next")}
          </Button>
        </div>
      </Card>
    </>
  );
}

// Export a button component to trigger the tour
export function AiChatTourButton({ onClick }: { onClick: () => void }) {
  const t = useTranslations("AiChatOnboarding");
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="text-pink-500 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20"
    >
      <HelpCircle className="h-4 w-4 mr-1" />
      {t("tourButton")}
    </Button>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { X, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslations, useLocale } from "next-intl";

interface TourStep {
  id: number;
  title: string;
  content: string;
  targetId: string;
  position: "top" | "bottom" | "left" | "right";
}

interface CourseOnboardingTourProps {
  userName: string;
  onComplete: () => void;
  onSkip: () => void;
}

export default function CourseOnboardingTour({
  userName,
  onComplete,
  onSkip,
}: CourseOnboardingTourProps) {
  const t = useTranslations("CourseOnboarding");
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
      content: t("step1.content"),
      targetId: "learning-content-area",
      position: "right",
    },
    {
      id: 2,
      title: t("step2.title"),
      content: t("step2.content", { userName }),
      targetId: "video-player-area",
      position: "bottom",
    },
    {
      id: 3,
      title: t("step3.title"),
      content: t("step3.content"),
      targetId: "lesson-sidebar",
      position: "left",
    },
    {
      id: 4,
      title: t("step4.title"),
      content: t("step4.content"),
      targetId: "first-lesson",
      position: "left",
    },
    {
      id: 5,
      title: t("step5.title"),
      content: t("step5.content"),
      targetId: "second-lesson-locked",
      position: "left",
    },
    {
      id: 6,
      title: t("step6.title"),
      content: t("step6.content"),
      targetId: "add-note-button",
      position: "bottom",
    },
    {
      id: 7,
      title: t("step7.title"),
      content: t("step7.content"),
      targetId: "qa-button",
      position: "top",
    },
  ];

  const currentTourStep = tourSteps[currentStep];

  // Text-to-Speech
  const speak = (text: string) => {
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
    utterance.pitch = 1.5; // Much higher pitch for female voice
    utterance.volume = 1.0;

    // Try to select a female voice - multiple strategies based on locale
    const voices = window.speechSynthesis.getVoices();
    
    // Get language prefix for matching
    const langPrefix = utterance.lang.split("-")[0]; // vi, en, ja
    
    let selectedVoice;
    
    if (locale === "vi") {
      // Vietnamese voice selection
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
      // English voice selection - prefer natural female voices
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
      // Japanese voice selection - prefer female voices
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
    
    // Fallback: any voice matching the language
    if (!selectedVoice) {
      selectedVoice = voices.find((voice) => 
        voice.lang.startsWith(langPrefix)
      );
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log("Selected voice:", selectedVoice.name, selectedVoice.lang);
    } else {
      console.log("No suitable voice found, using default");
    }

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    speechSynthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

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
  }, [currentStep, enableVoice]);

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
      <div className="fixed inset-0 z-40 pointer-events-none">
        <svg width="100%" height="100%" className="absolute inset-0">
          <defs>
            <mask id="spotlight-mask">
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
            mask="url(#spotlight-mask)"
          />
        </svg>
      </div>

      {/* Highlight border with glow effect */}
      {getTargetRect() && (
        <div
          className="fixed z-50 pointer-events-none border-4 border-white shadow-[0_0_20px_rgba(255,255,255,0.8)] animate-pulse"
          style={getHighlightStyle()}
        />
      )}

      {/* Tour Card */}
      <Card
        className="fixed z-50 w-96 p-6 shadow-2xl"
        style={getTooltipPosition()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold">
                M
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
            id="enable-voice"
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
            htmlFor="enable-voice"
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
                  index === currentStep ? "bg-primary" : "bg-muted"
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

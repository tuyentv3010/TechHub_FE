"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type CSSProperties,
} from "react";
import { X, Volume2, VolumeX, HelpCircle } from "lucide-react";
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

interface AiChatOnboardingTourProps {
  userName: string;
  onComplete: () => void;
  onSkip: () => void;
}

type TargetRect = {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

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
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [cardSize, setCardSize] = useState({ width: 384, height: 320 });
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const tourCardRef = useRef<HTMLDivElement | null>(null);

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
      title: t("step5.title"),
      content: t("step5.content"),
      targetId: "ai-session-list",
      position: "right",
    },
    {
      id: 5,
      title: t("step6.title"),
      content: t("step6.content"),
      targetId: "ai-new-chat-button",
      position: "right",
    },
  ];

  const currentTourStep = tourSteps[currentStep];
  const currentTourTargetId = currentTourStep.targetId;
  const currentTourContent = currentTourStep.content;
  const currentTourPosition = currentTourStep.position;

  const updateTargetRect = useCallback(() => {
    const target = document.getElementById(currentTourTargetId);
    if (!target) {
      setTargetRect(null);
      return;
    }

    const rect = target.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      setTargetRect(null);
      return;
    }

    setTargetRect({
      top: rect.top,
      left: rect.left,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
    });
  }, [currentTourTargetId]);

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
    if (enableVoice && currentTourContent) {
      speak(currentTourContent);
    }

    const target = document.getElementById(currentTourTargetId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    }

    const animationFrame = window.requestAnimationFrame(updateTargetRect);
    const delayedUpdate = window.setTimeout(updateTargetRect, 280);
    window.addEventListener("resize", updateTargetRect);
    window.addEventListener("scroll", updateTargetRect, true);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(delayedUpdate);
      window.removeEventListener("resize", updateTargetRect);
      window.removeEventListener("scroll", updateTargetRect, true);
      stopSpeech();
    };
  }, [
    currentStep,
    currentTourContent,
    currentTourTargetId,
    enableVoice,
    speak,
    updateTargetRect,
  ]);

  useEffect(() => {
    const updateCardSize = () => {
      const node = tourCardRef.current;
      if (!node) return;

      const rect = node.getBoundingClientRect();
      setCardSize({
        width: rect.width || 384,
        height: rect.height || 320,
      });
    };

    updateCardSize();

    if (typeof ResizeObserver === "undefined" || !tourCardRef.current) {
      return;
    }

    const observer = new ResizeObserver(updateCardSize);
    observer.observe(tourCardRef.current);

    return () => observer.disconnect();
  }, [currentStep, currentTourContent]);

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

  const clamp = (value: number, min: number, max: number) => {
    if (max < min) return min;
    return Math.min(Math.max(value, min), max);
  };

  const getTooltipPosition = (): CSSProperties => {
    const margin = 16;
    const gap = 18;
    const viewportWidth = typeof window === "undefined" ? 1280 : window.innerWidth;
    const viewportHeight = typeof window === "undefined" ? 800 : window.innerHeight;
    const maxHeight = `calc(100vh - ${margin * 2}px)`;

    if (viewportWidth < 768) {
      return {
        bottom: margin,
        left: margin,
        right: margin,
        width: "auto",
        maxHeight,
        overflowY: "auto",
      };
    }

    const width = Math.min(cardSize.width || 384, viewportWidth - margin * 2);
    const height = Math.min(cardSize.height || 320, viewportHeight - margin * 2);

    if (!targetRect) {
      return {
        top: "50%",
        left: `calc(50% - ${width / 2}px)`,
        width,
        maxHeight,
        overflowY: "auto",
        transform: "translateY(-50%)",
      };
    }

    let top = targetRect.top + targetRect.height / 2 - height / 2;
    let left = targetRect.left + targetRect.width / 2 - width / 2;
    const position = currentTourPosition;

    switch (position) {
      case "top":
        top = targetRect.top - gap - height;
        left = targetRect.left + targetRect.width / 2 - width / 2;
        if (top < margin) top = targetRect.bottom + gap;
        break;
      case "bottom":
        top = targetRect.bottom + gap;
        left = targetRect.left + targetRect.width / 2 - width / 2;
        if (top + height > viewportHeight - margin) top = targetRect.top - gap - height;
        break;
      case "left":
        top = targetRect.top + targetRect.height / 2 - height / 2;
        left = targetRect.left - gap - width;
        if (left < margin) left = targetRect.right + gap;
        break;
      case "right":
        top = targetRect.top + targetRect.height / 2 - height / 2;
        left = targetRect.right + gap;
        if (left + width > viewportWidth - margin) left = targetRect.left - gap - width;
        break;
      default:
        break;
    }

    return {
      top: clamp(top, margin, viewportHeight - height - margin),
      left: clamp(left, margin, viewportWidth - width - margin),
      width,
      maxHeight,
      overflowY: "auto",
    };
  };

  const getHighlightStyle = () => {
    if (!targetRect) return {};

    return {
      top: targetRect.top - 8,
      left: targetRect.left - 8,
      width: targetRect.width + 16,
      height: targetRect.height + 16,
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
              {targetRect && (
                <rect
                  x={targetRect.left - 8}
                  y={targetRect.top - 8}
                  width={targetRect.width + 16}
                  height={targetRect.height + 16}
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
      {targetRect && (
        <div
          className="fixed z-[101] pointer-events-none border-2 border-primary"
          style={getHighlightStyle()}
        />
      )}

      {/* Tour Card */}
      <Card
        ref={tourCardRef}
        className="ai-chat-theme font-ui fixed z-[102] w-[min(24rem,calc(100vw-2rem))] rounded-lg border border-border bg-card p-5 shadow-lg"
        style={getTooltipPosition()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/ai/TechHub_Logo.png"
                alt="AI Chat Assistant"
                width={32}
                height={32}
                className="h-8 w-8 flex-shrink-0 rounded-xl border border-border bg-card object-cover shadow-sm"
              />
              <div>
                <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  {t("stepOf", { current: currentStep + 1, total: tourSteps.length })}
                </div>
                <h3 className="mt-0.5 text-[20px] font-semibold leading-[1.2] text-foreground">{currentTourStep.title}</h3>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={handleSkip}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <p className="mb-5 max-w-[56ch] text-sm leading-6 text-foreground">{currentTourStep.content}</p>

        {/* Voice Control */}
        <div className="mb-5 flex items-center gap-2 border-y border-border py-2.5">
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
            className="flex-1 cursor-pointer text-xs text-muted-foreground"
          >
            {t("enableVoice")}
          </label>
          {enableVoice && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
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
            variant="ghost"
            size="sm"
            className="h-8 rounded-lg border border-border px-2.5 text-xs text-muted-foreground hover:border-primary/40 hover:bg-muted hover:text-foreground disabled:opacity-40"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            {t("previous")}
          </Button>

          <div className="flex gap-1.5">
            {tourSteps.map((_, index) => (
              <div
                key={index}
                className={`h-1 w-6 rounded-sm transition-colors ${
                  index === currentStep ? "bg-primary" : index < currentStep ? "bg-muted-foreground" : "bg-border"
                }`}
              />
            ))}
          </div>

          <Button
            size="sm"
            className="h-8 rounded-lg bg-primary px-3 text-xs text-primary-foreground hover:bg-primary/90"
            onClick={handleNext}
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
      className="rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      <HelpCircle className="h-4 w-4 mr-1" />
      {t("tourButton")}
    </Button>
  );
}

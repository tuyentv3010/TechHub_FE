"use client";

import { useState, useEffect, useRef } from "react";
import { X, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

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
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [enableVoice, setEnableVoice] = useState(false);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  const tourSteps: TourStep[] = [
    {
      id: 1,
      title: "Chào cậu! 👋",
      content: `Chào cậu! Mình là Miu - hướng dẫn viên tại F8, mình sẽ đưa cậu đi thăm quan và giới thiệu cho cậu hiểu rõ hơn về F8 nhé. Đi thôi!`,
      targetId: "learning-content-area",
      position: "right",
    },
    {
      id: 2,
      title: "Khu vực học tập 📺",
      content: `Đây là khu vực trung tâm của màn hình này, toàn bộ nội dung các bài học như là video, hình ảnh, văn bản sẽ được hiển thị ở đây ${userName} nhé ^^`,
      targetId: "video-player-area",
      position: "bottom",
    },
    {
      id: 3,
      title: "Danh sách bài học 📚",
      content: `Tiếp theo là khu vực quan trọng không kém, đây là danh sách các bài học tại khóa này. Cậu sẽ rất thường xuyên tương tác tại đây để chuyển bài học và làm bài tập đấy >_<`,
      targetId: "lesson-sidebar",
      position: "left",
    },
    {
      id: 4,
      title: "Bài học đầu tiên ✅",
      content: `Đây là bài học đầu tiên dành cho cậu, khi học xong bài học này Miu sẽ đánh "Tích xanh" bên cạnh để đánh dấu cậu đã hoàn thành bài học nhé!`,
      targetId: "first-lesson",
      position: "left",
    },
    {
      id: 5,
      title: "Bài học bị khóa 🔒",
      content: `Đây là bài học số 2, theo mặc định các bài học tại F8 đều bị khóa. Khi cậu hoàn thành bài học phía trước thì bài sau sẽ tự động được mở. Mà lúc học cậu đừng có tua video, vì sẽ không được tính là hoàn thành bài học đâu đấy nhé ^^`,
      targetId: "second-lesson-locked",
      position: "left",
    },
    {
      id: 6,
      title: "Ghi chú & Thảo luận 📝",
      content: `Tại F8 có một chức năng rất đặc biệt, đó là chức năng "Tạo ghi chú". Khi học sẽ có nhiều lúc cậu muốn ghi chép lại đó, tại F8 cậu sẽ không cần tốn giấy mực để làm việc này đâu. Thả tim nào <3`,
      targetId: "notes-discussion-area",
      position: "top",
    },
    {
      id: 7,
      title: "Khu vực hỏi đáp 💬",
      content: `Và đây là khu vực dành cho việc hỏi đáp, trao đổi trong mỗi bài học. Nếu có bài học nào hay thì cậu bình luận một lời động viên vào đây cũng được nhé. Miu sẽ rất vui và cảm thấy biết ơn đấy <3`,
      targetId: "notes-discussion-area",
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
    utterance.lang = "vi-VN";
    utterance.rate = 1.0;
    utterance.pitch = 1.2;
    utterance.volume = 1.0;

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

  const getTooltipPosition = () => {
    const target = document.getElementById(currentTourStep.targetId);
    if (!target) return {};

    const rect = target.getBoundingClientRect();
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

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 z-40" />

      {/* Highlight target */}
      <div
        className="fixed z-50 pointer-events-none"
        style={{
          boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.6)",
        }}
      />

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
                  Bước {currentStep + 1}/{tourSteps.length}
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
            Nghe giọng Miu &gt;_&lt;
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
            Quay lại
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
            {currentStep === tourSteps.length - 1 ? "Đi tiếp" : "Bắt đầu"}
          </Button>
        </div>
      </Card>
    </>
  );
}

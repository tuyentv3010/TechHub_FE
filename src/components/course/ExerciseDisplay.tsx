"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, HelpCircle, Code } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import ExerciseLeaderboard from "./ExerciseLeaderboard";

interface Choice {
  text: string;
  isCorrect: boolean;
}

interface Exercise {
  id: string;
  type: "MULTIPLE_CHOICE" | "CODING" | "OPEN_ENDED";
  question: string;
  options?: string; // JSON string of choices
  testCases?: any[];
}

interface ExerciseDisplayProps {
  exercise: Exercise;
  onComplete?: (exerciseId: string, isCorrect: boolean) => void;
}

export default function ExerciseDisplay({ exercise, onComplete }: ExerciseDisplayProps) {
  const { toast } = useToast();
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isMultipleChoice, setIsMultipleChoice] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Debug log
  useEffect(() => {
    console.log('🎯 ExerciseDisplay mounted with:', {
      exerciseId: exercise.id,
      exerciseType: exercise.type,
      question: exercise.question,
      options: exercise.options,
      testCases: exercise.testCases,
    });
  }, [exercise]);

  // Parse choices from options
  useEffect(() => {
    if (exercise.type === "MULTIPLE_CHOICE" && exercise.options) {
      try {
        console.log('🔧 Parsing exercise options:', exercise.options);
        
        let parsedOptions;
        if (typeof exercise.options === 'string') {
          parsedOptions = JSON.parse(exercise.options);
          console.log('🔧 Parsed options from string:', parsedOptions);
        } else {
          parsedOptions = exercise.options;
          console.log('🔧 Options already parsed:', parsedOptions);
        }
        
        if (parsedOptions.choices && Array.isArray(parsedOptions.choices)) {
          setChoices(parsedOptions.choices);
          // Check if multiple answers are correct
          const correctCount = parsedOptions.choices.filter((choice: Choice) => choice.isCorrect).length;
          setIsMultipleChoice(correctCount > 1);
          console.log('✅ Choices set:', parsedOptions.choices);
          console.log('🎯 Multiple choice detected:', correctCount > 1, 'correct answers:', correctCount);
        } else {
          console.warn('⚠️ No choices array found in options:', parsedOptions);
        }
      } catch (error) {
        console.error("❌ Error parsing exercise options:", error);
        console.error("❌ Raw options data:", exercise.options);
        console.error("❌ Options type:", typeof exercise.options);
      }
    }
  }, [exercise]);

  const handleSubmit = () => {
    if (isMultipleChoice) {
      if (selectedAnswers.length === 0) {
        toast({
          title: "Chưa chọn đáp án",
          description: "Vui lòng chọn ít nhất một đáp án trước khi nộp bài",
          variant: "destructive",
        });
        return;
      }

      // Check if all selected answers are correct and no incorrect ones are selected
      const correctIndices = choices.map((choice, index) => choice.isCorrect ? index : -1).filter(i => i !== -1);
      const selectedIndices = selectedAnswers.map(Number);
      
      const allCorrectSelected = correctIndices.every(i => selectedIndices.includes(i));
      const noIncorrectSelected = selectedIndices.every(i => choices[i].isCorrect);
      
      const correct = allCorrectSelected && noIncorrectSelected && correctIndices.length === selectedIndices.length;
      
      setIsCorrect(correct);
      setSubmitted(true);
      setShowResult(true);

      if (correct) {
        toast({
          title: "🎉 Chính xác!",
          description: "Bạn đã chọn đúng tất cả đáp án",
        });
      } else {
        toast({
          title: "❌ Chưa chính xác",
          description: "Hãy xem lại các đáp án đúng bên dưới",
          variant: "destructive",
        });
      }

      onComplete?.(exercise.id, correct);
    } else {
      if (!selectedAnswer) {
        toast({
          title: "Chưa chọn đáp án",
          description: "Vui lòng chọn một đáp án trước khi nộp bài",
          variant: "destructive",
        });
        return;
      }

      const selectedIndex = parseInt(selectedAnswer);
      const selectedChoice = choices[selectedIndex];
      const correct = selectedChoice?.isCorrect || false;

      setIsCorrect(correct);
      setSubmitted(true);
      setShowResult(true);

      if (correct) {
        toast({
          title: "🎉 Chính xác!",
          description: "Bạn đã trả lời đúng câu hỏi",
        });
      } else {
        toast({
          title: "❌ Chưa chính xác",
          description: "Hãy xem lại đáp án đúng bên dưới",
          variant: "destructive",
        });
      }

      onComplete?.(exercise.id, correct);
    }
  };

  const handleRetry = () => {
    setSelectedAnswer("");
    setSelectedAnswers([]);
    setSubmitted(false);
    setShowResult(false);
    setIsCorrect(false);
    setShowLeaderboard(false);
  };

  const handleShare = () => {
    // Implement share functionality
    console.log('Share leaderboard');
  };

  const handleViewTests = () => {
    // Implement view tests functionality  
    console.log('View tests');
  };

  const handleMultipleChoiceChange = (index: string, checked: boolean) => {
    if (checked) {
      setSelectedAnswers(prev => [...prev, index]);
    } else {
      setSelectedAnswers(prev => prev.filter(item => item !== index));
    }
  };

  const getExerciseIcon = () => {
    switch (exercise.type) {
      case "MULTIPLE_CHOICE":
        return <HelpCircle className="h-5 w-5" />;
      case "CODING":
        return <Code className="h-5 w-5" />;
      default:
        return <HelpCircle className="h-5 w-5" />;
    }
  };

  if (exercise.type !== "MULTIPLE_CHOICE") {
    return (
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            {getExerciseIcon()}
            <CardTitle className="text-lg">Bài tập</CardTitle>
            <Badge variant="outline" className="ml-auto">
              {exercise.type === "CODING" ? "Lập trình" : "Tự luận"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Loại bài tập này chưa được hỗ trợ trong phiên bản hiện tại.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6 border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          {getExerciseIcon()}
          <CardTitle className="text-lg">Bài tập trắc nghiệm</CardTitle>
          <Badge variant="outline" className="ml-auto">
            {isMultipleChoice ? "Nhiều lựa chọn" : "Một lựa chọn"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Question */}
        <div className="p-4 bg-muted/30 rounded-lg">
          <h3 className="font-medium text-lg mb-2">Câu hỏi:</h3>
          <p className="text-foreground">{exercise.question}</p>
        </div>

        {/* Choices */}
        <div className="space-y-3">
          <h4 className="font-medium">
            {isMultipleChoice 
              ? `Chọn các đáp án đúng (${choices.filter(c => c.isCorrect).length} đáp án):`
              : "Chọn đáp án đúng:"
            }
          </h4>
          
          {isMultipleChoice ? (
            // Multiple choice with checkboxes
            <div className="space-y-3">
              {choices.map((choice, index) => {
                const isSelected = selectedAnswers.includes(index.toString());
                const isCorrectChoice = choice.isCorrect;
                
                // Determine styling based on state
                let choiceClass = "p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50";
                
                if (showResult) {
                  if (isCorrectChoice) {
                    choiceClass += " bg-green-50 border-green-300 dark:bg-green-950 dark:border-green-700";
                  } else if (isSelected && !isCorrectChoice) {
                    choiceClass += " bg-red-50 border-red-300 dark:bg-red-950 dark:border-red-700";
                  }
                } else if (isSelected) {
                  choiceClass += " bg-primary/5 border-primary";
                }

                return (
                  <div key={index} className={choiceClass}>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id={`choice-${index}`}
                        checked={isSelected}
                        onCheckedChange={(checked) => handleMultipleChoiceChange(index.toString(), !!checked)}
                        disabled={submitted}
                        className="flex-shrink-0"
                      />
                      <Label 
                        htmlFor={`choice-${index}`}
                        className="flex-1 cursor-pointer font-normal"
                      >
                        <div className="flex items-center justify-between">
                          <span>{choice.text}</span>
                          {showResult && (
                            <div className="flex items-center gap-1">
                              {isCorrectChoice ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  <span className="text-sm text-green-600 font-medium">Đúng</span>
                                </>
                              ) : isSelected ? (
                                <>
                                  <XCircle className="h-4 w-4 text-red-600" />
                                  <span className="text-sm text-red-600 font-medium">Sai</span>
                                </>
                              ) : null}
                            </div>
                          )}
                        </div>
                      </Label>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Single choice with radio buttons
            <RadioGroup
              value={selectedAnswer}
              onValueChange={setSelectedAnswer}
              disabled={submitted}
              className="space-y-3"
            >
              {choices.map((choice, index) => {
                const isSelected = selectedAnswer === index.toString();
                const isCorrectChoice = choice.isCorrect;
                
                // Determine styling based on state
                let choiceClass = "p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50";
                
                if (showResult) {
                  if (isCorrectChoice) {
                    choiceClass += " bg-green-50 border-green-300 dark:bg-green-950 dark:border-green-700";
                  } else if (isSelected && !isCorrectChoice) {
                    choiceClass += " bg-red-50 border-red-300 dark:bg-red-950 dark:border-red-700";
                  }
                } else if (isSelected) {
                  choiceClass += " bg-primary/5 border-primary";
                }

                return (
                  <div key={index} className={choiceClass}>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem 
                        value={index.toString()} 
                        id={`choice-${index}`}
                        className="flex-shrink-0"
                      />
                      <Label 
                        htmlFor={`choice-${index}`} 
                        className="flex-1 cursor-pointer font-normal"
                      >
                        <div className="flex items-center justify-between">
                          <span>{choice.text}</span>
                          {showResult && (
                            <div className="flex items-center gap-1">
                              {isCorrectChoice ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  <span className="text-sm text-green-600 font-medium">Đúng</span>
                                </>
                              ) : isSelected ? (
                                <>
                                  <XCircle className="h-4 w-4 text-red-600" />
                                  <span className="text-sm text-red-600 font-medium">Sai</span>
                                </>
                              ) : null}
                            </div>
                          )}
                        </div>
                      </Label>
                    </div>
                  </div>
                );
              })}
            </RadioGroup>
          )}
        </div>

        {/* Result Message */}
        {showResult && (
          <div className={cn(
            "p-4 rounded-lg border-l-4 text-sm",
            isCorrect 
              ? "bg-green-50 border-green-500 text-green-800 dark:bg-green-950 dark:text-green-200" 
              : "bg-red-50 border-red-500 text-red-800 dark:bg-red-950 dark:text-red-200"
          )}>
            <div className="flex items-center gap-2 mb-2">
              {isCorrect ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="font-medium">
                {isCorrect ? "Chính xác!" : "Chưa chính xác"}
              </span>
            </div>
            <p>
              {isCorrect 
                ? "Chúc mừng! Bạn đã trả lời đúng câu hỏi này." 
                : `Đáp án đúng là: ${choices.filter(c => c.isCorrect).map(c => c.text).join(", ")}`
              }
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {!submitted ? (
            <Button 
              onClick={handleSubmit}
              disabled={isMultipleChoice ? selectedAnswers.length === 0 : !selectedAnswer}
              className="flex-1"
            >
              Nộp bài
            </Button>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={handleRetry}
                className="flex-1"
              >
                Làm lại
              </Button>
              {isCorrect && (
                <Button
                  onClick={() => setShowLeaderboard(true)}
                  className="flex-1"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Xem bảng xếp hạng
                </Button>
              )}
            </>
          )}
        </div>

        {/* Exercise Leaderboard */}
        {showLeaderboard && (
          <div className="mt-6">
            <ExerciseLeaderboard 
              onShare={handleShare}
            />
          </div>
        )}
      </CardContent>  
    </Card>
  );
}
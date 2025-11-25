"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { useRecommendRealtimeMutation, useRecommendScheduledMutation } from "@/queries/useAi";
import { Sparkles, Loader2, Clock, TrendingUp, BookOpen, Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { useTranslations } from "next-intl";
import { useAppContext } from "@/components/app-provider";

export default function RecommendationsPage() {
  const { toast } = useToast();
  const t = useTranslations("AiRecommendation");
  const tCommon = useTranslations("common");
  const { user } = useAppContext();
  const [userId, setUserId] = useState<string>("");
  const [language, setLanguage] = useState<string>("vi");
  const [preferredLanguages, setPreferredLanguages] = useState<string[]>([]);
  const [level, setLevel] = useState<string>("");
  const [maxDuration, setMaxDuration] = useState<number>(0);
  const [excludeCompleted, setExcludeCompleted] = useState<boolean>(false);
  const [recommendations, setRecommendations] = useState<unknown[]>([]);
  const [showDetails, setShowDetails] = useState<unknown>(null);
  const [scheduledHistory, setScheduledHistory] = useState<unknown[]>([]);

  const realtimeMutation = useRecommendRealtimeMutation();
  const scheduledMutation = useRecommendScheduledMutation();

  useEffect(() => {
    if (user?.id) {
      setUserId(user.id);
    }
  }, [user]);

  const handleLanguageToggle = (lang: string) => {
    setPreferredLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const handleRecommendRealtime = async () => {
    if (!userId) {
      toast({
        title: tCommon("error"),
        description: tCommon("error"),
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await realtimeMutation.mutateAsync({
        userId,
        mode: "REALTIME",
        language,
        preferredLanguages: preferredLanguages.length > 0 ? preferredLanguages : undefined,
      });

      setRecommendations(response.payload?.data?.recommendations || []);

      toast({
        title: tCommon("success"),
        description: t("foundCourses", { count: response.payload?.data?.recommendations?.length || 0 }),
      });
    } catch (error: any) {
      toast({
        title: tCommon("error"),
        description: error?.message || t("error"),
        variant: "destructive",
      });
    }
  };

  const handleRecommendScheduled = async () => {
    if (!userId) {
      toast({
        title: tCommon("error"),
        description: tCommon("error"),
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await scheduledMutation.mutateAsync({
        userId,
        mode: "SCHEDULED",
        language,
        preferredLanguages: preferredLanguages.length > 0 ? preferredLanguages : undefined,
      });

      const recs = response.payload?.data?.recommendations || [];
      setScheduledHistory((prev) => [
        {
          id: Date.now().toString(),
          createdAt: new Date(),
          recommendations: recs,
        },
        ...prev,
      ]);

      toast({
        title: tCommon("success"),
        description: t("scheduledSuccess"),
      });
    } catch (error: any) {
      toast({
        title: tCommon("error"),
        description: error?.message || t("scheduledError"),
        variant: "destructive",
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "bg-green-500";
    if (score >= 0.6) return "bg-yellow-500";
    return "bg-orange-500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return t("verySuitable");
    if (score >= 0.6) return t("suitable");
    return t("maybeSuitable");
  };

  return (
    <main className="container mx-auto p-4 sm:px-6 sm:py-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-500" />
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t("description")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{t("filters")}</CardTitle>
            <CardDescription>{t("customize")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t("interfaceLanguage")}</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectLanguage")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vi">Tiếng Việt</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("preferredLanguage")}</Label>
              <div className="space-y-2">
                {["VI", "EN", "JA"].map((lang) => (
                  <div key={lang} className="flex items-center space-x-2">
                    <Checkbox
                      id={`lang-${lang}`}
                      checked={preferredLanguages.includes(lang)}
                      onCheckedChange={() => handleLanguageToggle(lang)}
                    />
                    <label
                      htmlFor={`lang-${lang}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {lang === "VI" && "Tiếng Việt"}
                      {lang === "EN" && "English"}
                      {lang === "JA" && "日本語"}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Button
                onClick={handleRecommendRealtime}
                disabled={realtimeMutation.isPending}
                className="w-full"
              >
                {realtimeMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("generating")}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {t("recommendNow")}
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleRecommendScheduled}
                disabled={scheduledMutation.isPending}
                className="w-full"
              >
                {scheduledMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("scheduling")}
                  </>
                ) : (
                  <>
                    <Clock className="mr-2 h-4 w-4" />
                    {t("scheduleRecommend")}
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              * {t("recommendNow")}: {t("noteRealtime")}
              <br />
              * {t("scheduleRecommend")}: {t("noteScheduled")}
            </p>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="realtime">
            <TabsList>
              <TabsTrigger value="realtime">Realtime</TabsTrigger>
              <TabsTrigger value="scheduled">{t("scheduledHistory")}</TabsTrigger>
            </TabsList>

            <TabsContent value="realtime" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("newRecommendations")}</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{recommendations.length}</div>
                    <p className="text-xs text-muted-foreground">{t("suitableCourses")}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("completed")}</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">{t("coursesInRecommendations")}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("averageScore")}</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {recommendations.length > 0
                        ? (
                            recommendations.reduce((sum, rec) => sum + rec.score, 0) /
                            recommendations.length
                          ).toFixed(2)
                        : "N/A"}
                    </div>
                    <p className="text-xs text-muted-foreground">{t("relevance")}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>{t("recommendedCourses")}</CardTitle>
                  <CardDescription>{t("basedOnProgress")}</CardDescription>
                </CardHeader>
                <CardContent>
                  {recommendations.length === 0 ? (
                    <div className="text-center py-12">
                      <Sparkles className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">{t("noRecommendations")}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {t("clickToRecommend")}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recommendations.map((rec, idx) => (
                        <Card key={idx} className="hover:shadow-md transition-shadow">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold text-lg">{rec.title}</h3>
                                  <Badge className={getScoreColor(rec.score)}>
                                    {getScoreLabel(rec.score)} ({(rec.score * 100).toFixed(0)}%)
                                  </Badge>
                                </div>
                                <p className="text-muted-foreground text-sm mb-3">
                                  {rec.description}
                                </p>
                                <div className="flex items-center gap-2 mb-3">
                                  <Badge variant="outline">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {rec.estimatedDuration || "N/A"}
                                  </Badge>
                                  {rec.tags?.slice(0, 3).map((tag: string, tagIdx: number) => (
                                    <Badge key={tagIdx} variant="secondary">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                                <div className="bg-blue-50 p-3 rounded-md text-sm">
                                  <p className="text-blue-900">
                                    <strong>{t("reasonForRecommendation")}</strong> {rec.reason}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowDetails(rec)}
                                  >
                                    {t("viewDetails")}
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>{showDetails?.title}</DialogTitle>
                                    <DialogDescription>{showDetails?.description}</DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <strong>{t("matchScore")}</strong>{" "}
                                      <Badge className={getScoreColor(showDetails?.score || 0)}>
                                        {((showDetails?.score || 0) * 100).toFixed(0)}%
                                      </Badge>
                                    </div>
                                    <div>
                                      <strong>{t("reason")}</strong>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {showDetails?.reason}
                                      </p>
                                    </div>
                                    {showDetails?.tags && showDetails.tags.length > 0 && (
                                      <div>
                                        <strong>{t("tags")}</strong>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                          {showDetails.tags.map((tag: string, idxx: number) => (
                                            <Badge key={idxx} variant="secondary">
                                              {tag}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Button size="sm" className="flex-1">
                                {t("enroll")}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="scheduled" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t("scheduledHistory")}</CardTitle>
                  <CardDescription>
                    {t("scheduledLog")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {scheduledHistory.length === 0 ? (
                    <div className="text-sm text-muted-foreground">{t("noScheduledHistory")}</div>
                  ) : (
                    <div className="space-y-3">
                      {scheduledHistory.map((item) => (
                        <Card key={item.id}>
                          <CardContent className="py-3 space-y-2">
                            <div className="text-xs text-muted-foreground">
                              {item.createdAt.toLocaleString()}
                            </div>
                            {(item.recommendations || []).length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                {t("noRecsInResponse")}
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {(item.recommendations || []).map((rec: any, idx: number) => (
                                  <div key={idx} className="border rounded p-2">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{rec.title}</span>
                                      <Badge className={getScoreColor(rec.score)}>
                                        {(rec.score * 100).toFixed(0)}%
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                      {rec.description}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
}

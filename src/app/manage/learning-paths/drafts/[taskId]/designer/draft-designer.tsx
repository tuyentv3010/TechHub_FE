"use client";

import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  Panel,
  Handle,
  Position,
  ConnectionLineType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Check, Loader2, Route, X } from "lucide-react";

import aiApiRequest from "@/apiRequests/ai";
import {
  extractLearningPathDraftData,
  LearningPathDraftData,
  LearningPathDraftPublishError,
  publishLearningPathDraft,
} from "@/app/manage/learning-paths/draft-publish";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useRejectDraftMutation } from "@/queries/useAi";
import type { DraftItemType } from "@/schemaValidations/ai.schema";

interface DraftDesignerProps {
  taskId: string;
}

const RootNode = ({
  data,
}: {
  data: { title: string; description: string; totalCourses: number };
}) => {
  return (
    <>
      <Card className="min-w-[300px] border-4 border-primary bg-primary/5 p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary p-3">
            <Route className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="mb-1 text-lg font-bold">{data.title}</h3>
            <p className="line-clamp-2 text-sm text-muted-foreground">{data.description}</p>
            <div className="mt-2 flex gap-2">
              <Badge variant="outline">{data.totalCourses} Courses</Badge>
            </div>
          </div>
        </div>
      </Card>
      <Handle type="source" position={Position.Bottom} className="!bg-primary h-4 w-4" />
    </>
  );
};

const CourseNode = ({
  data,
}: {
  data: {
    title?: string;
    description?: string;
    order?: number;
    isOptional?: boolean;
    thumbnail?: string;
  };
}) => {
  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-blue-500 h-4 w-4" />

      <Card className="min-w-[280px] max-w-[320px] border-2 p-3 shadow-md">
        <div className="flex flex-col gap-2">
          {data.thumbnail ? (
            <div className="relative h-32 w-full overflow-hidden rounded-md bg-muted">
              <Image
                src={data.thumbnail}
                alt={data.title || "Course"}
                fill
                className="object-cover"
                sizes="320px"
              />
            </div>
          ) : null}

          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h4 className="line-clamp-2 text-sm font-semibold leading-tight">
                {data.title || "Untitled Course"}
              </h4>
              {data.order ? (
                <Badge variant="secondary" className="mt-1 text-xs">
                  Week {data.order}
                </Badge>
              ) : null}
            </div>
          </div>

          {data.description ? (
            <p className="line-clamp-2 text-xs text-muted-foreground">{data.description}</p>
          ) : null}

          {data.isOptional ? (
            <Badge variant="outline" className="w-fit text-xs">
              Optional
            </Badge>
          ) : null}
        </div>
      </Card>

      <Handle type="source" position={Position.Bottom} className="!bg-blue-500 h-4 w-4" />
    </>
  );
};

const nodeTypes = {
  root: RootNode,
  course: CourseNode,
};

export default function DraftDesigner({ taskId }: DraftDesignerProps) {
  const tCommon = useTranslations("common");
  const { toast } = useToast();
  const router = useRouter();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [draftData, setDraftData] = useState<DraftItemType | null>(null);
  const [pathData, setPathData] = useState<LearningPathDraftData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);

  const rejectMutation = useRejectDraftMutation();

  const onConnect = useCallback(
    (params: Connection) => setEdges((current) => addEdge(params, current)),
    [setEdges]
  );

  useEffect(() => {
    const loadDraftData = async () => {
      try {
        setIsLoading(true);
        const response = await aiApiRequest.getDraftById(taskId);
        const draft = response.payload.data;
        const parsedPathData = extractLearningPathDraftData(draft);

        setDraftData(draft);
        setPathData(parsedPathData);

        const nodeDataMap = new Map<string, { title?: string; description?: string; thumbnail?: string }>();
        parsedPathData.nodes.forEach((node) => {
          if (!node.id || !node.data) {
            return;
          }

          nodeDataMap.set(node.id, {
            title: node.data.label || node.data.title,
            description: node.data.description,
            thumbnail: node.data.thumbnail,
          });
        });

        const rootNode: Node = {
          id: "root",
          type: "root",
          position: { x: 400, y: 50 },
          data: {
            title: parsedPathData.title,
            description: parsedPathData.description,
            totalCourses: parsedPathData.courses.length,
          },
        };

        const courseNodes: Node[] = parsedPathData.courses.map((course, index) => {
          const nodeData = nodeDataMap.get(course.courseId);

          return {
            id: course.courseId,
            type: "course",
            position: {
              x: course.positionX ?? 50 + (index % 3) * 350,
              y: course.positionY ?? 200 + Math.floor(index / 3) * 250,
            },
            data: {
              courseId: course.courseId,
              title: nodeData?.title || course.title || `Course ${index + 1}`,
              description: nodeData?.description || course.description || "",
              order: course.order,
              isOptional: course.isOptional === "Y",
              thumbnail: nodeData?.thumbnail || course.thumbnail,
            },
          };
        });

        const pathEdges: Edge[] = parsedPathData.layoutEdges.map((edge, index) => ({
          id: `edge-${index}`,
          source: edge.source,
          target: edge.target,
          animated: true,
          type: "smoothstep",
        }));

        setNodes([rootNode, ...courseNodes]);
        setEdges(pathEdges);
      } catch (error) {
        toast({
          title: tCommon("error"),
          description: error instanceof Error ? error.message : "Failed to load draft",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadDraftData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const handleApprove = async () => {
    if (!draftData || !pathData) {
      toast({
        title: tCommon("error"),
        description: "No learning path data to approve",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsPublishing(true);
      await publishLearningPathDraft({
        taskId,
        draft: draftData,
        layoutEdges: edges.map((edge) => ({
          source: edge.source,
          target: edge.target,
        })),
      });

      toast({
        title: tCommon("success"),
        description: "Learning path approved and created successfully",
      });
      router.push("/manage/learning-paths");
    } catch (error) {
      if (error instanceof LearningPathDraftPublishError && error.pathId) {
        toast({
          title: tCommon("success"),
          description: error.message,
        });
        router.push("/manage/learning-paths");
        return;
      }

      toast({
        title: tCommon("error"),
        description: error instanceof Error ? error.message : "Failed to approve draft",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleReject = async () => {
    if (!confirm("Are you sure you want to reject this draft?")) {
      return;
    }

    try {
      await rejectMutation.mutateAsync({ taskId });
      toast({
        title: tCommon("success"),
        description: "Draft rejected successfully",
      });
      router.replace("/manage/learning-paths");
    } catch (error) {
      toast({
        title: tCommon("error"),
        description: error instanceof Error ? error.message : "Failed to reject draft",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-background"
        defaultEdgeOptions={{
          animated: true,
          type: "smoothstep",
          style: { strokeWidth: 2, stroke: "#3b82f6" },
        }}
        connectionLineStyle={{ strokeWidth: 2, stroke: "#3b82f6" }}
        connectionLineType={ConnectionLineType.SmoothStep}
      >
        <Panel position="top-left" className="space-y-2">
          <Card className="max-w-md p-4">
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="secondary">AI Generated</Badge>
              <Badge variant="outline">Draft</Badge>
            </div>
            <h2 className="mb-1 text-lg font-bold">{pathData?.title || "Loading..."}</h2>
            <p className="text-sm text-muted-foreground">{pathData?.description || ""}</p>
            <div className="mt-3 flex gap-2">
              <Badge variant="outline">{Math.max(0, nodes.length - 1)} Courses</Badge>
            </div>
          </Card>
        </Panel>

        <Panel position="top-right" className="space-x-2">
          <Button onClick={() => router.back()} variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={handleReject} variant="outline" disabled={rejectMutation.isPending}>
            {rejectMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <X className="mr-2 h-4 w-4" />
            )}
            Reject
          </Button>
          <Button onClick={handleApprove} disabled={isPublishing}>
            {isPublishing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Approve & Create
          </Button>
        </Panel>

        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}

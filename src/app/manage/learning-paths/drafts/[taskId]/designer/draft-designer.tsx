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
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, BookOpen, Check, LayoutGrid, Loader2, Route, X } from "lucide-react";

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

const ROOT_NODE_ID = "root-learning-path";
const COURSE_NODE_WIDTH = 320;
const COURSE_NODE_HEIGHT = 230;
const COURSE_COLUMN_GAP = 96;
const COURSE_ROW_GAP = 120;
const COURSE_START_Y = 310;
const MAX_COLUMNS = 4;

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

const normalizeDraftThumbnail = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:image/")
  ) {
    return trimmed;
  }

  return undefined;
};

function DraftCourseThumbnail({ src, title }: { src?: string; title: string }) {
  const [failed, setFailed] = useState(false);
  const imageSrc = normalizeDraftThumbnail(src);

  if (!imageSrc || failed) {
    return (
      <div className="flex h-32 w-full items-center justify-center rounded-md bg-muted">
        <BookOpen className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative h-32 w-full overflow-hidden rounded-md bg-muted">
      <img
        src={imageSrc}
        alt={title}
        className="h-full w-full object-cover"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

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
      <Handle type="target" position={Position.Top} className="!bg-primary h-4 w-4" />

      <Card className="min-w-[280px] max-w-[320px] border-2 p-3 shadow-md">
        <div className="flex flex-col gap-2">
          <DraftCourseThumbnail src={data.thumbnail} title={data.title || "Course"} />

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

      <Handle type="source" position={Position.Bottom} className="!bg-primary h-4 w-4" />
    </>
  );
};

const nodeTypes = {
  root: RootNode,
  course: CourseNode,
};

const getAutoLayoutPosition = (index: number, total: number) => {
  const columns = Math.min(MAX_COLUMNS, Math.max(1, total));
  const row = Math.floor(index / columns);
  const column = index % columns;
  const itemsInRow = Math.min(columns, total - row * columns);
  const rowWidth =
    itemsInRow * COURSE_NODE_WIDTH + Math.max(0, itemsInRow - 1) * COURSE_COLUMN_GAP;
  const startX = -rowWidth / 2;

  return {
    x: startX + column * (COURSE_NODE_WIDTH + COURSE_COLUMN_GAP),
    y: COURSE_START_Y + row * (COURSE_NODE_HEIGHT + COURSE_ROW_GAP),
  };
};

const createSequentialEdges = (courses: LearningPathDraftData["courses"]): Edge[] =>
  courses.slice(1).map((course, index) => {
    const source = courses[index].courseId;
    const target = course.courseId;

    return {
      id: `edge-${source}-${target}-${index}`,
      source,
      target,
      animated: true,
      type: "smoothstep",
    };
  });

const createRootEdge = (courses: LearningPathDraftData["courses"]): Edge | null => {
  const firstCourseId = courses[0]?.courseId;
  if (!firstCourseId) {
    return null;
  }

  return {
    id: `edge-${ROOT_NODE_ID}-${firstCourseId}`,
    source: ROOT_NODE_ID,
    target: firstCourseId,
    animated: true,
    type: "smoothstep",
  };
};

const normalizeDraftEdges = (
  draftEdges: LearningPathDraftData["layoutEdges"],
  courses: LearningPathDraftData["courses"]
): Edge[] => {
  const courseIds = new Set(courses.map((course) => course.courseId));
  const validIds = new Set([ROOT_NODE_ID, ...courseIds]);
  const seen = new Set<string>();
  const edges = draftEdges
    .filter((edge) => {
      const key = `${edge.source}->${edge.target}`;
      if (
        !validIds.has(edge.source) ||
        !courseIds.has(edge.target) ||
        edge.source === edge.target ||
        seen.has(key)
      ) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .map((edge, index) => ({
      id: `edge-${edge.source}-${edge.target}-${index}`,
      source: edge.source,
      target: edge.target,
      animated: true,
      type: "smoothstep",
    }));

  const hasRootEdge = edges.some((edge) => edge.source === ROOT_NODE_ID);
  const rootEdge = hasRootEdge ? null : createRootEdge(courses);
  const courseEdges = edges.some((edge) => edge.source !== ROOT_NODE_ID)
    ? edges
    : createSequentialEdges(courses);

  return [rootEdge, ...courseEdges].filter((edge): edge is Edge => Boolean(edge));
};

const createRootNode = (pathData: LearningPathDraftData): Node => ({
  id: ROOT_NODE_ID,
  type: "root",
  position: { x: -150, y: 40 },
  data: {
    title: pathData.title,
    description: pathData.description,
    totalCourses: pathData.courses.length,
  },
});

const createCourseNodes = (pathData: LearningPathDraftData): Node[] => {
  const nodeDataMap = new Map<string, { title?: string; description?: string; thumbnail?: string }>();
  pathData.nodes.forEach((node) => {
    if (!node.id || !node.data) {
      return;
    }

    nodeDataMap.set(node.id, {
      title: node.data.label || node.data.title,
      description: node.data.description,
      thumbnail: node.data.thumbnail,
    });
  });

  return pathData.courses.map((course, index) => {
    const nodeData = nodeDataMap.get(course.courseId);

    return {
      id: course.courseId,
      type: "course",
      position: getAutoLayoutPosition(index, pathData.courses.length),
      data: {
        courseId: course.courseId,
        title: nodeData?.title || course.title || `Course ${index + 1}`,
        description: nodeData?.description || course.description || "",
        order: course.order ?? index + 1,
        isOptional: course.isOptional === "Y",
        thumbnail: nodeData?.thumbnail || course.thumbnail,
      },
    };
  });
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

  const handleAutoFormat = useCallback(() => {
    if (!pathData) {
      return;
    }

    setNodes([createRootNode(pathData), ...createCourseNodes(pathData)]);
    setEdges((currentEdges) => {
      const layoutEdges = currentEdges.map((edge) => ({
        source: edge.source,
        target: edge.target,
      }));

      return normalizeDraftEdges(layoutEdges, pathData.courses);
    });
  }, [pathData, setEdges, setNodes]);

  useEffect(() => {
    const loadDraftData = async () => {
      try {
        setIsLoading(true);
        const response = await aiApiRequest.getDraftById(taskId);
        const draft = response.payload.data;
        const parsedPathData = extractLearningPathDraftData(draft);

        setDraftData(draft);
        setPathData(parsedPathData);

        setNodes([createRootNode(parsedPathData), ...createCourseNodes(parsedPathData)]);
        setEdges(normalizeDraftEdges(parsedPathData.layoutEdges, parsedPathData.courses));
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
        coursePositions: nodes
          .filter((node) => node.id !== ROOT_NODE_ID)
          .map((node) => ({
            courseId: node.id,
            positionX: Math.round(node.position.x),
            positionY: Math.round(node.position.y),
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
          style: { strokeWidth: 2, stroke: "hsl(var(--primary))" },
        }}
        connectionLineStyle={{ strokeWidth: 2, stroke: "hsl(var(--primary))" }}
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

        <Panel position="top-right" className="flex flex-wrap justify-end gap-2">
          <Button onClick={() => router.back()} variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={handleAutoFormat} variant="outline">
            <LayoutGrid className="mr-2 h-4 w-4" />
            Auto format
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

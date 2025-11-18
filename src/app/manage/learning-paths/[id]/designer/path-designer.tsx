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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Check, Save, Plus } from "lucide-react";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  useGetLearningPathById,
  useAddCoursesToPathMutation,
  useRemoveCourseFromPathMutation,
  useUpdateLearningPathMutation,
} from "@/queries/useLearningPath";
import { CourseInPathType } from "@/schemaValidations/learning-path.schema";
import { useToast } from "@/hooks/use-toast";
import CourseSelector from "../../course-selector";

interface PathDesignerProps {
  pathId: string;
}

// Custom node component for courses
const CourseNode = ({ data }: any) => {
  return (
    <Card className="p-4 min-w-[250px] border-2">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-sm mb-1">{data.title}</h4>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {data.description}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              Order: {data.order}
            </Badge>
            {data.isOptional && (
              <Badge variant="secondary" className="text-xs">
                Optional
              </Badge>
            )}
            {data.isCompleted && (
              <Badge variant="default" className="text-xs">
                <Check className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

const nodeTypes = {
  courseNode: CourseNode,
};

export default function PathDesigner({ pathId }: PathDesignerProps) {
  const t = useTranslations("PathDesigner");
  const { data: pathData, isLoading, refetch } = useGetLearningPathById(pathId);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [showCourseSelector, setShowCourseSelector] = useState(false);

  const addCoursesMutation = useAddCoursesToPathMutation();
  const removeCoursesMutation = useRemoveCourseFromPathMutation();
  const updateMutation = useUpdateLearningPathMutation();
  const { toast } = useToast();

  // Convert courses to nodes
  useEffect(() => {
    if (pathData?.payload?.data) {
      const courses = pathData.payload.data.courses || [];
      
      // Create nodes
      const newNodes: Node[] = courses.map((course: CourseInPathType, index: number) => ({
        id: course.courseId,
        type: "courseNode",
        position: { x: 100, y: index * 180 + 50 },
        data: {
          title: course.courseTitle || course.title || "Untitled Course",
          description: course.description || "",
          order: course.order,
          isOptional: course.isOptional === "Y",
          isCompleted: course.isCompleted || false,
        },
      }));

      // Create edges (connect sequential courses)
      const newEdges: Edge[] = courses
        .slice(0, -1)
        .map((course: CourseInPathType, index: number) => ({
          id: `e${course.courseId}-${courses[index + 1].courseId}`,
          source: course.courseId,
          target: courses[index + 1].courseId,
          animated: true,
          style: { stroke: courses[index + 1].isOptional ? "#94a3b8" : "#3b82f6" },
        }));

      setNodes(newNodes);
      setEdges(newEdges);
    }
  }, [pathData, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleAddCourses = async (courseIds: string[]) => {
    try {
      // Build courses array with order
      const courses = courseIds.map((courseId, index) => ({
        courseId,
        order: (pathData?.payload?.data?.courses?.length || 0) + index + 1,
        isOptional: "N",
      }));
      
      await addCoursesMutation.mutateAsync({
        pathId,
        body: { courses },
      });
      toast({
        title: t("CoursesAdded"),
        variant: "default",
      });
      refetch();
      setShowCourseSelector(false);
    } catch (error: any) {
      toast({
        title: t("AddCoursesError"),
        description: error?.message || "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleSaveLayout = async () => {
    // Extract new order from node positions (sort by Y position)
    const sortedNodes = [...nodes].sort((a, b) => a.position.y - b.position.y);
    const courses = sortedNodes.map((node, index) => ({
      courseId: node.id,
      order: index + 1,
      isOptional: node.data.isOptional ? "Y" : "N",
    }));

    try {
      await updateMutation.mutateAsync({
        id: pathId,
        body: {
          ...pathData!.payload!.data,
          courses,
        },
      });
      toast({
        title: t("LayoutSaved"),
        variant: "default",
      });
      refetch();
    } catch (error: any) {
      toast({
        title: t("SaveLayoutError"),
        description: error?.message || "An error occurred",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p>{t("Loading")}</p>
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
      >
        <Panel position="top-left" className="space-y-2">
          <Card className="p-4">
            <h2 className="font-bold text-lg mb-1">
              {pathData?.payload?.data?.title || "Loading..."}
            </h2>
            <p className="text-sm text-muted-foreground">
              {pathData?.payload?.data?.description || ""}
            </p>
            <div className="flex gap-2 mt-3">
              <Badge variant="outline">
                {pathData?.payload?.data?.courses?.length || 0} Courses
              </Badge>
              <Badge variant="secondary">
                {pathData?.payload?.data?.level || "N/A"}
              </Badge>
            </div>
          </Card>
        </Panel>

        <Panel position="top-right" className="space-x-2">
          <Button onClick={() => setShowCourseSelector(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t("AddCourses")}
          </Button>
          <Button onClick={handleSaveLayout} variant="secondary">
            <Save className="h-4 w-4 mr-2" />
            {t("SaveLayout")}
          </Button>
        </Panel>

        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>

      {showCourseSelector && (
        <CourseSelector
          onClose={() => setShowCourseSelector(false)}
          onSelect={handleAddCourses}
          existingCourseIds={pathData?.payload?.data?.courses?.map((c: CourseInPathType) => c.courseId) || []}
        />
      )}
    </div>
  );
}

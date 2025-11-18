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
import courseApiRequest from "@/apiRequests/course";
import { CourseItemResType } from "@/schemaValidations/course.schema";
import Image from "next/image";

interface PathDesignerProps {
  pathId: string;
}

// Custom node component for courses
const CourseNode = ({ data }: any) => {
  return (
    <Card className="p-3 min-w-[280px] max-w-[320px] border-2 shadow-md">
      <div className="flex flex-col gap-2">
        {/* Thumbnail */}
        {data.thumbnail ? (
          <div className="relative w-full h-32 rounded-md overflow-hidden bg-muted">
            <Image
              src={data.thumbnail}
              alt={data.title || "Course"}
              fill
              className="object-cover"
              sizes="320px"
            />
          </div>
        ) : (
          <div className="w-full h-32 rounded-md bg-muted flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1">
          <h4 className="font-semibold text-sm mb-1 line-clamp-2">{data.title || "Untitled Course"}</h4>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {data.description || "No description available"}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
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
  const [courseDetailsMap, setCourseDetailsMap] = useState<Map<string, CourseItemResType>>(new Map());

  const addCoursesMutation = useAddCoursesToPathMutation();
  const removeCoursesMutation = useRemoveCourseFromPathMutation();
  const updateMutation = useUpdateLearningPathMutation();
  const { toast } = useToast();

  // Fetch course details and convert to nodes
  useEffect(() => {
    if (pathData?.payload?.data) {
      const courses = pathData.payload.data.courses || [];
      console.log('🔍 Learning Path Courses:', courses);
      console.log('📊 Total courses to fetch:', courses.length);
      
      // Fetch all course details
      const fetchCourseDetails = async () => {
        const detailsMap = new Map<string, CourseItemResType>();
        
        await Promise.all(
          courses.map(async (course: CourseInPathType) => {
            try {
              console.log(`📡 Fetching course ID: ${course.courseId}`);
              const response = await courseApiRequest.getCourseById(course.courseId);
              console.log(`✅ Response for ${course.courseId}:`, response);
              console.log(`📊 Full payload data:`, response.payload?.data);
              console.log(`📊 Response structure:`, {
                hasPayload: !!response.payload,
                hasData: !!response.payload?.data,
                hasSummary: !!response.payload?.data?.summary,
                title: response.payload?.data?.summary?.title,
                description: response.payload?.data?.summary?.description,
                thumbnail: response.payload?.data?.summary?.thumbnail,
                hasThumbnail: !!response.payload?.data?.summary?.thumbnail,
                thumbnailUrl: response.payload?.data?.summary?.thumbnail?.url,
                thumbnailSecureUrl: response.payload?.data?.summary?.thumbnail?.secureUrl,
              });
              if (response.payload?.data?.summary) {
                detailsMap.set(course.courseId, response.payload.data.summary);
                console.log(`💾 Saved course: ${response.payload.data.summary.title}`);
              }
            } catch (error) {
              console.error(`❌ Failed to fetch course ${course.courseId}:`, error);
            }
          })
        );
        
        console.log('📦 Final course details map size:', detailsMap.size);
        console.log('📦 All course details:', Array.from(detailsMap.entries()));
        setCourseDetailsMap(detailsMap);
        
        // Create nodes with course details
        console.log('🏗️ Starting to create nodes...');
        const newNodes: Node[] = courses.map((course: CourseInPathType, index: number) => {
          const courseDetail = detailsMap.get(course.courseId);
          console.log(`🔧 Creating node ${index + 1}/${courses.length}:`, {
            courseId: course.courseId,
            hasCourseDetail: !!courseDetail,
            title: courseDetail?.title || course.title,
            thumbnailUrl: courseDetail?.thumbnail?.secureUrl || courseDetail?.thumbnail?.url,
            position: { x: 100 + (index % 3) * 360, y: Math.floor(index / 3) * 220 + 50 },
          });
          
          return {
            id: course.courseId,
            type: "courseNode",
            position: { x: 100 + (index % 3) * 360, y: Math.floor(index / 3) * 220 + 50 },
            data: {
              title: courseDetail?.title || course.title || "Untitled Course",
              description: courseDetail?.description || course.description || "",
              thumbnail: courseDetail?.thumbnail?.secureUrl || courseDetail?.thumbnail?.url,
              order: course.order,
              isOptional: course.isOptional === "Y",
              isCompleted: course.isCompleted || false,
            },
          };
        });

        console.log('✨ Created nodes:', newNodes.length);
        console.log('📍 Node details:', newNodes);

        // Create edges (connect sequential courses)
        console.log('🔗 Creating edges...');
        const newEdges: Edge[] = courses
          .slice(0, -1)
          .map((course: CourseInPathType, index: number) => ({
            id: `e${course.courseId}-${courses[index + 1].courseId}`,
            source: course.courseId,
            target: courses[index + 1].courseId,
            animated: true,
            type: "smoothstep",
            style: { 
              stroke: courses[index + 1].isOptional === "Y" ? "#94a3b8" : "#3b82f6",
              strokeWidth: 2,
            },
          }));

        console.log('🔗 Created edges:', newEdges.length);
        console.log('🔗 Edge details:', newEdges);

        setNodes(newNodes);
        setEdges(newEdges);
        console.log('✅ PathDesigner setup complete!');
      };
      
      fetchCourseDetails();
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
    // Calculate order based on tree-like position: top to bottom, left to right
    // Sort by Y position first (rows), then by X position (columns)
    const sortedNodes = [...nodes].sort((a, b) => {
      const yDiff = a.position.y - b.position.y;
      if (Math.abs(yDiff) > 50) { // Different rows (with 50px tolerance)
        return yDiff;
      }
      return a.position.x - b.position.x; // Same row, sort by X
    });
    
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

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

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Route, Check, Loader2, X, ArrowLeft } from "lucide-react";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Image from "next/image";
import aiApiRequest from "@/apiRequests/ai";
import learningPathApiRequest from "@/apiRequests/learning-path";
import { useApproveLearningPathDraftMutation, useRejectDraftMutation } from "@/queries/useAi";

interface DraftDesignerProps {
  taskId: string;
}

// Root node component for Learning Path
const RootNode = ({ data }: { data: { title: string; description: string; totalCourses: number } }) => {
  return (
    <>
      <Card className="p-4 min-w-[300px] border-4 border-primary shadow-lg bg-primary/5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary rounded-lg">
            <Route className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">{data.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {data.description}
            </p>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline">{data.totalCourses} Courses</Badge>
            </div>
          </div>
        </div>
      </Card>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-4 h-4 !bg-primary"
      />
    </>
  );
};

// Custom node component for courses
const CourseNode = ({ data }: { data: { title?: string; description?: string; order?: number; isOptional?: boolean; thumbnail?: string } }) => {
  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="w-4 h-4 !bg-blue-500"
      />
      
      <Card className="p-3 min-w-[280px] max-w-[320px] border-2 shadow-md">
        <div className="flex flex-col gap-2">
          {data.thumbnail && (
            <div className="relative w-full h-32 rounded-md overflow-hidden bg-muted">
              <Image
                src={data.thumbnail}
                alt={data.title || "Course"}
                fill
                className="object-cover"
                sizes="320px"
              />
            </div>
          )}
          
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm leading-tight line-clamp-2">
                {data.title || "Untitled Course"}
              </h4>
              {data.order && (
                <Badge variant="secondary" className="mt-1 text-xs">
                  Week {data.order}
                </Badge>
              )}
            </div>
          </div>
          
          {data.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {data.description}
            </p>
          )}
          
          {data.isOptional && (
            <Badge variant="outline" className="text-xs w-fit">
              Optional
            </Badge>
          )}
        </div>
      </Card>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-4 h-4 !bg-blue-500"
      />
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
  
  interface CourseData {
    courseId: string;
    title?: string;
    description?: string;
    order?: number;
    positionX?: number;
    positionY?: number;
    isOptional?: string;
    thumbnail?: string;
  }

  interface LayoutEdge {
    source: string;
    target: string;
  }

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [_draftData, setDraftData] = useState<{resultPayload: string} | null>(null);
  const [pathData, setPathData] = useState<{
    title: string;
    description: string;
    skills?: string[];
    courses: CourseData[];
    layoutEdges: LayoutEdge[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const approveMutation = useApproveLearningPathDraftMutation();
  const rejectMutation = useRejectDraftMutation();

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Load draft data
  useEffect(() => {
    const loadDraftData = async () => {
      try {
        setIsLoading(true);
        const response = await aiApiRequest.getDraftById(taskId);
        const draft = response.payload.data;
        setDraftData(draft);

        console.log('📦 Draft data received:', draft);
        console.log('📦 resultPayload:', draft.resultPayload);

        // Extract learning path data from OpenAI response structure
        // resultPayload.choices[0].message.content contains the JSON string
        let parsedPathData;
        
        if (draft.resultPayload.choices && draft.resultPayload.choices[0]?.message?.content) {
          // Parse the content which is a JSON string
          const contentString = draft.resultPayload.choices[0].message.content;
          console.log('🔄 Parsing content from OpenAI response...');
          parsedPathData = JSON.parse(contentString);
        } else if (typeof draft.resultPayload === 'string') {
          console.log('🔄 Parsing JSON string...');
          parsedPathData = JSON.parse(draft.resultPayload);
        } else if (draft.resultPayload && typeof draft.resultPayload === 'object') {
          // Fallback: check if it's already the learning path data
          if (draft.resultPayload.title && draft.resultPayload.courses) {
            console.log('✅ Already learning path object');
            parsedPathData = draft.resultPayload;
          } else {
            throw new Error('Invalid resultPayload format - missing choices or learning path data');
          }
        } else {
          throw new Error('Invalid resultPayload format');
        }

        console.log('✅ Path data:', parsedPathData);
        setPathData(parsedPathData);
        
        // Build a map from nodes array for course titles/labels
        const nodeDataMap = new Map();
        if (parsedPathData.nodes && Array.isArray(parsedPathData.nodes)) {
          parsedPathData.nodes.forEach((node: { id: string; data?: { label?: string; title?: string; description?: string; thumbnail?: string } }) => {
            if (node.id && node.data) {
              nodeDataMap.set(node.id, {
                title: node.data.label || node.data.title,
                description: node.data.description,
                thumbnail: node.data.thumbnail,
              });
            }
          });
        }
        console.log('📋 Node data map:', Array.from(nodeDataMap.entries()));
        
        // Build nodes from AI data
        const rootNode: Node = {
          id: "root",
          type: "root",
          position: { x: 400, y: 50 },
          data: {
            title: parsedPathData.title,
            description: parsedPathData.description,
            totalCourses: parsedPathData.courses?.length || 0,
          },
        };
        
        const courseNodes: Node[] = (parsedPathData.courses || []).map((course: CourseData, index: number) => {
          // Get course details from nodes array
          const nodeData = nodeDataMap.get(course.courseId);
          
          return {
            id: course.courseId,
            type: "course",
            position: {
              x: course.positionX || 50 + (index % 3) * 350,
              y: course.positionY || 200 + Math.floor(index / 3) * 250,
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

        setNodes([rootNode, ...courseNodes] as Node[]);

        // Build edges from layoutEdges
        const pathEdges: Edge[] = (parsedPathData.layoutEdges || []).map((edge: LayoutEdge, index: number) => ({
          id: `edge-${index}`,
          source: edge.source,
          target: edge.target,
          animated: true,
          type: 'smoothstep',
        }));

        setEdges(pathEdges);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to load draft";
        toast({
          title: tCommon("error"),
          description: errorMessage,
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
    if (!pathData) {
      toast({
        title: tCommon("error"),
        description: "No learning path data to approve",
        variant: "destructive",
      });
      return;
    }

    try {
      // Step 1: Approve draft trong AI Service (chỉ update status)
      console.log("📤 Step 1: Approving draft in AI Service...");
      await approveMutation.mutateAsync(taskId);
      
      // Step 2: Tạo Learning Path qua proxy-client
      console.log("📤 Step 2: Creating learning path via proxy-client...");
      console.log("📦 Path data:", pathData);
      
      const createResponse = await learningPathApiRequest.createLearningPath({
        title: pathData.title,
        description: pathData.description,
        skills: pathData.skills || [],
        isActive: "Y",
      });
      
      const newPathId = createResponse.payload.data.id;
      console.log("✅ Learning path created:", newPathId);
      
      // Step 3: Add courses to learning path
      if (pathData.courses && pathData.courses.length > 0) {
        console.log("📤 Step 3: Adding courses to learning path...");
        console.log("📦 Courses data:", pathData.courses);
        
        const coursesToAdd = pathData.courses.map(course => ({
          courseId: course.courseId,
          order: course.order || 1,
          positionX: course.positionX,
          positionY: course.positionY,
          isOptional: course.isOptional || "N",
        }));
        
        console.log("📤 Courses to add:", coursesToAdd);
        
        await learningPathApiRequest.addCoursesToPath(
          newPathId,
          { courses: coursesToAdd }
        );
        
        console.log("✅ Courses added successfully");
      }
      
      // Step 4: Save layoutEdges to learning path
      // Get current edges from UI state (may have been modified by user)
      const currentLayoutEdges = edges.map(edge => ({
        source: edge.source,
        target: edge.target,
      }));
      
      if (currentLayoutEdges.length > 0) {
        console.log("📤 Step 4: Saving layout edges...");
        console.log("📦 Layout edges:", currentLayoutEdges);
        
        await learningPathApiRequest.updateLearningPath(newPathId, {
          title: pathData.title,
          description: pathData.description,
          skills: pathData.skills || [],
          layoutEdges: currentLayoutEdges,
        });
        
        console.log("✅ Layout edges saved successfully");
      }
      
      toast({
        title: tCommon("success"),
        description: "Learning path approved and created successfully",
      });
      router.push("/manage/learning-paths");
    } catch (error) {
      console.error("❌ Error approving draft:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to approve draft";
      toast({
        title: tCommon("error"),
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    if (!confirm("Are you sure you want to reject this draft?")) return;
    
    try {
      await rejectMutation.mutateAsync({ taskId });
      toast({
        title: tCommon("success"),
        description: "Draft rejected successfully",
      });
      router.replace("/manage/learning-paths");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to reject draft";
      toast({
        title: tCommon("error"),
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
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
          type: 'smoothstep',
          style: { strokeWidth: 2, stroke: '#3b82f6' },
        }}
        connectionLineStyle={{ strokeWidth: 2, stroke: '#3b82f6' }}
        connectionLineType={ConnectionLineType.SmoothStep}
      >
        <Panel position="top-left" className="space-y-2">
          <Card className="p-4 max-w-md">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">AI Generated</Badge>
              <Badge variant="outline">Draft</Badge>
            </div>
            <h2 className="font-bold text-lg mb-1">
              {pathData?.title || "Loading..."}
            </h2>
            <p className="text-sm text-muted-foreground">
              {pathData?.description || ""}
            </p>
            <div className="flex gap-2 mt-3">
              <Badge variant="outline">
                {nodes.length - 1} Courses
              </Badge>
            </div>
          </Card>
        </Panel>

        <Panel position="top-right" className="space-x-2">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleReject}
            variant="outline"
            disabled={rejectMutation.isPending}
          >
            {rejectMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <X className="h-4 w-4 mr-2" />
            )}
            Reject
          </Button>
          <Button
            onClick={handleApprove}
            disabled={approveMutation.isPending}
          >
            {approveMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
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

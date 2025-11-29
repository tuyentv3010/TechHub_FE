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
import { BookOpen, Check, Save, Plus, Route } from "lucide-react";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  useGetLearningPathById,
  useAddCoursesToPathMutation,
  useRemoveCourseFromPathMutation,
  useUpdateLearningPathMutation,
  useReorderCoursesMutation,
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

// Root node component for Learning Path
const RootNode = ({ data }: any) => {
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
      {/* Connection handle at bottom for connecting to courses */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-4 h-4 !bg-primary"
      />
    </>
  );
};

// Custom node component for courses
const CourseNode = ({ data }: any) => {
  return (
    <>
      {/* Connection handle at top */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-4 h-4 !bg-blue-500"
      />
      
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
      
      {/* Connection handle at bottom */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-4 h-4 !bg-blue-500"
      />
    </>
  );
};

const nodeTypes = {
  rootNode: RootNode,
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
  const reorderCoursesMutation = useReorderCoursesMutation();
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
        
        // Create root node for the learning path
        const rootNode: Node = {
          id: 'root-learning-path',
          type: 'rootNode',
          position: { x: 400, y: 50 },
          data: {
            title: pathData.payload.data.title,
            description: pathData.payload.data.description,
            totalCourses: courses.length,
          },
        };
        
        console.log('🎯 Created root node:', rootNode);
        
        // Create nodes with course details
        console.log('🏗️ Starting to create nodes...');
        const courseNodes: Node[] = courses.map((course: CourseInPathType, index: number) => {
          const courseDetail = detailsMap.get(course.courseId);
          
          // Use saved position if available, otherwise use grid layout
          const position = course.positionX !== undefined && course.positionY !== undefined
            ? { x: course.positionX, y: course.positionY }
            : { x: 100 + (index % 4) * 360, y: 300 + Math.floor(index / 4) * 240 };
          
          console.log(`🔧 Creating node ${index + 1}/${courses.length}:`, {
            courseId: course.courseId,
            hasCourseDetail: !!courseDetail,
            title: courseDetail?.title || course.title,
            thumbnailUrl: courseDetail?.thumbnail?.secureUrl || courseDetail?.thumbnail?.url,
            position,
            usingSavedPosition: course.positionX !== undefined,
          });
          
          return {
            id: course.courseId,
            type: "courseNode",
            position,
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
        
        // Combine root node with course nodes
        const allNodes = [rootNode, ...courseNodes];

        console.log('✨ Created total nodes:', allNodes.length);
        console.log('📍 Node details:', allNodes);

        setNodes(allNodes);

        // Restore edges from backend data
        const savedEdges = pathData.payload?.data?.layoutEdges || [];
        console.log('📂 Checking backend for edges...');
        console.log('✅ Found saved edges:', savedEdges);
        
        if (savedEdges.length > 0) {
          // Recreate edges with proper IDs and styling
          const restoredEdges = savedEdges.map((edge: any) => ({
            id: `xy-edge__${edge.source}-${edge.target}`,
            source: edge.source,
            target: edge.target,
            animated: true,
            type: 'smoothstep',
            style: { stroke: '#3b82f6', strokeWidth: 2 },
          }));
          
          console.log('🔗 Restored edges:', restoredEdges);
          setEdges(restoredEdges);
        } else {
          console.log('ℹ️ No saved edges found');
          setEdges([]);
        }

        console.log('✅ PathDesigner setup complete!');
      };
      
      fetchCourseDetails();
    }
  }, [pathData, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      console.log('🔗 New connection created:', params);
      const newEdge = {
        ...params,
        animated: true,
        type: "smoothstep",
        style: { 
          stroke: "#3b82f6",
          strokeWidth: 2,
        },
      };
      console.log('➕ Adding edge:', newEdge);
      setEdges((eds) => {
        const updatedEdges = addEdge(newEdge, eds);
        console.log('📊 Updated edges:', updatedEdges);
        return updatedEdges;
      });
    },
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
    console.log('💾 ==================== SAVING LAYOUT ====================');
    console.log('📦 All nodes:', nodes);
    console.log('🔗 All edges:', edges);
    
    // Filter out root node
    const courseNodes = nodes.filter(n => n.id !== 'root-learning-path');
    const courseEdges = edges.filter(e => e.source !== 'root-learning-path');
    
    console.log('📊 Course nodes (filtered):', courseNodes);
    console.log('📊 Course nodes count:', courseNodes.length);
    console.log('🔗 Course edges (filtered):', courseEdges);
    console.log('🔗 Course edges count:', courseEdges.length);
    
    // Build a tree structure from edges to determine order
    // Nodes connected directly from root are at the top level
    const rootConnections = edges
      .filter(e => e.source === 'root-learning-path')
      .map(e => e.target);
    
    console.log('🌳 Root connections:', rootConnections);
    console.log('🌳 Root connections count:', rootConnections.length);
    
    // Build adjacency list for the course graph
    const adjacencyList = new Map<string, string[]>();
    courseEdges.forEach(edge => {
      console.log(`  Adding edge: ${edge.source} -> ${edge.target}`);
      const children = adjacencyList.get(edge.source) || [];
      children.push(edge.target);
      adjacencyList.set(edge.source, children);
    });
    
    console.log('📊 Adjacency list:', Array.from(adjacencyList.entries()));
    
    // Perform BFS starting from root connections
    const orderedCourseIds: string[] = [];
    const visited = new Set<string>();
    
    const queue: string[] = [...rootConnections];
    console.log('🚀 Starting BFS with queue:', queue);
    
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      console.log(`  Processing: ${currentId}`);
      
      if (visited.has(currentId)) {
        console.log(`    ⏭️ Already visited, skipping`);
        continue;
      }
      visited.add(currentId);
      orderedCourseIds.push(currentId);
      console.log(`    ✅ Added to order (position ${orderedCourseIds.length})`);
      
      // Add children to queue (sorted by position)
      const children = adjacencyList.get(currentId) || [];
      console.log(`    Children of ${currentId}:`, children);
      
      const childNodes = children
        .map(id => courseNodes.find(n => n.id === id)!)
        .filter(Boolean)
        .sort((a, b) => {
          const yDiff = a.position.y - b.position.y;
          if (Math.abs(yDiff) > 50) return yDiff;
          return a.position.x - b.position.x;
        });
      
      console.log(`    Sorted children:`, childNodes.map(n => `${n.id} (${n.position.x}, ${n.position.y})`));
      queue.push(...childNodes.map(n => n.id));
      console.log(`    Queue after adding children:`, queue);
    }
    
    // Add any disconnected nodes at the end
    console.log('🔍 Checking for disconnected nodes...');
    courseNodes.forEach(node => {
      if (!visited.has(node.id)) {
        console.log(`  ⚠️ Disconnected node found: ${node.id}`);
        orderedCourseIds.push(node.id);
      }
    });
    
    console.log('📋 Final ordered course IDs:', orderedCourseIds);
    
    // Build courses array with calculated order AND position
    const courses = orderedCourseIds.map((courseId, index) => {
      const node = courseNodes.find(n => n.id === courseId)!;
      const course = {
        courseId,
        order: index + 1,
        isOptional: node.data.isOptional ? "Y" : "N",
        positionX: Math.round(node.position.x),
        positionY: Math.round(node.position.y),
      };
      console.log(`  Course ${index + 1}:`, course);
      return course;
    });

    console.log('💾 Courses to save:', courses);
    
    // Prepare edges to save (source and target only)
    const layoutEdges = edges.map(edge => ({
      source: edge.source,
      target: edge.target,
    }));
    console.log('🔗 Edges to save:', layoutEdges);

    try {
      // Step 1: Reorder courses with positions
      console.log('📡 Calling reorderCourses API...');
      await reorderCoursesMutation.mutateAsync({
        pathId,
        body: courses,
      });
      console.log('✅ Courses with positions saved successfully');
      
      // Step 2: Update learning path with edges
      console.log('📡 Calling updateLearningPath API for edges...');
      await updateMutation.mutateAsync({
        id: pathId,
        body: {
          ...pathData!.payload!.data,
          layoutEdges,
        },
      });
      console.log('✅ Layout edges saved successfully');
      
      console.log('✅ All changes saved to backend: courses with positions + edges');
      
      toast({
        title: t("LayoutSaved"),
        variant: "default",
      });
      refetch();
    } catch (error: any) {
      console.error('❌ Save error:', error);
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
        defaultEdgeOptions={{
          animated: true,
          type: 'smoothstep',
          style: { strokeWidth: 2, stroke: '#3b82f6' },
        }}
        connectionLineStyle={{ strokeWidth: 2, stroke: '#3b82f6' }}
        connectionLineType={ConnectionLineType.SmoothStep}
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

"use client";

import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  BackgroundVariant,
  Panel,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Check, Route, User } from "lucide-react";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useGetLearningPathById } from "@/queries/useLearningPath";
import { CourseInPathType } from "@/schemaValidations/learning-path.schema";
import courseApiRequest from "@/apiRequests/course";
import { CourseItemResType } from "@/schemaValidations/course.schema";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface PathViewerProps {
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
              <Badge variant="default">{data.level}</Badge>
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

// Custom node component for courses (Read-only version)
const CourseNode = ({ data }: any) => {
  return (
    <>
      {/* Connection handle at top */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-4 h-4 !bg-blue-500"
      />
      
      <Card 
        className="p-3 min-w-[280px] max-w-[320px] border-2 shadow-md hover:shadow-lg hover:border-primary transition-all cursor-pointer"
        onClick={() => {
          if (data.courseId) {
            window.location.href = `/courses/${data.courseId}`;
          }
        }}
      >
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
            <div className="w-full h-32 rounded-md bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          
          {/* Content */}
          <div className="flex-1">
            <h4 className="font-semibold text-sm mb-1 line-clamp-2 hover:text-primary transition-colors">{data.title || "Untitled Course"}</h4>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {data.description || "No description available"}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                Order: {data.order}
              </Badge>
              {data.level && (
                <Badge variant="secondary" className="text-xs">
                  {data.level}
                </Badge>
              )}
              {data.isOptional && (
                <Badge variant="secondary" className="text-xs">
                  Optional
                </Badge>
              )}
              {data.totalEnrollments !== undefined && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {data.totalEnrollments}
                </span>
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

export default function PathViewer({ pathId }: PathViewerProps) {
  const t = useTranslations("LearningPathDetail");
  const { data: pathData, isLoading } = useGetLearningPathById(pathId);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [courseDetailsMap, setCourseDetailsMap] = useState<Map<string, CourseItemResType>>(new Map());

  // Fetch course details and convert to nodes
  useEffect(() => {
    if (pathData?.payload?.data) {
      const path = pathData.payload.data;
      const courses = path.courses || [];
      
      // Fetch all course details
      const fetchCourseDetails = async () => {
        const detailsMap = new Map<string, CourseItemResType>();
        
        await Promise.all(
          courses.map(async (course: CourseInPathType) => {
            try {
              const response = await courseApiRequest.getCourseById(course.courseId);
              if (response.payload?.data?.summary) {
                detailsMap.set(course.courseId, response.payload.data.summary);
              }
            } catch (error) {
              console.error(`Failed to fetch course ${course.courseId}:`, error);
            }
          })
        );
        
        setCourseDetailsMap(detailsMap);
        
        // Create root node for the learning path
        const rootNode: Node = {
          id: 'root-learning-path',
          type: 'rootNode',
          position: { x: 400, y: 50 },
          data: {
            title: path.title,
            description: path.description,
            level: path.level,
            totalCourses: courses.length,
          },
        };
        
        // Create nodes with course details
        const courseNodes: Node[] = courses.map((course: CourseInPathType, index: number) => {
          const courseDetail = detailsMap.get(course.courseId);
          
          // Use saved position if available, otherwise use grid layout
          const position = course.positionX !== undefined && course.positionY !== undefined
            ? { x: course.positionX, y: course.positionY }
            : { x: 100 + (index % 4) * 360, y: 300 + Math.floor(index / 4) * 240 };
          
          return {
            id: course.courseId,
            type: "courseNode",
            position,
            data: {
              courseId: course.courseId,
              title: courseDetail?.title || course.title || "Untitled Course",
              description: courseDetail?.description || course.description || "",
              thumbnail: courseDetail?.thumbnail?.secureUrl || courseDetail?.thumbnail?.url,
              order: course.order,
              level: courseDetail?.level,
              isOptional: course.isOptional === "Y",
              totalEnrollments: courseDetail?.totalEnrollments,
            },
          };
        });
        
        // Combine root node with course nodes
        const allNodes = [rootNode, ...courseNodes];
        setNodes(allNodes);

        // Restore edges from backend data
        const savedEdges = path.layoutEdges || [];
        
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
          
          setEdges(restoredEdges);
        } else {
          setEdges([]);
        }
      };
      
      fetchCourseDetails();
    }
  }, [pathData, setNodes, setEdges]);

  if (isLoading) {
    return (
      <div className="h-[600px] flex items-center justify-center bg-muted/30 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (!pathData?.payload?.data) {
    return (
      <div className="h-[600px] flex items-center justify-center bg-muted/30 rounded-lg">
        <div className="text-center">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">{t("notFound")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[600px] w-full rounded-lg overflow-hidden border shadow-sm">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        className="bg-background"
        defaultEdgeOptions={{
          animated: true,
          type: 'smoothstep',
          style: { strokeWidth: 2, stroke: '#3b82f6' },
        }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        zoomOnScroll={true}
        panOnScroll={false}
        minZoom={0.5}
        maxZoom={1.5}
      >
        <Panel position="top-left" className="bg-background/95 backdrop-blur p-3 rounded-lg shadow-md">
          <div className="space-y-1">
            <h3 className="font-bold text-sm">{pathData.payload.data.title}</h3>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">
                {pathData.payload.data.courses?.length || 0} Courses
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {pathData.payload.data.level}
              </Badge>
            </div>
          </div>
        </Panel>

        <Controls 
          showInteractive={false}
          className="bg-background/95 backdrop-blur"
        />
        <MiniMap 
          nodeColor={(node) => {
            if (node.type === 'rootNode') return '#3b82f6';
            return '#94a3b8';
          }}
          className="bg-background/95 backdrop-blur"
        />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}

import aiApiRequest from "@/apiRequests/ai";
import learningPathApiRequest from "@/apiRequests/learning-path";
import type { DraftItemType } from "@/schemaValidations/ai.schema";

export type LearningPathDraftEdge = {
  source: string;
  target: string;
};

export type LearningPathDraftNode = {
  id: string;
  data?: {
    label?: string;
    title?: string;
    description?: string;
    thumbnail?: string;
  };
};

export type LearningPathDraftCourse = {
  courseId: string;
  title?: string;
  description?: string;
  order?: number;
  positionX?: number;
  positionY?: number;
  isOptional?: string;
  thumbnail?: string;
};

export type LearningPathDraftData = {
  title: string;
  description: string;
  skills: string[];
  courses: LearningPathDraftCourse[];
  layoutEdges: LearningPathDraftEdge[];
  nodes: LearningPathDraftNode[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];

const normalizeEdges = (value: unknown): LearningPathDraftEdge[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((edge): edge is Record<string, unknown> => isRecord(edge))
    .map((edge) => ({
      source: typeof edge.source === "string" ? edge.source : "",
      target: typeof edge.target === "string" ? edge.target : "",
    }))
    .filter((edge) => edge.source && edge.target);
};

const normalizeNodes = (value: unknown): LearningPathDraftNode[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((node): node is Record<string, unknown> => isRecord(node))
    .map((node) => ({
      id: typeof node.id === "string" ? node.id : "",
      data: isRecord(node.data)
        ? {
            label: typeof node.data.label === "string" ? node.data.label : undefined,
            title: typeof node.data.title === "string" ? node.data.title : undefined,
            description: typeof node.data.description === "string" ? node.data.description : undefined,
            thumbnail: typeof node.data.thumbnail === "string" ? node.data.thumbnail : undefined,
          }
        : undefined,
    }))
    .filter((node) => node.id);
};

const normalizeCourses = (value: unknown): LearningPathDraftCourse[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((course): course is Record<string, unknown> => isRecord(course))
    .map((course) => ({
      courseId: typeof course.courseId === "string" ? course.courseId : "",
      title: typeof course.title === "string" ? course.title : undefined,
      description: typeof course.description === "string" ? course.description : undefined,
      order: typeof course.order === "number" ? course.order : undefined,
      positionX: typeof course.positionX === "number" ? course.positionX : undefined,
      positionY: typeof course.positionY === "number" ? course.positionY : undefined,
      isOptional: typeof course.isOptional === "string" ? course.isOptional : undefined,
      thumbnail: typeof course.thumbnail === "string" ? course.thumbnail : undefined,
    }))
    .filter((course) => course.courseId);
};

const extractPayload = (input: unknown): unknown => {
  if (isRecord(input) && "resultPayload" in input) {
    return input.resultPayload;
  }

  return input;
};

const parseLearningPathPayload = (input: unknown): Record<string, unknown> => {
  const payload = extractPayload(input);

  if (typeof payload === "string") {
    return parseLearningPathPayload(JSON.parse(payload));
  }

  if (!isRecord(payload)) {
    throw new Error("Invalid learning path draft payload.");
  }

  if (isRecord(payload.learningPathData)) {
    return parseLearningPathPayload(payload.learningPathData);
  }

  if (Array.isArray(payload.choices)) {
    const content = payload.choices[0];
    if (isRecord(content) && isRecord(content.message) && typeof content.message.content === "string") {
      return parseLearningPathPayload(content.message.content);
    }
  }

  if (typeof payload.title === "string" && Array.isArray(payload.courses)) {
    return payload;
  }

  throw new Error("Learning path draft is missing title or courses.");
};

export const extractLearningPathDraftData = (input: unknown): LearningPathDraftData => {
  const parsed = parseLearningPathPayload(input);

  return {
    title: typeof parsed.title === "string" ? parsed.title : "Untitled learning path",
    description: typeof parsed.description === "string" ? parsed.description : "",
    skills: toStringArray(parsed.skills),
    courses: normalizeCourses(parsed.courses),
    layoutEdges: normalizeEdges(parsed.layoutEdges),
    nodes: normalizeNodes(parsed.nodes),
  };
};

export class LearningPathDraftPublishError extends Error {
  constructor(message: string, public readonly pathId?: string) {
    super(message);
    this.name = "LearningPathDraftPublishError";
  }
}

const createLearningPathFromDraft = async (
  draftData: LearningPathDraftData,
  layoutEdges?: LearningPathDraftEdge[]
) => {
  const normalizedEdges = layoutEdges ?? draftData.layoutEdges;
  const createResponse = await learningPathApiRequest.createLearningPath({
    title: draftData.title,
    description: draftData.description,
    skills: draftData.skills,
    layoutEdges: normalizedEdges,
    isActive: "Y",
  });

  const pathId = createResponse.payload.data.id;

  if (draftData.courses.length > 0) {
    await learningPathApiRequest.addCoursesToPath(pathId, {
      courses: draftData.courses.map((course, index) => ({
        courseId: course.courseId,
        order: course.order ?? index + 1,
        positionX: course.positionX,
        positionY: course.positionY,
        isOptional: course.isOptional ?? "N",
      })),
    });
  }

  return pathId;
};

export const publishLearningPathDraft = async ({
  taskId,
  draft,
  layoutEdges,
}: {
  taskId: string;
  draft?: DraftItemType;
  layoutEdges?: LearningPathDraftEdge[];
}) => {
  const draftSource = draft ?? (await aiApiRequest.getDraftById(taskId)).payload.data;
  const draftData = extractLearningPathDraftData(draftSource);
  const pathId = await createLearningPathFromDraft(draftData, layoutEdges);

  try {
    await aiApiRequest.approveLearningPathDraft(taskId);
  } catch {
    throw new LearningPathDraftPublishError(
      "Learning path created, but the AI draft could not be marked as approved.",
      pathId
    );
  }

  return {
    pathId,
    draftData,
  };
};

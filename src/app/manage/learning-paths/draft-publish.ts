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

export type LearningPathDraftCoursePosition = {
  courseId: string;
  positionX: number;
  positionY: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .map((item) => String(item ?? "").trim())
        .filter((item) => item.length > 0)
    : [];

const toOptionalNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
};

const toOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const parseJsonString = (value: string): unknown => {
  const trimmed = value.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return JSON.parse(fenced?.[1] ?? trimmed);
};

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
            label: toOptionalString(node.data.label),
            title: toOptionalString(node.data.title),
            description: toOptionalString(node.data.description),
            thumbnail: toOptionalString(node.data.thumbnail),
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
      courseId: toOptionalString(course.courseId) ?? toOptionalString(course.id) ?? "",
      title: toOptionalString(course.title) ?? toOptionalString(course.courseTitle),
      description: toOptionalString(course.description),
      order: toOptionalNumber(course.order),
      positionX: toOptionalNumber(course.positionX),
      positionY: toOptionalNumber(course.positionY),
      isOptional:
        typeof course.isOptional === "boolean"
          ? course.isOptional
            ? "Y"
            : "N"
          : toOptionalString(course.isOptional),
      thumbnail: toOptionalString(course.thumbnail),
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
    return parseLearningPathPayload(parseJsonString(payload));
  }

  if (!isRecord(payload)) {
    throw new Error("Invalid learning path draft payload.");
  }

  if (isRecord(payload.path)) {
    return parseLearningPathPayload(payload.path);
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
  const layoutEdges = normalizeEdges(parsed.layoutEdges);

  return {
    title: typeof parsed.title === "string" ? parsed.title : "Untitled learning path",
    description: typeof parsed.description === "string" ? parsed.description : "",
    skills: toStringArray(parsed.skills),
    courses: normalizeCourses(parsed.courses),
    layoutEdges: layoutEdges.length > 0 ? layoutEdges : normalizeEdges(parsed.edges),
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
  layoutEdges?: LearningPathDraftEdge[],
  coursePositions?: LearningPathDraftCoursePosition[]
) => {
  const normalizedEdges = layoutEdges ?? draftData.layoutEdges;
  const positionMap = new Map(
    (coursePositions ?? []).map((position) => [position.courseId, position])
  );
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
        positionX: positionMap.get(course.courseId)?.positionX ?? course.positionX,
        positionY: positionMap.get(course.courseId)?.positionY ?? course.positionY,
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
  coursePositions,
}: {
  taskId: string;
  draft?: DraftItemType;
  layoutEdges?: LearningPathDraftEdge[];
  coursePositions?: LearningPathDraftCoursePosition[];
}) => {
  const draftSource = draft ?? (await aiApiRequest.getDraftById(taskId)).payload.data;
  const draftData = extractLearningPathDraftData(draftSource);
  const pathId = await createLearningPathFromDraft(draftData, layoutEdges, coursePositions);

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

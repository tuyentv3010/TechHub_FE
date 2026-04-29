import type {
  LearningPathItemType,
  LearningPathPaginationType,
} from "@/schemaValidations/learning-path.schema";

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null;

const toNumber = (value: unknown, fallback = 0) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
};

const toBoolean = (value: unknown, fallback = false) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return fallback;
};

const toPagination = (value: unknown): LearningPathPaginationType | null => {
  if (!isRecord(value)) {
    return null;
  }

  const page =
    "page" in value
      ? toNumber(value.page)
      : "number" in value
        ? toNumber(value.number)
        : 0;

  const size = "size" in value ? toNumber(value.size) : 0;
  const totalElements =
    "totalElements" in value ? toNumber(value.totalElements) : 0;
  const totalPages =
    "totalPages" in value ? toNumber(value.totalPages) : totalElements > 0 ? 1 : 0;

  return {
    page,
    size,
    totalElements,
    totalPages,
    first: "first" in value ? toBoolean(value.first, page === 0) : page === 0,
    last:
      "last" in value
        ? toBoolean(value.last, totalPages <= 1)
        : totalPages <= 1,
    hasNext:
      "hasNext" in value
        ? toBoolean(value.hasNext)
        : page < Math.max(totalPages - 1, 0),
    hasPrevious:
      "hasPrevious" in value
        ? toBoolean(value.hasPrevious)
        : page > 0,
  };
};

export const normalizeLearningPathListPayload = (value: unknown) => {
  if (!isRecord(value)) {
    return {
      data: [] as LearningPathItemType[],
      pagination: null as LearningPathPaginationType | null,
    };
  }

  const rawData =
    Array.isArray(value.data)
      ? value.data
      : isRecord(value.data) && Array.isArray(value.data.content)
        ? value.data.content
        : Array.isArray(value.content)
          ? value.content
          : [];

  const paginationSource =
    isRecord(value.pagination)
      ? value.pagination
      : isRecord(value.data) && Array.isArray(value.data.content)
        ? value.data
        : Array.isArray(value.content)
          ? value
          : null;

  return {
    data: rawData as LearningPathItemType[],
    pagination: toPagination(paginationSource),
  };
};

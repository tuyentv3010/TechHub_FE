import type { FileType } from "@/schemaValidations/file.schema";

type FileLike = Partial<
  Pick<
    FileType,
    | "fileType"
    | "objectKey"
    | "thumbnailObjectKey"
    | "thumbnailUrl"
    | "secureUrl"
    | "publicUrl"
    | "cloudinarySecureUrl"
    | "cloudinaryUrl"
  >
>;

const DEFAULT_MINIO_PUBLIC_BASE_URL = "https://minio-api.inova.id.vn/techhub";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, "");

const getMinioPublicBaseUrl = () =>
  (
    process.env.NEXT_PUBLIC_MINIO_PUBLIC_URL?.trim() ||
    DEFAULT_MINIO_PUBLIC_BASE_URL
  ).replace(/\/+$/, "");

const getPublicMinioUrlFromPath = (path: string, search = "") => {
  const publicBaseUrl = getMinioPublicBaseUrl();

  try {
    const publicBase = new URL(publicBaseUrl);
    const basePath = trimSlashes(publicBase.pathname);
    let objectPath = trimSlashes(path);

    if (basePath && objectPath === basePath) {
      objectPath = "";
    } else if (basePath && objectPath.startsWith(`${basePath}/`)) {
      objectPath = objectPath.slice(basePath.length + 1);
    }

    publicBase.pathname = [basePath, objectPath].filter(Boolean).join("/");
    publicBase.search = search;
    return publicBase.toString();
  } catch {
    const objectPath = trimSlashes(path);
    return `${publicBaseUrl}/${objectPath}${search}`;
  }
};

const getPublicMinioUrlFromObjectKey = (objectKey: unknown): string | null => {
  if (!isNonEmptyString(objectKey)) {
    return null;
  }

  return getPublicMinioUrlFromPath(objectKey);
};

const normalizeMediaUrl = (value: unknown): string | null => {
  if (!isNonEmptyString(value)) {
    return null;
  }

  return value.trim();
};

const collectAvailableUrls = (...values: unknown[]) => {
  const resolvedUrls: string[] = [];
  const seenUrls = new Set<string>();

  for (const value of values) {
    const normalizedValue = normalizeMediaUrl(value);
    if (normalizedValue && !seenUrls.has(normalizedValue)) {
      resolvedUrls.push(normalizedValue);
      seenUrls.add(normalizedValue);
    }
  }

  return resolvedUrls;
};

export const getFilePreviewCandidates = (file: FileLike): string[] => {
  if (file.fileType === "IMAGE") {
    return collectAvailableUrls(
      file.secureUrl,
      file.cloudinarySecureUrl,
      file.publicUrl,
      file.cloudinaryUrl,
      file.thumbnailUrl,
      getPublicMinioUrlFromObjectKey(file.objectKey),
      getPublicMinioUrlFromObjectKey(file.thumbnailObjectKey)
    );
  }

  if (file.fileType === "VIDEO") {
    return collectAvailableUrls(
      file.thumbnailUrl,
      getPublicMinioUrlFromObjectKey(file.thumbnailObjectKey)
    );
  }

  return collectAvailableUrls(
    file.thumbnailUrl,
    getPublicMinioUrlFromObjectKey(file.thumbnailObjectKey)
  );
};

export const getFileSourceCandidates = (file: FileLike): string[] =>
  collectAvailableUrls(
    file.secureUrl,
    file.cloudinarySecureUrl,
    file.publicUrl,
    file.cloudinaryUrl,
    file.thumbnailUrl,
    getPublicMinioUrlFromObjectKey(file.objectKey)
  );

export const resolveFilePreviewUrl = (file: FileLike): string | null =>
  getFilePreviewCandidates(file)[0] ?? null;

export const resolveFileSourceUrl = (file: FileLike): string | null =>
  getFileSourceCandidates(file)[0] ?? null;

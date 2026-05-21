import type { FileType } from "@/schemaValidations/file.schema";

type FileLike = Partial<
  Pick<
    FileType,
    | "id"
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

const removePresignedQuery = (value: unknown): string | null => {
  const normalizedUrl = normalizeMediaUrl(value);
  if (!normalizedUrl) {
    return null;
  }

  try {
    const url = new URL(normalizedUrl);
    const hasPresignedParams = Array.from(url.searchParams.keys()).some((key) =>
      key.toLowerCase().startsWith("x-amz-")
    );

    if (hasPresignedParams) {
      url.search = "";
      return url.toString();
    }
  } catch {
    return normalizedUrl;
  }

  return normalizedUrl;
};

export const normalizePersistedMediaUrl = (value: unknown): string | null =>
  removePresignedQuery(value);

export const isInternalFileProxyUrl = (value: unknown): boolean => {
  const normalizedUrl = normalizeMediaUrl(value);
  if (!normalizedUrl) {
    return false;
  }

  try {
    const url = new URL(normalizedUrl, "http://techhub.local");
    return url.pathname.startsWith("/api/proxy/files/")
      || url.pathname.startsWith("/app/api/proxy/files/");
  } catch {
    return normalizedUrl.startsWith("/api/proxy/files/")
      || normalizedUrl.startsWith("/app/api/proxy/files/");
  }
};

export const normalizePublicMediaUrl = (value: unknown): string | null => {
  const url = normalizePersistedMediaUrl(value);
  return url && !isInternalFileProxyUrl(url) ? url : null;
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

type FileVariant = "content" | "thumbnail";

export const buildFileMediaProxyUrl = (
  fileId: unknown,
  userId: unknown,
  variant: FileVariant = "content"
): string | null => {
  if (!isNonEmptyString(fileId) || !isNonEmptyString(userId)) {
    return null;
  }

  return `/api/proxy/files/${encodeURIComponent(fileId.trim())}/${variant}?userId=${encodeURIComponent(userId.trim())}`;
};

export const getFilePreviewCandidates = (
  file: FileLike,
  userId?: unknown
): string[] => {
  const thumbnailProxyUrl = buildFileMediaProxyUrl(file.id, userId, "thumbnail");
  const contentProxyUrl = buildFileMediaProxyUrl(file.id, userId, "content");

  if (file.fileType === "IMAGE") {
    return collectAvailableUrls(
      thumbnailProxyUrl,
      contentProxyUrl,
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
      thumbnailProxyUrl,
      file.thumbnailUrl,
      getPublicMinioUrlFromObjectKey(file.thumbnailObjectKey)
    );
  }

  return [];
};

export const getFileSourceCandidates = (
  file: FileLike,
  userId?: unknown
): string[] =>
  collectAvailableUrls(
    buildFileMediaProxyUrl(file.id, userId, "content"),
    file.secureUrl,
    file.cloudinarySecureUrl,
    file.publicUrl,
    file.cloudinaryUrl,
    getPublicMinioUrlFromObjectKey(file.objectKey)
  );

export const resolveFilePreviewUrl = (
  file: FileLike,
  userId?: unknown
): string | null => getFilePreviewCandidates(file, userId)[0] ?? null;

export const resolveFileSourceUrl = (
  file: FileLike,
  userId?: unknown
): string | null => getFileSourceCandidates(file, userId)[0] ?? null;

export const resolvePersistentFileUrl = (
  file: FileLike,
  variant: "content" | "thumbnail" = "content"
): string | null => {
  if (variant === "thumbnail") {
    return (
      getPublicMinioUrlFromObjectKey(file.thumbnailObjectKey) ||
      getPublicMinioUrlFromObjectKey(file.objectKey) ||
      removePresignedQuery(file.thumbnailUrl) ||
      removePresignedQuery(file.publicUrl) ||
      removePresignedQuery(file.cloudinaryUrl) ||
      removePresignedQuery(file.secureUrl) ||
      removePresignedQuery(file.cloudinarySecureUrl)
    );
  }

  return (
    getPublicMinioUrlFromObjectKey(file.objectKey) ||
    removePresignedQuery(file.publicUrl) ||
    removePresignedQuery(file.cloudinaryUrl) ||
    removePresignedQuery(file.secureUrl) ||
    removePresignedQuery(file.cloudinarySecureUrl)
  );
};

export const resolveManagedFileUrl = (
  file: FileLike,
  userId: unknown,
  variant: FileVariant = "content"
): string | null =>
  buildFileMediaProxyUrl(file.id, userId, variant) ||
  resolvePersistentFileUrl(file, variant);

"use client";

import { useEffect, useState, type ReactElement } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGetFilesByUser, useGetFilesByFolder, useGetFoldersByUser } from "@/queries/useFile";
import {
  getFilePreviewCandidates,
  getFileSourceCandidates,
} from "@/lib/file-media";
import type { FileType, FolderType } from "@/schemaValidations/file.schema";
import {
  Folder,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Eye,
  Grid,
  List,
  Video,
  Play,
  Image as ImageIcon,
} from "lucide-react";

type MediaType = "IMAGE" | "VIDEO" | "ALL";

type MediaLibraryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectFile: (file: FileType) => void;
  userId: string;
  mediaType?: MediaType;
  title?: string;
};

type FilePagePayload = {
  content?: FileType[];
  totalPages?: number;
};

type FileListPayload = {
  data?: FileType[] | FilePagePayload;
  pagination?: {
    totalPages?: number;
  };
};

type FileListResponse = {
  payload?: FileListPayload;
};

const DEFAULT_PAGE_SIZE = 10;

const isFilePagePayload = (value: unknown): value is FilePagePayload =>
  !!value && typeof value === "object" && "content" in value;

const getFilesFromResponse = (response?: FileListResponse): FileType[] => {
  const data = response?.payload?.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (isFilePagePayload(data) && Array.isArray(data.content)) {
    return data.content;
  }

  return [];
};

const getTotalPagesFromResponse = (response?: FileListResponse) => {
  const data = response?.payload?.data;
  const totalPages =
    response?.payload?.pagination?.totalPages ||
    (isFilePagePayload(data) ? data.totalPages : undefined);

  return Math.max(totalPages || 1, 1);
};

export default function MediaLibraryDialog({
  open,
  onOpenChange,
  onSelectFile,
  userId,
  mediaType = "ALL",
  title = "Media Library",
}: MediaLibraryDialogProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedLibraryFolder, setSelectedLibraryFolder] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewFallbackState, setPreviewFallbackState] = useState<
    Record<string, { previewIndex?: number; sourceIndex?: number }>
  >({});
  const pageSize = DEFAULT_PAGE_SIZE;

  const { data: foldersData } = useGetFoldersByUser(userId);
  const folders: FolderType[] = foldersData?.payload?.data || [];

  const { data: allFilesData, isLoading: loadingFiles } = useGetFilesByUser(
    userId,
    currentPage,
    pageSize
  );
  const { data: folderFilesData, isLoading: loadingFolderFiles } = useGetFilesByFolder(
    selectedLibraryFolder || "",
    userId,
    currentPage,
    pageSize
  );

  const filesFromAllFiles = getFilesFromResponse(allFilesData);
  const filesFromFolder = getFilesFromResponse(folderFilesData);

  const allFiles = selectedLibraryFolder ? filesFromFolder : filesFromAllFiles;
  const loading = selectedLibraryFolder ? loadingFolderFiles : loadingFiles;
  const totalPages = selectedLibraryFolder
    ? getTotalPagesFromResponse(folderFilesData)
    : getTotalPagesFromResponse(allFilesData);

  // Reset fallback state khi danh sách file thực sự đổi (so theo IDs ổn định).
  const allFilesKey = allFiles.map((f) => f.id).join("|");
  useEffect(() => {
    setPreviewFallbackState({});
  }, [allFilesKey]);

  useEffect(() => {
    if (currentPage > totalPages - 1) {
      setCurrentPage(Math.max(totalPages - 1, 0));
    }
  }, [currentPage, totalPages]);

  const filteredFiles = allFiles.filter((file) => {
    const matchesType = mediaType === "ALL" || file.fileType === mediaType;
    const matchesSearch =
      searchQuery === "" || file.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const nextExpanded = new Set(prev);
      if (nextExpanded.has(folderId)) {
        nextExpanded.delete(folderId);
      } else {
        nextExpanded.add(folderId);
      }
      return nextExpanded;
    });
  };

  const buildFolderTree = (parentId: string | null, level = 0): ReactElement[] => {
    const children = folders.filter(
      (folder) => folder.parentId === parentId || (parentId === null && !folder.parentId)
    );

    return children.map((folder) => {
      const hasChildren = folders.some((childFolder) => childFolder.parentId === folder.id);
      const isExpanded = expandedFolders.has(folder.id);
      const isSelected = selectedLibraryFolder === folder.id;

      return (
        <div key={folder.id}>
          <div
            className={`flex cursor-pointer items-center gap-1 rounded px-2 py-1.5 hover:bg-muted ${
              isSelected ? "bg-muted font-medium" : ""
            }`}
            style={{ marginLeft: `${level * 16}px` }}
          >
            {hasChildren ? (
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  toggleFolder(folder.id);
                }}
                className="p-0.5"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : (
              <div className="w-5" />
            )}
            <Folder className="h-4 w-4 text-primary" />
            <span
              className="flex-1 truncate text-sm"
              onClick={() => {
                setCurrentPage(0);
                setSelectedLibraryFolder(folder.id);
              }}
            >
              {folder.name}
            </span>
            <span className="text-xs text-muted-foreground">{folder.fileCount || 0}</span>
          </div>
          {isExpanded && hasChildren && buildFolderTree(folder.id, level + 1)}
        </div>
      );
    });
  };

  const handleSelectFile = (file: FileType) => {
    onSelectFile(file);
    setCurrentPage(0);
    setSelectedLibraryFolder(null);
    setSearchQuery("");
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setCurrentPage(0);
      setSelectedLibraryFolder(null);
      setSearchQuery("");
      setPreviewFallbackState({});
    }
    onOpenChange(isOpen);
  };

  const getPreviewUrl = (file: FileType) => {
    const previewIndex = previewFallbackState[file.id]?.previewIndex ?? 0;
    return getFilePreviewCandidates(file, userId)[previewIndex] ?? null;
  };

  const getSourceUrl = (file: FileType) => {
    const sourceIndex = previewFallbackState[file.id]?.sourceIndex ?? 0;
    return getFileSourceCandidates(file, userId)[sourceIndex] ?? null;
  };

  const advancePreviewCandidate = (
    fileId: string,
    candidateType: "previewIndex" | "sourceIndex"
  ) => {
    setPreviewFallbackState((current) => ({
      ...current,
      [fileId]: {
        ...current[fileId],
        [candidateType]: (current[fileId]?.[candidateType] ?? 0) + 1,
      },
    }));
  };

  const renderPreviewMedia = (
    file: FileType,
    iconClassName: string,
    mediaClassName: string
  ) => {
    const isVideo = file.fileType === "VIDEO";
    const previewUrl = getPreviewUrl(file);
    const sourceUrl = getSourceUrl(file);

    if (previewUrl) {
      return (
        <img
          src={previewUrl}
          alt={file.name}
          className={mediaClassName}
          onError={() => advancePreviewCandidate(file.id, "previewIndex")}
        />
      );
    }

    if (isVideo && sourceUrl) {
      return (
        <video
          src={sourceUrl}
          className={mediaClassName}
          muted
          playsInline
          preload="metadata"
          onError={() => advancePreviewCandidate(file.id, "sourceIndex")}
        />
      );
    }

    return (
      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
        {isVideo ? <Video className={iconClassName} /> : <ImageIcon className={iconClassName} />}
      </div>
    );
  };

  const renderGridView = () => (
    <div className="grid grid-cols-6 gap-3">
      {filteredFiles.map((file) => {
        const isVideo = file.fileType === "VIDEO";

        return (
          <div
            key={file.id}
            className="group th-hover-lift th-focus-ring relative cursor-pointer overflow-hidden rounded-lg border"
            onClick={() => handleSelectFile(file)}
            tabIndex={0}
            role="button"
          >
            <div className="relative aspect-square bg-muted">
              {renderPreviewMedia(file, "h-8 w-8", "h-full w-full object-cover")}
              <div className="th-interactive-color absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40">
                {isVideo ? (
                  <Play className="th-reveal-on-hover h-8 w-8 text-white" />
                ) : (
                  <Eye className="th-reveal-on-hover h-5 w-5 text-white" />
                )}
              </div>
              {isVideo && file.duration ? (
                <div className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-0.5 text-xs text-white">
                  {Math.floor(file.duration / 60)}:
                  {String(file.duration % 60).padStart(2, "0")}
                </div>
              ) : null}
            </div>
            <div className="bg-background p-2">
              <p className="truncate text-xs font-medium">{file.name}</p>
              <div className="mt-0.5 flex items-center justify-between text-xs text-muted-foreground">
                <span>{(file.fileSize / 1024).toFixed(2)} KB</span>
                {isVideo ? <Video className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-1">
      {filteredFiles.map((file) => {
        const isVideo = file.fileType === "VIDEO";

        return (
          <div
            key={file.id}
            className="flex cursor-pointer items-center gap-3 rounded p-2 hover:bg-muted"
            onClick={() => handleSelectFile(file)}
          >
            <div className="relative h-12 w-12 rounded bg-muted">
              {renderPreviewMedia(file, "h-4 w-4", "h-full w-full rounded object-cover")}
              {isVideo ? (
                <Play className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-white" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{(file.fileSize / 1024).toFixed(2)} KB</span>
                {isVideo && file.duration ? (
                  <span>
                    • {Math.floor(file.duration / 60)}:
                    {String(file.duration % 60).padStart(2, "0")}
                  </span>
                ) : null}
              </div>
            </div>
            {isVideo ? (
              <Video className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[95vh] max-w-[95vw] p-0">
        <div className="flex h-[90vh]">
          <div className="w-64 border-r bg-muted/10">
            <div className="border-b p-4">
              <h3 className="mb-3 text-sm font-semibold">Media</h3>
              <div
                className={`flex cursor-pointer items-center gap-2 rounded px-2 py-2 hover:bg-muted ${
                  selectedLibraryFolder === null ? "bg-muted font-medium" : ""
                }`}
                onClick={() => {
                  setCurrentPage(0);
                  setSelectedLibraryFolder(null);
                }}
              >
                <Folder className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 text-sm">All Media</span>
              </div>
            </div>
            <ScrollArea className="h-[calc(90vh-120px)]">
              <div className="p-2">{buildFolderTree(null)}</div>
            </ScrollArea>
          </div>

          <div className="flex flex-1 flex-col">
            <DialogHeader className="border-b p-4">
              <div className="flex items-center justify-between">
                <DialogTitle>{title}</DialogTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <div className="flex items-center gap-2 border-b p-4">
              <Input
                placeholder={`Search ${
                  mediaType === "IMAGE" ? "images" : mediaType === "VIDEO" ? "videos" : "media"
                }...`}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="max-w-sm"
              />
              <div className="flex-1" />
              <span className="text-sm text-muted-foreground">
                Found: {filteredFiles.length} items
              </span>
            </div>

            <ScrollArea className="flex-1 p-4">
              {loading ? (
                <div className="py-8 text-center">Loading...</div>
              ) : filteredFiles.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No {mediaType === "IMAGE" ? "images" : mediaType === "VIDEO" ? "videos" : "files"} found
                  {selectedLibraryFolder ? " in this folder" : ""}
                  {searchQuery ? " matching your search" : ""}.
                </div>
              ) : viewMode === "grid" ? (
                renderGridView()
              ) : (
                renderListView()
              )}
            </ScrollArea>

            <div className="flex items-center justify-between border-t p-4">
              <div className="text-sm text-muted-foreground">
                Showing {filteredFiles.length} items • Page {currentPage + 1} / {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 text-sm">Page {currentPage + 1}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages - 1, page + 1))}
                  disabled={currentPage >= totalPages - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";
import { useState } from "react";
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
  Folder,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Eye,
  Grid,
  List,
  Video,
  Play,
} from "lucide-react";

type MediaType = 'IMAGE' | 'VIDEO' | 'ALL';

type MediaLibraryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectFile: (file: any) => void;
  userId: string;
  mediaType?: MediaType; // 'IMAGE', 'VIDEO', or 'ALL'
  title?: string;
};

export default function MediaLibraryDialog({
  open,
  onOpenChange,
  onSelectFile,
  userId,
  mediaType = 'ALL',
  title = 'Media Library',
}: MediaLibraryDialogProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedLibraryFolder, setSelectedLibraryFolder] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const pageSize = 54;

  // Fetch folders for sidebar
  const { data: foldersData } = useGetFoldersByUser(userId);
  const folders = foldersData?.payload?.data || [];

  // Fetch files for library
  const { data: allFilesData, isLoading: loadingFiles } = useGetFilesByUser(
    userId,
    currentPage,
    pageSize
  );

  // Fetch files by folder if folder is selected
  const { data: folderFilesData, isLoading: loadingFolderFiles } = useGetFilesByFolder(
    selectedLibraryFolder || '',
    userId
  );

  // Get files from response
  const isPageResponse = allFilesData?.payload?.data && typeof allFilesData.payload.data === 'object' && 'content' in allFilesData.payload.data;
  const filesFromAllFiles = isPageResponse 
    ? (allFilesData.payload.data as any).content || []
    : (Array.isArray(allFilesData?.payload?.data) ? allFilesData.payload.data : []);
  
  const filesFromFolder = Array.isArray(folderFilesData?.payload?.data) ? folderFilesData.payload.data : [];
  
  // Use folder files if folder selected, otherwise use all files
  const allFiles = selectedLibraryFolder ? filesFromFolder : filesFromAllFiles;
  const loading = selectedLibraryFolder ? loadingFolderFiles : loadingFiles;
  
  const totalPages = isPageResponse ? (allFilesData.payload.data as any).totalPages || 1 : 1;
  
  // Filter by file type and search
  const filterFiles = (files: any[]) => {
    return files.filter((file: any) => {
      const matchesType = mediaType === 'ALL' || file.fileType === mediaType;
      const matchesSearch = searchQuery === '' || file.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  };
  
  const filteredFiles = filterFiles(allFiles);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const buildFolderTree = (parentId: string | null, level: number = 0): React.ReactElement[] => {
    const children = folders.filter(
      (f: any) => (f.parentId === parentId) || (parentId === null && !f.parentId)
    );

    return children.map((folder: any) => {
      const hasChildren = folders.some((f: any) => f.parentId === folder.id);
      const isExpanded = expandedFolders.has(folder.id);
      const isSelected = selectedLibraryFolder === folder.id;

      return (
        <div key={folder.id}>
          <div
            className={`flex items-center gap-1 py-1.5 px-2 hover:bg-muted rounded cursor-pointer ${
              isSelected ? 'bg-muted font-medium' : ''
            }`}
            style={{ marginLeft: `${level * 16}px` }}
          >
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder(folder.id);
                }}
                className="p-0.5"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            ) : (
              <div className="w-5" />
            )}
            <Folder className="w-4 h-4 text-blue-500" />
            <span
              className="flex-1 text-sm truncate"
              onClick={() => setSelectedLibraryFolder(folder.id)}
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

  const handleSelectFile = (file: any) => {
    onSelectFile(file);
    // Reset state
    setCurrentPage(0);
    setSelectedLibraryFolder(null);
    setSearchQuery('');
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset state when closing
      setCurrentPage(0);
      setSelectedLibraryFolder(null);
      setSearchQuery('');
    }
    onOpenChange(isOpen);
  };

  const renderGridView = () => (
    <div className="grid grid-cols-6 gap-3">
      {filteredFiles.map((file: any) => {
        const isVideo = file.fileType === 'VIDEO';
        const thumbnailUrl = isVideo 
          ? file.cloudinarySecureUrl.replace(/\.(mp4|mov|avi|webm|mkv)$/i, '.jpg')
          : file.cloudinarySecureUrl;

        return (
          <div
            key={file.id}
            className="group relative border rounded-lg overflow-hidden cursor-pointer hover:border-primary transition-all hover:shadow-md"
            onClick={() => handleSelectFile(file)}
          >
            <div className="aspect-square relative bg-muted">
              <img
                src={thumbnailUrl}
                alt={file.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-image.png';
                }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                {isVideo ? (
                  <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
              {isVideo && file.duration && (
                <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-0.5 rounded text-xs text-white">
                  {Math.floor(file.duration / 60)}:{String(file.duration % 60).padStart(2, '0')}
                </div>
              )}
            </div>
            <div className="p-2 bg-background">
              <p className="text-xs font-medium truncate">{file.name}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-0.5">
                <span>{(file.fileSize / 1024).toFixed(2)} KB</span>
                {isVideo ? <Video className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-1">
      {filteredFiles.map((file: any) => {
        const isVideo = file.fileType === 'VIDEO';
        const thumbnailUrl = isVideo 
          ? file.cloudinarySecureUrl.replace(/\.(mp4|mov|avi|webm|mkv)$/i, '.jpg')
          : file.cloudinarySecureUrl;

        return (
          <div
            key={file.id}
            className="flex items-center gap-3 p-2 hover:bg-muted rounded cursor-pointer"
            onClick={() => handleSelectFile(file)}
          >
            <div className="w-12 h-12 relative bg-muted rounded">
              <img
                src={thumbnailUrl}
                alt={file.name}
                className="w-full h-full object-cover rounded"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-image.png';
                }}
              />
              {isVideo && (
                <Play className="w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{(file.fileSize / 1024).toFixed(2)} KB</span>
                {isVideo && file.duration && (
                  <span>• {Math.floor(file.duration / 60)}:{String(file.duration % 60).padStart(2, '0')}</span>
                )}
              </div>
            </div>
            {isVideo ? <Video className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
          </div>
        );
      })}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
        <div className="flex h-[90vh]">
          {/* Left Sidebar - Folders */}
          <div className="w-64 border-r bg-muted/10">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-sm mb-3">Media</h3>
              <div
                className={`flex items-center gap-2 py-2 px-2 hover:bg-muted rounded cursor-pointer ${
                  selectedLibraryFolder === null ? 'bg-muted font-medium' : ''
                }`}
                onClick={() => setSelectedLibraryFolder(null)}
              >
                <Folder className="w-4 h-4 text-gray-500" />
                <span className="flex-1 text-sm">All Media</span>
              </div>
            </div>
            <ScrollArea className="h-[calc(90vh-120px)]">
              <div className="p-2">
                {buildFolderTree(null)}
              </div>
            </ScrollArea>
          </div>

          {/* Right Content */}
          <div className="flex-1 flex flex-col">
            <DialogHeader className="p-4 border-b">
              <div className="flex items-center justify-between">
                <DialogTitle>{title}</DialogTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>

            {/* Search and Actions */}
            <div className="p-4 border-b flex items-center gap-2">
              <Input
                placeholder={`Search ${mediaType === 'IMAGE' ? 'images' : mediaType === 'VIDEO' ? 'videos' : 'media'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
              <div className="flex-1" />
              <span className="text-sm text-muted-foreground">
                Found: {filteredFiles.length} items
              </span>
            </div>

            {/* Files Grid/List */}
            <ScrollArea className="flex-1 p-4">
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : filteredFiles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No {mediaType === 'IMAGE' ? 'images' : mediaType === 'VIDEO' ? 'videos' : 'files'} found
                  {selectedLibraryFolder ? ' in this folder' : ''}
                  {searchQuery ? ' matching your search' : ''}.
                </div>
              ) : viewMode === 'grid' ? (
                renderGridView()
              ) : (
                renderListView()
              )}
            </ScrollArea>

            {/* Footer with Pagination */}
            <div className="p-4 border-t flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {filteredFiles.length} items • Page {currentPage + 1} / {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm px-3">Page {currentPage + 1}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage >= totalPages - 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleOpenChange(false)}
                >
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

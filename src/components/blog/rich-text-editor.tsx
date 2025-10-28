"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { ResizableImage } from "./tiptap-image-extension";
import { ResizableVideo } from "./tiptap-video-extension";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Code,
  ImageIcon,
  Upload,
  Video,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Heading1,
  Heading2,
  Heading3,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRef, useState } from "react";
import fileApiRequest from "@/apiRequests/file";
import { useAccountProfile } from "@/queries/useAccount";
import { useGetFilesByUser, useGetFilesByFolder, useGetFoldersByUser } from "@/queries/useFile";
import { FolderOpen, ChevronLeft, ChevronRight, Eye, Grid, ChevronDown, ChevronRight as ChevronRightIcon, Folder } from "lucide-react";

const lowlight = createLowlight(common);

type RichTextEditorProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  editable?: boolean;
};

type FileUploadResponse = {
  status: string;
  payload: {
    data: {
      id: string;
      cloudinarySecureUrl: string;
      cloudinaryUrl: string;
      name: string;
      fileType: string;
    };
    status: string;
    message: string;
  };
};

export default function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Start writing... (supports image and video upload from computer or URL)",
  editable = true,
}: RichTextEditorProps) {
  const { data: profileData } = useAccountProfile();
  const userId = profileData?.payload?.data?.id || '';
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showImageLibrary, setShowImageLibrary] = useState(false);
  const [showVideoLibrary, setShowVideoLibrary] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedLibraryFolder, setSelectedLibraryFolder] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  const pageSize = 54; // More items per page like in the image

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

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Underline,
      ResizableImage.configure({
        inline: true,
        allowBase64: false, // Không dùng base64, upload lên cloud
      }),
      ResizableVideo.configure({
        inline: false,
        allowBase64: false,
      }),
      Link.configure({
        openOnClick: false,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content: value,
    editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
    },
  });

  if (!editor) {
    return null;
  }

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
  const filterFiles = (files: any[], type: 'IMAGE' | 'VIDEO') => {
    return files.filter((file: any) => {
      const matchesType = file.fileType === type;
      const matchesSearch = searchQuery === '' || file.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  };
  
  const imageFiles = filterFiles(allFiles, 'IMAGE');
  const videoFiles = filterFiles(allFiles, 'VIDEO');

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
                  <ChevronRightIcon className="w-4 h-4" />
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

  const handleSelectImageFromLibrary = (file: any) => {
    editor.chain().focus().setImage({ src: file.cloudinarySecureUrl }).run();
    setShowImageLibrary(false);
    setCurrentPage(0);
    setSelectedLibraryFolder(null);
    setSearchQuery('');
  };

  const handleSelectVideoFromLibrary = (file: any) => {
    editor
      .chain()
      .focus()
      .setVideo({ src: file.cloudinarySecureUrl, width: 640, height: 360 })
      .run();
    setShowVideoLibrary(false);
    setCurrentPage(0);
    setSelectedLibraryFolder(null);
    setSearchQuery('');
  };

  const openImageLibrary = () => {
    setShowImageLibrary(true);
    setCurrentPage(0);
    setSelectedLibraryFolder(null);
    setSearchQuery('');
  };

  const openVideoLibrary = () => {
    setShowVideoLibrary(true);
    setCurrentPage(0);
    setSelectedLibraryFolder(null);
    setSearchQuery('');
  };

  const addImage = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl("");
      setShowImageInput(false);
    }
  };

  const addLink = () => {
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl("");
      setShowLinkInput(false);
    }
  };

  const addVideoUrl = () => {
    if (videoUrl) {
      // Insert as resizable video node
      editor
        .chain()
        .focus()
        .setVideo({ src: videoUrl, width: 640, height: 360 })
        .run();
      setVideoUrl("");
      setShowVideoInput(false);
    }
  };

  const handleImageFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("Image size must be less than 10MB");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", userId);
      formData.append("tags", "blog,image");
      formData.append("description", "Blog image upload");

      const result = await fileApiRequest.uploadFile(formData);
      
      if (result.status === 200 && result.payload?.data?.cloudinarySecureUrl) {
        editor.chain().focus().setImage({ src: result.payload.data.cloudinarySecureUrl }).run();
        console.log("Image uploaded successfully:", result.payload.data);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to upload image. Please try again."
      );
    } finally {
      setIsUploading(false);
      if (imageFileInputRef.current) {
        imageFileInputRef.current.value = "";
      }
    }
  };

  const handleVideoFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("video/")) {
      alert("Please select a valid video file");
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert("Video size must be less than 50MB");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", userId);
      formData.append("tags", "blog,video");
      formData.append("description", "Blog video upload");

      const result = await fileApiRequest.uploadFile(formData);

      if (result.status === 200 && result.payload?.data?.cloudinarySecureUrl) {
        editor
          .chain()
          .focus()
          .setVideo({ src: result.payload.data.cloudinarySecureUrl, width: 640, height: 360 })
          .run();
        console.log("Video uploaded successfully:", result.payload.data);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Error uploading video:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to upload video. Please try again."
      );
    } finally {
      setIsUploading(false);
      if (videoFileInputRef.current) {
        videoFileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="border rounded-md overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/50">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "bg-muted" : ""}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "bg-muted" : ""}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive("underline") ? "bg-muted" : ""}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={editor.isActive("code") ? "bg-muted" : ""}
        >
          <Code className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive("heading", { level: 1 }) ? "bg-muted" : ""}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive("heading", { level: 2 }) ? "bg-muted" : ""}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive("heading", { level: 3 }) ? "bg-muted" : ""}
        >
          <Heading3 className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive("bulletList") ? "bg-muted" : ""}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive("orderedList") ? "bg-muted" : ""}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive("blockquote") ? "bg-muted" : ""}
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editor.isActive("codeBlock") ? "bg-muted" : ""}
        >
          <Code className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowImageInput(!showImageInput)}
          title="Insert image from URL or upload from computer"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowVideoInput(!showVideoInput)}
          title="Insert video from URL or upload from computer"
        >
          <Video className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowLinkInput(!showLinkInput)}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={imageFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageFileSelect}
        className="hidden"
      />
      <input
        ref={videoFileInputRef}
        type="file"
        accept="video/*"
        onChange={handleVideoFileSelect}
        className="hidden"
      />

      {/* Image URL Input */}
      {showImageInput && (
        <div className="space-y-2 p-2 border-b bg-muted/30">
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="Enter image URL"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addImage()}
            />
            <Button type="button" size="sm" onClick={addImage}>
              Add URL
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="flex-1"
              onClick={() => imageFileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-1" />
              {isUploading ? "Uploading..." : "Upload from Computer"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="flex-1"
              onClick={openImageLibrary}
            >
              <FolderOpen className="h-4 w-4 mr-1" />
              Choose from Library
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setShowImageInput(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Video URL Input */}
      {showVideoInput && (
        <div className="space-y-2 p-2 border-b bg-muted/30">
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="Enter video URL"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addVideoUrl()}
            />
            <Button type="button" size="sm" onClick={addVideoUrl}>
              Add URL
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="flex-1"
              onClick={() => videoFileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-1" />
              {isUploading ? "Uploading..." : "Upload from Computer"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="flex-1"
              onClick={openVideoLibrary}
            >
              <FolderOpen className="h-4 w-4 mr-1" />
              Choose from Library
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setShowVideoInput(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Link URL Input */}
      {showLinkInput && (
        <div className="flex gap-2 p-2 border-b bg-muted/30">
          <Input
            type="url"
            placeholder="Enter link URL"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addLink()}
          />
          <Button type="button" size="sm" onClick={addLink}>
            Add
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setShowLinkInput(false)}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Image Library Dialog */}
      <Dialog open={showImageLibrary} onOpenChange={setShowImageLibrary}>
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
                  <DialogTitle>Image Library</DialogTitle>
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
                  placeholder="Search images..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
                <div className="flex-1" />
                <span className="text-sm text-muted-foreground">
                  Selected: 0/{imageFiles.length}
                </span>
              </div>

              {/* Files Grid */}
              <ScrollArea className="flex-1 p-4">
                {loading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : imageFiles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No images found{selectedLibraryFolder ? ' in this folder' : ''}. Upload some images first.
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-6 gap-3">
                    {imageFiles.map((file: any) => (
                      <div
                        key={file.id}
                        className="group relative border rounded-lg overflow-hidden cursor-pointer hover:border-primary transition-all hover:shadow-md"
                        onClick={() => handleSelectImageFromLibrary(file)}
                      >
                        <div className="aspect-square relative bg-muted">
                          <img
                            src={file.cloudinarySecureUrl}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                            <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100">
                            <input type="checkbox" className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="p-2 bg-background">
                          <p className="text-xs font-medium truncate">{file.name}</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground mt-0.5">
                            <span>{(file.fileSize / 1024).toFixed(2)} KB</span>
                            <Eye className="w-3 h-3" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {imageFiles.map((file: any) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-3 p-2 hover:bg-muted rounded cursor-pointer"
                        onClick={() => handleSelectImageFromLibrary(file)}
                      >
                        <div className="w-12 h-12 relative bg-muted rounded">
                          <img
                            src={file.cloudinarySecureUrl}
                            alt={file.name}
                            className="w-full h-full object-cover rounded"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.fileSize / 1024).toFixed(2)} KB
                          </p>
                        </div>
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Footer with Pagination */}
              <div className="p-4 border-t flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {imageFiles.length} items • Page {currentPage + 1} / {totalPages}
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
                  <Button variant="outline" size="sm">
                    Cancel
                  </Button>
                  <Button size="sm" disabled>
                    Select (0)
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Library Dialog */}
      <Dialog open={showVideoLibrary} onOpenChange={setShowVideoLibrary}>
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
                  <DialogTitle>Video Library</DialogTitle>
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
                  placeholder="Search videos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
                <div className="flex-1" />
                <span className="text-sm text-muted-foreground">
                  Selected: 0/{videoFiles.length}
                </span>
              </div>

              {/* Files Grid */}
              <ScrollArea className="flex-1 p-4">
                {loading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : videoFiles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No videos found{selectedLibraryFolder ? ' in this folder' : ''}. Upload some videos first.
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-6 gap-3">
                    {videoFiles.map((file: any) => {
                      const thumbnailUrl = file.cloudinarySecureUrl.replace(/\.(mp4|mov|avi|webm|mkv)$/i, '.jpg');
                      return (
                        <div
                          key={file.id}
                          className="group relative border rounded-lg overflow-hidden cursor-pointer hover:border-primary transition-all hover:shadow-md"
                          onClick={() => handleSelectVideoFromLibrary(file)}
                        >
                          <div className="aspect-square relative bg-muted">
                            <img
                              src={thumbnailUrl}
                              alt={file.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/placeholder-video.png';
                              }}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                              <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100">
                              <input type="checkbox" className="w-4 h-4" />
                            </div>
                            <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-0.5 rounded text-xs text-white">
                              {file.duration ? `${Math.floor(file.duration / 60)}:${String(file.duration % 60).padStart(2, '0')}` : 'N/A'}
                            </div>
                          </div>
                          <div className="p-2 bg-background">
                            <p className="text-xs font-medium truncate">{file.name}</p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground mt-0.5">
                              <span>{(file.fileSize / 1024).toFixed(2)} KB</span>
                              <Video className="w-3 h-3" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {videoFiles.map((file: any) => {
                      const thumbnailUrl = file.cloudinarySecureUrl.replace(/\.(mp4|mov|avi|webm|mkv)$/i, '.jpg');
                      return (
                        <div
                          key={file.id}
                          className="flex items-center gap-3 p-2 hover:bg-muted rounded cursor-pointer"
                          onClick={() => handleSelectVideoFromLibrary(file)}
                        >
                          <div className="w-12 h-12 relative bg-muted rounded">
                            <img
                              src={thumbnailUrl}
                              alt={file.name}
                              className="w-full h-full object-cover rounded"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/placeholder-video.png';
                              }}
                            />
                            <Play className="w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{(file.fileSize / 1024).toFixed(2)} KB</span>
                              {file.duration && (
                                <span>• {Math.floor(file.duration / 60)}:{String(file.duration % 60).padStart(2, '0')}</span>
                              )}
                            </div>
                          </div>
                          <Video className="w-4 h-4 text-muted-foreground" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>

              {/* Footer with Pagination */}
              <div className="p-4 border-t flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {videoFiles.length} items • Page {currentPage + 1} / {totalPages}
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
                  <Button variant="outline" size="sm">
                    Cancel
                  </Button>
                  <Button size="sm" disabled>
                    Select (0)
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Editor Content */}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-4 min-h-[300px] focus:outline-none"
      />
    </div>
  );
}

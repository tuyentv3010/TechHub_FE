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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRef, useState } from "react";
import fileApiRequest from "@/apiRequests/file";
import { useAccountProfile } from "@/queries/useAccount";
import { useGetFilesByUser } from "@/queries/useFile";
import { FolderOpen, ChevronLeft, ChevronRight, Eye } from "lucide-react";

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
  const [isUploading, setIsUploading] = useState(false);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  const pageSize = 12; // 12 items per page (4 columns x 3 rows)

  // Fetch files for library
  const { data: allFilesData, isLoading: loadingFiles } = useGetFilesByUser(
    userId,
    currentPage,
    pageSize
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
  const allFiles = isPageResponse 
    ? (allFilesData.payload.data as any).content || []
    : (Array.isArray(allFilesData?.payload?.data) ? allFilesData.payload.data : []);
  
  const totalPages = isPageResponse ? (allFilesData.payload.data as any).totalPages || 1 : 1;
  
  // Filter by file type
  const imageFiles = allFiles.filter((file: any) => file.fileType === 'IMAGE');
  const videoFiles = allFiles.filter((file: any) => file.fileType === 'VIDEO');

  const handleSelectImageFromLibrary = (file: any) => {
    editor.chain().focus().setImage({ src: file.cloudinarySecureUrl }).run();
    setShowImageLibrary(false);
    setCurrentPage(0);
  };

  const handleSelectVideoFromLibrary = (file: any) => {
    editor
      .chain()
      .focus()
      .setVideo({ src: file.cloudinarySecureUrl, width: 640, height: 360 })
      .run();
    setShowVideoLibrary(false);
    setCurrentPage(0);
  };

  const openImageLibrary = () => {
    setShowImageLibrary(true);
    setCurrentPage(0);
  };

  const openVideoLibrary = () => {
    setShowVideoLibrary(true);
    setCurrentPage(0);
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
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Media Library - Images</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col h-[70vh]">
            {/* Search and filter */}
            <div className="mb-4">
              <Input
                placeholder="Search images..."
                className="max-w-sm"
              />
            </div>

            {/* Files Grid */}
            <div className="flex-1 overflow-y-auto">
              {loadingFiles ? (
                <div className="text-center py-8">Loading...</div>
              ) : imageFiles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No images found. Upload some images first.
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-4">
                  {imageFiles.map((file: any) => (
                    <div
                      key={file.id}
                      className="group relative border rounded-lg overflow-hidden cursor-pointer hover:border-primary transition-all hover:shadow-lg"
                      onClick={() => handleSelectImageFromLibrary(file)}
                    >
                      <div className="aspect-square relative bg-muted">
                        <img
                          src={file.cloudinarySecureUrl}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                          <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      <div className="p-2 bg-background">
                        <p className="text-xs font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.fileSize / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Library Dialog */}
      <Dialog open={showVideoLibrary} onOpenChange={setShowVideoLibrary}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Media Library - Videos</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col h-[70vh]">
            {/* Search and filter */}
            <div className="mb-4">
              <Input
                placeholder="Search videos..."
                className="max-w-sm"
              />
            </div>

            {/* Files Grid */}
            <div className="flex-1 overflow-y-auto">
              {loadingFiles ? (
                <div className="text-center py-8">Loading...</div>
              ) : videoFiles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No videos found. Upload some videos first.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {videoFiles.map((file: any) => (
                    <div
                      key={file.id}
                      className="group relative border rounded-lg overflow-hidden cursor-pointer hover:border-primary transition-all hover:shadow-lg"
                      onClick={() => handleSelectVideoFromLibrary(file)}
                    >
                      <div className="aspect-video relative bg-muted">
                        <video
                          src={file.cloudinarySecureUrl}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                          <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      <div className="p-2 bg-background">
                        <p className="text-xs font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                          {file.duration && ` • ${Math.floor(file.duration / 60)}:${String(file.duration % 60).padStart(2, '0')}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
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

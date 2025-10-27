"use client";

import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading2,
  Image as ImageIcon,
  Italic,
  List,
  ListOrdered,
  Loader2,
  Quote,
  Redo2,
  Undo2,
  X,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { addTagToList, normalizeTags } from "@/lib/blog";
import type {
  Blog,
  BlogStatus,
  CreateBlogBody,
  UpdateBlogBody,
} from "@/types/blog.types";

type AttachmentForm = {
  type: "image" | "pdf";
  url: string;
  caption?: string;
  altText?: string;
};

type BlogEditorDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  availableTags: string[];
  initialBlog?: Blog;
  isSubmitting: boolean;
  onClose: () => void;
  onCreate: (payload: CreateBlogBody) => void;
  onUpdate: (id: string, payload: UpdateBlogBody) => void;
};

const statusOptions: BlogStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

const cleanHtml = (value: string) => value.replace(/<p><\/p>/g, "").trim();

const MenuBar = ({
  editor,
  onInsertImage,
}: {
  editor: ReturnType<typeof useEditor>;
  onInsertImage: () => void;
}) => {
  if (!editor) {
    return null;
  }

  const ToolbarButton = ({
    icon: Icon,
    onClick,
    ariaLabel,
    active,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    ariaLabel: string;
    active?: boolean;
  }) => (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="icon"
      aria-label={ariaLabel}
      onClick={onClick}
      className="h-9 w-9"
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-muted/40 bg-muted/40 p-2">
      <ToolbarButton
        icon={Bold}
        ariaLabel="Bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        icon={Italic}
        ariaLabel="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        icon={Heading2}
        ariaLabel="Heading level 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
      />
      <ToolbarButton
        icon={List}
        ariaLabel="Bullet list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        icon={ListOrdered}
        ariaLabel="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <ToolbarButton
        icon={Quote}
        ariaLabel="Blockquote"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />
      <ToolbarButton
        icon={ImageIcon}
        ariaLabel="Insert image"
        onClick={onInsertImage}
      />
      <Separator orientation="vertical" className="h-6" />
      <ToolbarButton
        icon={Undo2}
        ariaLabel="Undo"
        onClick={() => editor.chain().focus().undo().run()}
      />
      <ToolbarButton
        icon={Redo2}
        ariaLabel="Redo"
        onClick={() => editor.chain().focus().redo().run()}
      />
    </div>
  );
};

const createEditor = (content?: string) =>
  useEditor({
    extensions: [StarterKit],
    content: content ?? "<p></p>",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[320px] rounded-lg border border-muted/40 bg-background p-4 focus:outline-none dark:prose-invert",
      },
    },
  });

export default function BlogEditorDialog({
  open,
  mode,
  availableTags,
  initialBlog,
  isSubmitting,
  onClose,
  onCreate,
  onUpdate,
}: BlogEditorDialogProps) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<BlogStatus>("DRAFT");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [attachments, setAttachments] = useState<AttachmentForm[]>([]);
  const [error, setError] = useState<string | null>(null);

  const editor = createEditor(initialBlog?.content);

  useEffect(() => {
    if (!open) {
      return;
    }

    setTitle(initialBlog?.title ?? "");
    setStatus(initialBlog?.status ?? "DRAFT");
    setTags(normalizeTags(initialBlog?.tags ?? []));
    setAttachments(
      initialBlog?.attachments?.map((item) => ({
        type: item.type as AttachmentForm["type"],
        url: item.url ?? "",
        caption: item.caption ?? "",
        altText: item.altText ?? "",
      })) ?? []
    );
    setTagInput("");
    setError(null);
    if (editor) {
      editor.commands.setContent(initialBlog?.content ?? "<p></p>");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialBlog]);

  const suggestedTags = normalizeTags(availableTags).filter(
    (tag) => !tags.includes(tag)
  );

  const handleAddTag = () => {
    if (!tagInput.trim()) {
      return;
    }
    setTags((prev) => addTagToList(prev, tagInput));
    setTagInput("");
  };

  const handleRemoveTag = (tag: string) => {
    setTags((prev) => prev.filter((item) => item !== tag));
  };

  const updateAttachment = (
    index: number,
    field: keyof AttachmentForm,
    value: string
  ) => {
    setAttachments((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const addAttachment = () => {
    setAttachments((prev) => [
      ...prev,
      { type: "image", url: "", caption: "", altText: "" },
    ]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleInsertImage = () => {
    if (!editor) {
      return;
    }
    const url = window.prompt("Image URL");
    if (!url) {
      return;
    }
    const alt = window.prompt("Image description (optional)") ?? "";
    editor
      .chain()
      .focus()
      .insertContent(
        `<figure><img src="${url}" alt="${alt || title || "blog image"}" /><figcaption>${
          alt || ""
        }</figcaption></figure>`
      )
      .run();
  };

  const handleSubmit = () => {
    if (!editor) {
      return;
    }
    const content = cleanHtml(editor.getHTML());
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError("Title cannot be empty.");
      return;
    }

    if (!content) {
      setError("Content cannot be empty.");
      return;
    }

    const cleanedAttachments = attachments
      .filter((item) => item.url.trim())
      .map((item) => ({
        type: item.type,
        url: item.url.trim(),
        caption: item.caption?.trim() || undefined,
        altText:
          item.type === "image"
            ? item.altText?.trim() ||
              item.caption?.trim() ||
              trimmedTitle
            : undefined,
      }));

    const payload = {
      title: trimmedTitle,
      content,
      status,
      tags,
      attachments: cleanedAttachments,
    };

    if (mode === "create") {
      onCreate(payload);
    } else if (initialBlog) {
      onUpdate(initialBlog.id, payload);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => (!value ? onClose() : null)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create article" : "Edit article"}
          </DialogTitle>
          <DialogDescription>
            Craft your content, manage tags and attachments, then choose when to
            publish.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Enter a headline that tells the story"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as BlogStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option === "DRAFT"
                        ? "Draft"
                        : option === "PUBLISHED"
                        ? "Published"
                        : "Archived"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Add tag</label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  placeholder="Add a tag and press Enter"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" variant="secondary" onClick={handleAddTag}>
                  Add
                </Button>
              </div>
              {suggestedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {suggestedTags.slice(0, 10).map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="cursor-pointer rounded-full"
                      onClick={() => setTags((prev) => addTagToList(prev, tag))}
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {tags.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Selected tags</label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="flex items-center gap-1 rounded-full"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-muted-foreground transition hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <label className="text-sm font-medium">Content</label>
            <MenuBar editor={editor} onInsertImage={handleInsertImage} />
            <EditorContent editor={editor} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Attachments</label>
              <Button type="button" variant="outline" size="sm" onClick={addAttachment}>
                Add file
              </Button>
            </div>
            {attachments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No attachments yet. Add image or PDF resources if needed.
              </p>
            ) : (
              <div className="space-y-4">
                {attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="space-y-3 rounded-xl border border-muted/40 bg-muted/20 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">File #{index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-5">
                      <div className="md:col-span-1">
                        <Select
                          value={attachment.type}
                          onValueChange={(value) =>
                            updateAttachment(index, "type", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="image">Image</SelectItem>
                            <SelectItem value="pdf">PDF</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-3 md:col-span-4">
                        <Input
                          placeholder="File URL"
                          value={attachment.url}
                          onChange={(event) =>
                            updateAttachment(index, "url", event.target.value)
                          }
                        />
                        <div className="grid gap-3 md:grid-cols-2">
                          <Input
                            placeholder="Caption (optional)"
                            value={attachment.caption ?? ""}
                            onChange={(event) =>
                              updateAttachment(index, "caption", event.target.value)
                            }
                          />
                          {attachment.type === "image" && (
                            <Input
                              placeholder="Alt text (optional)"
                              value={attachment.altText ?? ""}
                              onChange={(event) =>
                                updateAttachment(index, "altText", event.target.value)
                              }
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-3 pt-4 md:flex-row md:items-center md:justify-between">
          {error && <span className="text-sm text-destructive">{error}</span>}
          <div className="flex w-full items-center justify-end gap-3 md:w-auto">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {mode === "create" ? "Create" : "Save changes"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

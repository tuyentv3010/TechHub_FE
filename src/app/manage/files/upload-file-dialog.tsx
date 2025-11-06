'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { useUploadFileMutation } from '@/queries/useFile';
import { useAccountProfile } from '@/queries/useAccount';

interface UploadFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  selectedFolderId?: string | null;
}

export default function UploadFileDialog({
  open,
  onOpenChange,
  onSuccess,
  selectedFolderId,
}: UploadFileDialogProps) {
  const { toast } = useToast();
  const { data: profileData } = useAccountProfile();
  const userId = profileData?.payload?.data?.id || '';

  // Debug logs
  console.log('🔍 UploadDialog - profileData:', profileData);
  console.log('🔍 UploadDialog - userId:', userId);
  console.log('🔍 UploadDialog - selectedFolderId:', selectedFolderId);

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [tags, setTags] = useState<string>('');
  const [description, setDescription] = useState('');

  const uploadMutation = useUploadFileMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(selectedFiles);

    // Generate previews for images
    const newPreviews: string[] = [];
    selectedFiles.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
          if (newPreviews.length === selectedFiles.length) {
            setPreviews(newPreviews);
          }
        };
        reader.readAsDataURL(file);
      } else {
        newPreviews.push('');
      }
    });
  };

  const handleUpload = async () => {
    console.log('🚀 Starting upload...', { files: files.length, userId, selectedFolderId });

    if (files.length === 0) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng chọn file để tải lên',
        variant: 'destructive',
      });
      return;
    }

    if (!userId) {
      console.error('❌ No userId found!', { profileData });
      toast({
        title: 'Lỗi',
        description: 'Không tìm thấy thông tin người dùng',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Upload each file
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userId);
        if (selectedFolderId) {
          formData.append('folderId', selectedFolderId);
        }
        if (tags) {
          // Send tags as comma-separated string
          formData.append('tags', tags);
        }
        if (description) {
          formData.append('description', description);
        }

        console.log('📤 Uploading file:', file.name, {
          userId,
          folderId: selectedFolderId,
          tags,
          description,
        });

        const result = await uploadMutation.mutateAsync(formData);
        console.log('✅ Upload success:', result);
      }

      toast({
        title: 'Thành công',
        description: `Đã tải lên ${files.length} file thành công`,
      });

      // Reset form
      setFiles([]);
      setPreviews([]);
      setTags('');
      setDescription('');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('❌ Error uploading files:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải file lên',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const tagArray = tags
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tải lên file</DialogTitle>
          <DialogDescription>
            Chọn file để tải lên. Hỗ trợ hình ảnh, video, tài liệu, âm thanh.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Input */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">Chọn file</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file-upload"
                type="file"
                multiple
                onChange={handleFileChange}
                className="flex-1"
              />
              {files.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setFiles([]);
                    setPreviews([]);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* File Previews */}
          {files.length > 0 && (
            <div className="space-y-2">
              <Label>Danh sách file ({files.length})</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {files.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-lg border overflow-hidden bg-muted">
                      {previews[index] ? (
                        <Image
                          src={previews[index]}
                          alt={file.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Upload className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveFile(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {file.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags Input */}
          <div className="space-y-2">
            <Label htmlFor="tags">
              Tags <span className="text-muted-foreground text-sm">(Cách nhau bởi dấu phẩy)</span>
            </Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="ví dụ: blog, 2024, featured"
            />
            {tagArray.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {tagArray.map((tag, idx) => (
                  <Badge key={idx} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập mô tả cho file..."
              rows={3}
            />
          </div>

          {/* Folder Info */}
          {selectedFolderId && (
            <div className="text-sm text-muted-foreground">
              File sẽ được tải lên vào thư mục đã chọn
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={uploadMutation.isPending}
          >
            Hủy
          </Button>
          <Button
            onClick={handleUpload}
            disabled={uploadMutation.isPending || files.length === 0}
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang tải lên...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Tải lên {files.length > 0 && `(${files.length})`}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

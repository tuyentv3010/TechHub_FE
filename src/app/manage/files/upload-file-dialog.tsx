'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Loader2, Upload, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
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
import { useAccountProfile } from '@/queries/useAccount';
import { useUploadFileMutation } from '@/queries/useFile';

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
  const t = useTranslations('ManageFile');
  const { toast } = useToast();
  const { data: profileData } = useAccountProfile();
  const userId = profileData?.payload?.data?.id || '';

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [tags, setTags] = useState('');
  const [description, setDescription] = useState('');

  const uploadMutation = useUploadFileMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(selectedFiles);

    const nextPreviews: string[] = [];
    selectedFiles.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        nextPreviews.push('');
        if (nextPreviews.length === selectedFiles.length) setPreviews(nextPreviews);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        nextPreviews.push(reader.result as string);
        if (nextPreviews.length === selectedFiles.length) {
          setPreviews(nextPreviews);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        title: t('ErrorTitle'),
        description: t('UploadRequired'),
        variant: 'destructive',
      });
      return;
    }

    if (!userId) {
      toast({
        title: t('ErrorTitle'),
        description: t('MissingUserInfo'),
        variant: 'destructive',
      });
      return;
    }

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userId);
        formData.append('uploadSource', 'MANAGE_FILES');
        if (selectedFolderId) formData.append('folderId', selectedFolderId);
        if (tags) formData.append('tags', tags);
        if (description) formData.append('description', description);
        await uploadMutation.mutateAsync(formData);
      }

      toast({
        title: t('SuccessTitle'),
        description: t('UploadCompleted', { count: files.length }),
      });
      setFiles([]);
      setPreviews([]);
      setTags('');
      setDescription('');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: t('ErrorTitle'),
        description: t('UploadFailed'),
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
    .map((tag) => tag.trim())
    .filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="manage-dialog-panel max-w-2xl max-h-[90vh] overflow-y-auto rounded-[1.35rem] border-border/50">
        <DialogHeader>
          <DialogTitle>{t('UploadDialogTitle')}</DialogTitle>
          <DialogDescription>{t('UploadDialogDescription')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file-upload">{t('SelectFilesLabel')}</Label>
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
                  className="manage-secondary-button"
                  size="icon"
                  onClick={() => {
                    setFiles([]);
                    setPreviews([]);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <Label>{t('FileListLabel', { count: files.length })}</Label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {files.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="group relative">
                    <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
                      {previews[index] ? (
                        <Image src={previews[index]} alt={file.name} fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => handleRemoveFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{file.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="tags">
              {t('TagsLabel')} <span className="text-sm text-muted-foreground">{t('TagsHint')}</span>
            </Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder={t('TagsPlaceholder')}
            />
            {tagArray.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tagArray.map((tag, idx) => (
                  <Badge key={`${tag}-${idx}`} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('DescriptionLabel')}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('DescriptionPlaceholder')}
              rows={3}
            />
          </div>

          {selectedFolderId && (
            <div className="text-sm text-muted-foreground">{t('UploadTargetHint')}</div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="manage-secondary-button"
            onClick={() => onOpenChange(false)}
            disabled={uploadMutation.isPending}
          >
            {t('Cancel')}
          </Button>
          <Button
            onClick={handleUpload}
            className="manage-primary-button"
            disabled={uploadMutation.isPending || files.length === 0}
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('Uploading')}
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {t('Upload')} {files.length > 0 && `(${files.length})`}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

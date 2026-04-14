'use client';

import { useState } from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { enUS, ja, vi } from 'date-fns/locale';
import { useLocale, useTranslations } from 'next-intl';
import {
  File,
  Image as ImageIcon,
  Video,
  FileText,
  Music,
  Upload,
  Search,
  FolderOpen,
  MoreHorizontal,
  Eye,
  Download,
  Trash2,
} from 'lucide-react';

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAccountProfile } from '@/queries/useAccount';
import {
  useDeleteFileMutation,
  useGetFileStatistics,
  useGetFilesByFolder,
  useGetFilesByUser,
} from '@/queries/useFile';
import type { FileType } from '@/schemaValidations/file.schema';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';

import FolderTreeDialog from './folder-tree-dialog';
import UploadFileDialog from './upload-file-dialog';

const FILE_TYPE_ICONS = {
  IMAGE: ImageIcon,
  VIDEO: Video,
  DOCUMENT: FileText,
  AUDIO: Music,
  OTHER: File,
};

const FILE_TYPE_COLORS = {
  IMAGE: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-100',
  VIDEO: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-100',
  DOCUMENT: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-100',
  AUDIO: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-100',
  OTHER: 'bg-slate-200 text-slate-700 dark:bg-slate-500/15 dark:text-slate-100',
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const getDateLocale = (locale: string) => {
  if (locale === 'ja') return ja;
  if (locale === 'en') return enUS;
  return vi;
};

const getProcessingBadgeVariant = (
  status?: string | null
): 'secondary' | 'destructive' | 'outline' => {
  if (status === 'FAILED') return 'destructive';
  if (status === 'READY') return 'secondary';
  return 'outline';
};

const getFilePreviewUrl = (file: FileType) => {
  if (file.fileType === 'VIDEO') {
    return file.thumbnailUrl || '/placeholder-image.png';
  }
  return file.secureUrl || file.publicUrl || file.cloudinarySecureUrl;
};

const getFileSourceUrl = (file: FileType) =>
  file.secureUrl || file.publicUrl || file.cloudinarySecureUrl || '';

export default function FileTable() {
  const t = useTranslations('ManageFile');
  const locale = useLocale();
  const { toast } = useToast();
  const { data: profileData } = useAccountProfile();
  const { hasPermission } = usePermissions();
  const userId = profileData?.payload?.data?.id || '';

  const canUploadFiles = hasPermission('POST', '/api/files/upload');
  const canDeleteFiles = hasPermission('DELETE', '/api/files');
  const canDownloadFiles = hasPermission('GET', '/api/files/download');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedFolderName, setSelectedFolderName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<FileType | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileType | null>(null);
  const [videoPreviewErrors, setVideoPreviewErrors] = useState<Record<string, boolean>>({});

  const { data: userFilesData, isLoading: loadingUserFiles } = useGetFilesByUser(userId, 0, 100);
  const { data: folderFilesData, isLoading: loadingFolderFiles } = useGetFilesByFolder(
    selectedFolder || '',
    userId
  );
  const { data: statisticsData } = useGetFileStatistics(userId);
  const deleteFileMutation = useDeleteFileMutation();

  const isPageResponse =
    userFilesData?.payload?.data &&
    typeof userFilesData.payload.data === 'object' &&
    'content' in userFilesData.payload.data;

  const filesFromUser = isPageResponse
    ? (userFilesData.payload.data as any).content
    : Array.isArray(userFilesData?.payload?.data)
      ? userFilesData.payload.data
      : [];

  const filesFromFolder = Array.isArray(folderFilesData?.payload?.data)
    ? folderFilesData.payload.data
    : [];

  const files: FileType[] = selectedFolder ? filesFromFolder : filesFromUser;
  const statistics = statisticsData?.payload?.data;
  const loading = selectedFolder ? loadingFolderFiles : loadingUserFiles;
  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFileTypeLabel = (type: FileType['fileType']) => t(`FileType.${type}`);
  const getProcessingStatusLabel = (status?: string | null) =>
    status ? t(`ProcessingStatus.${status}`) : '';

  const handleDelete = async () => {
    if (!fileToDelete || !userId) return;
    if (!canDeleteFiles) {
      toast({
        title: t('PermissionDeniedTitle'),
        description: t('DeletePermissionDenied'),
        variant: 'destructive',
      });
      return;
    }

    try {
      await deleteFileMutation.mutateAsync({ id: fileToDelete.id, userId });
      toast({ title: t('SuccessTitle'), description: t('DeleteSuccess') });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: t('ErrorTitle'),
        description: t('DeleteError'),
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setFileToDelete(null);
    }
  };

  const handleDownload = async (file: FileType) => {
    if (!canDownloadFiles) {
      toast({
        title: t('PermissionDeniedTitle'),
        description: t('DownloadPermissionDenied'),
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(getFileSourceUrl(file));
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.originalName || file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({ title: t('SuccessTitle'), description: t('DownloadSuccess') });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: t('ErrorTitle'),
        description: t('DownloadError'),
        variant: 'destructive',
      });
    }
  };

  const FileTypeIcon = ({
    type,
    className,
  }: {
    type: FileType['fileType'];
    className?: string;
  }) => {
    const Icon = FILE_TYPE_ICONS[type];
    return <Icon className={cn('h-5 w-5', className)} />;
  };

  return (
    <div className="manage-data-table">
      {statistics && (
        <div className="manage-kpi-grid">
          {[
            { label: t('TotalFiles'), value: statistics.totalFiles, icon: File, tone: 'text-muted-foreground' },
            { label: t('TotalSize'), value: formatFileSize(statistics.totalSize), icon: Upload, tone: 'text-muted-foreground' },
            { label: t('Images'), value: statistics.byType.IMAGE?.count || 0, icon: ImageIcon, tone: 'text-blue-500' },
            { label: t('Videos'), value: statistics.byType.VIDEO?.count || 0, icon: Video, tone: 'text-purple-500' },
          ].map((item) => (
            <div key={item.label} className="manage-kpi-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="text-2xl font-bold">{item.value}</p>
                </div>
                <item.icon className={`h-8 w-8 ${item.tone}`} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="manage-toolbar">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('SearchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="manage-field pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setFolderDialogOpen(true)}
            className="manage-secondary-button"
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            {selectedFolder && selectedFolderName ? selectedFolderName : t('AllFolders')}
          </Button>
        </div>
        <Button
          onClick={() => setUploadDialogOpen(true)}
          disabled={!canUploadFiles}
          title={!canUploadFiles ? t('UploadPermissionDenied') : undefined}
          className="manage-primary-button"
        >
          <Upload className="mr-2 h-4 w-4" />
          {t('Upload')}
        </Button>
      </div>

      <div className="manage-table-shell">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">{t('PreviewColumn')}</TableHead>
              <TableHead>{t('FileNameColumn')}</TableHead>
              <TableHead>{t('TypeColumn')}</TableHead>
              <TableHead>{t('SizeColumn')}</TableHead>
              <TableHead>{t('FolderColumn')}</TableHead>
              <TableHead>{t('CreatedAtColumn')}</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center">{t('Loading')}</TableCell>
              </TableRow>
            ) : filteredFiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center">{t('EmptyState')}</TableCell>
              </TableRow>
            ) : (
              filteredFiles.map((file) => (
                <TableRow key={file.id}>
                  <TableCell>
                    <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 shadow-inner dark:border-white/10 dark:bg-slate-800/90">
                      {file.fileType === 'IMAGE' ? (
                        <Image src={getFilePreviewUrl(file)} alt={file.name} fill className="object-cover" />
                      ) : file.fileType === 'VIDEO' &&
                        !videoPreviewErrors[file.id] &&
                        getFilePreviewUrl(file) !== '/placeholder-image.png' ? (
                        <Image
                          src={getFilePreviewUrl(file)}
                          alt={file.name}
                          fill
                          className="object-cover"
                          onError={() =>
                            setVideoPreviewErrors((current) => ({ ...current, [file.id]: true }))
                          }
                        />
                      ) : (
                        <div className={cn('flex h-full w-full items-center justify-center', FILE_TYPE_COLORS[file.fileType])}>
                          <FileTypeIcon type={file.fileType} className="h-7 w-7" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[300px]">
                      <p className="truncate font-medium">{file.name}</p>
                      {file.fileType === 'VIDEO' && file.processingStatus && file.processingStatus !== 'READY' && (
                        <Badge variant={getProcessingBadgeVariant(file.processingStatus)} className="mt-1 text-xs">
                          {getProcessingStatusLabel(file.processingStatus)}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-slate-200 bg-white/70 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-100">
                      <FileTypeIcon type={file.fileType} />
                      <span className="ml-1">{getFileTypeLabel(file.fileType)}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>{formatFileSize(file.fileSize)}</TableCell>
                  <TableCell>
                    {file.folderName ? (
                      <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-100">
                        {file.folderName}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">{t('RootFolder')}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(file.created), { addSuffix: true, locale: getDateLocale(locale) })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-slate-600 hover:bg-slate-900/5 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{t('Actions')}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setPreviewFile(file)}>
                          <Eye className="mr-2 h-4 w-4" />
                          {t('PreviewAction')}
                        </DropdownMenuItem>
                        {canDownloadFiles && (
                          <DropdownMenuItem onClick={() => handleDownload(file)}>
                            <Download className="mr-2 h-4 w-4" />
                            {t('DownloadAction')}
                          </DropdownMenuItem>
                        )}
                        {canDeleteFiles && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setFileToDelete(file);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t('DeleteAction')}
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <UploadFileDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onSuccess={() => {}}
        selectedFolderId={selectedFolder}
      />

      <FolderTreeDialog
        open={folderDialogOpen}
        onOpenChange={setFolderDialogOpen}
        onSelectFolder={(folderId: string | null, folderName?: string) => {
          setSelectedFolder(folderId);
          setSelectedFolderName(folderName || '');
          setFolderDialogOpen(false);
        }}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('DeleteDialogTitle')}</DialogTitle>
            <DialogDescription>
              {t('DeleteDialogDescription', { name: fileToDelete?.name ?? '' })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>{t('Cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete}>{t('DeleteAction')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {previewFile && (
        <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{previewFile.name}</DialogTitle>
              <DialogDescription>{t('PreviewDialogDescription')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {previewFile.fileType === 'IMAGE' && (
                <div className="relative h-[400px] w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 dark:border-white/10 dark:bg-slate-900/80">
                  <Image src={getFilePreviewUrl(previewFile)} alt={previewFile.name} fill className="object-contain" />
                </div>
              )}
              {previewFile.fileType === 'VIDEO' && (
                <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 dark:border-white/10 dark:bg-slate-900/80">
                  <video src={getFileSourceUrl(previewFile)} controls className="w-full max-h-[400px]">
                    {t('BrowserUnsupportedVideo')}
                  </video>
                </div>
              )}
              {previewFile.fileType === 'AUDIO' && (
                <div className="relative w-full rounded-2xl border border-slate-200/80 bg-slate-100 p-4 dark:border-white/10 dark:bg-slate-900/80">
                  <audio src={getFileSourceUrl(previewFile)} controls className="w-full">
                    {t('BrowserUnsupportedAudio')}
                  </audio>
                </div>
              )}
              {(previewFile.fileType === 'DOCUMENT' || previewFile.fileType === 'OTHER') && (
                <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-100 px-6 py-8 text-center dark:border-white/10 dark:bg-slate-900/80">
                  <div className={cn('flex h-20 w-20 items-center justify-center rounded-3xl', FILE_TYPE_COLORS[previewFile.fileType])}>
                    <FileTypeIcon type={previewFile.fileType} className="h-10 w-10" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-slate-900 dark:text-slate-50">
                      {previewFile.fileType === 'DOCUMENT' ? t('DocumentLabel') : t('AttachmentLabel')}
                    </p>
                    <p className="text-sm text-muted-foreground">{t('DocumentPreviewHint')}</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('FileTypeLabel')}</p>
                  <p className="font-medium">{getFileTypeLabel(previewFile.fileType)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('SizeLabel')}</p>
                  <p className="font-medium">{formatFileSize(previewFile.fileSize)}</p>
                </div>
                {previewFile.width && previewFile.height && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t('DimensionsLabel')}</p>
                    <p className="font-medium">{previewFile.width} x {previewFile.height}</p>
                  </div>
                )}
                {previewFile.duration && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t('DurationLabel')}</p>
                    <p className="font-medium">
                      {Math.floor(previewFile.duration / 60)}:{String(previewFile.duration % 60).padStart(2, '0')}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">{t('FormatLabel')}</p>
                  <p className="font-medium">{previewFile.format || t('NotAvailable')}</p>
                </div>
              </div>
              {previewFile.description && (
                <div>
                  <p className="mb-1 text-sm text-muted-foreground">{t('DescriptionLabel')}</p>
                  <p className="text-sm">{previewFile.description}</p>
                </div>
              )}
              {previewFile.tags && Array.isArray(previewFile.tags) && previewFile.tags.length > 0 && (
                <div>
                  <p className="mb-2 text-sm text-muted-foreground">{t('TagsLabel')}</p>
                  <div className="flex flex-wrap gap-2">
                    {previewFile.tags
                      .filter((tag) => !tag.startsWith('[Ljava.lang.String'))
                      .map((tag, idx) => (
                        <Badge key={idx} variant="secondary">{tag}</Badge>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

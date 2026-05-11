'use client';

import { useEffect, useState } from 'react';
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
import envConfig from '@/config';
import {
  useDeleteFileMutation,
  useGetFileStatistics,
  useGetFilesByFolder,
  useGetFilesByUser,
} from '@/queries/useFile';
import type { FileType } from '@/schemaValidations/file.schema';
import { useToast } from '@/hooks/use-toast';
import {
  getFilePreviewCandidates,
  getFileSourceCandidates,
  resolveFileSourceUrl,
} from '@/lib/file-media';
import { usePermissions } from '@/hooks/usePermissions';
import { cn, getAccessTokenFromLocalStorage } from '@/lib/utils';

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

const PROCESSING_STATUS_LABELS = new Set(['READY', 'PENDING', 'PROCESSING', 'FAILED']);
const VISIBLE_PROCESSING_STATUSES = new Set(['PENDING', 'PROCESSING']);

const getFileSourceUrl = (file: FileType) => resolveFileSourceUrl(file) || '';

const getAccessToken = () =>
  typeof window === 'undefined' ? null : getAccessTokenFromLocalStorage();

const buildFileMediaUrl = (
  fileId: string,
  userId: string,
  variant: 'content' | 'thumbnail'
) =>
  `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/app/api/proxy/files/${fileId}/${variant}?userId=${encodeURIComponent(userId)}`;

const fetchWithAuth = (url: string, init?: RequestInit) => {
  const headers = new Headers(init?.headers);
  const accessToken = getAccessToken();
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  return fetch(url, {
    ...init,
    headers,
    credentials: 'include',
  });
};

const isHtmlResponse = (response: Response) =>
  (response.headers.get('content-type') || '').toLowerCase().includes('text/html');

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

function FileMediaPreview({
  file,
  userId,
  variant,
  directUrls,
  iconSizeClass,
  mediaFitClass,
}: {
  file: FileType;
  userId: string;
  variant: 'content' | 'thumbnail';
  directUrls: string[];
  iconSizeClass: string;
  mediaFitClass: string;
}) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [authFailed, setAuthFailed] = useState(false);
  const [directIndex, setDirectIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let nextObjectUrl: string | null = null;

    setObjectUrl(null);
    setAuthFailed(false);
    setDirectIndex(0);

    if (!userId) {
      setAuthFailed(true);
      return;
    }

    const controller = new AbortController();

    fetchWithAuth(buildFileMediaUrl(file.id, userId, variant), {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok || isHtmlResponse(response)) {
          throw new Error(`Media request failed with status ${response.status}`);
        }
        return response.blob();
      })
      .then((blob) => {
        if (cancelled) {
          return;
        }
        nextObjectUrl = window.URL.createObjectURL(blob);
        setObjectUrl(nextObjectUrl);
      })
      .catch((error) => {
        if (!cancelled && error?.name !== 'AbortError') {
          setAuthFailed(true);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
      if (nextObjectUrl) {
        window.URL.revokeObjectURL(nextObjectUrl);
      }
    };
  }, [file.id, userId, variant]);

  if (objectUrl) {
    return (
      <img
        src={objectUrl}
        alt={file.name}
        className={cn('h-full w-full', mediaFitClass)}
      />
    );
  }

  if (authFailed) {
    const directUrl = directUrls[directIndex];
    if (directUrl) {
      return (
        <img
          src={directUrl}
          alt={file.name}
          className={cn('h-full w-full', mediaFitClass)}
          onError={() => setDirectIndex((current) => current + 1)}
        />
      );
    }
  }

  return (
    <div className={cn('flex h-full w-full items-center justify-center', FILE_TYPE_COLORS[file.fileType])}>
      <FileTypeIcon type={file.fileType} className={iconSizeClass} />
    </div>
  );
}

export default function FileTable() {
  const t = useTranslations('ManageFile');
  const locale = useLocale();
  const { toast } = useToast();
  const { data: profileData } = useAccountProfile();
  const { hasPermission } = usePermissions();
  const userId = profileData?.payload?.data?.id || '';

  const canUploadFiles = hasPermission('POST', '/api/files/upload');
  const canDeleteFiles = hasPermission('DELETE', '/api/files/{id}');
  const canDownloadFiles = hasPermission('GET', '/api/files/{id}');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedFolderName, setSelectedFolderName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<FileType | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileType | null>(null);
  const [pendingDeletedFileIds, setPendingDeletedFileIds] = useState<Set<string>>(new Set());
  const [previewFallbackState, setPreviewFallbackState] = useState<
    Record<string, { previewIndex?: number; sourceIndex?: number }>
  >({});

  const {
    data: userFilesData,
    isLoading: loadingUserFiles,
    refetch: refetchUserFiles,
  } = useGetFilesByUser(userId, 0, 100);
  const {
    data: folderFilesData,
    isLoading: loadingFolderFiles,
    refetch: refetchFolderFiles,
  } = useGetFilesByFolder(
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
    ? (userFilesData.payload.data as { content: FileType[] }).content
    : Array.isArray(userFilesData?.payload?.data)
      ? userFilesData.payload.data
      : [];

  const filesFromFolder = Array.isArray(folderFilesData?.payload?.data)
    ? folderFilesData.payload.data
    : [];

  const files: FileType[] = selectedFolder ? filesFromFolder : filesFromUser;
  const statistics = statisticsData?.payload?.data;
  const loading = selectedFolder ? loadingFolderFiles : loadingUserFiles;
  const filteredFiles = files.filter(
    (file) => !pendingDeletedFileIds.has(file.id) && file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getErrorDescription = (error: unknown, fallback: string) => {
    if (error && typeof error === 'object') {
      const payload = (error as { payload?: unknown }).payload;
      if (payload && typeof payload === 'object') {
        const message = (payload as { message?: unknown; error?: unknown; data?: { message?: unknown } }).message
          ?? (payload as { error?: unknown }).error
          ?? (payload as { data?: { message?: unknown } }).data?.message;
        if (typeof message === 'string' && message.trim()) {
          return message;
        }
      }
      if (typeof payload === 'string' && payload.trim()) {
        try {
          const parsed = JSON.parse(payload) as { message?: unknown; error?: unknown };
          const message = parsed.message ?? parsed.error;
          if (typeof message === 'string' && message.trim()) {
            return message;
          }
        } catch {
          if (payload.includes('Cannot delete folder with files')) {
            return t('DeleteFolderNotEmpty');
          }
          if (payload.includes('Cannot delete folder with subfolders')) {
            return t('DeleteFolderNotEmpty');
          }
          if (payload.length < 180 && !payload.includes('<html')) {
            return payload;
          }
        }
      }
      if (error instanceof Error && error.message) {
        return error.message;
      }
    }
    return fallback;
  };

  const filePreviewSignature = files
    .map((file) => `${file.id}:${file.thumbnailUrl ?? ''}:${file.secureUrl ?? ''}:${file.publicUrl ?? ''}`)
    .join('|');

  useEffect(() => {
    setPreviewFallbackState({});
  }, [filePreviewSignature]);

  const hasUnfinishedVideoProcessing = files.some(
    (file) =>
      file.fileType === 'VIDEO' &&
      (file.processingStatus === 'PENDING' || file.processingStatus === 'PROCESSING')
  );

  useEffect(() => {
    if (!hasUnfinishedVideoProcessing || !userId) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (selectedFolder) {
        void refetchFolderFiles();
        return;
      }
      void refetchUserFiles();
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [
    hasUnfinishedVideoProcessing,
    refetchFolderFiles,
    refetchUserFiles,
    selectedFolder,
    userId,
  ]);

  const getFileTypeLabel = (type: FileType['fileType']) => t(`FileType.${type}`);
  const getProcessingStatusLabel = (status?: string | null) =>
    status ? (PROCESSING_STATUS_LABELS.has(status) ? t(`ProcessingStatus.${status}`) : status) : '';
  const shouldShowProcessingStatus = (file: FileType) =>
    file.fileType === 'VIDEO' &&
    !!file.processingStatus &&
    VISIBLE_PROCESSING_STATUSES.has(file.processingStatus);

  const handleDelete = async () => {
    if (!fileToDelete || !userId) return;
    const deletingFile = fileToDelete;
    if (!canDeleteFiles) {
      toast({
        title: t('PermissionDeniedTitle'),
        description: t('DeletePermissionDenied'),
        variant: 'destructive',
      });
      return;
    }

    setPendingDeletedFileIds((current) => new Set(current).add(deletingFile.id));
    setDeleteDialogOpen(false);
    setFileToDelete(null);

    try {
      await deleteFileMutation.mutateAsync({ id: deletingFile.id, userId, folderId: selectedFolder });
      toast({ title: t('SuccessTitle'), description: t('DeleteSuccess') });
    } catch (error) {
      setPendingDeletedFileIds((current) => {
        const next = new Set(current);
        next.delete(deletingFile.id);
        return next;
      });
      console.error('Error deleting file:', error);
      toast({
        title: t('ErrorTitle'),
        description: getErrorDescription(error, t('DeleteError')),
        variant: 'destructive',
      });
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
      let response = await fetchWithAuth(buildFileMediaUrl(file.id, userId, 'content'));
      if (!response.ok || isHtmlResponse(response)) {
        const sourceUrl = getFileSourceUrl(file);
        if (!sourceUrl) {
          throw new Error('Missing file source');
        }
        response = await fetch(sourceUrl);
      }

      if (!response.ok || isHtmlResponse(response)) {
        throw new Error('Failed to download file content');
      }

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

  const advancePreviewCandidate = (
    fileId: string,
    candidateType: 'previewIndex' | 'sourceIndex'
  ) => {
    setPreviewFallbackState((current) => ({
      ...current,
      [fileId]: {
        ...current[fileId],
        [candidateType]: (current[fileId]?.[candidateType] ?? 0) + 1,
      },
    }));
  };

  const getActivePreviewUrl = (file: FileType) => {
    const previewIndex = previewFallbackState[file.id]?.previewIndex ?? 0;
    return getFilePreviewCandidates(file)[previewIndex] ?? null;
  };

  const getActiveSourceUrl = (file: FileType) => {
    const sourceIndex = previewFallbackState[file.id]?.sourceIndex ?? 0;
    return getFileSourceCandidates(file)[sourceIndex] ?? '';
  };

  const renderFilePreview = (
    file: FileType,
    iconSizeClass = 'h-7 w-7',
    mediaFitClass = 'object-cover',
    mediaVariant: 'content' | 'thumbnail' = 'thumbnail'
  ) => {
    const previewUrl = getActivePreviewUrl(file);
    const sourceUrl = getActiveSourceUrl(file);

    if (file.fileType === 'IMAGE') {
      return (
        <FileMediaPreview
          file={file}
          userId={userId}
          variant={mediaVariant}
          directUrls={getFilePreviewCandidates(file)}
          iconSizeClass={iconSizeClass}
          mediaFitClass={mediaFitClass}
        />
      );
    }

    if (file.fileType === 'VIDEO' && previewUrl) {
      return (
        <FileMediaPreview
          file={file}
          userId={userId}
          variant="thumbnail"
          directUrls={getFilePreviewCandidates(file)}
          iconSizeClass={iconSizeClass}
          mediaFitClass={mediaFitClass}
        />
      );
    }

    if (file.fileType === 'VIDEO' && sourceUrl) {
      return (
        <video
          src={sourceUrl}
          className={cn('h-full w-full', mediaFitClass)}
          muted
          playsInline
          preload="metadata"
          onError={() => advancePreviewCandidate(file.id, 'sourceIndex')}
        />
      );
    }

    return (
      <div className={cn('flex h-full w-full items-center justify-center', FILE_TYPE_COLORS[file.fileType])}>
        <FileTypeIcon type={file.fileType} className={iconSizeClass} />
      </div>
    );
  };

  return (
    <div className="manage-data-table">
      {statistics && (
        <div className="manage-kpi-grid">
          {[
            { label: t('TotalFiles'), value: statistics.totalFiles, icon: File, tone: 'text-muted-foreground' },
            { label: t('TotalSize'), value: formatFileSize(statistics.totalSize), icon: Upload, tone: 'text-muted-foreground' },
            { label: t('Images'), value: statistics.byType.IMAGE?.count || 0, icon: ImageIcon, tone: 'text-blue-500' },
            { label: t('Videos'), value: statistics.byType.VIDEO?.count || 0, icon: Video, tone: 'text-primary' },
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
              <TableHead className="manage-table-number-cell">{t('SizeColumn')}</TableHead>
              <TableHead>{t('FolderColumn')}</TableHead>
              <TableHead>{t('CreatedAtColumn')}</TableHead>
              <TableHead className="manage-table-actions-cell w-[104px]" />
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
                    <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200/80 bg-white dark:border-white/10 dark:bg-slate-900/80">
                      {renderFilePreview(file, 'h-7 w-7', 'object-contain')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[300px]">
                      <p className="truncate font-medium">{file.name}</p>
                      {shouldShowProcessingStatus(file) && (
                        <Badge
                          variant={getProcessingBadgeVariant(file.processingStatus)}
                          className="mt-1 text-xs"
                          title={file.processingError || undefined}
                        >
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
                  <TableCell className="manage-table-number-cell">{formatFileSize(file.fileSize)}</TableCell>
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
                  <TableCell className="manage-table-actions-cell">
                    <div className="manage-table-actions">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={!canDeleteFiles}
                        title={!canDeleteFiles ? t('DeletePermissionDenied') : t('DeleteAction')}
                        onClick={() => {
                          setFileToDelete(file);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
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
            <Button variant="destructive" onClick={handleDelete} disabled={deleteFileMutation.isPending}>
              {t('DeleteAction')}
            </Button>
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
                  {renderFilePreview(previewFile, 'h-12 w-12', 'object-contain', 'content')}
                </div>
              )}
              {previewFile.fileType === 'VIDEO' && (
                <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 dark:border-white/10 dark:bg-slate-900/80">
                  <video
                    src={getActiveSourceUrl(previewFile) || getFileSourceUrl(previewFile)}
                    controls
                    className="w-full max-h-[400px]"
                    onError={() => advancePreviewCandidate(previewFile.id, 'sourceIndex')}
                  >
                    {t('BrowserUnsupportedVideo')}
                  </video>
                </div>
              )}
              {previewFile.fileType === 'AUDIO' && (
                <div className="relative w-full rounded-2xl border border-slate-200/80 bg-slate-100 p-4 dark:border-white/10 dark:bg-slate-900/80">
                  <audio
                    src={getActiveSourceUrl(previewFile) || getFileSourceUrl(previewFile)}
                    controls
                    className="w-full"
                    onError={() => advancePreviewCandidate(previewFile.id, 'sourceIndex')}
                  >
                    {t('BrowserUnsupportedAudio')}
                  </audio>
                </div>
              )}
              {(previewFile.fileType === 'DOCUMENT' || previewFile.fileType === 'OTHER') && (
                <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-100 px-6 py-8 text-center dark:border-white/10 dark:bg-slate-900/80">
                  <div className={cn('flex h-20 w-20 items-center justify-center rounded-xl', FILE_TYPE_COLORS[previewFile.fileType])}>
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

'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { enUS, ja, vi } from 'date-fns/locale';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50];

type FilePagePayload = {
  content?: FileType[];
  totalElements?: number;
  totalPages?: number;
  numberOfElements?: number;
  number?: number;
  size?: number;
  first?: boolean;
  last?: boolean;
};

type FilePaginationInfo = {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
};

type FileListPayload = {
  data?: FileType[] | FilePagePayload;
  pagination?: Partial<FilePaginationInfo>;
};

const toPositiveInteger = (value: string | null, fallback: number) => {
  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
};

const parsePageSize = (value: string | null) => {
  const parsedValue = toPositiveInteger(value, DEFAULT_PAGE_SIZE);
  return PAGE_SIZE_OPTIONS.includes(parsedValue) ? parsedValue : DEFAULT_PAGE_SIZE;
};

const isFilePagePayload = (value: unknown): value is FilePagePayload =>
  !!value && typeof value === 'object' && 'content' in value;

const getFileListFromPayload = (payload?: FileListPayload): FileType[] => {
  const data = payload?.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (isFilePagePayload(data) && Array.isArray(data.content)) {
    return data.content;
  }

  return [];
};

const getPaginationFromPayload = (
  payload: FileListPayload | undefined,
  fallbackPageIndex: number,
  fallbackPageSize: number
): FilePaginationInfo => {
  const fallbackDataLength = getFileListFromPayload(payload).length;
  const data = payload?.data;
  const pagePayload = isFilePagePayload(data) ? data : null;
  const pagination = payload?.pagination;
  const totalElements =
    pagination?.totalElements ?? pagePayload?.totalElements ?? fallbackDataLength;
  const totalPages = Math.max(
    pagination?.totalPages ?? pagePayload?.totalPages ?? (totalElements > 0 ? 1 : 0),
    1
  );
  const page = pagination?.page ?? pagePayload?.number ?? fallbackPageIndex;
  const size = pagination?.size ?? pagePayload?.size ?? fallbackPageSize;

  return {
    page,
    size,
    totalElements,
    totalPages,
    first: pagination?.first ?? pagePayload?.first ?? page <= 0,
    last: pagination?.last ?? pagePayload?.last ?? page >= totalPages - 1,
    hasNext: pagination?.hasNext ?? page < totalPages - 1,
    hasPrevious: pagination?.hasPrevious ?? page > 0,
  };
};

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
  const paginationT = useTranslations('Pagination');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { data: profileData } = useAccountProfile();
  const { hasPermission } = usePermissions();
  const userId = profileData?.payload?.data?.id || '';
  const page = toPositiveInteger(searchParams.get('page'), 1);
  const pageIndex = page - 1;
  const pageSize = parsePageSize(searchParams.get('pageSize'));
  const keyword = searchParams.get('keyword')?.trim() || '';

  const canUploadFiles = hasPermission('POST', '/api/files/upload');
  const canDeleteFiles = hasPermission('DELETE', '/api/files/{id}');
  const canDownloadFiles = hasPermission('GET', '/api/files/{id}');

  const [searchTerm, setSearchTerm] = useState(keyword);
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
  } = useGetFilesByUser(userId, pageIndex, pageSize, keyword);
  const {
    data: folderFilesData,
    isLoading: loadingFolderFiles,
    refetch: refetchFolderFiles,
  } = useGetFilesByFolder(
    selectedFolder || '',
    userId,
    pageIndex,
    pageSize,
    keyword
  );
  const { data: statisticsData } = useGetFileStatistics(userId);
  const deleteFileMutation = useDeleteFileMutation();

  const filesFromUser = getFileListFromPayload(userFilesData?.payload);
  const filesFromFolder = getFileListFromPayload(folderFilesData?.payload);
  const userPagination = getPaginationFromPayload(userFilesData?.payload, pageIndex, pageSize);
  const folderPagination = getPaginationFromPayload(folderFilesData?.payload, pageIndex, pageSize);
  const files: FileType[] = selectedFolder ? filesFromFolder : filesFromUser;
  const pagination = selectedFolder ? folderPagination : userPagination;
  const totalItems = pagination.totalElements;
  const totalPages = pagination.totalPages;
  const statistics = statisticsData?.payload?.data;
  const loading = selectedFolder ? loadingFolderFiles : loadingUserFiles;
  const filteredFiles = files.filter(
    (file) => !pendingDeletedFileIds.has(file.id)
  );

  const updatePaginationParams = (updates: {
    page?: number;
    pageSize?: number;
    keyword?: string | null;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (updates.page !== undefined) {
      params.set('page', String(updates.page));
    }

    if (updates.pageSize !== undefined) {
      params.set('pageSize', String(updates.pageSize));
    }

    if (updates.keyword !== undefined) {
      const nextKeyword = updates.keyword?.trim();
      if (nextKeyword) {
        params.set('keyword', nextKeyword);
      } else {
        params.delete('keyword');
      }
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    setSearchTerm(keyword);
  }, [keyword]);

  useEffect(() => {
    const normalizedSearchTerm = searchTerm.trim();
    const timerId = window.setTimeout(() => {
      if (normalizedSearchTerm === keyword) {
        return;
      }

      updatePaginationParams({
        page: 1,
        keyword: normalizedSearchTerm,
      });
    }, 400);

    return () => window.clearTimeout(timerId);
  }, [keyword, searchTerm]);

  useEffect(() => {
    if (!loading && page > totalPages) {
      updatePaginationParams({ page: totalPages });
    }
  }, [loading, page, totalPages]);

  const handlePageChange = (nextPage: number) => {
    if (nextPage >= 1 && nextPage <= totalPages) {
      updatePaginationParams({ page: nextPage });
    }
  };

  const handlePageSizeChange = (nextPageSize: number) => {
    updatePaginationParams({ page: 1, pageSize: nextPageSize });
  };

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
            { label: t('Images'), value: statistics.byType.IMAGE?.count || 0, icon: ImageIcon, tone: 'text-primary' },
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
        <div className="flex flex-1 flex-wrap items-center gap-2 sm:flex-nowrap">
          <div className="relative w-full min-w-0 flex-1 sm:w-auto sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('SearchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="manage-field !pl-11"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setFolderDialogOpen(true)}
            className="manage-secondary-button max-w-full shrink-0 truncate"
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
                    <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-border bg-card">
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
                    <Badge variant="outline" className="border-border bg-card text-muted-foreground">
                      <FileTypeIcon type={file.fileType} />
                      <span className="ml-1">{getFileTypeLabel(file.fileType)}</span>
                    </Badge>
                  </TableCell>
                  <TableCell className="manage-table-number-cell">{formatFileSize(file.fileSize)}</TableCell>
                  <TableCell>
                    {file.folderName ? (
                      <Badge variant="secondary" className="bg-muted text-muted-foreground">
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
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
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

      <div className="manage-pagination py-4">
        <div className="manage-pagination-copy">
          {paginationT('Pagi1')} <strong>{filteredFiles.length}</strong>{' '}
          {paginationT('Pagi2')} <strong>{totalItems}</strong>{' '}
          {paginationT('Pagi3')}
          <span className="mx-2 hidden sm:inline" aria-hidden>
            ·
          </span>
          <span className="mt-1 block sm:mt-0 sm:inline">
            {paginationT('Page')} {page} {paginationT('Of')} {totalPages}
          </span>
        </div>
        <div className="manage-pagination-actions">
          <Button
            variant="outline"
            size="sm"
            className="manage-secondary-button manage-pagination-button"
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1 || loading}
          >
            {paginationT('Previous')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="manage-secondary-button manage-pagination-button"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages || loading}
          >
            {paginationT('Next')}
          </Button>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => handlePageSizeChange(Number(value))}
          >
            <SelectTrigger className="manage-filter-trigger w-[120px]">
              <SelectValue placeholder={paginationT('RowsPerPage')} />
            </SelectTrigger>
            <SelectContent className="manage-popover-panel">
              {PAGE_SIZE_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
          updatePaginationParams({ page: 1 });
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
                <div className="relative h-[400px] w-full overflow-hidden rounded-2xl border border-border bg-muted">
                  {renderFilePreview(previewFile, 'h-12 w-12', 'object-contain', 'content')}
                </div>
              )}
              {previewFile.fileType === 'VIDEO' && (
                <div className="relative w-full overflow-hidden rounded-2xl border border-border bg-muted">
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
                <div className="relative w-full rounded-2xl border border-border bg-muted p-4">
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
                <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-muted px-6 py-8 text-center">
                  <div className={cn('flex h-20 w-20 items-center justify-center rounded-xl', FILE_TYPE_COLORS[previewFile.fileType])}>
                    <FileTypeIcon type={previewFile.fileType} className="h-10 w-10" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-foreground">
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

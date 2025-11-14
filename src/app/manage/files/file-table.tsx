'use client';

import { useState } from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import UploadFileDialog from './upload-file-dialog';
import FolderTreeDialog from './folder-tree-dialog';
import {
  useGetFilesByUser,
  useGetFilesByFolder,
  useGetFileStatistics,
  useDeleteFileMutation,
} from '@/queries/useFile';
import { useAccountProfile } from '@/queries/useAccount';
import type { FileType } from '@/schemaValidations/file.schema';

const FILE_TYPE_ICONS = {
  IMAGE: ImageIcon,
  VIDEO: Video,
  DOCUMENT: FileText,
  AUDIO: Music,
  OTHER: File,
};

const FILE_TYPE_COLORS = {
  IMAGE: 'bg-blue-100',
  VIDEO: 'bg-purple-100',
  DOCUMENT: 'bg-green-100',
  AUDIO: 'bg-yellow-100',
  OTHER: 'bg-gray-100',
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export default function FileTable() {
  const { toast } = useToast();
  const { data: profileData, isLoading: loadingProfile } = useAccountProfile();
  const userId = profileData?.payload?.data?.id || '';

  // Debug logs
  console.log('🔍 FileTable - profileData:', profileData);
  console.log('🔍 FileTable - userId:', userId);
  console.log('🔍 FileTable - loadingProfile:', loadingProfile);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedFolderName, setSelectedFolderName] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<FileType | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileType | null>(null);

  // Queries
  const { data: userFilesData, isLoading: loadingUserFiles } = useGetFilesByUser(
    userId,
    0,
    100
  );
  const { data: folderFilesData, isLoading: loadingFolderFiles } = useGetFilesByFolder(
    selectedFolder || '',
    userId
  );
  const { data: statisticsData } = useGetFileStatistics(userId);

  // Debug logs for queries
  console.log('🔍 FileTable - userFilesData:', userFilesData);
  console.log('🔍 FileTable - folderFilesData:', folderFilesData);
  console.log('🔍 FileTable - statisticsData:', statisticsData);

  // Mutations
  const deleteFileMutation = useDeleteFileMutation();

  // Determine which data to use - Handle Page response
  const isPageResponse = userFilesData?.payload?.data && typeof userFilesData.payload.data === 'object' && 'content' in userFilesData.payload.data;
  const filesFromUser = isPageResponse 
    ? (userFilesData.payload.data as any).content 
    : (Array.isArray(userFilesData?.payload?.data) ? userFilesData.payload.data : []);
  const filesFromFolder = Array.isArray(folderFilesData?.payload?.data) ? folderFilesData.payload.data : [];
  
  const files: FileType[] = selectedFolder ? filesFromFolder : filesFromUser;
  const statistics = statisticsData?.payload?.data;
  const loading = selectedFolder ? loadingFolderFiles : loadingUserFiles;

  const handleDelete = async () => {
    if (!fileToDelete || !userId) return;

    try {
      await deleteFileMutation.mutateAsync({
        id: fileToDelete.id,
        userId,
      });

      toast({
        title: 'Thành công',
        description: 'Đã xóa file thành công',
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa file',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setFileToDelete(null);
    }
  };

  const handleDownload = async (file: FileType) => {
    try {
      // Fetch file as blob
      const response = await fetch(file.cloudinarySecureUrl);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.originalName || file.name;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Thành công',
        description: 'Đã tải xuống file',
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải file xuống',
        variant: 'destructive',
      });
    }
  };

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const FileTypeIcon = ({ type }: { type: FileType['fileType'] }) => {
    const Icon = FILE_TYPE_ICONS[type];
    return <Icon className="w-5 h-5" />;
  };

  return (
    <div className="space-y-4">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tổng số file</p>
                <p className="text-2xl font-bold">{statistics.totalFiles}</p>
              </div>
              <File className="w-8 h-8 text-muted-foreground" />
            </div>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tổng dung lượng</p>
                <p className="text-2xl font-bold">{formatFileSize(statistics.totalSize)}</p>
              </div>
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hình ảnh</p>
                <p className="text-2xl font-bold">
                  {statistics.byType.IMAGE?.count || 0}
                </p>
              </div>
              <ImageIcon className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Video</p>
                <p className="text-2xl font-bold">
                  {statistics.byType.VIDEO?.count || 0}
                </p>
              </div>
              <Video className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Tìm kiếm file..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" onClick={() => setFolderDialogOpen(true)}>
            <FolderOpen className="w-4 h-4 mr-2" />
            {selectedFolder && selectedFolderName ? selectedFolderName : 'Tất cả thư mục'}
          </Button>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)}>
          <Upload className="w-4 h-4 mr-2" />
          Tải lên
        </Button>
      </div>

      {/* Files Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Preview</TableHead>
              <TableHead>Tên file</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Kích thước</TableHead>
              <TableHead>Thư mục</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : filteredFiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Không có file nào
                </TableCell>
              </TableRow>
            ) : (
              filteredFiles.map((file) => (
                <TableRow key={file.id}>
                  <TableCell>
                    <div className="w-16 h-16 relative rounded overflow-hidden bg-muted">
                      {file.fileType === 'IMAGE' ? (
                        <Image
                          src={file.cloudinarySecureUrl}
                          alt={file.name}
                          fill
                          className="object-cover"
                        />
                      ) : file.fileType === 'VIDEO' ? (
                        <Image
                          src={file.cloudinarySecureUrl.replace(/\.(mp4|mov|avi|webm|mkv)$/, '.jpg')}
                          alt={file.name}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            // Fallback to icon if thumbnail fails
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            if (target.parentElement) {
                              target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center ${FILE_TYPE_COLORS[file.fileType]}"><svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>`;
                            }
                          }}
                        />
                      ) : (
                        <div
                          className={`w-full h-full flex items-center justify-center ${
                            FILE_TYPE_COLORS[file.fileType]
                          }`}
                        >
                          <FileTypeIcon type={file.fileType} />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[300px]">
                      <p className="font-medium truncate">{file.name}</p>
                      {file.tags && Array.isArray(file.tags) && file.tags.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {file.tags
                            .filter((tag) => !tag.startsWith('[Ljava.lang.String'))
                            .slice(0, 3)
                            .map((tag, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          {file.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{file.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      <FileTypeIcon type={file.fileType} />
                      <span className="ml-1">{file.fileType}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>{formatFileSize(file.fileSize)}</TableCell>
                  <TableCell>
                    {file.folderName ? (
                      <Badge variant="secondary">{file.folderName}</Badge>
                    ) : (
                      <span className="text-muted-foreground">Root</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(file.created), {
                      addSuffix: true,
                      locale: vi,
                    })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setPreviewFile(file)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Xem chi tiết
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload(file)}>
                          <Download className="w-4 h-4 mr-2" />
                          Tải xuống
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setFileToDelete(file);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Upload Dialog */}
      <UploadFileDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onSuccess={() => {
          // Queries will auto-refresh via invalidateQueries in mutation
        }}
        selectedFolderId={selectedFolder}
      />

      {/* Folder Tree Dialog */}
      <FolderTreeDialog
        open={folderDialogOpen}
        onOpenChange={setFolderDialogOpen}
        onSelectFolder={(folderId: string | null, folderName?: string) => {
          setSelectedFolder(folderId);
          setSelectedFolderName(folderName || '');
          setFolderDialogOpen(false);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa file &quot;{fileToDelete?.name}&quot;? Hành động này
              không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Preview Dialog */}
      {previewFile && (
        <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{previewFile.name}</DialogTitle>
              <DialogDescription>Chi tiết file</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {previewFile.fileType === 'IMAGE' && (
                <div className="relative w-full h-[400px] bg-muted rounded-lg overflow-hidden">
                  <Image
                    src={previewFile.cloudinarySecureUrl}
                    alt={previewFile.name}
                    fill
                    className="object-contain"
                  />
                </div>
              )}
              {previewFile.fileType === 'VIDEO' && (
                <div className="relative w-full bg-muted rounded-lg overflow-hidden">
                  <video
                    src={previewFile.cloudinarySecureUrl}
                    controls
                    className="w-full max-h-[400px]"
                  >
                    Trình duyệt không hỗ trợ video.
                  </video>
                </div>
              )}
              {previewFile.fileType === 'AUDIO' && (
                <div className="relative w-full bg-muted rounded-lg p-4">
                  <audio
                    src={previewFile.cloudinarySecureUrl}
                    controls
                    className="w-full"
                  >
                    Trình duyệt không hỗ trợ audio.
                  </audio>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Loại file</p>
                  <p className="font-medium">{previewFile.fileType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Kích thước</p>
                  <p className="font-medium">{formatFileSize(previewFile.fileSize)}</p>
                </div>
                {previewFile.width && previewFile.height && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Kích thước</p>
                      <p className="font-medium">
                        {previewFile.width} x {previewFile.height}
                      </p>
                    </div>
                  </>
                )}
                {previewFile.duration && (
                  <div>
                    <p className="text-sm text-muted-foreground">Thời lượng</p>
                    <p className="font-medium">
                      {Math.floor(previewFile.duration / 60)}:{String(previewFile.duration % 60).padStart(2, '0')}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Định dạng</p>
                  <p className="font-medium">{previewFile.format || 'N/A'}</p>
                </div>
              </div>
              {previewFile.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Mô tả</p>
                  <p className="text-sm">{previewFile.description}</p>
                </div>
              )}
              {previewFile.tags && Array.isArray(previewFile.tags) && previewFile.tags.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Tags</p>
                  <div className="flex gap-2 flex-wrap">
                    {previewFile.tags
                      .filter((tag) => !tag.startsWith('[Ljava.lang.String'))
                      .map((tag, idx) => (
                        <Badge key={idx} variant="secondary">
                          {tag}
                        </Badge>
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

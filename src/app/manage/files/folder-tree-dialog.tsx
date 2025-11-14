'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Folder,
  FolderOpen,
  FolderPlus,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { useGetFoldersByUser, useCreateFolderMutation } from '@/queries/useFile';
import { useAccountProfile } from '@/queries/useAccount';
import type { FolderType } from '@/schemaValidations/file.schema';

interface FolderTreeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectFolder: (folderId: string | null, folderName?: string) => void;
}

export default function FolderTreeDialog({
  open,
  onOpenChange,
  onSelectFolder,
}: FolderTreeDialogProps) {
  const { toast } = useToast();
  const { data: profileData } = useAccountProfile();
  const userId = profileData?.payload?.data?.id || '';

  // Debug logs
  console.log('🔍 FolderDialog - profileData:', profileData);
  console.log('🔍 FolderDialog - userId:', userId);

  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [creatingSubfolderFor, setCreatingSubfolderFor] = useState<string | null>(null);

  // Queries
  const { data: foldersData } = useGetFoldersByUser(userId);
  const folders: FolderType[] = foldersData?.payload?.data || [];

  // Debug logs
  console.log('🔍 FolderDialog - foldersData:', foldersData);
  console.log('🔍 FolderDialog - folders:', folders);

  // Mutations
  const createFolderMutation = useCreateFolderMutation();

  const handleCreateRootFolder = async () => {
    console.log('🚀 Creating folder...', { folderName: newFolderName, userId });

    if (!newFolderName.trim() || !userId) {
      console.error('❌ Invalid input:', { folderName: newFolderName, userId });
      return;
    }

    try {
      const result = await createFolderMutation.mutateAsync({
        userId,
        name: newFolderName.trim(),
        parentId: null,
      });

      console.log('✅ Folder created:', result);

      toast({
        title: 'Thành công',
        description: 'Đã tạo thư mục mới',
      });

      setNewFolderName('');
      setCreatingFolder(false);
    } catch (error) {
      console.error('❌ Error creating folder:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tạo thư mục',
        variant: 'destructive',
      });
    }
  };

  const handleCreateSubfolder = async (parentId: string, name: string) => {
    console.log('🚀 Creating subfolder...', { name, parentId, userId });

    if (!name.trim() || !userId) {
      console.error('❌ Invalid input:', { name, parentId, userId });
      return;
    }

    try {
      const result = await createFolderMutation.mutateAsync({
        userId,
        name: name.trim(),
        parentId,
      });

      console.log('✅ Subfolder created:', result);

      toast({
        title: 'Thành công',
        description: 'Đã tạo thư mục con',
      });

      setCreatingSubfolderFor(null);
      // Expand the parent folder to show the new subfolder
      setExpandedFolders((prev) => new Set(prev).add(parentId));
    } catch (error) {
      console.error('❌ Error creating subfolder:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tạo thư mục con',
        variant: 'destructive',
      });
    }
  };

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

  const buildTree = (parentId: string | null, level: number): React.ReactElement[] => {
    const children = folders.filter(
      (f) => (f.parentId === parentId) || (parentId === null && !f.parentId)
    );

    return children.map((folder) => {
      const hasChildren = folders.some((f) => f.parentId === folder.id);
      const isExpanded = expandedFolders.has(folder.id);

      return (
        <div key={folder.id} style={{ marginLeft: `${level * 20}px` }}>
          <div className="flex items-center gap-2 py-2 hover:bg-muted rounded-lg px-2 group">
            {/* Expand/Collapse Button */}
            {hasChildren ? (
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6"
                onClick={() => toggleFolder(folder.id)}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>
            ) : (
              <div className="w-6" />
            )}

            {/* Folder Icon and Name */}
            <Button
              variant="ghost"
              className="flex-1 justify-start"
              onClick={() => {
                onSelectFolder(folder.id, folder.name);
              }}
            >
              {isExpanded ? (
                <FolderOpen className="w-4 h-4 mr-2 text-blue-500" />
              ) : (
                <Folder className="w-4 h-4 mr-2 text-blue-500" />
              )}
              <span className="font-medium">{folder.name}</span>
              <span className="ml-2 text-xs text-muted-foreground">
                ({folder.fileCount} files)
              </span>
            </Button>

            {/* Create Subfolder Button */}
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 opacity-0 group-hover:opacity-100"
              onClick={() => setCreatingSubfolderFor(folder.id)}
            >
              <FolderPlus className="w-4 h-4" />
            </Button>
          </div>

          {/* Create Subfolder Input */}
          {creatingSubfolderFor === folder.id && (
            <div
              className="flex items-center gap-2 py-2 px-2"
              style={{ marginLeft: `${20}px` }}
            >
              <Input
                placeholder="Tên thư mục con..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateSubfolder(folder.id, e.currentTarget.value);
                  } else if (e.key === 'Escape') {
                    setCreatingSubfolderFor(null);
                  }
                }}
                onBlur={(e) => {
                  if (e.currentTarget.value.trim()) {
                    handleCreateSubfolder(folder.id, e.currentTarget.value);
                  } else {
                    setCreatingSubfolderFor(null);
                  }
                }}
              />
            </div>
          )}

          {/* Render children recursively */}
          {isExpanded && hasChildren && buildTree(folder.id, level + 1)}
        </div>
      );
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Chọn thư mục</DialogTitle>
          <DialogDescription>
            Chọn thư mục để lọc file hoặc tạo thư mục mới.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-2">
          {/* Root Folder (All Files) */}
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => onSelectFolder(null)}
          >
            <Folder className="w-4 h-4 mr-2 text-gray-500" />
            <span className="font-medium">Tất cả file</span>
          </Button>

          {/* Create Root Folder */}
          {!creatingFolder ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setCreatingFolder(true)}
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              Tạo thư mục mới
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                placeholder="Tên thư mục..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateRootFolder();
                  } else if (e.key === 'Escape') {
                    setCreatingFolder(false);
                    setNewFolderName('');
                  }
                }}
              />
              <Button onClick={handleCreateRootFolder} disabled={!newFolderName.trim()}>
                Tạo
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCreatingFolder(false);
                  setNewFolderName('');
                }}
              >
                Hủy
              </Button>
            </div>
          )}

          {/* Folder Tree */}
          <div className="border-t pt-2">
            {folders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Chưa có thư mục nào
              </div>
            ) : (
              buildTree(null, 0)
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

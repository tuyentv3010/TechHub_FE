'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  FolderPlus,
  Trash2,
} from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { useAccountProfile } from '@/queries/useAccount';
import { useCreateFolderMutation, useDeleteFolderMutation, useGetFoldersByUser } from '@/queries/useFile';
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
  const t = useTranslations('ManageFile');
  const { toast } = useToast();
  const { data: profileData } = useAccountProfile();
  const userId = profileData?.payload?.data?.id || '';

  const [newFolderName, setNewFolderName] = useState('');
  const [newSubfolderName, setNewSubfolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [creatingSubfolderFor, setCreatingSubfolderFor] = useState<string | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<FolderType | null>(null);
  const [pendingDeletedFolderIds, setPendingDeletedFolderIds] = useState<Set<string>>(new Set());

  const { data: foldersData } = useGetFoldersByUser(userId);
  const folders: FolderType[] = foldersData?.payload?.data || [];
  const visibleFolders = folders.filter((folder) => !pendingDeletedFolderIds.has(folder.id));
  const createFolderMutation = useCreateFolderMutation();
  const deleteFolderMutation = useDeleteFolderMutation();

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
          if (
            payload.includes('Cannot delete folder with files') ||
            payload.includes('Cannot delete folder with subfolders')
          ) {
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

  const handleCreateRootFolder = async () => {
    if (!newFolderName.trim() || !userId) return;

    try {
      await createFolderMutation.mutateAsync({
        userId,
        name: newFolderName.trim(),
        parentId: null,
      });
      toast({ title: t('SuccessTitle'), description: t('CreateFolderSuccess') });
      setNewFolderName('');
      setCreatingFolder(false);
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: t('ErrorTitle'),
        description: t('CreateFolderError'),
        variant: 'destructive',
      });
    }
  };

  const handleDeleteFolder = async () => {
    if (!folderToDelete || !userId) return;
    const deletingFolder = folderToDelete;
    const hasChildren = visibleFolders.some((folder) => folder.parentId === deletingFolder.id);
    if (hasChildren || (deletingFolder.fileCount || 0) > 0) {
      toast({
        title: t('ErrorTitle'),
        description: t('DeleteFolderNotEmpty'),
        variant: 'destructive',
      });
      return;
    }

    setPendingDeletedFolderIds((current) => new Set(current).add(deletingFolder.id));
    setFolderToDelete(null);
    try {
      await deleteFolderMutation.mutateAsync({ id: deletingFolder.id, userId });
      toast({ title: t('SuccessTitle'), description: t('DeleteFolderSuccess') });
    } catch (error) {
      setPendingDeletedFolderIds((current) => {
        const next = new Set(current);
        next.delete(deletingFolder.id);
        return next;
      });
      console.error('Error deleting folder:', error);
      toast({
        title: t('ErrorTitle'),
        description: getErrorDescription(error, t('DeleteFolderError')),
        variant: 'destructive',
      });
    }
  };

  const handleCreateSubfolder = async (parentId: string, name: string) => {
    if (!name.trim() || !userId) return;

    try {
      await createFolderMutation.mutateAsync({
        userId,
        name: name.trim(),
        parentId,
      });
      toast({ title: t('SuccessTitle'), description: t('CreateSubfolderSuccess') });
      setCreatingSubfolderFor(null);
      setNewSubfolderName('');
      setExpandedFolders((prev) => new Set(prev).add(parentId));
    } catch (error) {
      console.error('Error creating subfolder:', error);
      toast({
        title: t('ErrorTitle'),
        description: t('CreateSubfolderError'),
        variant: 'destructive',
      });
    }
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const buildTree = (parentId: string | null, level: number): React.ReactElement[] => {
    const children = visibleFolders.filter(
      (folder) => folder.parentId === parentId || (parentId === null && !folder.parentId)
    );

    return children.map((folder) => {
      const hasChildren = visibleFolders.some((item) => item.parentId === folder.id);
      const isExpanded = expandedFolders.has(folder.id);

      return (
        <div key={folder.id} style={{ marginLeft: `${level * 20}px` }}>
          <div className="group flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-muted">
            {hasChildren ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => toggleFolder(folder.id)}
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            ) : (
              <div className="w-6" />
            )}

            <Button
              variant="ghost"
              className="flex-1 justify-start"
              onClick={() => onSelectFolder(folder.id, folder.name)}
            >
              {isExpanded ? (
                <FolderOpen className="mr-2 h-4 w-4 text-blue-500" />
              ) : (
                <Folder className="mr-2 h-4 w-4 text-blue-500" />
              )}
              <span className="font-medium">{folder.name}</span>
              <span className="ml-2 text-xs text-muted-foreground">
                {t('FolderFileCount', { count: folder.fileCount })}
              </span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100"
              onClick={() => {
                setCreatingSubfolderFor(folder.id);
                setNewSubfolderName('');
              }}
            >
              <FolderPlus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
              title={t('DeleteFolderAction')}
              onClick={(event) => {
                event.stopPropagation();
                setFolderToDelete(folder);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {creatingSubfolderFor === folder.id && (
            <div className="flex items-center gap-2 px-2 py-2" style={{ marginLeft: '20px' }}>
              <Input
                placeholder={t('SubfolderNamePlaceholder')}
                value={newSubfolderName}
                onChange={(e) => setNewSubfolderName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateSubfolder(folder.id, newSubfolderName);
                  if (e.key === 'Escape') {
                    setCreatingSubfolderFor(null);
                    setNewSubfolderName('');
                  }
                }}
              />
              <Button
                size="sm"
                onClick={() => handleCreateSubfolder(folder.id, newSubfolderName)}
                disabled={!newSubfolderName.trim()}
              >
                {t('Create')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setCreatingSubfolderFor(null);
                  setNewSubfolderName('');
                }}
              >
                {t('Cancel')}
              </Button>
            </div>
          )}

          {isExpanded && hasChildren && buildTree(folder.id, level + 1)}
        </div>
      );
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('FolderDialogTitle')}</DialogTitle>
          <DialogDescription>{t('FolderDialogDescription')}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-2 overflow-y-auto">
          <Button variant="ghost" className="w-full justify-start" onClick={() => onSelectFolder(null)}>
            <Folder className="mr-2 h-4 w-4 text-gray-500" />
            <span className="font-medium">{t('AllFiles')}</span>
          </Button>

          {!creatingFolder ? (
            <Button variant="outline" className="w-full" onClick={() => setCreatingFolder(true)}>
              <FolderPlus className="mr-2 h-4 w-4" />
              {t('CreateFolder')}
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                placeholder={t('FolderNamePlaceholder')}
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateRootFolder();
                  if (e.key === 'Escape') {
                    setCreatingFolder(false);
                    setNewFolderName('');
                  }
                }}
              />
              <Button onClick={handleCreateRootFolder} disabled={!newFolderName.trim()}>
                {t('Create')}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCreatingFolder(false);
                  setNewFolderName('');
                }}
              >
                {t('Cancel')}
              </Button>
            </div>
          )}

          <div className="border-t pt-2">
            {visibleFolders.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">{t('NoFolders')}</div>
            ) : (
              buildTree(null, 0)
            )}
          </div>
        </div>
      </DialogContent>

      <AlertDialog
        open={!!folderToDelete}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setFolderToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('DeleteFolderDialogTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('DeleteFolderDialogDescription', { name: folderToDelete?.name ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteFolderMutation.isPending}
              onClick={(event) => {
                event.preventDefault();
                void handleDeleteFolder();
              }}
            >
              {t('DeleteAction')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

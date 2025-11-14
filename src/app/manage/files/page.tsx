import { Suspense } from 'react';
import FileTable from './file-table';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Quản lý File | TechHub',
  description: 'Quản lý file và media library',
};

export default function FilesPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Quản lý File</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý file, hình ảnh, video và tài liệu
          </p>
        </div>
      </div>

      <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
        <FileTable />
      </Suspense>
    </div>
  );
}

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import PermissionTable from "./permission-table";
import TableSkeleton from "@/components/Skeleton";

export default async function ManagePermissionsPage() {
  const t = await getTranslations("ManagePermission");
  
  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="space-y-2">
        <Card>
          <CardHeader>
            <CardTitle>Quản lý Permissions</CardTitle>
            <CardDescription>
              Quản lý các permissions trong hệ thống phân quyền
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<TableSkeleton />}>
              <PermissionTable />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

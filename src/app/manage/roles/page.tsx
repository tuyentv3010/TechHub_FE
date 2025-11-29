import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import RoleTable from "./role-table";
import TableSkeleton from "@/components/Skeleton";

export default async function ManageRolesPage() {
  const t = await getTranslations("ManageRole");
  
  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="space-y-2">
        <Card>
          <CardHeader>
            <CardTitle>Quản lý Roles</CardTitle>
            <CardDescription>
              Quản lý các roles và phân quyền trong hệ thống
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<TableSkeleton />}>
              <RoleTable />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

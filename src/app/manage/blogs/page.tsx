import { Suspense } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import BlogTable from "./blog-table";

const TableFallback = () => (
  <div className="space-y-3">
    <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
    <div className="h-64 w-full animate-pulse rounded-md bg-muted" />
  </div>
);

export default async function ManageBlogsPage() {
  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Blog Management</CardTitle>
          <CardDescription>
            Create, publish, and keep track of articles across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<TableFallback />}>
            <BlogTable />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}

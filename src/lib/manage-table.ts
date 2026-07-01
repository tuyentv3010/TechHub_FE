import { cn } from "@/lib/utils";

const indexColumns = new Set(["rowNumber", "index", "serialNumber"]);
const numericColumns = new Set([
  "averageRating",
  "fileSize",
  "ratingCount",
  "totalEnrollments",
]);
const moneyColumns = new Set(["amount", "price", "revenue", "totalRevenue"]);
const actionColumns = new Set(["actions"]);

export function getManageTableColumnClass(columnId: string) {
  return cn(
    indexColumns.has(columnId) && "manage-table-index-cell",
    numericColumns.has(columnId) && "manage-table-number-cell",
    moneyColumns.has(columnId) && "manage-table-money-cell",
    actionColumns.has(columnId) && "manage-table-actions-cell"
  );
}

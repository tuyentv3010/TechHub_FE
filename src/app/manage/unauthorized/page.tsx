import UnauthorizedAccess from "@/components/common/UnauthorizedAccess";

export const metadata = {
  title: "Không có quyền truy cập | TechHub",
  description: "Bạn không có quyền truy cập tài nguyên này",
};

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <UnauthorizedAccess />
    </div>
  );
}

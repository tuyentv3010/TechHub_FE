import UnauthorizedAccess from "@/components/common/UnauthorizedAccess";

export const metadata = {
  title: "Không có quyền truy cập | TechHub",
  description: "Bạn không có quyền truy cập tài nguyên này",
};

export default function UnauthorizedPage() {
  return (
    <div className="manage-page flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <UnauthorizedAccess />
    </div>
  );
}

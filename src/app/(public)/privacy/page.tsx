import type { Metadata } from "next";
import { LegalDocumentPage, type LegalSection } from "@/components/legal/LegalDocumentPage";

export const metadata: Metadata = {
  title: "Chính sách bảo mật | TechHub",
  description: "Cách TechHub thu thập, sử dụng và bảo vệ dữ liệu người dùng.",
};

const sections: LegalSection[] = [
  {
    title: "Thông tin chúng tôi thu thập",
    paragraphs: [
      "TechHub thu thập thông tin cần thiết để tạo tài khoản, vận hành khóa học, hỗ trợ thanh toán, cá nhân hóa trải nghiệm học tập và bảo vệ hệ thống.",
    ],
    bullets: [
      "Thông tin tài khoản như email, tên người dùng, vai trò, trạng thái xác thực và ảnh đại diện nếu bạn cung cấp.",
      "Dữ liệu học tập như khóa học đã ghi danh, tiến độ, bài làm, kết quả kiểm tra, lộ trình học và tương tác trong nền tảng.",
      "Dữ liệu kỹ thuật như thiết bị, trình duyệt, địa chỉ IP, log phiên đăng nhập và sự kiện bảo mật.",
      "Thông tin giao dịch ở mức cần thiết để xác nhận thanh toán, đối soát và hỗ trợ người dùng.",
    ],
  },
  {
    title: "Cách chúng tôi sử dụng thông tin",
    bullets: [
      "Cung cấp, duy trì và cải thiện các tính năng học tập của TechHub.",
      "Xử lý đăng nhập, xác thực, ghi danh khóa học, thanh toán và hỗ trợ khách hàng.",
      "Cá nhân hóa gợi ý khóa học, lộ trình học, thông báo và trải nghiệm nội dung.",
      "Phát hiện gian lận, lạm dụng, lỗi kỹ thuật và rủi ro bảo mật.",
    ],
  },
  {
    title: "Chia sẻ thông tin",
    paragraphs: [
      "TechHub không bán dữ liệu cá nhân của bạn. Chúng tôi chỉ chia sẻ thông tin trong phạm vi cần thiết để vận hành nền tảng hoặc khi có yêu cầu hợp lệ.",
    ],
    bullets: [
      "Nhà cung cấp hạ tầng, lưu trữ, phân tích, email, thanh toán hoặc dịch vụ hỗ trợ vận hành.",
      "Giảng viên hoặc quản trị viên khi cần xử lý khóa học, tiến độ học tập, bài làm hoặc yêu cầu hỗ trợ.",
      "Cơ quan có thẩm quyền khi pháp luật yêu cầu hoặc để bảo vệ quyền lợi hợp pháp của TechHub và người dùng.",
    ],
  },
  {
    title: "Cookie và công nghệ tương tự",
    paragraphs: [
      "TechHub có thể dùng cookie hoặc bộ nhớ trình duyệt để duy trì phiên đăng nhập, ghi nhớ tùy chọn giao diện, ngôn ngữ và cải thiện hiệu năng.",
    ],
  },
  {
    title: "Lưu trữ và bảo vệ dữ liệu",
    paragraphs: [
      "Chúng tôi duy trì dữ liệu trong thời gian cần thiết cho mục đích vận hành, pháp lý, bảo mật và hỗ trợ người dùng. TechHub áp dụng các biện pháp kỹ thuật và tổ chức hợp lý để giảm rủi ro truy cập trái phép, mất mát hoặc lạm dụng dữ liệu.",
    ],
  },
  {
    title: "Quyền lựa chọn của bạn",
    bullets: [
      "Bạn có thể cập nhật một số thông tin tài khoản trong trang hồ sơ hoặc cài đặt.",
      "Bạn có thể yêu cầu hỗ trợ về truy cập, chỉnh sửa hoặc xóa dữ liệu theo phạm vi hệ thống và quy định áp dụng.",
      "Bạn có thể đăng xuất và xóa dữ liệu phiên khỏi trình duyệt khi không sử dụng thiết bị cá nhân.",
    ],
  },
  {
    title: "Tính năng AI và dữ liệu học tập",
    paragraphs: [
      "Khi bạn sử dụng các tính năng AI, TechHub có thể xử lý nội dung bạn nhập và ngữ cảnh học tập liên quan để tạo phản hồi hoặc gợi ý. Bạn không nên nhập thông tin nhạy cảm, bí mật hoặc dữ liệu cá nhân của người khác nếu không có quyền.",
    ],
  },
  {
    title: "Cập nhật chính sách và liên hệ",
    paragraphs: [
      "Chính sách này có thể được cập nhật khi TechHub thay đổi sản phẩm, cách xử lý dữ liệu hoặc yêu cầu tuân thủ. Nếu có thay đổi quan trọng, chúng tôi sẽ cố gắng thông báo bằng kênh phù hợp.",
      "Nếu có câu hỏi về quyền riêng tư hoặc dữ liệu cá nhân, vui lòng liên hệ qua trang Liên hệ của TechHub.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalDocumentPage
      eyebrow="TechHub privacy"
      title="Chính sách bảo mật"
      description="Chính sách này giải thích dữ liệu TechHub thu thập, lý do sử dụng, trường hợp chia sẻ và các lựa chọn của bạn khi sử dụng nền tảng học tập."
      lastUpdated="11/05/2026"
      sections={sections}
    />
  );
}

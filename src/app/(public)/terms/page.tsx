import type { Metadata } from "next";
import { LegalDocumentPage, type LegalSection } from "@/components/legal/LegalDocumentPage";

export const metadata: Metadata = {
  title: "Điều khoản dịch vụ | TechHub",
  description: "Điều khoản sử dụng nền tảng học tập TechHub.",
};

const sections: LegalSection[] = [
  {
    title: "Tài khoản và quyền truy cập",
    paragraphs: [
      "Bạn cần cung cấp thông tin chính xác khi đăng ký và chịu trách nhiệm bảo mật tài khoản, mật khẩu, phiên đăng nhập và mọi hoạt động phát sinh từ tài khoản của mình.",
    ],
    bullets: [
      "Không chia sẻ tài khoản cho người khác sử dụng nếu gói học hoặc khóa học không cho phép.",
      "Thông báo cho TechHub khi phát hiện truy cập trái phép hoặc nghi ngờ tài khoản bị lộ.",
    ],
  },
  {
    title: "Nội dung khóa học",
    paragraphs: [
      "Tài liệu, video, bài tập, câu hỏi, lộ trình học và nội dung do giảng viên hoặc TechHub cung cấp chỉ dùng cho mục đích học tập cá nhân trong phạm vi nền tảng.",
    ],
    bullets: [
      "Không sao chép, phân phối lại, bán lại hoặc công khai nội dung khóa học nếu chưa có sự cho phép.",
      "Bạn có thể lưu ghi chú cá nhân và bài làm của mình, miễn là không vi phạm quyền sở hữu trí tuệ của bên thứ ba.",
    ],
  },
  {
    title: "Thanh toán và ghi danh",
    paragraphs: [
      "Giá, quyền lợi và điều kiện truy cập của từng khóa học sẽ được hiển thị trước khi thanh toán. Giao dịch có thể được xử lý bởi cổng thanh toán hoặc đối tác dịch vụ được TechHub tích hợp.",
    ],
    bullets: [
      "Quyền truy cập khóa học có thể phụ thuộc vào trạng thái thanh toán, hoàn tiền hoặc chính sách của từng chương trình.",
      "Nếu giao dịch lỗi hoặc bị trừ tiền nhưng chưa ghi danh, bạn nên liên hệ hỗ trợ để được đối soát.",
    ],
  },
  {
    title: "Hành vi sử dụng",
    paragraphs: [
      "Bạn đồng ý sử dụng TechHub theo cách tôn trọng người học khác, giảng viên và hệ thống vận hành của nền tảng.",
    ],
    bullets: [
      "Không đăng nội dung spam, lừa đảo, quấy rối, vi phạm pháp luật hoặc xâm phạm quyền riêng tư của người khác.",
      "Không tấn công, quét, khai thác lỗ hổng, tự động hóa bất thường hoặc làm gián đoạn dịch vụ.",
    ],
  },
  {
    title: "Tính năng AI",
    paragraphs: [
      "Một số khu vực của TechHub có thể dùng AI để gợi ý khóa học, giải thích nội dung, hỗ trợ học tập hoặc tạo bản nháp. Kết quả AI có tính hỗ trợ và có thể cần được kiểm tra lại.",
    ],
    bullets: [
      "Không dùng kết quả AI như lời khuyên chuyên môn duy nhất cho các quyết định quan trọng.",
      "Không nhập dữ liệu nhạy cảm, bí mật hoặc dữ liệu của người khác nếu bạn không có quyền xử lý.",
    ],
  },
  {
    title: "Tạm ngưng hoặc chấm dứt truy cập",
    paragraphs: [
      "TechHub có thể tạm ngưng hoặc giới hạn quyền truy cập khi phát hiện vi phạm điều khoản, rủi ro bảo mật, gian lận thanh toán hoặc hành vi gây ảnh hưởng đến người dùng khác.",
    ],
  },
  {
    title: "Thay đổi điều khoản và liên hệ",
    paragraphs: [
      "TechHub có thể cập nhật điều khoản để phản ánh thay đổi về sản phẩm, vận hành hoặc yêu cầu pháp lý. Khi có thay đổi quan trọng, nền tảng sẽ cố gắng thông báo bằng kênh phù hợp.",
      "Nếu cần hỗ trợ về điều khoản dịch vụ, vui lòng liên hệ qua trang Liên hệ của TechHub.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalDocumentPage
      eyebrow="TechHub legal"
      title="Điều khoản dịch vụ"
      description="Các điều khoản này mô tả cách bạn có thể sử dụng TechHub, quyền và trách nhiệm khi học tập, thanh toán, tương tác với nội dung và dùng các tính năng hỗ trợ học tập."
      lastUpdated="11/05/2026"
      sections={sections}
    />
  );
}

"use client";

/**
 * Root-level error boundary. Wraps its own <html>/<body> because the
 * normal root layout did not render (the error happened above it).
 * Required by Next.js App Router — without this file the dev tools
 * complain with "missing required error components, refreshing...".
 */

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Global error boundary]", error);
  }, [error]);

  return (
    <html lang="vi">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0b1224",
          color: "#e2e8f0",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          padding: "1.5rem",
        }}
      >
        <div
          style={{
            maxWidth: 420,
            width: "100%",
            padding: "2rem",
            borderRadius: 16,
            background: "#0f172a",
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 18px 40px -18px rgba(0,0,0,0.7)",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "1.25rem",
              fontWeight: 700,
              letterSpacing: "-0.01em",
            }}
          >
            Hệ thống đang gặp sự cố
          </h1>
          <p
            style={{
              marginTop: "0.5rem",
              fontSize: "0.875rem",
              color: "#94a3b8",
              lineHeight: 1.5,
            }}
          >
            Đã có lỗi nghiêm trọng xảy ra. Vui lòng tải lại trang để tiếp tục.
          </p>
          {error?.digest ? (
            <p
              style={{
                marginTop: "0.75rem",
                fontSize: "0.6875rem",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                color: "#64748b",
              }}
            >
              ref: {error.digest}
            </p>
          ) : null}
          <button
            onClick={() => reset()}
            style={{
              marginTop: "1.25rem",
              padding: "0.625rem 1.25rem",
              borderRadius: 10,
              border: "none",
              background: "#2563eb",
              color: "#fff",
              fontWeight: 600,
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Tải lại
          </button>
        </div>
      </body>
    </html>
  );
}

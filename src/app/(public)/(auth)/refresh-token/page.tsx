import { Suspense } from "react";
import RefreshTokenPage from "./refresh-token";

export default function RefreshTokenPageWrapper() {
  return (
    <Suspense>
      <RefreshTokenPage />
    </Suspense>
  );
}

import { NextResponse } from "next/server";

const maintenanceMessage = "現在メンテナンス中です。";

export function middleware() {
  if (process.env.MAINTENANCE_MODE === "true") {
    return new NextResponse(maintenanceMessage, {
      status: 503,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};

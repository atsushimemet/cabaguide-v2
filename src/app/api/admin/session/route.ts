import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE } from "@/lib/adminAuth";

export async function POST(request: Request) {
  const { password } = await request.json().catch(() => ({ password: null }));
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return NextResponse.json({ error: "ADMIN_PASSWORD が設定されていません" }, { status: 500 });
  }

  if (!password || password !== adminPassword) {
    return NextResponse.json({ error: "パスワードが正しくありません" }, { status: 401 });
  }

  cookies().set(ADMIN_SESSION_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8, // 8h
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  cookies().delete(ADMIN_SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}

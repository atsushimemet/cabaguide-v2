import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const ADMIN_SESSION_COOKIE = "cabaguide_admin";

export const ensureAdminSession = () => {
  const cookieStore = cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE);
  if (!session || session.value !== "1") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
};

export const clearAdminCookie = () => {
  cookies().delete(ADMIN_SESSION_COOKIE);
};

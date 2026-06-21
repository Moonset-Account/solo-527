import type { TRPCContext } from "./trpc";
import { db } from "./db";
import type { Staff } from "@/types";
import { headers } from "next/headers";

const clerkConfigured = () =>
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !!process.env.CLERK_SECRET_KEY;

export async function createContext(): Promise<TRPCContext> {
  const h = headers();
  let staff: Staff | undefined;
  let campusId: string | undefined;
  if (clerkConfigured()) {
    try {
      const { auth } = await import("@clerk/nextjs/server");
      const s = auth();
      if (s.userId) {
        staff = db.staff.findOne((x) => x.clerkUserId === s.userId) ?? undefined;
      }
    } catch {
      // fall through
    }
  }
  // Fallback: first principal (demo mode)
  if (!staff) {
    staff = db.staff.findOne((x) => x.role === "PRINCIPAL") ?? db.staff.list()[0];
  }
  if (staff) campusId = staff.campusId;
  return { staff, campusId, headers: h };
}

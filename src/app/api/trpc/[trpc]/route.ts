import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/routers/_app";
import { createTRPCContext, mapClerkRole, type AuthUser } from "@/server/trpc";

function hasClerkKeys(): boolean {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const secretKey = process.env.CLERK_SECRET_KEY;
  return (
    !!publishableKey &&
    !publishableKey.includes("placeholder") &&
    !!secretKey &&
    !secretKey.includes("placeholder")
  );
}

async function getAuthFromClerk(): Promise<AuthUser | null> {
  if (!hasClerkKeys()) {
    return null;
  }

  try {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId, orgRole } = await auth();

    const role = mapClerkRole(orgRole);

    return {
      userId,
      role,
      orgRole: orgRole ?? null,
    };
  } catch {
    return null;
  }
}

async function handler(req: Request) {
  const auth = await getAuthFromClerk();

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ req, auth }),
  });
}

export { handler as GET, handler as POST };

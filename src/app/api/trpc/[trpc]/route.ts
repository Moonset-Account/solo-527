import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/lib/trpc/root";
import type { Context } from "@/lib/trpc/server";

const createContext = (): Context => {
  return {
    user: {
      id: "user-1",
      role: "supervisor",
      teamIds: ["team-1", "team-2", "team-3", "team-4"],
    },
  };
};

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
  });

export { handler as GET, handler as POST };

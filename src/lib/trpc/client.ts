import { httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { type AppRouter } from "@/server/api/root";
import superjson from "superjson";

const getBaseUrl = () => {
  if (typeof window !== "undefined") return "";
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
};

export const api = createTRPCReact<AppRouter>();

export const trpcLinks = [
  loggerLink({
    enabled: (opts) =>
      process.env.NODE_ENV === "development" ||
      (opts.direction === "down" && opts.result instanceof Error),
  }),
  httpBatchLink({
    url: `${getBaseUrl()}/api/trpc`,
    transformer: superjson,
  }),
];

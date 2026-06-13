"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { httpBatchLink, loggerLink, splitLink, unstable_httpSubscriptionLink } from "@trpc/client";
import superjson from "superjson";

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 5000, refetchOnWindowFocus: false } },
      })
  );
  const [trpcClient] = useState(() =>
    api.createClient({
      transformer: superjson,
      links: [
        loggerLink({
          enabled: (op) =>
            process.env.NODE_ENV === "development" ||
            (op.direction === "down" && op.result instanceof Error),
        }),
        splitLink({
          condition: (op) => op.type === "subscription",
          true: unstable_httpSubscriptionLink({
            url: "/api/trpc",
            transformer: superjson,
          }),
          false: httpBatchLink({
            url: "/api/trpc",
            transformer: superjson,
            headers() {
              const heads = new Map<string, string>();
              heads.set("x-trpc-source", "nextjs-react");
              return Object.fromEntries(heads);
            },
          }),
        }),
      ],
    })
  );

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </api.Provider>
  );
}

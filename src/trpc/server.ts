import { auth } from "@clerk/nextjs/server";
import { cache } from "react";

import { createCaller } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";

export const createTRPCCaller = cache(() => {
  const session = auth();
  return createCaller(async () => {
    const ctx = await createTRPCContext({ headers: new Headers() });
    return { ...ctx, session };
  });
});

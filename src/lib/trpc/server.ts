import { createCaller } from "@/server/routers/_app";
import { createContext } from "@/server/context";

export async function api() {
  const ctx = await createContext();
  return createCaller(ctx);
}

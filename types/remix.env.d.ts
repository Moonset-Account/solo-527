export type AppLoadContext = {
  user: import("@/shared/types").User | null;
  sessionId?: string;
  ip?: string;
};

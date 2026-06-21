import { memoryRepos } from "./memory";
import { prismaRepos } from "./prisma";
import { prismaConfigured } from "./types";

type RepoKey = keyof typeof memoryRepos;

export function repo<K extends RepoKey>(key: K) {
  if (prismaConfigured()) {
    return prismaRepos[key];
  }
  return memoryRepos[key];
}

export const repose = {
  get leads() { return repo("leads"); },
  get followUps() { return repo("followUps"); },
  get trials() { return repo("trials"); },
  get consumptions() { return repo("consumptions"); },
  get parentFeedbacks() { return repo("parentFeedbacks"); },
  get exportTasks() { return repo("exportTasks"); },
};

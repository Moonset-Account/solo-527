declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      prisma: any;
    }
  }
}

let prisma: any;

if (typeof window === "undefined") {
  if (process.env.NODE_ENV === "production") {
    prisma = {} as any;
  } else {
    if (!(global as any).prisma) {
      (global as any).prisma = {} as any;
    }
    prisma = (global as any).prisma;
  }
}

export { prisma };

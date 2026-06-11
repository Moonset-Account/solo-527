// Prisma configuration file for Prisma 5.x
// This file is for reference and tooling support
// Actual database URL is configured in schema.prisma via env("DATABASE_URL")

export default {
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
}

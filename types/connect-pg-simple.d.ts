declare module "connect-pg-simple" {
  import { Store } from "express-session";
  import { Pool } from "pg";

  interface PGStoreOptions {
    pool?: Pool;
    conString?: string;
    tableName?: string;
    schemaName?: string;
    pruneSessionInterval?: number;
    errorLog?: (err: Error) => void;
  }

  class PGStore extends Store {
    constructor(options: PGStoreOptions);
  }

  export default function (session: typeof import("express-session")): typeof PGStore;
}

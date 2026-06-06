import { getDB, initDB } from "~/server/db";
import type { APIEvent } from "@solidjs/start/server";

initDB();

export async function GET({ params }: APIEvent) {
  const db = getDB();
  const plateNumber = params.plateNumber;
  const now = Date.now();

  const result = db
    .prepare(
      "SELECT * FROM blacklist WHERE plate_number = ? AND is_active = 1 AND (expires_at IS NULL OR expires_at > ?)"
    )
    .get(plateNumber.toUpperCase(), now);

  if (result) {
    return Response.json({ blocked: true, item: result });
  }

  return Response.json({ blocked: false });
}

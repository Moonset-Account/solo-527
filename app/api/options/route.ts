import { jsonResponse } from "../utils";
import { MOCK_OPTIONS } from "@/lib/mock/data";

export async function GET() {
  return jsonResponse(MOCK_OPTIONS);
}

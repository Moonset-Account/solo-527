import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { runExport } from "../../scripts/export-task";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { format = "csv", type = "full", filters = {} } = body;

    const result = await runExport({ format, type, filters, outputDir: "./exports" });

    return json({
      success: true,
      files: result.files,
      data: result.data,
    });
  } catch (error) {
    console.error("Export error:", error);
    return json(
      { success: false, error: "Export failed", details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function loader() {
  return json({
    availableFormats: ["csv", "json"],
    availableTypes: ["funnel", "quiz", "department", "certificate", "full"],
  });
}

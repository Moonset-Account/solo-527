import { redirect } from "@remix-run/node";
export function loader() { return redirect("/workorders"); }
export default function Index() { return null; }

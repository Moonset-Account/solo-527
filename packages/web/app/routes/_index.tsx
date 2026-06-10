import { redirect } from "@remix-run/node";

export const loader = async () => {
  return redirect("/pm/requests");
};

export default function Index() {
  return null;
}

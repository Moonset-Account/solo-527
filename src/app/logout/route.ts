import { signOut } from "@/app/actions";

export async function POST() {
  await signOut();
}

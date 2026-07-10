import { HvacGrowthApp } from "@/components/hvac-growth-app";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sessionCookieName, verifySessionToken } from "@/lib/auth";

export default async function UploadsPage() {
  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(sessionCookieName())?.value);
  if (!session) redirect("/login?next=/uploads");

  return <HvacGrowthApp currentUser={session} initialSection="uploads" />;
}

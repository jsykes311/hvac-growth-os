import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ChartNoAxesCombined } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { sessionCookieName, verifySessionToken } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(sessionCookieName())?.value);
  if (session) redirect("/");

  const params = await searchParams;
  const nextPath = safeNextPath(params.next);

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8 lg:px-12">
      <div className="background-effects" aria-hidden="true" />
      <div className="glow glow-one" aria-hidden="true" />
      <div className="glow glow-two" aria-hidden="true" />
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center gap-10 lg:grid-cols-[1fr_.86fr]">
        <section>
          <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-ink/10 bg-white/80 px-4 py-2 text-sm font-black text-ink shadow-soft">
            <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-ink to-flame text-white">
              <ChartNoAxesCombined className="size-4" aria-hidden="true" />
            </span>
            Powered by TallTwin
          </div>
          <h1 className="max-w-3xl text-5xl font-black leading-[1.02] text-ink sm:text-6xl">
            HVAC Growth OS
          </h1>
          <p className="mt-5 max-w-2xl text-xl font-bold leading-8 text-graphite">
            Your private AI marketing command center for HVAC growth.
          </p>
          <p className="mt-5 max-w-2xl text-base leading-7 text-graphite/75">
            Access is limited to approved TallTwin users and client teams. Public signup is currently closed.
          </p>
        </section>

        <section className="rounded-[28px] border border-ink/10 bg-white/88 p-7 shadow-soft backdrop-blur-md">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-copper">Private access</p>
          <h2 className="mt-3 text-2xl font-black text-ink">Sign in to continue</h2>
          <p className="mt-2 text-sm leading-6 text-graphite/70">
            Approved users can access dashboards, client workspaces, deployment tools, reports, and connected apps.
          </p>
          <LoginForm nextPath={nextPath} />
        </section>
      </div>
    </main>
  );
}

function safeNextPath(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

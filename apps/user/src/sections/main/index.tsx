import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import { ArrowRight, Check, Globe2, ShieldCheck, Zap } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useGlobalStore } from "@/stores/global";

export default function Main() {
  const { common, user } = useGlobalStore();
  const navigate = useNavigate();
  const { t } = useTranslation("main");

  const showLanding = import.meta.env.VITE_SHOW_LANDING_PAGE !== "false";
  const site = common.site;
  const siteName = site.site_name || "PPanel";
  const siteDescription =
    site.site_desc ||
    t(
      "apple_like_description",
      "A quiet, reliable network experience for work, travel, and everyday browsing."
    );

  useEffect(() => {
    if (user) {
      navigate({ to: "/dashboard" });
      return;
    }

    if (!showLanding) {
      navigate({ to: "/auth" });
    }
  }, [user, navigate, showLanding]);

  if (!showLanding) return null;

  return (
    <main className="overflow-hidden bg-background">
      <section className="container flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center gap-10 py-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-4 py-2 text-muted-foreground text-sm">
          <span className="size-2 rounded-full bg-emerald-500" />
          {t("landing_badge", "Built for a cleaner connection")}
        </div>
        <div className="mx-auto max-w-5xl space-y-6">
          <h1 className="text-balance font-semibold text-5xl tracking-normal sm:text-6xl lg:text-7xl">
            {siteName}
            <span className="block text-muted-foreground">
              {t("landing_hero_line", "Network, made simple.")}
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-balance text-lg text-muted-foreground leading-8 sm:text-xl">
            {siteDescription}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild className="rounded-full px-6" size="lg">
            <Link to="/auth">
              {t("started", "Get Started")}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button
            asChild
            className="rounded-full px-6"
            size="lg"
            variant="outline"
          >
            <Link to="/purchasing">
              {t("landing_view_plans", "View Plans")}
            </Link>
          </Button>
        </div>
        <div className="relative mt-4 w-full max-w-5xl">
          <div className="absolute inset-x-12 top-10 h-32 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-500/10" />
          <div className="relative rounded-[2rem] border bg-gradient-to-b from-background to-muted/50 p-3 shadow-2xl shadow-black/5">
            <div className="grid gap-3 rounded-[1.5rem] border bg-background/80 p-4 backdrop-blur md:grid-cols-3">
              {[
                {
                  icon: ShieldCheck,
                  label: t("landing_feature_private", "Private by design"),
                  value: t("landing_feature_private_value", "Encrypted access"),
                },
                {
                  icon: Zap,
                  label: t("landing_feature_fast", "Fast when it matters"),
                  value: t("landing_feature_fast_value", "Low-latency routes"),
                },
                {
                  icon: Globe2,
                  label: t("landing_feature_global", "Ready anywhere"),
                  value: t("landing_feature_global_value", "Global nodes"),
                },
              ].map((item) => (
                <div
                  className="flex items-center gap-4 rounded-2xl bg-muted/50 p-4 text-left"
                  key={item.label}
                >
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-background">
                    <item.icon className="size-5" />
                  </div>
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-muted-foreground text-sm">
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y bg-muted/30 py-16">
        <div className="container grid gap-8 md:grid-cols-3">
          {[
            {
              title: t("landing_principle_one", "Instant setup"),
              body: t(
                "landing_principle_one_body",
                "Pick a plan, sign in, and connect without digging through settings."
              ),
            },
            {
              title: t("landing_principle_two", "Transparent usage"),
              body: t(
                "landing_principle_two_body",
                "Your subscription, traffic, and renewal status stay clear at a glance."
              ),
            },
            {
              title: t("landing_principle_three", "Calm control"),
              body: t(
                "landing_principle_three_body",
                "Manage devices and access from a dashboard that stays out of your way."
              ),
            },
          ].map((item) => (
            <div className="space-y-3" key={item.title}>
              <Check className="size-5 text-emerald-500" />
              <h2 className="font-semibold text-2xl">{item.title}</h2>
              <p className="text-muted-foreground leading-7">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

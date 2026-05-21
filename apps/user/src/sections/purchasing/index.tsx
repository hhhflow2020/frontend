import { useQuery } from "@tanstack/react-query";
import { Link, useSearch } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import Empty from "@workspace/ui/composed/empty";
import { getSubscription } from "@workspace/ui/services/user/portal";
import { Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PlanCard } from "@/sections/subscribe/plan-card";
import { useGlobalStore } from "@/stores/global";
import Content from "./content";

export default function Purchasing() {
  const { id } = useSearch({ from: "/(main)/purchasing/" }) as { id: string };
  const { i18n, t } = useTranslation("subscribe");
  const { user } = useGlobalStore();
  const canBuySubscription = Boolean(user?.is_member);
  const unitTimeMap: Record<string, string> = {
    Day: t("Day", "Day"),
    Hour: t("Hour", "Hour"),
    Minute: t("Minute", "Minute"),
    Month: t("Month", "Month"),
    NoLimit: t("NoLimit", "No Limit"),
    Year: t("Year", "Year"),
  };
  const { data } = useQuery({
    queryKey: ["subscription", i18n.language],
    queryFn: async () => {
      const { data } = await getSubscription(
        {
          language: i18n.language,
        },
        {
          skipErrorHandler: true,
        }
      );
      return data.data?.list || [];
    },
  });

  const subscription = data?.find(
    (item: API.Subscribe) => item.id === Number(id)
  );

  if (!id) {
    return (
      <main className="container py-10">
        {data?.length ? (
          <div className="grid items-start gap-6 md:grid-cols-2 xl:grid-cols-3">
            {data.map((item) => {
              const unitTime =
                unitTimeMap[item.unit_time!] ||
                t(item.unit_time || "Month", item.unit_time || "Month");
              const action = (() => {
                if (!item.sell) {
                  return (
                    <Button
                      className="h-12 w-full rounded-2xl shadow-sm"
                      disabled
                    >
                      <Zap className="size-4" />
                      {t("soldOut", "Unavailable")}
                    </Button>
                  );
                }

                if (!user) {
                  return (
                    <Button
                      asChild
                      className="h-12 w-full rounded-2xl shadow-sm transition-shadow hover:shadow-md"
                    >
                      <Link to="/auth">
                        <Zap className="size-4" />
                        {t("membership.loginToBuy", "Login to Buy")}
                      </Link>
                    </Button>
                  );
                }

                if (!canBuySubscription) {
                  return (
                    <Button
                      asChild
                      className="h-12 w-full rounded-2xl shadow-sm transition-shadow hover:shadow-md"
                    >
                      <Link to="/subscribe">
                        <Zap className="size-4" />
                        {t("membership.buyFirst", "Get Membership")}
                      </Link>
                    </Button>
                  );
                }

                return (
                  <Button
                    asChild
                    className="h-12 w-full rounded-2xl shadow-sm transition-shadow hover:shadow-md"
                  >
                    <Link search={{ id: item.id }} to="/purchasing">
                      <Zap className="size-4" />
                      {t("buy", "Buy")}
                    </Link>
                  </Button>
                );
              })();

              return (
                <PlanCard
                  action={action}
                  item={item}
                  key={item.id}
                  unitTimeLabel={unitTime}
                />
              );
            })}
          </div>
        ) : (
          <Empty />
        )}
      </main>
    );
  }

  if (!canBuySubscription) {
    const actionTo = user ? "/subscribe" : "/auth";
    const actionText = user
      ? t("membership.buyFirst", "Get Membership")
      : t("membership.loginToBuy", "Login to Buy");

    return (
      <main className="container py-10">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-5 rounded-3xl border bg-background/70 px-8 py-12 text-center shadow-sm backdrop-blur">
          <div className="rounded-full bg-primary/10 p-3 text-primary">
            <Zap className="size-6" />
          </div>
          <div className="space-y-2">
            <h1 className="font-semibold text-2xl">
              {t("membership.requiredTitle", "Membership Required")}
            </h1>
            <p className="text-muted-foreground leading-7">
              {t(
                "membership.requiredDescription",
                "A membership card is required before purchasing subscription products."
              )}
            </p>
          </div>
          <Button asChild className="h-11 rounded-2xl px-6">
            <Link to={actionTo}>{actionText}</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="container space-y-16">
      <Content subscription={subscription} />
    </main>
  );
}

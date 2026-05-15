import { useQuery } from "@tanstack/react-query";
import { Link, useSearch } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import Empty from "@workspace/ui/composed/empty";
import { getSubscription } from "@workspace/ui/services/user/portal";
import { Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PlanCard } from "@/sections/subscribe/plan-card";
import Content from "./content";

export default function Purchasing() {
  const { id } = useSearch({ from: "/(main)/purchasing/" }) as { id: string };
  const { i18n, t } = useTranslation("subscribe");
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

              return (
                <PlanCard
                  action={
                    item.sell ? (
                      <Button
                        asChild
                        className="h-12 w-full rounded-2xl shadow-sm transition-shadow hover:shadow-md"
                      >
                        <Link search={{ id: item.id }} to="/purchasing">
                          <Zap className="size-4" />
                          {t("buy", "Buy")}
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        className="h-12 w-full rounded-2xl shadow-sm"
                        disabled
                      >
                        <Zap className="size-4" />
                        {t("soldOut", "Unavailable")}
                      </Button>
                    )
                  }
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

  return (
    <main className="container space-y-16">
      <Content subscription={subscription} />
    </main>
  );
}

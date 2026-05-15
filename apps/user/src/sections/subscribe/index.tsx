"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import Empty from "@workspace/ui/composed/empty";
import { querySubscribeList } from "@workspace/ui/services/user/subscribe";
import { Zap } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PlanCard } from "./plan-card";
import Purchase from "./purchase";

export default function Subscribe() {
  const { t, i18n } = useTranslation("subscribe");
  const unitTimeMap: Record<string, string> = {
    Day: t("Day", "Day"),
    Hour: t("Hour", "Hour"),
    Minute: t("Minute", "Minute"),
    Month: t("Month", "Month"),
    NoLimit: t("NoLimit", "No Limit"),
    Year: t("Year", "Year"),
  };
  const locale = i18n.language;
  const [subscribe, setSubscribe] = useState<API.Subscribe>();

  const { data } = useQuery({
    queryKey: ["querySubscribeList", locale],
    queryFn: async () => {
      const { data } = await querySubscribeList({ language: locale });
      return data.data?.list || [];
    },
  });

  const filteredData = data?.filter((item) => item.user_visible);

  return (
    <>
      <div className="space-y-4">
        <div className="grid items-start gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredData?.map((item) => {
            const unitTime =
              unitTimeMap[item.unit_time!] ||
              t(item.unit_time || "Month", item.unit_time || "Month");

            return (
              <PlanCard
                action={
                  <Button
                    className="h-12 w-full rounded-2xl shadow-sm transition-shadow hover:shadow-md"
                    disabled={!item.sell}
                    onClick={() => {
                      setSubscribe(item);
                    }}
                  >
                    <Zap className="size-4" />
                    {item.sell ? t("buy", "Buy") : t("soldOut", "Unavailable")}
                  </Button>
                }
                item={item}
                key={item.id}
                unitTimeLabel={unitTime}
              />
            );
          })}
        </div>
        {filteredData?.length === 0 && <Empty />}
      </div>
      <Purchase setSubscribe={setSubscribe} subscribe={subscribe} />
    </>
  );
}

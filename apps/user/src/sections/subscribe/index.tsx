"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import Empty from "@workspace/ui/composed/empty";
import { Icon } from "@workspace/ui/composed/icon";
import { cn } from "@workspace/ui/lib/utils";
import { querySubscribeList } from "@workspace/ui/services/user/subscribe";
import { Check, Gauge, HardDrive, Router, Sparkles, Zap } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Display } from "@/components/display";
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

  const filteredData = data?.filter((item) => item.show);

  return (
    <>
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredData?.map((item) => {
            const parsed = parseSubscribeDescription(item.description);
            const discounts = getDisplayDiscounts(item.discount);
            const unitTime =
              unitTimeMap[item.unit_time!] ||
              t(item.unit_time || "Month", item.unit_time || "Month");
            const hasDiscount = discounts.length > 0;

            return (
              <Card
                className="group hover:-translate-y-0.5 relative overflow-hidden border-muted/70 transition hover:border-primary/30 hover:shadow-lg"
                key={item.id}
              >
                <CardContent className="flex min-h-full flex-col gap-6 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-2xl leading-tight">
                          {item.name}
                        </h3>
                        {hasDiscount && (
                          <Badge variant="secondary">
                            <Sparkles className="size-3" />
                            {t("discount", "Discount")}
                          </Badge>
                        )}
                      </div>
                      {parsed.description && (
                        <p className="line-clamp-2 text-muted-foreground text-sm leading-6">
                          {parsed.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-end gap-1">
                      <div className="font-semibold text-4xl tracking-normal">
                        <Display type="currency" value={item.unit_price} />
                      </div>
                      <span className="pb-1 text-muted-foreground text-sm">
                        /{unitTime}
                      </span>
                    </div>
                    {hasDiscount && (
                      <div className="flex flex-wrap gap-1.5 text-muted-foreground text-xs">
                        {discounts.slice(0, 3).map((discount) => (
                          <Badge
                            className="h-5 rounded-sm px-1.5 font-normal text-[11px]"
                            key={`${discount.quantity}-${discount.discount}`}
                            variant="outline"
                          >
                            {discount.quantity} {unitTime} -
                            {100 - discount.discount}%
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3">
                    <PlanMetric
                      icon={<HardDrive className="size-4" />}
                      label={t("detail.traffic", "Traffic")}
                      value={
                        <Display
                          fractionDigits={0}
                          type="traffic"
                          unlimited
                          value={item.traffic}
                        />
                      }
                    />
                    <PlanMetric
                      icon={<Gauge className="size-4" />}
                      label={t("detail.speedLimit", "Speed")}
                      value={
                        <Display
                          fractionDigits={0}
                          type="trafficSpeed"
                          unlimited
                          value={item.speed_limit}
                        />
                      }
                    />
                    <PlanMetric
                      icon={<Router className="size-4" />}
                      label={t("detail.deviceLimit", "Devices")}
                      value={
                        <Display
                          fractionDigits={0}
                          type="number"
                          unlimited
                          value={item.device_limit}
                        />
                      }
                    />
                  </div>

                  {parsed.features.length > 0 && (
                    <ul className="grid gap-3 text-sm">
                      {parsed.features.slice(0, 5).map((feature, index) => (
                        <li
                          className={cn("flex items-start gap-2", {
                            "text-muted-foreground line-through":
                              feature.type === "destructive",
                          })}
                          key={`${feature.label}-${index}`}
                        >
                          {feature.icon ? (
                            <Icon
                              className={cn("mt-0.5 size-4 text-primary", {
                                "text-emerald-500": feature.type === "success",
                                "text-destructive":
                                  feature.type === "destructive",
                              })}
                              icon={feature.icon}
                            />
                          ) : (
                            <Check className="mt-0.5 size-4 text-emerald-500" />
                          )}
                          <span className="leading-5">{feature.label}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <Button
                    className="mt-auto h-11 w-full"
                    disabled={!item.sell}
                    onClick={() => {
                      setSubscribe(item);
                    }}
                  >
                    <Zap className="size-4" />
                    {item.sell ? t("buy", "Buy") : t("soldOut", "Unavailable")}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
        {filteredData?.length === 0 && <Empty />}
      </div>
      <Purchase setSubscribe={setSubscribe} subscribe={subscribe} />
    </>
  );
}

function PlanMetric({
  icon,
  label,
  value,
}: Readonly<{
  icon: ReactNode;
  label: string;
  value: ReactNode;
}>) {
  return (
    <div className="min-w-0 rounded-md border bg-muted/30 p-3">
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className="break-words font-medium text-xs leading-4">{value}</div>
    </div>
  );
}

function getDisplayDiscounts(discounts?: API.SubscribeDiscount[]) {
  return (discounts || [])
    .filter(
      (item) =>
        Number(item.quantity) > 1 &&
        Number(item.discount) > 0 &&
        Number(item.discount) < 100
    )
    .sort((a, b) => a.quantity - b.quantity);
}

function parseSubscribeDescription(value?: string): {
  description: string;
  features: Array<{
    icon?: string;
    label: string;
    type?: "default" | "success" | "destructive";
  }>;
} {
  if (!value) {
    return { description: "", features: [] };
  }

  try {
    const parsed = JSON.parse(value);
    return {
      description:
        typeof parsed.description === "string" ? parsed.description : "",
      features: Array.isArray(parsed.features) ? parsed.features : [],
    };
  } catch {
    return { description: value, features: [] };
  }
}

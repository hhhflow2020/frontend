"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Icon } from "@workspace/ui/composed/icon";
import { cn } from "@workspace/ui/lib/utils";
import { Check, Gauge, HardDrive, Router, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Display } from "@/components/display";

interface PlanCardProps {
  action: ReactNode;
  item: API.Subscribe;
  unitTimeLabel: string;
}

export function PlanCard({
  action,
  item,
  unitTimeLabel,
}: Readonly<PlanCardProps>) {
  const { t } = useTranslation("subscribe");
  const parsed = parseSubscribeDescription(item.description);
  const discounts = getDisplayDiscounts(item.discount);
  const hasDiscount = discounts.length > 0;

  return (
    <Card className="group hover:-translate-y-1 relative overflow-hidden rounded-3xl border border-white/10 bg-background/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-xl transition-all duration-300 hover:shadow-[0_12px_40px_rgb(0,0,0,0.12)] dark:bg-background/40">
      <CardContent className="flex min-h-full flex-col gap-6 p-8">
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

        <div className="flex flex-col gap-3">
          <div className="flex items-baseline gap-1.5">
            <div className="font-bold text-5xl text-foreground tracking-tighter">
              <Display type="currency" value={item.unit_price} />
            </div>
            <span className="font-medium text-muted-foreground text-sm">
              / {unitTimeLabel}
            </span>
          </div>
          {hasDiscount && (
            <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-3">
              <div className="mb-2 font-bold text-[10px] text-emerald-600/80 uppercase tracking-widest dark:text-emerald-400/80">
                {t("volumeDiscounts", "Volume Discounts")}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {discounts.slice(0, 3).map((discount) => (
                  <div
                    className="flex flex-col items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-1 py-1.5 text-emerald-700 shadow-sm transition-colors hover:bg-emerald-500/20 dark:text-emerald-300"
                    key={`${discount.quantity}-${discount.discount}`}
                  >
                    <span className="mb-0.5 font-medium text-[10px] uppercase leading-none opacity-80">
                      {discount.quantity} {unitTimeLabel}
                    </span>
                    <span className="font-bold text-lg leading-none">
                      -{100 - discount.discount}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-primary">
              <HardDrive className="size-5" />
              <span className="font-medium">
                {t("detail.traffic", "Traffic")}
              </span>
            </div>
            <div className="font-bold text-primary text-xl tracking-tight">
              <Display
                fractionDigits={0}
                type="traffic"
                unlimited
                value={item.traffic}
              />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
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
                      "text-destructive": feature.type === "destructive",
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

        <div className="mt-auto">{action}</div>
      </CardContent>
    </Card>
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
    <div className="min-w-0 rounded-2xl border border-white/5 bg-muted/40 p-4">
      <div className="mb-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
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

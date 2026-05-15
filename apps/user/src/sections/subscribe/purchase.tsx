"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Separator } from "@workspace/ui/components/separator";
import { cn } from "@workspace/ui/lib/utils";
import { preCreateOrder, purchase } from "@workspace/ui/services/user/order";
import { Check, Gauge, HardDrive, LoaderCircle, Router } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useTranslation } from "react-i18next";
import { Display } from "@/components/display";
import CouponInput from "@/sections/subscribe/coupon-input";
import DurationSelector from "@/sections/subscribe/duration-selector";
import PaymentMethods from "@/sections/subscribe/payment-methods";
import { useGlobalStore } from "@/stores/global";
import { SubscribeBilling } from "./billing";

interface PurchaseProps {
  subscribe?: API.Subscribe;
  setSubscribe: (subscribe?: API.Subscribe) => void;
}

export default function Purchase({
  subscribe,
  setSubscribe,
}: Readonly<PurchaseProps>) {
  const { t } = useTranslation("subscribe");
  const { getUserInfo } = useGlobalStore();
  const router = useRouter();
  const [params, setParams] = useState<Partial<API.PurchaseOrderRequest>>({
    quantity: 1,
    subscribe_id: 0,
    payment: -1,
    coupon: "",
  });
  const [loading, startTransition] = useTransition();
  const lastSuccessOrderRef = useRef<any>(null);
  const parsed = parseSubscribeDescription(subscribe?.description);

  const { data: order } = useQuery({
    enabled: !!subscribe?.id,
    queryKey: [
      "preCreateOrder",
      subscribe?.id,
      params.quantity,
      params.payment,
      params.coupon,
    ],
    queryFn: async () => {
      try {
        const { data } = await preCreateOrder({
          ...params,
          subscribe_id: subscribe?.id as number,
        } as API.PurchaseOrderRequest);
        const result = data.data;
        if (result) {
          lastSuccessOrderRef.current = result;
        }
        return result;
      } catch (error) {
        if (lastSuccessOrderRef.current) {
          return lastSuccessOrderRef.current;
        }
        throw error;
      }
    },
  });

  useEffect(() => {
    if (subscribe) {
      const defaultQuantity =
        subscribe.show_original_price === false && subscribe.discount?.[0]
          ? subscribe.discount[0].quantity
          : 1;
      setParams((prev) => ({
        ...prev,
        quantity: defaultQuantity,
        subscribe_id: subscribe?.id,
      }));
    }
  }, [subscribe]);

  const handleChange = useCallback(
    (field: keyof typeof params, value: string | number) => {
      setParams((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    startTransition(async () => {
      try {
        const response = await purchase(params as API.PurchaseOrderRequest);
        const orderNo = response.data.data?.order_no;
        if (orderNo) {
          getUserInfo();
          router.navigate({ to: "/payment", search: { order_no: orderNo } });
        }
      } catch (_error) {
        /* empty */
      }
    });
  }, [params, router, getUserInfo]);

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) setSubscribe(undefined);
      }}
      open={!!subscribe?.id}
    >
      <DialogContent className="flex h-full flex-col overflow-hidden border-none p-0 md:h-auto md:max-w-5xl">
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle className="text-2xl">
            {t("buySubscription", "Buy Subscription")}
          </DialogTitle>
        </DialogHeader>
        <div className="grid w-full flex-grow gap-4 overflow-auto p-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
          <Card className="overflow-hidden border-muted/70 shadow-none">
            <CardContent className="grid gap-6 p-6">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-semibold text-2xl leading-tight">
                    {subscribe?.name}
                  </h3>
                  <div className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary text-sm">
                    x {params.quantity || 1}
                  </div>
                </div>
                {parsed.description && (
                  <p className="text-muted-foreground text-sm leading-6">
                    {parsed.description}
                  </p>
                )}
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <PurchaseMetric
                  icon={<HardDrive className="size-4" />}
                  label={t("detail.traffic", "Traffic")}
                  value={
                    <Display
                      type="traffic"
                      unlimited
                      value={subscribe?.traffic}
                    />
                  }
                />
                <PurchaseMetric
                  icon={<Gauge className="size-4" />}
                  label={t("detail.speedLimit", "Speed")}
                  value={
                    <Display
                      type="trafficSpeed"
                      unlimited
                      value={subscribe?.speed_limit}
                    />
                  }
                />
                <PurchaseMetric
                  icon={<Router className="size-4" />}
                  label={t("detail.deviceLimit", "Devices")}
                  value={
                    <Display
                      type="number"
                      unlimited
                      value={subscribe?.device_limit}
                    />
                  }
                />
              </div>

              {parsed.features.length > 0 && (
                <ul className="grid gap-3 text-sm">
                  {parsed.features.slice(0, 6).map((feature, index) => (
                    <li
                      className={cn("flex items-start gap-2", {
                        "text-muted-foreground line-through":
                          feature.type === "destructive",
                      })}
                      key={`${feature.label}-${index}`}
                    >
                      <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                      <span className="leading-5">{feature.label}</span>
                    </li>
                  ))}
                </ul>
              )}

              <Separator />
              <SubscribeBilling
                order={{
                  ...order,
                  quantity: params.quantity,
                  unit_price: subscribe?.unit_price,
                  show_original_price: subscribe?.show_original_price,
                }}
              />
            </CardContent>
          </Card>
          <div className="flex flex-col justify-between rounded-md border bg-muted/20 p-4 text-sm md:p-5">
            <div className="mb-6 grid gap-5">
              <DurationSelector
                discounts={subscribe?.discount}
                onChange={(value) => {
                  handleChange("quantity", value);
                }}
                quantity={params.quantity as number}
                showOriginalPrice={subscribe?.show_original_price}
                unitTime={subscribe?.unit_time}
              />
              <CouponInput
                coupon={params.coupon}
                onChange={(value) => handleChange("coupon", value)}
              />
              <PaymentMethods
                onChange={(value) => {
                  handleChange("payment", value);
                }}
                value={params.payment as number}
              />
            </div>
            <Button
              className="fixed bottom-0 left-0 h-12 w-full md:relative md:mt-6"
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading && <LoaderCircle className="mr-2 animate-spin" />}
              {t("buyNow", "Buy Now")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PurchaseMetric({
  icon,
  label,
  value,
}: Readonly<{
  icon: ReactNode;
  label: string;
  value: ReactNode;
}>) {
  return (
    <div className="min-w-0 rounded-md border bg-background p-3">
      <div className="mb-2 flex items-center gap-1.5 text-muted-foreground text-xs">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className="break-words font-medium text-sm leading-5">{value}</div>
    </div>
  );
}

function parseSubscribeDescription(value?: string): {
  description: string;
  features: Array<{
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

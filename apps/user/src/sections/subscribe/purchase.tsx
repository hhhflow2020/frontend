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
      <DialogContent className="flex h-full flex-col overflow-hidden border-none bg-background p-0 md:h-auto md:max-w-screen-lg">
        <DialogHeader className="border-b px-6 py-5 text-center">
          <DialogTitle className="font-semibold text-xl tracking-normal">
            {t("buySubscription", "Buy Subscription")}
          </DialogTitle>
        </DialogHeader>
        <div className="grid w-full flex-grow overflow-auto lg:grid-cols-2">
          <section className="grid content-between gap-8 p-6 md:p-8">
            <div className="space-y-8">
              <div className="mx-auto max-w-md space-y-4 text-center">
                <div className="text-muted-foreground text-sm">
                  {t("selectedPlan", "Selected plan")}
                </div>
                <h3 className="font-semibold text-4xl leading-tight tracking-normal">
                  {subscribe?.name}
                </h3>
                {parsed.description && (
                  <p className="text-balance text-muted-foreground text-sm leading-6">
                    {parsed.description}
                  </p>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <PurchaseMetric
                  icon={<HardDrive className="size-4" />}
                  label={t("detail.traffic", "Traffic")}
                  value={
                    <Display
                      fractionDigits={0}
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
                      fractionDigits={0}
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
                      fractionDigits={0}
                      type="number"
                      unlimited
                      value={subscribe?.device_limit}
                    />
                  }
                />
              </div>

              {parsed.features.length > 0 && (
                <ul className="mx-auto grid max-w-md gap-3 text-sm">
                  {parsed.features.slice(0, 6).map((feature, index) => (
                    <li
                      className={cn("flex items-start gap-3", {
                        "text-muted-foreground line-through":
                          feature.type === "destructive",
                      })}
                      key={`${feature.label}-${index}`}
                    >
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                        <Check className="size-3.5 text-emerald-500" />
                      </span>
                      <span className="leading-5">{feature.label}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <aside className="flex flex-col justify-between border-t bg-muted/30 p-5 text-sm lg:border-t-0 lg:border-l lg:p-6">
            <div className="grid gap-6">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {t("quantity", "Quantity")}
                </span>
                <span className="font-medium">x {params.quantity || 1}</span>
              </div>
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
              <Card className="border-muted/70 bg-background shadow-none">
                <CardContent className="grid gap-4 p-4">
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
            </div>
            <Button
              className="fixed bottom-0 left-0 h-12 w-full rounded-none text-base md:relative md:mt-6 md:rounded-md"
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading && <LoaderCircle className="mr-2 animate-spin" />}
              {t("buyNow", "Buy Now")}
            </Button>
          </aside>
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

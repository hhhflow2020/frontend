"use client";

import { useNavigate } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Icon } from "@workspace/ui/composed/icon";
import { resetTraffic } from "@workspace/ui/services/user/order";
import { LoaderCircle } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useTranslation } from "react-i18next";
import { Display } from "@/components/display";
import { useGlobalStore } from "@/stores/global";
import PaymentMethods from "./payment-methods";

interface ResetTrafficProps {
  subscription: API.UserSubscribe;
  trigger?: React.ReactNode;
}
export default function ResetTraffic({
  subscription,
  trigger,
}: Readonly<ResetTrafficProps>) {
  const { t } = useTranslation("subscribe");
  const { getUserInfo } = useGlobalStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState<boolean>(false);
  const [params, setParams] = useState<API.ResetTrafficOrderRequest>({
    payment: -1,
    user_subscribe_id: subscription.id,
  });
  const [loading, startTransition] = useTransition();
  const replacement = subscription.subscribe?.replacement;
  const usedTraffic = subscription.upload + subscription.download;
  const remainingTraffic = subscription.traffic
    ? Math.max(subscription.traffic - usedTraffic, 0)
    : 0;
  const isExpired =
    subscription.status === 3 ||
    (!!subscription.expire_time &&
      subscription.expire_time < Date.now() &&
      subscription.expire_time !== 0);
  const isFree = (replacement || 0) <= 0;
  const submitDisabled =
    loading || isExpired || (!isFree && params.payment < 0);

  useEffect(() => {
    if (subscription.id) {
      setParams((prev) => ({
        ...prev,
        quantity: 1,
        user_subscribe_id: subscription.id,
      }));
    }
  }, [subscription.id]);

  if (replacement === undefined || replacement === null) return null;

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="secondary">
            <Icon className="mr-1.5 size-4" icon="uil:tachometer-fast-alt" />
            {t("resetTraffic", "Reset Traffic")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="flex h-full flex-col overflow-hidden md:h-auto md:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("resetTrafficTitle", "Reset Traffic")}</DialogTitle>
          <DialogDescription>{t("resetTrafficDescription")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 overflow-y-auto text-sm">
          <div className="rounded-2xl border border-border/50 bg-muted/20 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-muted-foreground text-xs">
                  {t("resetTrafficProduct")}
                </div>
                <div className="font-bold text-base">
                  {subscription.product_name || subscription.subscribe?.name}
                </div>
              </div>
              <div className="rounded-full border bg-background px-3 py-1 font-bold">
                {isFree ? (
                  t("freeReset", "Free")
                ) : (
                  <Display type="currency" value={replacement} />
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-background p-3">
                <div className="text-muted-foreground text-xs">
                  {t("usedTraffic")}
                </div>
                <div className="mt-1 font-bold">
                  <Display type="traffic" value={usedTraffic} />
                </div>
              </div>
              <div className="rounded-xl bg-background p-3">
                <div className="text-muted-foreground text-xs">
                  {t("remainingTraffic")}
                </div>
                <div className="mt-1 font-bold">
                  <Display
                    type="traffic"
                    unlimited={!subscription.traffic}
                    value={remainingTraffic}
                  />
                </div>
              </div>
              <div className="rounded-xl bg-background p-3">
                <div className="text-muted-foreground text-xs">
                  {t("afterReset")}
                </div>
                <div className="mt-1 font-bold">
                  <Display type="traffic" value={0} />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100">
            <ul className="grid gap-2">
              <li>{t("resetTrafficImpactClearUsed")}</li>
              <li>{t("resetTrafficImpactNoExtension")}</li>
              <li>{t("resetTrafficImpactKeepPlan")}</li>
            </ul>
          </div>

          {isExpired ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 font-medium text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
              {t("resetTrafficExpired")}
            </div>
          ) : null}

          {!isFree && (
            <PaymentMethods
              onChange={(value) => {
                setParams({
                  ...params,
                  payment: value,
                });
              }}
              value={params.payment}
            />
          )}

          <DialogFooter>
            <Button
              className="fixed bottom-0 left-0 w-full rounded-none md:relative md:mt-2 md:rounded-full"
              disabled={submitDisabled}
              onClick={async () => {
                startTransition(async () => {
                  try {
                    const response = await resetTraffic(params);
                    const orderNo = response.data.data?.order_no;
                    if (orderNo) {
                      getUserInfo();
                      navigate({
                        to: "/payment",
                        search: { order_no: String(orderNo) },
                      });
                    }
                  } catch (_error) {
                    // The shared request interceptor already shows the user-facing error.
                  }
                });
              }}
            >
              {loading && <LoaderCircle className="mr-2 animate-spin" />}
              {isFree ? t("resetForFree") : t("payAndResetTraffic")}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

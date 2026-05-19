"use client";

import { useRouter } from "@tanstack/react-router";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Separator } from "@workspace/ui/components/separator";
import { purchaseMembership } from "@workspace/ui/services/user/order";
import { formatDate } from "@workspace/ui/utils/formatting";
import { CreditCard, LoaderCircle, ShieldCheck } from "lucide-react";
import { useCallback, useMemo, useState, useTransition } from "react";
import { useTranslation } from "react-i18next";
import { Display } from "@/components/display";
import { useGlobalStore } from "@/stores/global";
import PaymentMethods from "./payment-methods";

interface MembershipStatusCardProps {
  card?: API.MembershipCardResponse;
  user?: API.User;
  onLogin: () => void;
  onPurchase: () => void;
}

export function MembershipStatusCard({
  card,
  user,
  onLogin,
  onPurchase,
}: Readonly<MembershipStatusCardProps>) {
  const { t } = useTranslation("subscribe");
  const isMember = Boolean(user?.is_member || card?.is_member);
  const expiredAt = card?.expired_at || user?.member_expired_at || 0;
  const title = isMember
    ? t("membership.activeTitle", "Membership Active")
    : t("membership.requiredTitle", "Membership Required");
  const description = isMember
    ? t(
        "membership.activeDescription",
        "Your membership card is active. Subscription products are ready to purchase."
      )
    : t(
        "membership.requiredDescription",
        "A membership card is required before purchasing subscription products."
      );

  return (
    <Card className="overflow-hidden border-border/60 bg-background shadow-sm">
      <CardContent className="flex flex-col gap-5 p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex size-11 flex-none items-center justify-center rounded-full border bg-muted">
            <ShieldCheck className="size-5" />
          </div>
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold text-lg tracking-tight">{title}</h2>
              <Badge
                className={
                  isMember
                    ? "border-emerald-500/20 bg-emerald-500 text-white"
                    : "border-foreground/10 bg-foreground text-background"
                }
              >
                {isMember
                  ? t("membership.member", "Member")
                  : t("membership.notMember", "Not a Member")}
              </Badge>
            </div>
            <p className="max-w-2xl text-muted-foreground text-sm">
              {description}
            </p>
            {isMember && expiredAt > 0 && (
              <p className="text-muted-foreground text-xs">
                {t("membership.expiresAt", "Expires at")}:{" "}
                {formatDate(expiredAt)}
              </p>
            )}
          </div>
        </div>
        {user ? (
          <Button
            className="h-11 rounded-full px-6"
            onClick={onPurchase}
            variant={isMember ? "outline" : "default"}
          >
            <CreditCard className="size-4" />
            {isMember
              ? t("membership.renew", "Renew Membership")
              : t("membership.buy", "Buy Membership")}
          </Button>
        ) : (
          <Button className="h-11 rounded-full px-6" onClick={onLogin}>
            {t("membership.login", "Login to Join")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface MembershipPurchaseDialogProps {
  card?: API.MembershipCardResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MembershipPurchaseDialog({
  card,
  open,
  onOpenChange,
}: Readonly<MembershipPurchaseDialogProps>) {
  const { t } = useTranslation("subscribe");
  const router = useRouter();
  const { getUserInfo } = useGlobalStore();
  const [payment, setPayment] = useState(-1);
  const [loading, startTransition] = useTransition();
  const plan = card?.plan;
  const planAmount = useMemo(() => {
    if (!plan) return 0;
    return plan.unit_price;
  }, [plan]);
  const requiresPayment = planAmount > 0;
  const planReady = !!plan;

  const handleSubmit = useCallback(() => {
    startTransition(async () => {
      const response = await purchaseMembership({
        payment: requiresPayment ? payment : 0,
      });
      const orderNo = response.data.data?.order_no;
      if (!orderNo) return;
      await getUserInfo();
      onOpenChange(false);
      router.navigate({ to: "/payment", search: { order_no: orderNo } });
    });
  }, [getUserInfo, onOpenChange, payment, requiresPayment, router]);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-lg sm:rounded-3xl">
        <DialogHeader className="space-y-2 p-6 pb-0">
          <DialogTitle className="text-2xl">
            {t("membership.dialogTitle", "Membership Card")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "membership.dialogDescription",
              "Activate the annual card to unlock subscription purchases."
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 p-6 pt-4">
          <Card className="border-border/60 bg-muted/30 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {plan?.name || t("membership.annual", "Annual Membership")}
              </CardTitle>
              <CardDescription>
                {plan?.description ||
                  t(
                    "membership.defaultPlan",
                    "Default annual membership card."
                  )}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {t("membership.duration", "Duration")}
                </span>
                <span className="font-medium">
                  {plan?.duration_value || 1}{" "}
                  {t(
                    plan?.duration_unit || "Year",
                    plan?.duration_unit || "Year"
                  )}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {t("membership.total", "Total")}
                </span>
                <span className="font-semibold text-2xl tracking-tight">
                  <Display type="currency" value={planAmount} />
                </span>
              </div>
            </CardContent>
          </Card>
          {requiresPayment && (
            <PaymentMethods onChange={setPayment} value={payment} />
          )}
          <Button
            className="h-12 rounded-full"
            disabled={loading || !planReady || (requiresPayment && payment < 0)}
            onClick={handleSubmit}
          >
            {loading && <LoaderCircle className="animate-spin" />}
            {planReady
              ? planAmount > 0
                ? t("membership.payAndActivate", "Pay and Activate")
                : t("membership.activateFree", "Activate Membership")
              : t("membership.loading", "Loading")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

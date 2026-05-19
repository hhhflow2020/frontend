"use client";

import { Link } from "@tanstack/react-router";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { formatDate } from "@workspace/ui/utils/formatting";
import { ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useGlobalStore } from "@/stores/global";

interface MembershipStatusBannerProps {
  showAction?: boolean;
}

export function MembershipStatusBanner({
  showAction = true,
}: Readonly<MembershipStatusBannerProps>) {
  const { t } = useTranslation("user");
  const { user } = useGlobalStore();

  if (!user) return null;

  const isMember = Boolean(user.is_member);
  const expiredAt = user.member_expired_at || 0;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-background/80 p-4 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex size-10 flex-none items-center justify-center rounded-full bg-muted">
          <ShieldCheck className="size-5" />
        </div>
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold text-base tracking-tight">
              {isMember
                ? t("membershipActive", "会员卡生效中")
                : t("membershipInactive", "未开通会员卡")}
            </h2>
            <Badge variant={isMember ? "default" : "outline"}>
              {isMember
                ? t("memberActive", "Active Member")
                : t("memberInactive", "No Active Membership")}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {isMember && expiredAt > 0
              ? `${t("membershipExpiresAt", "Membership expires at")} ${formatDate(
                  expiredAt,
                  false
                )}`
              : t(
                  "membershipRequiredHint",
                  "A membership card is required before purchasing subscription products."
                )}
          </p>
        </div>
      </div>
      {showAction && !isMember && (
        <Button asChild className="rounded-full" size="sm">
          <Link to="/subscribe">{t("getMembership", "Get Membership")}</Link>
        </Button>
      )}
    </div>
  );
}

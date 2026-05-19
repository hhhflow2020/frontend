"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import Empty from "@workspace/ui/composed/empty";
import { queryMembershipCard } from "@workspace/ui/services/user/order";
import { querySubscribeList } from "@workspace/ui/services/user/subscribe";
import { Zap } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useGlobalStore } from "@/stores/global";
import {
  MembershipPurchaseDialog,
  MembershipStatusCard,
} from "./membership-card";
import { PlanCard } from "./plan-card";
import Purchase from "./purchase";

export default function Subscribe() {
  const { t, i18n } = useTranslation("subscribe");
  const router = useRouter();
  const { user } = useGlobalStore();
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
  const [membershipOpen, setMembershipOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["querySubscribeList", locale],
    queryFn: async () => {
      const { data } = await querySubscribeList({ language: locale });
      return data.data?.list || [];
    },
  });

  const { data: membershipCard } = useQuery({
    enabled: !!user,
    queryKey: ["queryMembershipCard", user?.id],
    queryFn: async () => {
      const { data } = await queryMembershipCard();
      return data.data;
    },
  });

  const filteredData = data?.filter((item) => item.user_visible);
  const isMember = membershipCard?.is_member ?? user?.is_member ?? false;

  return (
    <>
      <div className="space-y-4">
        <MembershipStatusCard
          card={membershipCard}
          onLogin={() => router.navigate({ to: "/auth" })}
          onPurchase={() => setMembershipOpen(true)}
          user={user}
        />
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
                      if (!user) {
                        router.navigate({ to: "/auth" });
                        return;
                      }
                      if (!isMember) {
                        setMembershipOpen(true);
                        return;
                      }
                      setSubscribe(item);
                    }}
                  >
                    <Zap className="size-4" />
                    {item.sell
                      ? user
                        ? isMember
                          ? t("buy", "Buy")
                          : t("membership.buyFirst", "Get Membership")
                        : t("membership.loginToBuy", "Login to Buy")
                      : t("soldOut", "Unavailable")}
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
      <MembershipPurchaseDialog
        card={membershipCard}
        onOpenChange={setMembershipOpen}
        open={membershipOpen}
      />
      <Purchase setSubscribe={setSubscribe} subscribe={subscribe} />
    </>
  );
}

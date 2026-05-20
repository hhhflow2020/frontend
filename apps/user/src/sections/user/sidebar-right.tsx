"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Sidebar, SidebarContent } from "@workspace/ui/components/sidebar";
import { Icon } from "@workspace/ui/composed/icon";
import { isBrowser } from "@workspace/ui/utils/index";
import CopyToClipboard from "react-copy-to-clipboard";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Display } from "@/components/display";
import Recharge from "@/sections/subscribe/recharge";
import { useGlobalStore } from "@/stores/global";

export function SidebarRight({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { user } = useGlobalStore();
  const { t } = useTranslation("layout");

  return (
    <Sidebar collapsible="none" side="right" {...props}>
      <SidebarContent className="gap-3 py-0">
        <Card className="overflow-hidden py-0">
          <CardHeader className="border-border/60 border-b bg-muted/15 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="font-semibold text-sm">
                  {t("wallet", "Wallet")}
                </CardTitle>
                <div className="mt-1 text-muted-foreground text-xs">
                  {t("availableBalance", "Available balance")}
                </div>
              </div>
              <Recharge className="h-8 rounded-full px-3" variant="outline" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            <div>
              <div className="font-semibold text-3xl tracking-tight">
                <Display type="currency" value={user?.balance} />
              </div>
            </div>
            <div className="grid gap-2">
              <div className="rounded-xl border border-border/60 bg-background/70 p-3">
                <div className="text-muted-foreground text-xs">
                  {t("giftAmount", "Gift Amount")}
                </div>
                <div className="mt-1 font-semibold text-lg">
                  <Display type="currency" value={user?.gift_amount} />
                </div>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/70 p-3">
                <div className="text-muted-foreground text-xs">
                  {t("commission", "Commission")}
                </div>
                <div className="mt-1 font-semibold text-lg">
                  <Display type="currency" value={user?.commission} />
                </div>
              </div>
            </div>
            {user?.refer_code && (
              <div className="rounded-xl border border-border/60 bg-background/70 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="font-medium text-sm">
                    {t("inviteCode", "Invite Code")}
                  </div>
                  <CopyToClipboard
                    onCopy={(_text: string, result: boolean) => {
                      if (result) {
                        toast.success(t("copySuccess", "Copy Success"));
                      }
                    }}
                    text={`${isBrowser() && location?.origin}/#/auth?invite=${user?.refer_code}`}
                  >
                    <Button className="size-7 rounded-full p-0" variant="ghost">
                      <Icon className="size-4 text-primary" icon="uil:copy" />
                    </Button>
                  </CopyToClipboard>
                </div>
                <div className="truncate font-semibold">{user.refer_code}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </SidebarContent>
    </Sidebar>
  );
}

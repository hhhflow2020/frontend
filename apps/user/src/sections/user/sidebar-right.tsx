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
        <Card className="hover:-translate-y-[2px] relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/90 to-slate-50/50 p-0 shadow-md backdrop-blur-xl transition-all duration-300 hover:border-slate-300 hover:shadow-lg dark:border-border/30 dark:from-card/95 dark:via-card/75 dark:to-card/50 dark:shadow-lg dark:hover:border-border/60 dark:hover:shadow-xl">
          <CardHeader className="border-slate-100 border-b bg-slate-50/50 px-5 py-4 dark:border-border/30 dark:bg-muted/5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 space-y-1.5">
                <CardTitle className="flex items-center gap-1.5 font-bold text-foreground/90 text-sm tracking-tight">
                  <Icon className="size-4 text-primary" icon="uil:wallet" />
                  {t("wallet", "Wallet")}
                </CardTitle>
                <div className="flex flex-col">
                  <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider dark:text-muted-foreground/60">
                    {t("availableBalance", "Available balance")}
                  </span>
                  <span className="mt-0.5 font-black text-2xl text-foreground tracking-tight">
                    <Display type="currency" value={user?.balance} />
                  </span>
                </div>
              </div>
              <Recharge
                className="h-8 rounded-full border border-primary/20 bg-primary/10 px-3 font-semibold text-primary text-xs shadow-xs transition-all hover:bg-primary/20 active:scale-95"
                variant="outline"
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-5 p-5">
            <div className="grid gap-3">
              {/* Gift Amount */}
              <div className="relative flex items-center gap-3 overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3.5 shadow-xs transition-all hover:bg-emerald-100/50 dark:border-emerald-500/15 dark:bg-emerald-500/5 dark:hover:bg-emerald-500/10">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 shadow-xs dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-500">
                  <Icon className="size-4.5" icon="uil:gift" />
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="font-semibold text-[10px] text-slate-500 uppercase tracking-wider dark:text-muted-foreground">
                    {t("giftAmount", "Gift Amount")}
                  </span>
                  <span className="mt-0.5 font-bold text-base text-foreground">
                    <Display type="currency" value={user?.gift_amount} />
                  </span>
                </div>
              </div>

              {/* Commission */}
              <div className="relative flex items-center gap-3 overflow-hidden rounded-2xl border border-amber-100 bg-amber-50/60 p-3.5 shadow-xs transition-all hover:bg-amber-100/50 dark:border-orange-500/15 dark:bg-orange-500/5 dark:hover:bg-orange-500/10">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-600 shadow-xs dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-500">
                  <Icon className="size-4.5" icon="uil:percentage" />
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="font-semibold text-[10px] text-slate-500 uppercase tracking-wider dark:text-muted-foreground">
                    {t("commission", "Commission")}
                  </span>
                  <span className="mt-0.5 font-bold text-base text-foreground">
                    <Display type="currency" value={user?.commission} />
                  </span>
                </div>
              </div>
            </div>

            {/* Invite Code */}
            {user?.refer_code && (
              <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-blue-50/60 p-3.5 shadow-xs transition-all hover:bg-blue-100/50 dark:border-blue-500/15 dark:bg-blue-500/5 dark:hover:bg-blue-500/10">
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <Icon
                      className="size-4 shrink-0 text-blue-500"
                      icon="uil:share-alt"
                    />
                    <span className="truncate font-semibold text-[10px] text-slate-500 uppercase tracking-wider dark:text-muted-foreground">
                      {t("inviteCode", "Invite Code")}
                    </span>
                  </div>
                  <CopyToClipboard
                    onCopy={(_text: string, result: boolean) => {
                      if (result) {
                        toast.success(t("copySuccess", "Copy Success"));
                      }
                    }}
                    text={`${isBrowser() && location?.origin}/#/auth?invite=${user?.refer_code}`}
                  >
                    <Button
                      className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-white/90 p-0 text-blue-500 shadow-xs transition-all hover:bg-accent active:scale-95 dark:border-blue-500/20 dark:bg-background/80"
                      variant="ghost"
                    >
                      <Icon className="size-4" icon="uil:copy" />
                    </Button>
                  </CopyToClipboard>
                </div>
                <div className="flex min-w-0 items-center gap-2">
                  <span className="w-full select-all truncate rounded-xl border border-slate-200 bg-white/90 px-2.5 py-1 text-center font-bold font-mono text-base text-foreground tracking-wider dark:border-border/30 dark:bg-background/40">
                    {user.refer_code}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </SidebarContent>
    </Sidebar>
  );
}

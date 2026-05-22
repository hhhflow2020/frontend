import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { Icon } from "@workspace/ui/composed/icon";
import { cn } from "@workspace/ui/lib/utils";
import { getClient, getStat } from "@workspace/ui/services/common/common";
import {
  queryUserSubscribe,
  resetUserSubscribeToken,
} from "@workspace/ui/services/user/user";
import { differenceInDays, formatDate } from "@workspace/ui/utils/formatting";
import { QRCodeCanvas } from "qrcode.react";
import React, { useState } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Display } from "@/components/display";
import { useGlobalStore } from "@/stores/global";
import { getPlatform } from "@/utils/common";
import Renewal from "../../subscribe/renewal";
import ResetTraffic from "../../subscribe/reset-traffic";
import Unsubscribe from "../../subscribe/unsubscribe";

const platforms: (keyof API.DownloadLink)[] = [
  "windows",
  "mac",
  "linux",
  "ios",
  "android",
  "harmony",
];

const getAppGradient = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("shadowrocket"))
    return "from-purple-500 via-indigo-500 to-blue-600 shadow-purple-500/25";
  if (n.includes("clash"))
    return "from-blue-500 via-cyan-500 to-sky-600 shadow-blue-500/25";
  if (n.includes("singbox") || n.includes("sing-box"))
    return "from-orange-500 via-amber-500 to-yellow-600 shadow-orange-500/25";
  if (n.includes("surge"))
    return "from-pink-500 via-rose-500 to-red-600 shadow-pink-500/25";
  if (n.includes("v2ray") || n.includes("v2fly"))
    return "from-teal-500 via-emerald-500 to-green-600 shadow-teal-500/25";
  if (n.includes("trojan"))
    return "from-violet-500 via-purple-500 to-fuchsia-600 shadow-violet-500/25";
  return "from-slate-500 via-neutral-600 to-zinc-700 shadow-slate-500/25";
};

interface SubscriptionCardProps {
  item: any;
  index: number;
  refetch: () => any;
  statusWatermarks: Record<number, string>;
  t: any;
  platform: any;
  applications: any[];
  protocol: string;
  getUserSubscribe: any;
  common: any;
}

function SubscriptionCard({
  item,
  index,
  refetch,
  statusWatermarks,
  t,
  platform,
  applications,
  protocol,
  getUserSubscribe,
  common,
}: Readonly<SubscriptionCardProps>) {
  const isActuallyExpired = item.status === 3 && item.expire_time !== 0;
  const shouldShowWatermark =
    item.status === 2 || item.status === 4 || isActuallyExpired;
  const [resetTokenOpen, setResetTokenOpen] = useState(false);
  const [resettingToken, setResettingToken] = useState(false);
  const [resetTokenLinks, setResetTokenLinks] = useState<string[]>([]);
  const hasResetTokenResult = resetTokenLinks.length > 0;
  const resetTokenPrimaryLink = resetTokenLinks[0] || "";

  // Calculate usage percentage
  const percent = item.traffic
    ? Math.min(
        100,
        Math.round(((item.upload + item.download) / item.traffic) * 100)
      )
    : 0;

  // SVG circular progress constants
  const radius = 24;
  const strokeWidth = 4.5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <Card
      className={cn(
        "hover:-translate-y-[2px] relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/90 to-slate-50/50 p-0 shadow-md backdrop-blur-xl transition-all duration-300 hover:border-slate-300 hover:shadow-lg dark:border-border/30 dark:from-card/95 dark:via-card/75 dark:to-card/50 dark:shadow-lg dark:hover:border-border/60 dark:hover:shadow-xl",
        {
          "opacity-85 grayscale": isActuallyExpired,
          "hidden opacity-60 blur-[0.3px] grayscale": item.status === 4,
        }
      )}
      key={item.id}
    >
      {shouldShowWatermark && (
        <div
          className={cn(
            "pointer-events-none absolute top-0 left-0 z-10 h-full w-full overflow-hidden mix-blend-difference brightness-150 contrast-200 invert-[0.2]",
            {
              "text-destructive": item.status === 2,
              "text-white": isActuallyExpired || item.status === 4,
            }
          )}
        >
          <div className="absolute inset-0">
            {Array.from({ length: 16 }).map((_, i) => {
              const row = Math.floor(i / 4);
              const col = i % 4;
              const top = 10 + row * 25 + (col % 2 === 0 ? 5 : -5);
              const left = 5 + col * 30 + (row % 2 === 0 ? 0 : 10);

              return (
                <span
                  className="absolute rotate-[-30deg] whitespace-nowrap font-black text-lg opacity-40 shadow-[0px_0px_1px_rgba(255,255,255,0.5)]"
                  key={i}
                  style={{
                    top: `${top}%`,
                    left: `${left}%`,
                  }}
                >
                  {
                    statusWatermarks[
                      item.status as keyof typeof statusWatermarks
                    ]
                  }
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Card Header: Name, Expiry Status Pill, Expiry Date, Renew Button */}
      <CardHeader className="border-slate-100 border-b bg-slate-50/50 px-4.5 py-3 dark:border-border/30 dark:bg-muted/5">
        <div className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="flex min-w-0 flex-row items-center gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-gradient-to-br from-primary/20 to-primary/5 font-black text-[10px] text-primary shadow-xs">
              #{index + 1}
            </span>
            <div className="flex min-w-0 flex-col">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="truncate font-bold text-base text-foreground leading-none tracking-tight">
                  {item.subscribe.name}
                </span>

                {/* Expiration/Status Pill */}
                {isActuallyExpired || item.status === 4 ? (
                  <span className="inline-flex items-center gap-0.5 rounded-md border border-red-100 bg-red-50 px-1.5 py-0.5 font-bold text-[10px] text-red-600 uppercase leading-none tracking-wider dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-500">
                    {item.status === 4
                      ? t("deducted", "Deducted")
                      : t("expired", "Expired")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 rounded-md border border-emerald-100 bg-emerald-50 px-1.5 py-0.5 font-bold text-[10px] text-emerald-700 uppercase leading-none tracking-wider dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                    {t("active", "Active")}
                  </span>
                )}
              </div>
              <span className="mt-1 flex items-center gap-1 font-semibold text-[11px] text-slate-500 dark:text-muted-foreground/80">
                <Icon
                  className="size-3.5 text-slate-400 dark:text-muted-foreground/60"
                  icon="uil:clock"
                />
                {t("expireAt", "Expires At")}:{" "}
                {item.expire_time
                  ? formatDate(item.expire_time)
                  : t("noLimit", "No Limit")}
              </span>
            </div>
          </CardTitle>
          {item.status !== 4 && (
            <div className="flex shrink-0 items-center gap-1">
              {item.subscribe.allow_renewal !== false &&
                item.expire_time !== 0 && (
                  <Renewal
                    id={item.id}
                    subscribe={item.subscribe}
                    trigger={
                      <Button className="h-7 rounded-lg bg-gradient-to-r from-primary to-indigo-600 px-3 font-bold text-[11px] text-white shadow-sm transition-all duration-300 hover:from-primary/95 hover:to-indigo-500 hover:shadow-md hover:shadow-primary/10 active:scale-95">
                        <Icon className="mr-1 size-3.5" icon="uil:history" />
                        {t("renew", "Renew")}
                      </Button>
                    }
                  />
                )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="size-7 rounded-lg border-slate-200 transition-all duration-200 hover:bg-slate-50 active:scale-95 dark:border-border/40 dark:hover:bg-muted/10"
                    size="icon"
                    variant="outline"
                  >
                    <Icon
                      className="size-3.5 text-muted-foreground"
                      icon="uil:ellipsis-h"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 rounded-2xl border-slate-200/80 bg-popover/95 p-1.5 shadow-xl backdrop-blur-xl dark:border-border/30"
                >
                  <AlertDialog
                    onOpenChange={(open) => {
                      setResetTokenOpen(open);
                      if (!open) {
                        setResetTokenLinks([]);
                        setResettingToken(false);
                      }
                    }}
                    open={resetTokenOpen}
                  >
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs"
                        onSelect={(e) => e.preventDefault()}
                      >
                        <Icon
                          className="size-4 text-muted-foreground"
                          icon="uil:sync"
                        />
                        <span>{t("resetSubscriptionAddress")}</span>
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-3xl sm:max-w-lg">
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {hasResetTokenResult
                            ? t("resetSubscriptionReady")
                            : t("resetSubscriptionAddress")}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {hasResetTokenResult
                            ? t("resetSubscriptionReadyDescription")
                            : t("confirmResetSubscription")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      {hasResetTokenResult ? (
                        <div className="grid gap-3">
                          <div className="rounded-2xl border border-primary/15 bg-primary/5 p-3">
                            <div className="break-all font-mono text-muted-foreground text-xs leading-relaxed">
                              {resetTokenPrimaryLink}
                            </div>
                            <CopyToClipboard
                              onCopy={(_, result) => {
                                if (result) {
                                  toast.success(
                                    t("copySuccess", "Copy Success")
                                  );
                                }
                              }}
                              text={resetTokenPrimaryLink}
                            >
                              <Button
                                className="mt-3 h-9 rounded-full"
                                size="sm"
                              >
                                <Icon
                                  className="mr-1.5 size-4"
                                  icon="uil:copy"
                                />
                                {t("copyNewSubscriptionAddress")}
                              </Button>
                            </CopyToClipboard>
                          </div>
                          <div className="flex justify-center rounded-2xl border border-border/50 bg-background p-4">
                            <QRCodeCanvas
                              size={148}
                              value={resetTokenPrimaryLink}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-amber-900 text-sm dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                          <ul className="grid gap-2">
                            <li>
                              {t("resetSubscriptionImpactInvalidatesOld")}
                            </li>
                            <li>{t("resetSubscriptionImpactReimport")}</li>
                            <li>{t("resetSubscriptionImpactKeepsPlan")}</li>
                          </ul>
                        </div>
                      )}
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-full">
                          {hasResetTokenResult
                            ? t("confirm", "Confirm")
                            : t("cancel", "Cancel")}
                        </AlertDialogCancel>
                        {!hasResetTokenResult && (
                          <Button
                            className="rounded-full"
                            disabled={resettingToken}
                            onClick={async () => {
                              setResettingToken(true);
                              try {
                                await resetUserSubscribeToken({
                                  user_subscribe_id: item.id,
                                });
                                const result = await refetch();
                                const latest = result?.data?.list?.find(
                                  (sub: any) => sub.id === item.id
                                );
                                const next = latest || item;
                                setResetTokenLinks(
                                  getUserSubscribe(
                                    next.short,
                                    next.token,
                                    protocol
                                  ) || []
                                );
                                toast.success(
                                  t("resetSubscriptionAddressSuccess")
                                );
                              } finally {
                                setResettingToken(false);
                              }
                            }}
                          >
                            {resettingToken && (
                              <Icon
                                className="mr-1.5 size-4 animate-spin"
                                icon="uil:spinner-alt"
                              />
                            )}
                            {t("confirmResetSubscriptionAddress")}
                          </Button>
                        )}
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  {item.subscribe.allow_reset_traffic !== false && (
                    <ResetTraffic
                      subscription={item}
                      trigger={
                        <DropdownMenuItem
                          className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs"
                          onSelect={(e) => e.preventDefault()}
                        >
                          <Icon
                            className="size-4 text-muted-foreground"
                            icon="uil:tachometer-fast-alt"
                          />
                          <span>{t("resetTraffic", "Reset Traffic")}</span>
                        </DropdownMenuItem>
                      }
                    />
                  )}

                  {(common?.subscribe?.single_model ||
                    item.subscribe.allow_deduction) && (
                    <>
                      <DropdownMenuSeparator className="border-border/40" />
                      <Unsubscribe
                        allowDeduction={item.subscribe.allow_deduction}
                        id={item.id}
                        onSuccess={refetch}
                        trigger={
                          <DropdownMenuItem
                            className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-destructive text-xs focus:bg-destructive/10 focus:text-destructive"
                            onSelect={(e) => e.preventDefault()}
                          >
                            <Icon
                              className="size-4 text-destructive"
                              icon="uil:ban"
                            />
                            <span>{t("unsubscribe", "Unsubscribe")}</span>
                          </DropdownMenuItem>
                        }
                      />
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 p-4.5">
        {/* Main Info: Circular progress ring next to vertical aligned figures */}
        <div className="flex items-center gap-4.5">
          {/* Left: Circular SVG progress gauge */}
          <div className="relative flex size-18 shrink-0 select-none items-center justify-center">
            <svg className="-rotate-90 size-full" viewBox="0 0 60 60">
              <title>{t("trafficUsage", "Traffic Usage")}</title>
              {/* Background Track */}
              <circle
                className="stroke-slate-100 dark:stroke-muted/30"
                cx="30"
                cy="30"
                fill="transparent"
                r={radius}
                strokeWidth={strokeWidth}
              />
              {/* Foreground circle segment */}
              {item.traffic ? (
                <circle
                  className={cn(
                    "origin-center transition-all duration-700 ease-in-out",
                    percent > 90
                      ? "stroke-red-500"
                      : percent > 75
                        ? "stroke-orange-500"
                        : "stroke-primary"
                  )}
                  cx="30"
                  cy="30"
                  fill="transparent"
                  r={radius}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  strokeWidth={strokeWidth}
                />
              ) : (
                <circle
                  className="animate-pulse stroke-primary"
                  cx="30"
                  cy="30"
                  fill="transparent"
                  r={radius}
                  strokeDasharray={circumference}
                  strokeDashoffset={0}
                  strokeLinecap="round"
                  strokeWidth={strokeWidth}
                />
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="mt-0.5 font-black text-foreground text-sm leading-none tracking-tighter">
                {item.traffic ? `${percent}%` : "∞"}
              </span>
              <span className="mt-0.5 font-bold text-[8.5px] text-slate-500 uppercase leading-none tracking-wider dark:text-muted-foreground/80">
                {t("used", "Used")}
              </span>
            </div>
          </div>

          {/* Right: Detailed vertical aligned metrics */}
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1 font-bold text-slate-500 text-xs uppercase tracking-wider dark:text-muted-foreground/80">
                {t("usedTraffic", "Used Traffic")}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-black text-foreground text-xl tracking-tight">
                  <Display
                    type="traffic"
                    unlimited={!item.traffic}
                    value={item.upload + item.download}
                  />
                </span>
                <span className="font-semibold text-[11px] text-slate-400 dark:text-muted-foreground/50">
                  /{" "}
                  {item.traffic ? (
                    <Display type="traffic" value={item.traffic} />
                  ) : (
                    "∞"
                  )}
                </span>
              </div>
            </div>

            {/* Remaining tag */}
            {!!item.traffic && (
              <div className="mt-1 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 font-bold text-[11px] text-blue-700 dark:border-primary/20 dark:bg-primary/10 dark:text-primary">
                  {t("remaining", "Remaining")}:{" "}
                  <Display
                    type="traffic"
                    value={Math.max(
                      0,
                      item.traffic - (item.upload + item.download)
                    )}
                  />
                </span>

                {/* Upload & Download inline indicators */}
                <div className="flex items-center gap-2 font-medium text-[10px] text-slate-500 dark:text-muted-foreground/85">
                  <span className="flex items-center gap-0.5">
                    <Icon
                      className="size-3 text-blue-500"
                      icon="uil:arrow-down"
                    />
                    <Display type="traffic" value={item.download} />
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Icon
                      className="size-3 text-emerald-500"
                      icon="uil:arrow-up"
                    />
                    <Display type="traffic" value={item.upload} />
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Secondary Info Badges Row */}
        <div className="flex flex-wrap items-center gap-1.5 border-slate-100 border-t pt-3 dark:border-border/20">
          {!isActuallyExpired && item.status !== 4 && (
            <>
              <span className="inline-flex items-center gap-1 rounded-md border border-blue-100 bg-blue-50 px-2.5 py-0.5 font-bold text-[11px] text-blue-700 dark:border-blue-500/15 dark:bg-blue-500/5 dark:text-blue-400">
                <Icon
                  className="size-3.5 text-blue-500 dark:text-blue-400/90"
                  icon="uil:sync"
                />
                <span>{t("reset", "Reset")}:</span>
                <span className="font-extrabold text-foreground">
                  {item.reset_time
                    ? `${Math.max(
                        0,
                        differenceInDays(item.reset_time, new Date())
                      )} ${t("days", "Days")}`
                    : t("noReset", "No Reset")}
                </span>
              </span>

              <span className="inline-flex items-center gap-1 rounded-md border border-amber-100 bg-amber-50 px-2.5 py-0.5 font-bold text-[11px] text-amber-700 dark:border-orange-500/15 dark:bg-orange-500/5 dark:text-orange-400">
                <Icon
                  className="size-3.5 text-amber-500 dark:text-orange-400/90"
                  icon="uil:calendar-alt"
                />
                <span>{t("expire", "Expire")}:</span>
                <span className="font-extrabold text-foreground">
                  {item.expire_time
                    ? `${Math.max(
                        0,
                        differenceInDays(item.expire_time, new Date())
                      )} ${t("days", "Days")}`
                    : t("noLimit", "No Limit")}
                </span>
              </span>
            </>
          )}
        </div>

        {/* Accordion-Free Actions Panel: Direct Copier and One-Click Client Grid */}
        <div className="space-y-3 border-slate-100 border-t pt-3.5 dark:border-border/20">
          {getUserSubscribe(item.short, item.token, protocol)?.map(
            (url: string, idx: number) => (
              <div className="space-y-3" key={url}>
                {/* Link Copier Row */}
                <div className="flex items-center gap-2">
                  <CopyToClipboard
                    onCopy={(_, result) => {
                      if (result) {
                        toast.success(t("copySuccess", "Copy Success"));
                      }
                    }}
                    text={url}
                  >
                    <Button className="h-8 flex-1 rounded-xl bg-gradient-to-r from-primary to-indigo-600 font-bold text-[13px] text-white shadow-xs transition-all hover:brightness-105 active:scale-95">
                      <Icon className="mr-1.5 size-4" icon="uil:copy" />
                      {t("copySubscriptionLink", "Copy Subscription Link")}{" "}
                      {idx > 0 ? `#${idx + 1}` : ""}
                    </Button>
                  </CopyToClipboard>

                  {/* Scan QR Code via Popover */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        className="size-8 rounded-xl border border-blue-100 bg-blue-50/70 p-0 text-blue-500 shadow-xs hover:bg-blue-100/80 dark:border-blue-500/20 dark:bg-blue-500/5 dark:hover:bg-blue-500/10"
                        variant="outline"
                      >
                        <Icon className="size-4" icon="uil:qrcode-scan" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="flex w-44 flex-col items-center gap-2 rounded-2xl border-slate-200 bg-popover/95 p-3 shadow-xl backdrop-blur-xl dark:border-border/30">
                      <span className="text-center font-black text-[9px] text-blue-500 uppercase tracking-widest">
                        {t("scanToSubscribe", "Scan to Subscribe")}
                      </span>
                      <div className="relative flex size-28 items-center justify-center rounded-xl border border-blue-100 bg-white p-2 shadow-inner">
                        <QRCodeCanvas
                          bgColor="transparent"
                          fgColor="rgb(59, 130, 246)"
                          size={96}
                          value={url}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Micro capsule grid of client imports */}
                <div className="space-y-1.5">
                  <div className="font-semibold text-[11px] text-slate-500 uppercase tracking-wider dark:text-muted-foreground/85">
                    {t("quickImport", "Quick Import to Client")}
                  </div>
                  <div className="grid grid-cols-2 xs:grid-cols-3 gap-1.5 sm:grid-cols-2 xl:grid-cols-2">
                    {applications
                      ?.filter(
                        (application) =>
                          application.enabled !== false &&
                          (application.scheme ||
                            application.download_link?.[platform])
                      )
                      .map((application) => {
                        const downloadUrl =
                          application.download_link?.[platform];

                        const handleCopy = (_: string, result: boolean) => {
                          if (result) {
                            toast.success(
                              `${application.name} ${t(
                                "copySuccess",
                                "Copy Success"
                              )}`
                            );
                          }
                        };

                        const appGradient = getAppGradient(application.name);

                        return (
                          <CopyToClipboard
                            key={application.name}
                            onCopy={handleCopy}
                            text={url}
                          >
                            <div className="group hover:-translate-y-0.5 flex h-8 cursor-pointer items-center justify-between gap-1.5 rounded-xl border border-slate-100 bg-slate-50/60 px-2.5 py-1 shadow-xs transition-all duration-200 hover:border-slate-200 hover:bg-slate-100/80 dark:border-border/30 dark:bg-background/40 dark:hover:border-border/60 dark:hover:bg-background">
                              <div className="flex min-w-0 flex-1 items-center gap-1.5">
                                {application.icon ? (
                                  <div className="relative flex size-6 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white p-0.5 shadow-xs dark:border-border/20 dark:bg-white/95">
                                    <img
                                      alt={application.name}
                                      className="object-contain"
                                      height={18}
                                      src={application.icon}
                                      width={18}
                                    />
                                  </div>
                                ) : (
                                  <div
                                    className={cn(
                                      "flex size-6 shrink-0 items-center justify-center rounded-md text-center text-white shadow-xs",
                                      appGradient
                                    )}
                                  >
                                    <span className="font-black text-[7px] uppercase leading-none tracking-tight">
                                      {application.name.substring(0, 3)}
                                    </span>
                                  </div>
                                )}
                                <span className="truncate font-bold text-[11px] text-foreground/80 tracking-tight">
                                  {application.name}
                                </span>
                              </div>

                              <div className="flex shrink-0 items-center gap-0.5 opacity-40 transition-opacity group-hover:opacity-100">
                                {downloadUrl && (
                                  <a
                                    className="rounded-sm p-0.5 text-muted-foreground hover:bg-muted"
                                    href={downloadUrl}
                                    onClick={(e) => e.stopPropagation()}
                                    rel="noopener noreferrer"
                                    target="_blank"
                                    title={t("download", "Download")}
                                  >
                                    <Icon
                                      className="size-3"
                                      icon="uil:download"
                                    />
                                  </a>
                                )}
                                <span
                                  className="rounded-sm p-0.5 text-muted-foreground hover:bg-muted"
                                  title={t("copy", "Copy")}
                                >
                                  <Icon className="size-3" icon="uil:copy" />
                                </span>
                              </div>
                            </div>
                          </CopyToClipboard>
                        );
                      })}
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Content() {
  const { t } = useTranslation("dashboard");
  const { common, getUserSubscribe } = useGlobalStore();

  const [protocol, setProtocol] = useState("");

  const {
    data: userSubscribe = [],
    refetch,
    isLoading,
  } = useQuery({
    queryKey: ["queryUserSubscribe"],
    queryFn: async () => {
      const { data } = await queryUserSubscribe();
      return data.data?.list || [];
    },
  });
  const { data: applications } = useQuery({
    queryKey: ["getClient"],
    queryFn: async () => {
      const { data } = await getClient();
      return data.data?.list || [];
    },
  });

  const availablePlatforms = React.useMemo(() => {
    if (!applications || applications.length === 0) return platforms;

    const platformsSet = new Set<keyof API.DownloadLink>();

    applications.forEach((app) => {
      if (app.download_link) {
        platforms.forEach((platform) => {
          if (app.download_link?.[platform]) {
            platformsSet.add(platform);
          }
        });
      }
    });

    return platforms.filter((platform) => platformsSet.has(platform));
  }, [applications]);

  const [platform, setPlatform] = useState<keyof API.DownloadLink>(() => {
    const detectedPlatform =
      getPlatform() === "macos"
        ? "mac"
        : (getPlatform() as keyof API.DownloadLink);
    return detectedPlatform;
  });

  React.useEffect(() => {
    if (
      availablePlatforms.length > 0 &&
      !availablePlatforms.includes(platform)
    ) {
      const firstAvailablePlatform = availablePlatforms[0];
      if (firstAvailablePlatform) {
        setPlatform(firstAvailablePlatform);
      }
    }
  }, [availablePlatforms, platform]);

  const { data } = useQuery({
    queryKey: ["getStat"],
    queryFn: async () => {
      const { data } = await getStat({
        skipErrorHandler: true,
      });
      return data.data;
    },
    refetchOnWindowFocus: false,
  });

  const statusWatermarks = {
    2: t("finished", "Finished"),
    3: t("expired", "Expired"),
    4: t("deducted", "Deducted"),
  };

  const validSubscribeCount = React.useMemo(
    () =>
      userSubscribe.filter((item) => {
        const isActuallyExpired = item.status === 3 && item.expire_time !== 0;
        return !(isActuallyExpired || item.status === 4);
      }).length,
    [userSubscribe]
  );

  const [subFilter, setSubFilter] = useState<"all" | "valid" | "usable">("all");

  const filteredSubscribe = React.useMemo(
    () =>
      userSubscribe.filter((item) => {
        const isActuallyExpired = item.status === 3 && item.expire_time !== 0;
        const isInvalid = isActuallyExpired || item.status === 4;
        const remaining = item.traffic
          ? Math.max(0, item.traffic - (item.upload + item.download))
          : Number.POSITIVE_INFINITY;

        if (subFilter === "valid") {
          return !isInvalid;
        }
        if (subFilter === "usable") {
          return !isInvalid && item.status !== 2 && remaining > 0;
        }
        return true;
      }),
    [userSubscribe, subFilter]
  );

  return (
    <>
      {userSubscribe.length ? (
        <>
          <div className="rounded-3xl border border-border/40 bg-gradient-to-r from-card/95 via-card/75 to-card/50 p-6 shadow-md backdrop-blur-xl transition-all duration-300 hover:shadow-lg">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="mb-1 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                  {t("subscriptionOverview", "Subscription overview")}
                </div>
                <h2 className="flex items-center gap-2.5 font-bold text-2xl text-foreground tracking-tight">
                  <span className="flex size-9 items-center justify-center rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-xs">
                    <Icon className="size-4.5" icon="uil:servers" />
                  </span>
                  {t("mySubscriptions", "My Subscriptions")}
                </h2>
                <div className="mt-3.5 flex flex-wrap items-center gap-2.5 text-xs">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/10 bg-emerald-500/5 px-3 py-1 font-semibold text-emerald-600 dark:text-emerald-400">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    {t("activeSubscriptions", "Active")} {validSubscribeCount}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/10 bg-indigo-500/5 px-3 py-1 font-semibold text-indigo-600 dark:text-indigo-400">
                    <span className="h-2 w-2 rounded-full bg-indigo-500" />
                    {t("totalSubscriptions", "Total")} {userSubscribe.length}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  onValueChange={(v: any) => setSubFilter(v)}
                  value={subFilter}
                >
                  <SelectTrigger className="h-10 w-32 rounded-full border-border/40 bg-background/80 font-semibold text-xs shadow-xs transition-all hover:bg-background focus:ring-0 active:scale-95">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("filterAll", "All")}</SelectItem>
                    <SelectItem value="valid">
                      {t("filterValid", "Valid")}
                    </SelectItem>
                    <SelectItem value="usable">
                      {t("filterUsable", "Usable")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  className={cn(
                    "size-10 rounded-full border-border/40 transition-all hover:bg-muted/10 active:scale-95",
                    {
                      "animate-spin": isLoading,
                    }
                  )}
                  onClick={() => {
                    refetch();
                  }}
                  size="icon"
                  variant="outline"
                >
                  <Icon className="size-4" icon="uil:sync" />
                </Button>
                <Button
                  asChild
                  className="h-10 rounded-full bg-gradient-to-r from-primary to-indigo-600 px-5 font-semibold text-white shadow-md transition-all duration-300 hover:from-primary/95 hover:to-indigo-500 hover:shadow-lg hover:shadow-primary/20 active:scale-95"
                  size="sm"
                >
                  <Link to="/subscribe">
                    <Icon className="mr-1.5 size-4" icon="uil:plus" />
                    {t("purchaseSubscription", "Purchase Subscription")}
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            {availablePlatforms.length > 0 && (
              <Tabs
                className="w-full max-w-full md:w-auto"
                onValueChange={(value) =>
                  setPlatform(value as keyof API.DownloadLink)
                }
                value={platform}
              >
                <TabsList className="flex rounded-full border border-border/40 bg-muted/60 p-1 backdrop-blur-sm *:flex-auto">
                  {availablePlatforms.map((item) => (
                    <TabsTrigger
                      className="rounded-full px-3 py-1.5 transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm lg:px-4"
                      key={item}
                      value={item}
                    >
                      <Icon
                        className="size-4.5"
                        icon={`${
                          {
                            windows: "mdi:microsoft-windows",
                            mac: "uil:apple",
                            linux: "uil:linux",
                            ios: "simple-icons:ios",
                            android: "uil:android",
                            harmony: "simple-icons:harmonyos",
                          }[item]
                        }`}
                      />
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}
            {data?.protocol && data?.protocol.length > 1 && (
              <Tabs
                className="w-full max-w-full md:w-auto"
                onValueChange={setProtocol}
                value={protocol}
              >
                <TabsList className="flex rounded-full border border-border/40 bg-muted/60 p-1 backdrop-blur-sm *:flex-auto">
                  {["all", ...(data?.protocol || [])].map((item) => (
                    <TabsTrigger
                      className="rounded-full px-3 py-1.5 font-semibold text-xs uppercase transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm lg:px-4"
                      key={item}
                      value={item === "all" ? "" : item}
                    >
                      {item}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}
          </div>
          {filteredSubscribe.length > 0 ? (
            <div className="grid w-full grid-cols-1 gap-5 xl:grid-cols-2">
              {filteredSubscribe.map((item, index) => (
                <SubscriptionCard
                  applications={applications || []}
                  common={common}
                  getUserSubscribe={getUserSubscribe}
                  index={index}
                  item={item}
                  key={item.id}
                  platform={platform}
                  protocol={protocol}
                  refetch={refetch}
                  statusWatermarks={statusWatermarks}
                  t={t}
                />
              ))}
            </div>
          ) : (
            <div className="flex h-40 w-full flex-col items-center justify-center rounded-3xl border border-border/40 border-dashed bg-muted/5 text-muted-foreground/60 shadow-inner">
              <Icon
                className="mb-2.5 size-9 text-primary opacity-40"
                icon="uil:box"
              />
              <p className="font-semibold text-sm tracking-tight">
                {t("noMatchSubscriptions", "No matching subscriptions found.")}
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-card/95 via-card/80 to-muted/20 p-6 shadow-md backdrop-blur-xl md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_280px] lg:items-center">
            <div className="min-w-0 space-y-5">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-xs">
                  <Icon className="size-5" icon="uil:servers" />
                </span>
                <div className="min-w-0">
                  <div className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                    {t("subscriptionOverview", "Subscription overview")}
                  </div>
                  <h2 className="font-bold text-2xl text-foreground tracking-tight">
                    {t("emptyTitle", "No subscriptions yet")}
                  </h2>
                </div>
              </div>
              <p className="max-w-2xl text-muted-foreground text-sm leading-6">
                {t(
                  "emptyDescription",
                  "Choose a plan when you are ready. Your active subscriptions, traffic usage, reset date, and client import links will appear here."
                )}
              </p>
              <div className="flex flex-wrap gap-2.5">
                <Button
                  asChild
                  className="h-10 rounded-full bg-gradient-to-r from-primary to-indigo-600 px-5 font-semibold text-white shadow-md transition-all duration-300 hover:from-primary/95 hover:to-indigo-500 hover:shadow-lg hover:shadow-primary/20 active:scale-95"
                >
                  <Link to="/subscribe">
                    <Icon className="mr-1.5 size-4" icon="uil:shop" />
                    {t("purchaseSubscription", "Purchase Subscription")}
                  </Link>
                </Button>
                <Button
                  asChild
                  className="h-10 rounded-full border-border/50 bg-background/70 px-5 font-semibold shadow-xs backdrop-blur transition-all hover:bg-background active:scale-95"
                  variant="outline"
                >
                  <Link to="/document">
                    <Icon className="mr-1.5 size-4" icon="uil:file-alt" />
                    {t("viewDocuments", "View Documents")}
                  </Link>
                </Button>
              </div>
            </div>
            <div className="grid gap-2 rounded-2xl border border-border/40 bg-background/60 p-4 text-sm shadow-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">
                  {t("activeSubscriptions", "Active")}
                </span>
                <span className="font-bold">0</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">
                  {t("usedTraffic", "Used Traffic")}
                </span>
                <span className="font-bold">0 B</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">
                  {t("quickImport", "Quick Import to Client")}
                </span>
                <span className="font-bold text-muted-foreground">
                  {t("afterPurchase", "After purchase")}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import {
  AlertDialog,
  AlertDialogAction,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Separator } from "@workspace/ui/components/separator";
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { Icon } from "@workspace/ui/composed/icon";
import { cn } from "@workspace/ui/lib/utils";
import { getClient, getStat } from "@workspace/ui/services/common/common";
import {
  queryUserSubscribe,
  resetUserSubscribeToken,
} from "@workspace/ui/services/user/user";
import { differenceInDays, formatDate } from "@workspace/ui/utils/formatting";
import { isBrowser } from "@workspace/ui/utils/index";
import { QRCodeCanvas } from "qrcode.react";
import React, { useState } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Display } from "@/components/display";
import { useGlobalStore } from "@/stores/global";
import { getPlatform } from "@/utils/common";
import Subscribe from "../../subscribe";
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

export default function Content() {
  const { t } = useTranslation("dashboard");
  const { getUserSubscribe, getAppSubLink } = useGlobalStore();

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
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h2 className="flex items-center gap-1.5 font-semibold">
                <Icon className="size-5" icon="uil:servers" />
                {t("mySubscriptions", "My Subscriptions")}
              </h2>
              <Select
                onValueChange={(v: any) => setSubFilter(v)}
                value={subFilter}
              >
                <SelectTrigger className="h-8 w-32 rounded-full border border-border/40 bg-muted/20 text-xs shadow-sm backdrop-blur-md transition-colors hover:bg-muted/30 focus:ring-0">
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
            </div>
            <div className="flex gap-2">
              <Button
                className={isLoading ? "animate-pulse" : ""}
                onClick={() => {
                  refetch();
                }}
                size="sm"
                variant="outline"
              >
                <Icon icon="uil:sync" />
              </Button>
              <Button asChild size="sm">
                <Link to="/subscribe">
                  {t("purchaseSubscription", "Purchase Subscription")}
                </Link>
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap justify-between gap-4">
            {availablePlatforms.length > 0 && (
              <Tabs
                className="w-full max-w-full md:w-auto"
                onValueChange={(value) =>
                  setPlatform(value as keyof API.DownloadLink)
                }
                value={platform}
              >
                <TabsList className="flex *:flex-auto">
                  {availablePlatforms.map((item) => (
                    <TabsTrigger
                      className="px-1 lg:px-3"
                      key={item}
                      value={item}
                    >
                      <Icon
                        className="size-5"
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
                <TabsList className="flex *:flex-auto">
                  {["all", ...(data?.protocol || [])].map((item) => (
                    <TabsTrigger
                      className="px-1 uppercase lg:px-3"
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
            filteredSubscribe.map((item, index) => {
              // 如果过期时间为0，说明是永久订阅，不应该显示过期状态
              const isActuallyExpired =
                item.status === 3 && item.expire_time !== 0;
              const shouldShowWatermark =
                item.status === 2 || item.status === 4 || isActuallyExpired;

              return (
                <Card
                  className={cn("relative", {
                    "relative opacity-80 grayscale": isActuallyExpired,
                    "relative hidden opacity-60 blur-[0.3px] grayscale":
                      item.status === 4,
                  })}
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
                  <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0 pb-2">
                    <CardTitle className="flex flex-row items-center gap-3">
                      <span className="flex size-7 items-center justify-center rounded-md bg-primary/10 font-bold text-primary text-sm">
                        #{index + 1}
                      </span>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-black text-primary text-xl tracking-tight">
                          {item.subscribe.name}
                        </span>
                        <span className="font-medium text-foreground/50 text-xs">
                          {t("expireAt", "Expires At")}:{" "}
                          {item.expire_time
                            ? formatDate(item.expire_time)
                            : t("noLimit", "No Limit")}
                        </span>
                      </div>
                    </CardTitle>
                    {item.status !== 4 && (
                      <div className="flex flex-wrap gap-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Icon className="mr-1.5 size-4" icon="uil:sync" />
                              {t("resetSubscription", "Reset Subscription")}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {t("prompt", "Prompt")}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {t(
                                  "confirmResetSubscription",
                                  "Are you sure you want to reset your subscription?"
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>
                                {t("cancel", "Cancel")}
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={async () => {
                                  await resetUserSubscribeToken({
                                    user_subscribe_id: item.id,
                                  });
                                  await refetch();
                                  toast.success(
                                    t("resetSuccess", "Reset Success")
                                  );
                                }}
                              >
                                {t("confirm", "Confirm")}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        {item.subscribe.allow_reset_traffic !== false && (
                          <ResetTraffic
                            id={item.id}
                            replacement={item.subscribe.replacement}
                          />
                        )}
                        {item.subscribe.allow_renewal !== false &&
                          item.expire_time !== 0 && (
                            <Renewal id={item.id} subscribe={item.subscribe} />
                          )}
                        <Unsubscribe
                          allowDeduction={item.subscribe.allow_deduction}
                          id={item.id}
                          onSuccess={refetch}
                        />
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="mb-3 flex w-full flex-col gap-3">
                      <div className="flex flex-col justify-between gap-3 rounded-2xl border border-border/40 bg-muted/5 p-3 lg:flex-row lg:items-center">
                        <div className="flex min-w-[160px] flex-col">
                          <span className="mb-0 font-medium text-muted-foreground text-xs">
                            {t("used", "Used")}
                          </span>
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-black text-2xl text-foreground tracking-tighter">
                              <Display
                                type="traffic"
                                unlimited={!item.traffic}
                                value={item.upload + item.download}
                              />
                            </span>
                            <span className="font-medium text-muted-foreground text-xs">
                              /{" "}
                              {item.traffic ? (
                                <Display type="traffic" value={item.traffic} />
                              ) : (
                                "∞"
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="flex max-w-lg flex-1 flex-col gap-2">
                          <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted/50 shadow-inner">
                            {item.traffic ? (
                              <>
                                <div
                                  className="relative h-full bg-blue-500 transition-all duration-500 ease-in-out hover:brightness-110"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      ((item.download || 0) /
                                        (item.traffic || 1)) *
                                        100
                                    )}%`,
                                  }}
                                  title={"Download"}
                                >
                                  <div className="absolute inset-0 animate-pulse bg-[length:1rem_1rem] bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] opacity-50" />
                                </div>
                                <div
                                  className="relative h-full bg-emerald-500 transition-all duration-500 ease-in-out hover:brightness-110"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      ((item.upload || 0) /
                                        (item.traffic || 1)) *
                                        100
                                    )}%`,
                                  }}
                                  title={"Upload"}
                                >
                                  <div className="absolute inset-0 animate-pulse bg-[length:1rem_1rem] bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] opacity-50" />
                                </div>
                              </>
                            ) : (
                              <div className="h-full w-full animate-pulse bg-[length:200%_100%] bg-gradient-to-r from-blue-500 via-emerald-500 to-blue-500 opacity-80" />
                            )}
                          </div>

                          <div className="flex items-center justify-between font-medium text-xs">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-sm" />
                                <Icon
                                  className="size-3.5"
                                  icon="uil:arrow-down"
                                />
                                <Display type="traffic" value={item.download} />
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm" />
                                <Icon
                                  className="size-3.5"
                                  icon="uil:arrow-up"
                                />
                                <Display type="traffic" value={item.upload} />
                              </div>
                            </div>
                            {!!item.traffic && (
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <span>{t("remaining", "Remaining")}:</span>
                                <span className="text-foreground">
                                  <Display
                                    type="traffic"
                                    value={Math.max(
                                      0,
                                      item.traffic -
                                        (item.upload + item.download)
                                    )}
                                  />
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {isActuallyExpired || item.status === 4 ? (
                        <div className="flex flex-wrap gap-2.5">
                          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 py-1 pr-3 pl-1 shadow-sm">
                            <div className="flex size-6 items-center justify-center rounded-full bg-red-500/20 text-red-500">
                              <Icon
                                className="size-3.5"
                                icon="uil:times-circle"
                              />
                            </div>
                            <span className="font-bold text-[11px] text-red-500">
                              {item.status === 4
                                ? t("deducted", "Deducted")
                                : t("expired", "Expired")}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2.5">
                          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/40 bg-muted/5 py-1 pr-3 pl-1 shadow-sm transition-colors hover:bg-muted/10">
                            <div className="flex size-6 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                              <Icon className="size-3.5" icon="uil:sync" />
                            </div>
                            <span className="font-medium text-[11px]">
                              <span className="mr-1 text-muted-foreground">
                                {t("nextResetDays", "Next Reset Days")}:
                              </span>
                              <span className="text-foreground">
                                {item.reset_time
                                  ? Math.max(
                                      0,
                                      differenceInDays(
                                        item.reset_time,
                                        new Date()
                                      )
                                    )
                                  : t("noReset", "No Reset")}
                              </span>
                            </span>
                          </div>

                          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/40 bg-muted/5 py-1 pr-3 pl-1 shadow-sm transition-colors hover:bg-muted/10">
                            <div className="flex size-6 items-center justify-center rounded-full bg-orange-500/10 text-orange-500">
                              <Icon
                                className="size-3.5"
                                icon="uil:calendar-alt"
                              />
                            </div>
                            <span className="font-medium text-[11px]">
                              <span className="mr-1 text-muted-foreground">
                                {t("expirationDays", "Expiration Days")}:
                              </span>
                              <span className="text-foreground">
                                {item.expire_time
                                  ? Math.max(
                                      0,
                                      differenceInDays(
                                        item.expire_time,
                                        new Date()
                                      )
                                    ) || t("unknown", "Unknown")
                                  : t("noLimit", "No Limit")}
                              </span>
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    <Separator className="mt-4" />
                    <Accordion
                      className="w-full"
                      collapsible
                      defaultValue="0"
                      type="single"
                    >
                      {getUserSubscribe(item.short, item.token, protocol)?.map(
                        (url, index) => (
                          <AccordionItem key={url} value={String(index)}>
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex w-full flex-row items-center justify-between">
                                <CardTitle className="font-medium text-sm">
                                  {t("subscriptionUrl", "Subscription URL")}{" "}
                                  {index + 1}
                                </CardTitle>

                                <CopyToClipboard
                                  onCopy={(_, result) => {
                                    if (result) {
                                      toast.success(
                                        t("copySuccess", "Copy Success")
                                      );
                                    }
                                  }}
                                  text={url}
                                >
                                  <span
                                    className="mr-4 flex cursor-pointer rounded p-2 text-primary text-sm hover:bg-accent"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Icon
                                      className="mr-2 size-5"
                                      icon="uil:copy"
                                    />
                                    {t("copy", "Copy")}
                                  </span>
                                </CopyToClipboard>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                                {applications
                                  ?.filter(
                                    (application) =>
                                      application.enabled !== false &&
                                      !!(
                                        application.scheme ||
                                        application.download_link?.[platform]
                                      )
                                  )
                                  .map((application) => {
                                    const downloadUrl =
                                      application.download_link?.[platform];

                                    const handleCopy = (
                                      _: string,
                                      result: boolean
                                    ) => {
                                      if (result) {
                                        const href = getAppSubLink(
                                          url,
                                          application.scheme
                                        );
                                        const showSuccessMessage = () => {
                                          toast.success(
                                            <>
                                              <p>
                                                {t(
                                                  "copySuccess",
                                                  "Copy Success"
                                                )}
                                              </p>
                                              <br />
                                              <p>
                                                {t(
                                                  "manualImportMessage",
                                                  "Please import manually"
                                                )}
                                              </p>
                                            </>
                                          );
                                        };

                                        if (isBrowser() && href) {
                                          window.location.href = href;
                                          const checkRedirect = setTimeout(
                                            () => {
                                              if (
                                                window.location.href !== href
                                              ) {
                                                showSuccessMessage();
                                              }
                                              clearTimeout(checkRedirect);
                                            },
                                            1000
                                          );
                                          return;
                                        }

                                        showSuccessMessage();
                                      }
                                    };

                                    return (
                                      <div
                                        className="group hover:-translate-y-1 relative flex h-full w-full flex-col items-center justify-between gap-3 rounded-2xl border border-border/40 bg-muted/5 p-4 shadow-sm transition-all duration-300 hover:bg-muted/10 hover:shadow-md"
                                        key={application.name}
                                      >
                                        <span className="font-semibold text-foreground text-sm tracking-tight">
                                          {application.name}
                                        </span>

                                        {application.icon ? (
                                          <div className="relative flex size-16 items-center justify-center rounded-2xl bg-white p-2 shadow-sm dark:bg-white/5">
                                            <img
                                              alt={application.name}
                                              className="object-contain"
                                              height={48}
                                              src={application.icon}
                                              width={48}
                                            />
                                          </div>
                                        ) : (
                                          <div className="flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground shadow-sm">
                                            <Icon
                                              className="size-8"
                                              icon="uil:apps"
                                            />
                                          </div>
                                        )}

                                        <div className="flex w-full overflow-hidden rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm">
                                          {downloadUrl && (
                                            <Button
                                              asChild
                                              className={
                                                application.scheme
                                                  ? "h-8 flex-1 rounded-none border-border/50 border-r bg-transparent text-xs hover:bg-accent"
                                                  : "h-8 flex-1 rounded-none bg-transparent text-xs hover:bg-accent"
                                              }
                                              variant="ghost"
                                            >
                                              <a
                                                href={downloadUrl}
                                                rel="noopener noreferrer"
                                                target="_blank"
                                              >
                                                {t("download", "Download")}
                                              </a>
                                            </Button>
                                          )}

                                          {application.scheme && (
                                            <CopyToClipboard
                                              onCopy={handleCopy}
                                              text={getAppSubLink(
                                                url,
                                                application.scheme
                                              )}
                                            >
                                              <Button
                                                className="h-8 flex-1 rounded-none bg-transparent text-xs hover:bg-accent"
                                                variant="ghost"
                                              >
                                                {t("import", "Import")}
                                              </Button>
                                            </CopyToClipboard>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                <div className="group hover:-translate-y-1 relative hidden h-full w-full flex-col items-center justify-between gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 shadow-sm transition-all duration-300 hover:shadow-md lg:flex">
                                  <span className="font-semibold text-blue-500 text-sm tracking-tight">
                                    {t("qrCode", "QR Code")}
                                  </span>
                                  <div className="relative flex size-16 items-center justify-center rounded-2xl bg-white p-1.5 shadow-[0_0_15px_rgba(59,130,246,0.3)] dark:bg-white/90">
                                    <QRCodeCanvas
                                      bgColor="transparent"
                                      fgColor="rgb(59, 130, 246)"
                                      size={56}
                                      value={url}
                                    />
                                  </div>
                                  <span className="text-center text-muted-foreground text-xs">
                                    {t("scanToSubscribe", "Scan to Subscribe")}
                                  </span>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        )
                      )}
                    </Accordion>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="flex h-32 w-full flex-col items-center justify-center rounded-2xl border border-border/50 border-dashed text-muted-foreground">
              <Icon className="mb-2 size-8 opacity-50" icon="uil:box" />
              <p className="text-sm">
                {t("noMatchSubscriptions", "No matching subscriptions found.")}
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          <h2 className="flex items-center gap-1.5 font-semibold">
            <Icon className="size-5" icon="uil:shop" />
            {t("purchaseSubscription", "Purchase Subscription")}
          </h2>
          <Subscribe />
        </>
      )}
    </>
  );
}

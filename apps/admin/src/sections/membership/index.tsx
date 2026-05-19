"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Separator } from "@workspace/ui/components/separator";
import { Switch } from "@workspace/ui/components/switch";
import { Textarea } from "@workspace/ui/components/textarea";
import { EnhancedInput } from "@workspace/ui/composed/enhanced-input";
import {
  queryMembershipPlan,
  updateMembershipPlan,
} from "@workspace/ui/services/admin/membership";
import { unitConversion } from "@workspace/ui/utils/unit-conversions";
import { RefreshCw, Save } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Display } from "@/components/display";
import { formatDate } from "@/utils/common";

type DurationUnit = "Year" | "Month" | "Day" | "Hour" | "Minute";

const durationUnits: DurationUnit[] = [
  "Year",
  "Month",
  "Day",
  "Hour",
  "Minute",
];

const defaultForm: API.UpdateMembershipPlanRequest = {
  id: 0,
  name: "",
  description: "",
  unit_price: 0,
  duration_unit: "Year",
  duration_value: 1,
  enabled: true,
};

export default function Membership() {
  const { t } = useTranslation("membership");
  const [form, setForm] =
    useState<API.UpdateMembershipPlanRequest>(defaultForm);
  const [loading, startTransition] = useTransition();

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["queryMembershipPlan"],
    queryFn: async () => {
      const { data } = await queryMembershipPlan();
      return data.data;
    },
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      id: data.id,
      name: data.name,
      description: data.description,
      unit_price: data.unit_price,
      duration_unit: data.duration_unit,
      duration_value: data.duration_value || 1,
      enabled: data.enabled,
    });
  }, [data]);

  const updateForm = <K extends keyof API.UpdateMembershipPlanRequest>(
    key: K,
    value: API.UpdateMembershipPlanRequest[K]
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error(t("nameRequired", "Please enter a membership card name"));
      return;
    }
    startTransition(async () => {
      try {
        await updateMembershipPlan({
          ...form,
          name: form.name.trim(),
          description: form.description?.trim() || "",
          duration_value: Math.max(Number(form.duration_value) || 1, 1),
          unit_price: Math.max(Number(form.unit_price) || 0, 0),
        });
        toast.success(t("updateSuccess", "Updated successfully"));
        refetch();
      } catch {
        toast.error(t("updateFailed", "Update failed"));
      }
    });
  };

  const durationLabel = (unit?: string) =>
    t(`duration.${unit || "Year"}`, unit || "Year");

  const disabled = loading || isFetching || !form.id;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">
            {t("title", "Membership Management")}
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            {t(
              "description",
              "Configure the membership card users must hold before purchasing subscription products."
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            disabled={isFetching}
            onClick={() => refetch()}
            type="button"
            variant="outline"
          >
            <RefreshCw className="size-4" />
            {t("refresh", "Refresh")}
          </Button>
          <Button disabled={disabled} onClick={handleSubmit} type="button">
            <Save className="size-4" />
            {t("save", "Save")}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>{t("cardSettings", "Card Settings")}</CardTitle>
            <CardDescription>
              {t(
                "cardSettingsDescription",
                "Only one default membership card is currently sold to users."
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-3">
              <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                <div className="space-y-1">
                  <Label>{t("enabled", "Enabled")}</Label>
                  <p className="text-muted-foreground text-sm">
                    {t(
                      "enabledDescription",
                      "When disabled, users cannot purchase or renew this membership card."
                    )}
                  </p>
                </div>
                <Switch
                  checked={form.enabled}
                  onCheckedChange={(checked) => updateForm("enabled", checked)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="membership-name">{t("name", "Name")}</Label>
                <Input
                  id="membership-name"
                  onChange={(event) => updateForm("name", event.target.value)}
                  placeholder={t("namePlaceholder", "Annual Membership")}
                  value={form.name}
                />
              </div>

              <div className="grid gap-2">
                <Label>{t("price", "Price")}</Label>
                <EnhancedInput<number>
                  formatInput={(value) =>
                    unitConversion("centsToDollars", value)
                  }
                  formatOutput={(value) =>
                    unitConversion("dollarsToCents", value)
                  }
                  min={0}
                  onValueChange={(value) => updateForm("unit_price", value)}
                  type="number"
                  value={form.unit_price}
                />
                <p className="text-muted-foreground text-xs">
                  {t(
                    "priceDescription",
                    "This is the price for one full membership card period, not a monthly unit price."
                  )}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="membership-duration-value">
                  {t("durationValue", "Duration")}
                </Label>
                <Input
                  id="membership-duration-value"
                  min={1}
                  onChange={(event) =>
                    updateForm(
                      "duration_value",
                      Number(event.target.value) || 1
                    )
                  }
                  type="number"
                  value={form.duration_value}
                />
              </div>

              <div className="grid gap-2">
                <Label>{t("durationUnit", "Duration Unit")}</Label>
                <Select
                  onValueChange={(value) =>
                    updateForm("duration_unit", value as DurationUnit)
                  }
                  value={form.duration_unit || "Year"}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {durationUnits.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {durationLabel(unit)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="membership-description">
                {t("cardDescription", "Description")}
              </Label>
              <Textarea
                className="min-h-28"
                id="membership-description"
                onChange={(event) =>
                  updateForm("description", event.target.value)
                }
                placeholder={t(
                  "descriptionPlaceholder",
                  "Required before purchasing subscription products."
                )}
                value={form.description}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("preview", "Preview")}</CardTitle>
            <CardDescription>
              {t("previewDescription", "What users will purchase.")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-medium text-lg">
                  {form.name || t("emptyName", "Membership Card")}
                </h2>
                <Badge variant={form.enabled ? "default" : "outline"}>
                  {form.enabled
                    ? t("status.enabled", "Enabled")
                    : t("status.disabled", "Disabled")}
                </Badge>
              </div>
              <p className="min-h-10 text-muted-foreground text-sm">
                {form.description ||
                  t("emptyDescription", "No description yet.")}
              </p>
            </div>

            <Separator />

            <div className="grid gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {t("previewDuration", "Duration")}
                </span>
                <span className="font-medium">
                  {form.duration_value || 1} {durationLabel(form.duration_unit)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {t("previewPrice", "Price")}
                </span>
                <span className="font-semibold text-xl">
                  <Display type="currency" value={form.unit_price} />
                </span>
              </div>
              {data?.id ? (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {t("updatedAt", "Updated At")}
                  </span>
                  <span>
                    {data.updated_at ? formatDate(data.updated_at) : "--"}
                  </span>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

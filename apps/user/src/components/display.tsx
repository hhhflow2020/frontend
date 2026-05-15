import { formatBytes } from "@workspace/ui/utils/formatting";
import { unitConversion } from "@workspace/ui/utils/unit-conversions";
import { useTranslation } from "react-i18next";
import { useGlobalStore } from "@/stores/global";

type DisplayType = "currency" | "traffic" | "number" | "trafficSpeed";

interface DisplayProps<T> {
  fractionDigits?: number;
  value?: T;
  unlimited?: boolean;
  type?: DisplayType;
}

export function Display<T extends number | undefined | null>({
  fractionDigits,
  value = 0,
  unlimited = false,
  type = "number",
}: DisplayProps<T>): string {
  const { t } = useTranslation("components");
  const { common } = useGlobalStore();
  const { currency } = common;

  if (type === "currency") {
    const formattedValue = `${currency?.currency_symbol ?? ""}${unitConversion("centsToDollars", value as number)?.toFixed(2) ?? "0.00"}`;
    return formattedValue;
  }

  if (
    ["traffic", "trafficSpeed", "number"].includes(type) &&
    unlimited &&
    !value
  ) {
    return t("unlimited");
  }

  if (type === "traffic") {
    return value ? formatDisplayBytes(value, fractionDigits) : "0";
  }

  if (type === "trafficSpeed") {
    return value
      ? `${formatDisplayBytes(value, fractionDigits).replace("B", "b")}ps`
      : "0";
  }

  if (type === "number") {
    return value ? formatDisplayNumber(value, fractionDigits) : "0";
  }

  return "0";
}

function formatDisplayBytes(value: number, fractionDigits?: number) {
  const formatted = formatBytes(value);
  if (fractionDigits === undefined) {
    return formatted;
  }

  return formatted.replace(/^-?\d+(?:\.\d+)?/, (number) =>
    Number(number).toLocaleString(undefined, {
      maximumFractionDigits: fractionDigits,
      minimumFractionDigits: fractionDigits,
    })
  );
}

function formatDisplayNumber(value: number, fractionDigits?: number) {
  if (fractionDigits === undefined) {
    return value.toString();
  }

  return value.toLocaleString(undefined, {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  });
}

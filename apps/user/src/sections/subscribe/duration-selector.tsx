"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Label } from "@workspace/ui/components/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group";
import { cn } from "@workspace/ui/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type React from "react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

interface DurationSelectorProps {
  quantity: number;
  unitTime?: string;
  discounts?: Array<{ quantity: number; discount: number }>;
  onChange: (value: number) => void;
  showOriginalPrice?: boolean;
}

const DurationSelector: React.FC<DurationSelectorProps> = ({
  quantity,
  unitTime = "Month",
  discounts = [],
  onChange,
  showOriginalPrice = true,
}) => {
  const { t } = useTranslation("subscribe");
  const handleChange = useCallback(
    (value: string) => {
      onChange(Number(value));
    },
    [onChange]
  );

  const currentDiscount = discounts?.find(
    (item) => item.quantity === quantity
  )?.discount;
  const discountPercentage = currentDiscount ? 100 - currentDiscount : 0;

  const DurationOption: React.FC<{
    value: string;
    label: string;
    pct?: number;
  }> = ({ value, label, pct }) => {
    const selected = String(quantity) === value;

    return (
      <div className="relative min-w-[30%] flex-1">
        <RadioGroupItem className="peer sr-only" id={value} value={value} />
        <Label
          className="relative flex h-16 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-[1.5px] border-slate-200 bg-white text-muted-foreground transition-all duration-300 hover:border-slate-300 hover:bg-slate-50/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:text-foreground peer-data-[state=checked]:shadow-[0_4px_12px_rgba(59,130,246,0.08)] dark:border-border/50 dark:bg-background dark:peer-data-[state=checked]:shadow-[0_2px_10px_rgba(0,0,0,0.05)] dark:hover:border-border dark:hover:bg-muted/30"
          htmlFor={value}
        >
          <span className="font-semibold text-[15px]">{label}</span>
          {pct && pct > 0 ? (
            <div
              className={cn(
                "absolute top-0 right-0 rounded-bl-xl border-emerald-100 border-b border-l bg-emerald-50 px-2 py-0.5 font-bold text-[10px] text-emerald-700 transition-colors dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400",
                selected &&
                  "border-transparent bg-emerald-500 text-white dark:bg-emerald-600 dark:text-white"
              )}
            >
              -{pct.toFixed(0)}%
            </div>
          ) : null}
        </Label>
      </div>
    );
  };

  return (
    <div className="grid gap-3">
      <div className="flex min-h-[32px] items-center justify-between">
        <div className="font-bold text-foreground">
          {t("purchaseDuration", "Purchase Duration")}
        </div>
        <AnimatePresence mode="wait">
          {discountPercentage > 0 && (
            <motion.div
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              initial={{ opacity: 0, x: 10 }}
              key={`discount-${discountPercentage}`}
              transition={{ duration: 0.2 }}
            >
              <Badge
                className="border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 font-bold text-emerald-600 text-sm hover:bg-emerald-500/20 dark:text-emerald-400"
                variant="outline"
              >
                <Sparkles className="mr-1.5 size-3.5" />
                {t("saved", "Saved")} {discountPercentage.toFixed(0)}%
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <RadioGroup
        className="flex flex-wrap gap-2.5"
        onValueChange={handleChange}
        value={String(quantity)}
      >
        {showOriginalPrice && unitTime !== "Minute" && (
          <DurationOption label={`1 ${t(unitTime)}`} value="1" />
        )}
        {discounts?.map((item) => (
          <DurationOption
            key={item.quantity}
            label={`${item.quantity} ${t(unitTime)}`}
            pct={100 - item.discount}
            value={String(item.quantity)}
          />
        ))}
      </RadioGroup>
    </div>
  );
};

export default DurationSelector;

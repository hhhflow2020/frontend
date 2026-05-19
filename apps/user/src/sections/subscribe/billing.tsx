"use client";

import { useTranslation } from "react-i18next";
import { Display } from "@/components/display";

interface SubscribeBillingProps {
  order?: Partial<
    API.OrderDetail & {
      unit_price: number;
      unit_time: string;
      subscribe_discount: number;
      show_original_price?: boolean;
    }
  >;
}

export function SubscribeBilling({ order }: Readonly<SubscribeBillingProps>) {
  const { t } = useTranslation("subscribe");

  return (
    <>
      <div className="mt-6 mb-4 text-center font-bold text-muted-foreground/60 text-sm uppercase tracking-widest">
        --- {t("billing.billingTitle", "Billing")} ---
      </div>
      <ul className="grid gap-2">
        {order?.type && [1, 2].includes(order?.type) && (
          <li className="flex items-end justify-between">
            <span className="text-muted-foreground">
              {t("billing.duration", "Duration")}
            </span>
            <span className="mx-2 mb-1 flex-grow border-border/50 border-b-2 border-dotted" />
            <span className="font-semibold text-foreground">
              {order?.quantity || 1}{" "}
              {t(order?.unit_time || "Month", order?.unit_time || "Month")}
            </span>
          </li>
        )}{" "}
        {order?.show_original_price !== false &&
          order?.type &&
          [1, 2].includes(order?.type) && (
            <li className="flex items-end justify-between">
              <span className="text-muted-foreground">
                {t("billing.originalPrice", "Original Price")}
              </span>
              <span className="mx-2 mb-1 flex-grow border-border/50 border-b-2 border-dotted" />
              <span className="font-semibold text-foreground">
                <Display type="currency" value={order?.unit_price} />
              </span>
            </li>
          )}{" "}
        <li className="flex items-end justify-between">
          <span className="text-muted-foreground">
            {t("billing.price", "Price")}
          </span>
          <span className="mx-2 mb-1 flex-grow border-border/50 border-b-2 border-dotted" />
          <span className="font-semibold text-foreground">
            <Display
              type="currency"
              value={order?.price || order?.unit_price}
            />
          </span>
        </li>
        <li className="flex items-end justify-between">
          <span className="text-muted-foreground">
            {t("billing.productDiscount", "Product Discount")}
          </span>
          <span className="mx-2 mb-1 flex-grow border-border/50 border-b-2 border-dotted" />
          <span className="font-semibold text-foreground">
            <Display type="currency" value={order?.discount} />
          </span>
        </li>
        <li className="flex items-end justify-between">
          <span className="text-muted-foreground">
            {t("billing.couponDiscount", "Coupon Discount")}
          </span>
          <span className="mx-2 mb-1 flex-grow border-border/50 border-b-2 border-dotted" />
          <span className="font-semibold text-foreground">
            <Display type="currency" value={order?.coupon_discount} />
          </span>
        </li>
        <li className="flex items-end justify-between">
          <span className="text-muted-foreground">
            {t("billing.fee", "Fee")}
          </span>
          <span className="mx-2 mb-1 flex-grow border-border/50 border-b-2 border-dotted" />
          <span className="font-semibold text-foreground">
            <Display type="currency" value={order?.fee_amount} />
          </span>
        </li>
        <li className="flex items-end justify-between">
          <span className="text-muted-foreground">
            {t("billing.gift", "Gift")}
          </span>
          <span className="mx-2 mb-1 flex-grow border-border/50 border-b-2 border-dotted" />
          <span className="font-semibold text-foreground">
            <Display type="currency" value={order?.gift_amount} />
          </span>
        </li>
      </ul>
      <div className="my-4 border-border/50 border-b-2 border-dashed" />
      <div className="flex flex-col items-end">
        <span className="mb-1 font-bold text-[10px] text-muted-foreground uppercase tracking-widest">
          {t("billing.total", "Total Amount")}
        </span>
        <span className="font-bold text-4xl text-foreground tracking-tighter">
          <Display type="currency" value={order?.amount} />
        </span>
      </div>
    </>
  );
}

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
      <div className="mt-6 mb-4 text-center font-bold text-slate-400 text-sm uppercase tracking-widest">
        --- {t("billing.billingTitle", "Billing")} ---
      </div>
      <ul className="grid gap-2">
        {order?.type && [1, 2].includes(order?.type) && (
          <li className="flex items-end justify-between">
            <span className="text-slate-500 dark:text-slate-400">
              {t("billing.duration", "Duration")}
            </span>
            <span className="mx-2 mb-1 flex-grow border-slate-300 border-b-2 border-dotted dark:border-slate-700" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {order?.quantity || 1}{" "}
              {t(order?.unit_time || "Month", order?.unit_time || "Month")}
            </span>
          </li>
        )}{" "}
        {order?.show_original_price !== false &&
          order?.type &&
          [1, 2].includes(order?.type) && (
            <li className="flex items-end justify-between">
              <span className="text-slate-500 dark:text-slate-400">
                {t("billing.originalPrice", "Original Price")}
              </span>
              <span className="mx-2 mb-1 flex-grow border-slate-300 border-b-2 border-dotted dark:border-slate-700" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                <Display type="currency" value={order?.unit_price} />
              </span>
            </li>
          )}{" "}
        <li className="flex items-end justify-between">
          <span className="text-slate-500 dark:text-slate-400">
            {t("billing.price", "Price")}
          </span>
          <span className="mx-2 mb-1 flex-grow border-slate-300 border-b-2 border-dotted dark:border-slate-700" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            <Display
              type="currency"
              value={order?.price || order?.unit_price}
            />
          </span>
        </li>
        <li className="flex items-end justify-between">
          <span className="text-slate-500 dark:text-slate-400">
            {t("billing.productDiscount", "Product Discount")}
          </span>
          <span className="mx-2 mb-1 flex-grow border-slate-300 border-b-2 border-dotted dark:border-slate-700" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            <Display type="currency" value={order?.discount} />
          </span>
        </li>
        <li className="flex items-end justify-between">
          <span className="text-slate-500 dark:text-slate-400">
            {t("billing.couponDiscount", "Coupon Discount")}
          </span>
          <span className="mx-2 mb-1 flex-grow border-slate-300 border-b-2 border-dotted dark:border-slate-700" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            <Display type="currency" value={order?.coupon_discount} />
          </span>
        </li>
        <li className="flex items-end justify-between">
          <span className="text-slate-500 dark:text-slate-400">
            {t("billing.fee", "Fee")}
          </span>
          <span className="mx-2 mb-1 flex-grow border-slate-300 border-b-2 border-dotted dark:border-slate-700" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            <Display type="currency" value={order?.fee_amount} />
          </span>
        </li>
        <li className="flex items-end justify-between">
          <span className="text-slate-500 dark:text-slate-400">
            {t("billing.gift", "Gift")}
          </span>
          <span className="mx-2 mb-1 flex-grow border-slate-300 border-b-2 border-dotted dark:border-slate-700" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            <Display type="currency" value={order?.gift_amount} />
          </span>
        </li>
      </ul>
      <div className="my-4 border-slate-300 border-b-2 border-dashed dark:border-slate-700" />
      <div className="flex flex-col items-end">
        <span className="mb-1 font-bold text-[10px] text-slate-500 uppercase tracking-widest dark:text-slate-400">
          {t("billing.total", "Total Amount")}
        </span>
        <span className="font-bold text-4xl text-slate-800 tracking-tighter dark:text-slate-100">
          <Display type="currency" value={order?.amount} />
        </span>
      </div>
    </>
  );
}

import { useTranslation } from "react-i18next";
import { Display } from "@/components/display";

interface SubscribeDetailProps {
  subscribe?: Partial<
    API.Subscribe & {
      name: string;
      quantity: number;
    }
  >;
}

export function SubscribeDetail({ subscribe }: Readonly<SubscribeDetailProps>) {
  const { t } = useTranslation("subscribe");

  return (
    <>
      <div className="mb-4 text-center font-bold text-slate-400 text-sm uppercase tracking-widest">
        --- {t("detail.productDetail", "Order Info")} ---
      </div>
      <ul className="grid gap-2">
        {subscribe?.name && (
          <li className="flex items-end justify-between pb-3">
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {subscribe?.name}
            </span>
            <span className="mx-2 mb-1 flex-grow border-slate-300 border-b-2 border-dotted dark:border-slate-700" />
            <span className="font-bold text-slate-800 dark:text-slate-200">
              x{subscribe?.quantity || 1}
            </span>
          </li>
        )}
        <li className="flex items-end justify-between">
          <span className="text-slate-500 dark:text-slate-400">
            {t("detail.availableTraffic", "Available Traffic")}
          </span>
          <span className="mx-2 mb-1 flex-grow border-slate-300 border-b-2 border-dotted dark:border-slate-700" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            <Display type="traffic" unlimited value={subscribe?.traffic} />
          </span>
        </li>
        <li className="flex items-end justify-between">
          <span className="text-slate-500 dark:text-slate-400">
            {t("detail.connectionSpeed", "Connection Speed")}
          </span>
          <span className="mx-2 mb-1 flex-grow border-slate-300 border-b-2 border-dotted dark:border-slate-700" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            <Display
              type="trafficSpeed"
              unlimited
              value={subscribe?.speed_limit}
            />
          </span>
        </li>
        <li className="flex items-end justify-between">
          <span className="text-slate-500 dark:text-slate-400">
            {t("detail.connectedDevices", "Connected Devices")}
          </span>
          <span className="mx-2 mb-1 flex-grow border-slate-300 border-b-2 border-dotted dark:border-slate-700" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            <Display type="number" unlimited value={subscribe?.device_limit} />
          </span>
        </li>
      </ul>
    </>
  );
}

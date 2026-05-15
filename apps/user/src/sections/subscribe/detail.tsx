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
      <div className="font-semibold">
        {t("detail.productDetail", "Product Detail")}
      </div>
      <ul className="grid grid-cols-1 gap-4 *:flex *:items-center *:justify-between *:gap-4 lg:grid-cols-1">
        {subscribe?.name && (
          <li className="flex items-center justify-between">
            <span className="line-clamp-2 flex-1 text-muted-foreground">
              {subscribe?.name}
            </span>
            <span className="shrink-0">
              x <span>{subscribe?.quantity || 1}</span>
            </span>
          </li>
        )}
        <li>
          <span className="text-muted-foreground">
            {t("detail.availableTraffic", "Available Traffic")}
          </span>
          <span className="text-right font-medium">
            <Display type="traffic" unlimited value={subscribe?.traffic} />
          </span>
        </li>
        <li>
          <span className="text-muted-foreground">
            {t("detail.connectionSpeed", "Connection Speed")}
          </span>
          <span className="text-right font-medium">
            <Display
              type="trafficSpeed"
              unlimited
              value={subscribe?.speed_limit}
            />
          </span>
        </li>
        <li>
          <span className="text-muted-foreground">
            {t("detail.connectedDevices", "Connected Devices")}
          </span>
          <span className="text-right font-medium">
            <Display type="number" unlimited value={subscribe?.device_limit} />
          </span>
        </li>
      </ul>
    </>
  );
}

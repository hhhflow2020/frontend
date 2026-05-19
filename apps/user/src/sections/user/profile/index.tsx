import { MembershipStatusBanner } from "@/components/membership-status";
import ChangePassword from "./change-password";
import NotifySettings from "./notify-settings";
import ThirdPartyAccounts from "./third-party-accounts";

export default function Profile() {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:*:flex-auto">
      <div className="w-full lg:flex-none">
        <MembershipStatusBanner />
      </div>
      <ThirdPartyAccounts />
      <NotifySettings />
      <ChangePassword />
    </div>
  );
}

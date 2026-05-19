import { Link } from "@tanstack/react-router";
import { Badge } from "@workspace/ui/components/badge";
import { buttonVariants } from "@workspace/ui/components/button";
import { LanguageSwitch } from "@workspace/ui/composed/language-switch";
import { ThemeSwitch } from "@workspace/ui/composed/theme-switch";
import { useTranslation } from "react-i18next";
import { useGlobalStore } from "@/stores/global";
import { UserNav } from "./user-nav";

export default function Header() {
  const { t } = useTranslation("components");

  const { common, user } = useGlobalStore();
  const { site } = common;
  const Logo = (
    <Link className="flex items-center gap-2 font-bold text-lg" to="/">
      {site.site_logo && (
        <img alt="logo" height={36} src={site.site_logo} width={36} />
      )}
      <span className="">{site.site_name}</span>
    </Link>
  );
  return (
    <header className="sticky top-0 z-50 border-b backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <nav className="flex-col gap-6 font-medium text-lg md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          {Logo}
        </nav>
        <div className="flex flex-1 items-center justify-end gap-2">
          <LanguageSwitch />
          <ThemeSwitch />
          {user && (
            <Link className="hidden sm:block" to="/subscribe">
              <Badge
                className={
                  user.is_member
                    ? "h-8 border-emerald-500/20 bg-emerald-500 px-3 text-white"
                    : "h-8 border-foreground/10 bg-foreground px-3 text-background"
                }
              >
                {user.is_member
                  ? t("membership.member", "Member")
                  : t("membership.join", "Join Membership")}
              </Badge>
            </Link>
          )}
          <UserNav />
          {!user && (
            <Link
              className={buttonVariants({
                size: "sm",
              })}
              to="/auth"
            >
              {t("loginRegister", "Login / Register")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

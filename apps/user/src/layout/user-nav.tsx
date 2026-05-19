"use client";

import { useNavigate } from "@tanstack/react-router";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Badge } from "@workspace/ui/components/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Icon } from "@workspace/ui/composed/icon";
import { formatDate } from "@workspace/ui/utils/formatting";
import { useTranslation } from "react-i18next";
import { useNavs } from "@/layout/navs";
import { useGlobalStore } from "@/stores/global";
import { Logout } from "@/utils/common";

export function UserNav() {
  const { t } = useTranslation("components");
  const { user, setUser } = useGlobalStore();
  const navigate = useNavigate();
  const navs = useNavs();

  const handleLogout = () => {
    setUser(undefined);
    Logout();
  };

  if (user) {
    return (
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <div className="flex cursor-pointer items-center gap-2 rounded-full border bg-background px-2 py-1.5 transition-colors duration-200 hover:bg-accent">
            <Avatar className="h-6 w-6">
              <AvatarImage
                alt={user?.avatar ?? ""}
                className="object-cover"
                src={user?.auth_methods?.[0]?.auth_identifier ?? ""}
              />
              <AvatarFallback className="bg-linear-to-br from-primary/90 to-primary font-medium text-background">
                {user?.auth_methods?.[0]?.auth_identifier
                  .toUpperCase()
                  .charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="max-w-10 truncate text-sm sm:max-w-[100px]">
              {user?.auth_methods?.[0]?.auth_identifier.split("@")[0]}
            </span>
            <Icon
              className="size-4 text-muted-foreground"
              icon="mdi:chevron-down"
            />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64" forceMount>
          <div className="flex items-center justify-start gap-2 p-2">
            <Avatar className="h-10 w-10">
              <AvatarImage
                alt={user?.avatar ?? ""}
                className="object-cover"
                src={user?.avatar ?? ""}
              />
              <AvatarFallback className="bg-linear-to-br from-primary/90 to-primary text-background">
                {user?.auth_methods?.[0]?.auth_identifier
                  .toUpperCase()
                  .charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col space-y-1">
              <p className="font-medium text-sm leading-none">
                {user?.auth_methods?.[0]?.auth_identifier.split("@")[0]}
              </p>
              <p className="text-muted-foreground text-xs">
                {user?.auth_methods?.[0]?.auth_identifier}
              </p>
              <div className="flex flex-wrap items-center gap-1">
                <Badge
                  className={
                    user.is_member
                      ? "border-emerald-500/20 bg-emerald-500 text-white"
                      : "border-foreground/10 bg-foreground text-background"
                  }
                >
                  {user.is_member
                    ? t("membership.member", "Member")
                    : t("membership.notMember", "Not a Member")}
                </Badge>
                {user.is_member && user.member_expired_at > 0 && (
                  <span className="text-[11px] text-muted-foreground">
                    {formatDate(user.member_expired_at, false)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <DropdownMenuSeparator />
          {navs.map((nav) => (
            <DropdownMenuGroup key={nav.title}>
              {(nav.items || [nav]).map((item) => (
                <DropdownMenuItem
                  className="flex cursor-pointer items-center gap-2 py-2"
                  key={item.title}
                  onClick={() => {
                    navigate({ to: item.url });
                  }}
                >
                  <Icon
                    className="size-4 flex-none text-muted-foreground"
                    icon={item.icon as string}
                  />
                  <span className="grow truncate">{item.title}</span>
                  <Icon
                    className="size-4 text-muted-foreground opacity-50"
                    icon="lucide:chevron-right"
                  />
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="flex cursor-pointer items-center gap-2 py-2 text-destructive focus:text-destructive"
            onClick={handleLogout}
          >
            <Icon className="size-4 flex-none" icon="uil:exit" />
            <span className="grow">{t("menu.logout", "Logout")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
}

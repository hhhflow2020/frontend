import { useQuery } from "@tanstack/react-query";
import { Link, useSearch } from "@tanstack/react-router";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet";
import { Switch } from "@workspace/ui/components/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { ConfirmButton } from "@workspace/ui/composed/confirm-button";
import {
  ProTable,
  type ProTableActions,
} from "@workspace/ui/composed/pro-table/pro-table";
import { cn } from "@workspace/ui/lib/utils";
import {
  createUser,
  deleteUser,
  getUserDetail,
  getUserList,
  updateUserBasicInfo,
} from "@workspace/ui/services/admin/user";
import {
  CheckCircle2,
  Copy,
  PauseCircle,
  ShieldCheck,
  ShieldX,
  Trash2,
  UserRound,
} from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Display } from "@/components/display";
import { useSubscribe } from "@/stores/subscribe";
import { formatDate } from "@/utils/common";
import { UserDetail } from "./user-detail";
import UserForm from "./user-form";
import { AuthMethodsForm } from "./user-profile/auth-methods-form";
import { BasicInfoForm } from "./user-profile/basic-info-form";
import { MembershipInfoForm } from "./user-profile/membership-info-form";
import { NotifySettingsForm } from "./user-profile/notify-settings-form";
import UserSubscription from "./user-subscription";

type UserWithMembership = API.User & {
  is_member?: boolean;
  member_expired_at?: number;
};

function buildBasicInfoPayload(
  user: UserWithMembership,
  enable: boolean
): API.UpdateUserBasiceInfoRequest {
  const {
    auth_methods: _auth_methods,
    user_devices: _user_devices,
    enable_balance_notify: _enable_balance_notify,
    enable_login_notify: _enable_login_notify,
    enable_subscribe_notify: _enable_subscribe_notify,
    enable_trade_notify: _enable_trade_notify,
    is_member: _is_member,
    member_expired_at: _member_expired_at,
    updated_at: _updated_at,
    created_at: _created_at,
    id,
    ...rest
  } = user;
  return {
    user_id: id,
    ...rest,
    enable,
  } as unknown as API.UpdateUserBasiceInfoRequest;
}

function UserStatusCell({
  onToggle,
  t,
  user,
}: {
  onToggle: (checked: boolean) => Promise<void>;
  t: ReturnType<typeof useTranslation>["t"];
  user: UserWithMembership;
}) {
  const deleted = Boolean(user.deleted_at);
  const enabled = Boolean(user.enable);
  const Icon = deleted ? Trash2 : enabled ? CheckCircle2 : PauseCircle;
  const label = deleted
    ? t("deleted", "已删除")
    : enabled
      ? t("enabled", "已启用")
      : t("disabled", "已停用");

  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "inline-flex min-w-24 items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium text-xs",
          deleted
            ? "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400"
            : enabled
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "border-orange-500/20 bg-orange-500/10 text-orange-600 dark:text-orange-400"
        )}
      >
        <Icon className="size-3.5" />
        <span>{label}</span>
      </div>
      <Switch checked={enabled} disabled={deleted} onCheckedChange={onToggle} />
    </div>
  );
}

function UserNameCell({
  t,
  user,
}: {
  t: ReturnType<typeof useTranslation>["t"];
  user: API.User;
}) {
  const method = user.auth_methods?.[0];
  const identifier = method?.auth_identifier || `#${user.id}`;
  const authType = method?.auth_type || "user";
  const initial = identifier.slice(0, 1).toUpperCase();

  return (
    <button
      className="group flex min-w-0 items-center gap-3 text-left"
      onClick={async () => {
        await navigator.clipboard.writeText(identifier);
        toast.success(t("copySuccess", "Copied successfully"));
      }}
      title={t("clickToCopy", "Click to copy")}
      type="button"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground text-xs">
        {initial || <UserRound className="size-4" />}
      </span>
      <span className="min-w-0">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate font-medium text-sm">{identifier}</span>
          <Copy className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </span>
        <span className="mt-1 flex items-center gap-1.5">
          <Badge className="h-5 px-1.5 text-[10px] uppercase" variant="outline">
            {authType}
          </Badge>
          {method?.verified ? (
            <span className="text-emerald-600 text-xs">
              {t("verified", "Verified")}
            </span>
          ) : null}
        </span>
      </span>
    </button>
  );
}

function MembershipCell({
  t,
  user,
}: {
  t: ReturnType<typeof useTranslation>["t"];
  user: UserWithMembership;
}) {
  const isMember = Boolean(user.is_member);
  const expiredAt = user.member_expired_at || 0;
  const Icon = isMember ? ShieldCheck : ShieldX;

  return (
    <div
      className={cn(
        "inline-flex min-w-44 items-center gap-2 rounded-2xl border px-3 py-2",
        isMember
          ? "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-300"
          : "border-border bg-muted/30 text-muted-foreground"
      )}
    >
      <Icon className="size-4 shrink-0" />
      <div className="min-w-0">
        <div className="truncate font-medium text-xs">
          {isMember
            ? t("memberActive", "Active Member")
            : t("memberInactive", "No Active Membership")}
        </div>
        <div className="truncate text-[11px] opacity-80">
          {expiredAt > 0
            ? formatDate(expiredAt, false)
            : t("notActivated", "Not activated")}
        </div>
      </div>
    </div>
  );
}

export default function User() {
  const { t } = useTranslation("user");
  const [loading, setLoading] = useState(false);
  const ref = useRef<ProTableActions>(null);
  const sp = useSearch({ strict: false }) as Record<string, string | undefined>;

  const { subscribes } = useSubscribe();

  const initialFilters = {
    search: sp.search || undefined,
    user_id: sp.user_id || undefined,
    subscribe_id: sp.subscribe_id || undefined,
    user_subscribe_id: sp.user_subscribe_id || undefined,
  };

  return (
    <ProTable<API.User, API.GetUserListParams>
      action={ref}
      actions={{
        render: (row) => [
          <ProfileSheet
            key="profile"
            onUpdated={() => ref.current?.refresh()}
            userId={row.id}
          />,
          <SubscriptionSheet key="subscription" userId={row.id} />,
          <DropdownMenu key="more" modal={false}>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                {t("more", "More")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link
                  search={{ user_id: String(row.id) }}
                  to="/dashboard/order"
                >
                  {t("orderList", "Order List")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  search={{ user_id: String(row.id) }}
                  to="/dashboard/log/login"
                >
                  {t("loginLogs", "Login Logs")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  search={{ user_id: String(row.id) }}
                  to="/dashboard/log/balance"
                >
                  {t("balanceLogs", "Balance Logs")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  search={{ user_id: String(row.id) }}
                  to="/dashboard/log/commission"
                >
                  {t("commissionLogs", "Commission Logs")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  search={{ user_id: String(row.id) }}
                  to="/dashboard/log/gift"
                >
                  {t("giftLogs", "Gift Logs")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <ConfirmButton
                  cancelText={t("cancel", "Cancel")}
                  confirmText={t("confirm", "Confirm")}
                  description={t(
                    "deleteDescription",
                    "This action cannot be undone."
                  )}
                  onConfirm={async () => {
                    await deleteUser({ id: row.id });
                    toast.success(t("deleteSuccess", "Deleted successfully"));
                    ref.current?.refresh();
                  }}
                  title={t("confirmDelete", "Confirm Delete")}
                  trigger={
                    <button
                      className="w-full cursor-default text-left text-red-500 hover:text-red-600 focus:text-red-600"
                      type="button"
                    >
                      {t("delete", "Delete")}
                    </button>
                  }
                />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>,
        ],
      }}
      columns={[
        {
          accessorKey: "enable",
          header: t("status", "Status"),
          cell: ({ row }) => (
            <UserStatusCell
              onToggle={async (checked) => {
                await updateUserBasicInfo(
                  buildBasicInfoPayload(
                    row.original as UserWithMembership,
                    checked
                  )
                );
                toast.success(t("updateSuccess", "Updated successfully"));
                ref.current?.refresh();
              }}
              t={t}
              user={row.original as UserWithMembership}
            />
          ),
        },
        {
          accessorKey: "id",
          header: "ID",
        },
        {
          accessorKey: "auth_methods",
          header: t("userName", "Username"),
          cell: ({ row }) => <UserNameCell t={t} user={row.original} />,
        },
        {
          accessorKey: "is_member",
          header: t("membership", "Membership"),
          cell: ({ row }) => (
            <MembershipCell t={t} user={row.original as UserWithMembership} />
          ),
        },
        {
          accessorKey: "balance",
          header: t("balance", "Balance"),
          cell: ({ row }) => (
            <Display type="currency" value={row.getValue("balance")} />
          ),
        },
        {
          accessorKey: "gift_amount",
          header: t("giftAmount", "Gift Amount"),
          cell: ({ row }) => (
            <Display type="currency" value={row.getValue("gift_amount")} />
          ),
        },
        {
          accessorKey: "commission",
          header: t("commission", "Commission"),
          cell: ({ row }) => (
            <Display type="currency" value={row.getValue("commission")} />
          ),
        },
        {
          accessorKey: "refer_code",
          header: t("inviteCode", "Invite Code"),
          cell: ({ row }) => row.getValue("refer_code") || "--",
        },
        {
          accessorKey: "referer_id",
          header: t("referer", "Referer"),
          cell: ({ row }) => <UserDetail id={row.original.referer_id} />,
        },
        {
          accessorKey: "created_at",
          header: t("createdAt", "Created At"),
          cell: ({ row }) => formatDate(row.getValue("created_at")),
        },
      ]}
      header={{
        title: t("userList", "User List"),
        toolbar: (
          <UserForm<API.CreateUserRequest>
            key="create"
            loading={loading}
            onSubmit={async (values) => {
              setLoading(true);
              try {
                await createUser(values);
                toast.success(t("createSuccess", "Created successfully"));
                ref.current?.refresh();
                setLoading(false);

                return true;
              } catch {
                setLoading(false);

                return false;
              }
            }}
            title={t("createUser", "Create User")}
            trigger={t("create", "Create")}
          />
        ),
      }}
      initialFilters={initialFilters}
      key={initialFilters.user_id}
      params={[
        {
          key: "subscribe_id",
          placeholder: t("subscription", "Subscription"),
          options: subscribes?.map((item) => ({
            label: item.name!,
            value: String(item.id!),
          })),
        },
        {
          key: "search",
          placeholder: t("search", "Search"),
        },
        {
          key: "user_id",
          placeholder: t("userId", "User ID"),
        },
        {
          key: "user_subscribe_id",
          placeholder: t("subscriptionId", "Subscription ID"),
        },
      ]}
      request={async (pagination, filter) => {
        const { data } = await getUserList({
          ...pagination,
          ...filter,
        });
        return {
          list: data.data?.list || [],
          total: data.data?.total || 0,
        };
      }}
    />
  );
}

function ProfileSheet({
  userId,
  onUpdated,
}: {
  userId: number;
  onUpdated?: () => void;
}) {
  const { t } = useTranslation("user");
  const [open, setOpen] = useState(false);
  const { data: user, refetch } = useQuery({
    enabled: open,
    queryKey: ["user", userId],
    queryFn: async () => {
      const { data } = await getUserDetail({ id: userId });
      return data.data as API.User;
    },
  });

  const refetchAll = async () => {
    await refetch();
    onUpdated?.();
    return Promise.resolve();
  };
  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger asChild>
        <Button size="sm" variant="default">
          {t("edit", "Edit")}
        </Button>
      </SheetTrigger>
      <SheetContent
        className="w-[700px] max-w-full md:max-w-screen-lg"
        side="right"
      >
        <SheetHeader>
          <SheetTitle>
            {t("userProfile", "User Profile")} · ID: {userId}
          </SheetTitle>
        </SheetHeader>
        {user && (
          <ScrollArea className="h-[calc(100dvh-140px)] p-2">
            <Tabs defaultValue="basic">
              <TabsList className="mb-3">
                <TabsTrigger value="basic">
                  {t("basicInfoTitle", "Basic Info")}
                </TabsTrigger>
                <TabsTrigger value="membership">
                  {t("membership", "Membership")}
                </TabsTrigger>
                <TabsTrigger value="notify">
                  {t("notifySettingsTitle", "Notify Settings")}
                </TabsTrigger>
                <TabsTrigger value="auth">
                  {t("authMethodsTitle", "Auth Methods")}
                </TabsTrigger>
              </TabsList>
              <TabsContent className="mt-0" value="basic">
                <BasicInfoForm refetch={refetchAll} user={user} />
              </TabsContent>
              <TabsContent className="mt-0" value="membership">
                <MembershipInfoForm refetch={refetchAll} user={user} />
              </TabsContent>
              <TabsContent className="mt-0" value="notify">
                <NotifySettingsForm refetch={refetchAll} user={user} />
              </TabsContent>
              <TabsContent className="mt-0" value="auth">
                <AuthMethodsForm refetch={refetchAll} user={user} />
              </TabsContent>
            </Tabs>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}

function SubscriptionSheet({ userId }: { userId: number }) {
  const { t } = useTranslation("user");
  const [open, setOpen] = useState(false);
  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger asChild>
        <Button size="sm" variant="secondary">
          {t("subscription", "Subscription")}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[1000px] max-w-full md:max-w-7xl" side="right">
        <SheetHeader>
          <SheetTitle>
            {t("subscriptionList", "Subscription List")} · ID: {userId}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-2 px-4">
          <UserSubscription userId={userId} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

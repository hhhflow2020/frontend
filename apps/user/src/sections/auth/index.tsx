"use client";

import { Link } from "@tanstack/react-router";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { LanguageSwitch } from "@workspace/ui/composed/language-switch";
import { ThemeSwitch } from "@workspace/ui/composed/theme-switch";
import { useTranslation } from "react-i18next";
import { useGlobalStore } from "@/stores/global";
import EmailAuthForm from "./email/auth-form";
import { OAuthMethods } from "./oauth-methods";
import PhoneAuthForm from "./phone/auth-form";

export default function Main() {
  const { t } = useTranslation("auth");
  const { common } = useGlobalStore();
  const { site, auth } = common;

  const AUTH_METHODS = [
    {
      key: "email",
      enabled: auth.email.enable,
      children: <EmailAuthForm />,
    },
    {
      key: "mobile",
      enabled: auth.mobile.enable,
      children: <PhoneAuthForm />,
    },
  ].filter((method) => method.enabled);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-5 md:px-8">
        <header className="flex items-center justify-between">
          <Link className="flex items-center gap-3" to="/">
            {site.site_logo && (
              <img
                alt="logo"
                className="size-8 rounded-md"
                height={32}
                src={site.site_logo}
                width={32}
              />
            )}
            <span className="font-medium text-sm">{site.site_name}</span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitch />
            <ThemeSwitch />
          </div>
        </header>

        <div className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-[minmax(0,1fr)_420px] lg:py-20">
          <section className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
            <p className="mb-5 font-medium text-muted-foreground text-sm">
              {t("verifyAccount", "Verify Your Account")}
            </p>
            <h1 className="text-balance font-semibold text-4xl tracking-normal md:text-6xl">
              A simpler way to stay connected.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground leading-8 lg:mx-0">
              {site.site_desc ||
                t("verifyAccountDesc", "Please login or register to continue")}
            </p>
          </section>

          <section className="mx-auto w-full max-w-[420px]">
            <div className="rounded-lg border bg-card/80 px-6 py-8 shadow-sm backdrop-blur md:px-8">
              <div className="mb-8 text-center">
                <h2 className="font-semibold text-2xl">
                  {t("verifyAccount", "Verify Your Account")}
                </h2>
                <p className="mt-2 text-muted-foreground text-sm">
                  {t(
                    "verifyAccountDesc",
                    "Please login or register to continue"
                  )}
                </p>
              </div>
              <div className="flex flex-col justify-center">
                {AUTH_METHODS.length === 1
                  ? AUTH_METHODS[0]?.children
                  : AUTH_METHODS[0] && (
                      <Tabs defaultValue={AUTH_METHODS[0].key}>
                        <TabsList className="mb-6 flex w-full *:flex-1">
                          {AUTH_METHODS.map((item) => (
                            <TabsTrigger key={item.key} value={item.key}>
                              {t(`methods.${item.key}`)}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                        {AUTH_METHODS.map((item) => (
                          <TabsContent key={item.key} value={item.key}>
                            {item.children}
                          </TabsContent>
                        ))}
                      </Tabs>
                    )}
              </div>
              <div className="py-8">
                <OAuthMethods />
              </div>
              <div className="flex justify-center gap-2 font-medium text-muted-foreground text-sm">
                <Link to="/tos">{t("tos", "Terms of Service")}</Link>
                <span className="text-foreground/30">|</span>
                <Link to="/privacy-policy">
                  {t("privacyPolicy", "Privacy Policy")}
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

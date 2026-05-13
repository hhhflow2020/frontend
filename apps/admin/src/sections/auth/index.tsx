"use client";

import { Link, useNavigate } from "@tanstack/react-router";
import { LanguageSwitch } from "@workspace/ui/composed/language-switch";
import { ThemeSwitch } from "@workspace/ui/composed/theme-switch";
import { useEffect } from "react";
import { useGlobalStore } from "@/stores/global";
import EmailAuthForm from "./email/auth-form";

export default function Auth() {
  const { common, user } = useGlobalStore();
  const { site } = common;

  const navigate = useNavigate();
  useEffect(() => {
    if (user) {
      navigate({ to: "/dashboard" });
    }
  }, [navigate, user]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-5 md:px-8">
        <header className="flex items-center justify-between">
          <Link className="flex items-center gap-3" to="/">
            <img
              alt="logo"
              className="size-8 rounded-md"
              height={32}
              src={site.site_logo || "/favicon.svg"}
              width={32}
            />
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
              Admin Console
            </p>
            <h1 className="text-balance font-semibold text-4xl tracking-normal md:text-6xl">
              Manage everything from one quiet place.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground leading-8 lg:mx-0">
              {site.site_desc ||
                "A focused workspace for users, products, nodes, orders, and daily operations."}
            </p>
          </section>

          <section className="mx-auto w-full max-w-[420px]">
            <div className="mb-8 flex justify-center lg:hidden">
              <Link className="flex flex-col items-center" to="/">
                <img
                  alt="logo"
                  className="size-12 rounded-xl"
                  height={48}
                  src={site.site_logo || "/favicon.svg"}
                  width={48}
                />
              </Link>
            </div>
            <div className="rounded-lg border bg-card/80 px-6 py-8 shadow-sm backdrop-blur md:px-8">
              <div className="mb-8 text-center">
                <h2 className="font-semibold text-2xl">Sign in</h2>
                <p className="mt-2 text-muted-foreground text-sm">
                  Continue to {site.site_name}
                </p>
              </div>
              <EmailAuthForm />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

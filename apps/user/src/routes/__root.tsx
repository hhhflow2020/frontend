import { TanStackDevtools } from "@tanstack/react-devtools";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { Toaster } from "@workspace/ui/components/sonner";
import { NavigationProgress } from "@workspace/ui/composed/navigation-progress";
import { TanStackQueryDevtools } from "@workspace/ui/integrations/tanstack-query-devtools";
import { getCookie } from "@workspace/ui/lib/cookies";
import { getGlobalConfig } from "@workspace/ui/services/common/common";
import { isBrowser } from "@workspace/ui/utils/index";
import { useEffect } from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { useGlobalStore } from "@/stores/global";

declare const __TANSTACK_DEVTOOLS_PORT__: number;

export const Route = createRootRouteWithContext()({
  component: () => {
    const { common, setCommon, getUserInfo } = useGlobalStore();
    useEffect(() => {
      const initializeApp = async () => {
        try {
          const configResponse = await getGlobalConfig();
          if (configResponse.data?.data) {
            setCommon(configResponse.data.data);
          }
          try {
            if (getCookie("Authorization")) {
              await getUserInfo();
            }
          } catch {
            /* empty */
          }
        } catch (error) {
          console.error("Failed to initialize app:", error);
        }
      };

      initializeApp();
    }, []);

    const { site } = common;
    const title = site.site_name || "Loading...";
    const description = site.site_desc || "";
    const keywords = site.keywords || "";
    const logo = site.site_logo || `${import.meta.env.BASE_URL}favicon.svg`;
    const url = isBrowser() ? window.location.href : "";
    const manifest = `${import.meta.env.BASE_URL}site.webmanifest`;

    return (
      <HelmetProvider>
        <Helmet>
          <title>{title}</title>
          <meta content={description} name="description" />
          <meta content={keywords} name="keywords" />
          <link href={url} rel="canonical" />
          <link href={logo} rel="icon" type="image/*" />
          <link href={logo} rel="apple-touch-icon" sizes="180x180" />
          <link href={manifest} rel="manifest" />
        </Helmet>
        <NavigationProgress />
        <Outlet />
        <Toaster closeButton richColors />
        <div
          dangerouslySetInnerHTML={{ __html: common?.site.custom_html || "" }}
          id="custom_html"
        />
        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          eventBusConfig={{
            port: __TANSTACK_DEVTOOLS_PORT__,
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
      </HelmetProvider>
    );
  },
});

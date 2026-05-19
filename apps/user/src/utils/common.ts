import {
  clearLegacyAuthorizationToken,
  removeAuthorizationToken,
  setAuthorizationToken,
} from "@workspace/ui/lib/auth-token";
import { isBrowser } from "@workspace/ui/utils/index";

export function getPlatform(): string {
  if (typeof window === "undefined") return "unknown";

  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes("win")) return "windows";
  if (userAgent.includes("mac")) return "macos";
  if (userAgent.includes("linux")) return "linux";
  if (userAgent.includes("android")) return "android";
  if (userAgent.includes("iphone") || userAgent.includes("ipad")) return "ios";

  return "unknown";
}

export { differenceInDays, formatDate } from "@workspace/ui/utils/formatting";

export function setAuthorization(token: string): void {
  setAuthorizationToken(token);
  clearLegacyAuthorizationToken();
}

export function getRedirectUrl(): string {
  if (typeof window === "undefined") return "/dashboard";
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get("redirect");
  return redirect?.startsWith("/") ? redirect : "/dashboard";
}

export function setRedirectUrl(value?: string) {
  if (value) {
    sessionStorage.setItem("redirect-url", value);
  }
}

export function Logout() {
  if (!isBrowser()) return;
  removeAuthorizationToken();
  clearLegacyAuthorizationToken();

  const pathname = location.pathname;
  const hash = location.hash.slice(1); // 移除 '#'

  if (
    !(
      ["", "/", "/auth", "/tos", "/privacy-policy"].includes(pathname) ||
      pathname.startsWith("/purchasing") ||
      pathname.startsWith("/oauth/")
    )
  ) {
    setRedirectUrl(pathname);
    location.href = "/#/auth";
    return;
  }

  if (
    hash &&
    !(
      ["", "/", "/auth", "/tos", "/privacy-policy"].includes(hash) ||
      hash.startsWith("/purchasing") ||
      hash.startsWith("/oauth/")
    )
  ) {
    setRedirectUrl(hash);
    location.href = "/#/auth";
  }
}

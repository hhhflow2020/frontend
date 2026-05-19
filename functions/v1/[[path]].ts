interface Env {
  API_BASE_URL?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const configuredApiBase = env.API_BASE_URL?.trim();
  if (!configuredApiBase) {
    return new Response(
      JSON.stringify({ code: 500, msg: "API_BASE_URL is not configured" }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }

  let apiBaseURL: URL;
  try {
    apiBaseURL = new URL(configuredApiBase);
  } catch {
    return new Response(
      JSON.stringify({ code: 500, msg: "API_BASE_URL is invalid" }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }

  const apiBase = configuredApiBase.replace(/\/$/, "");

  const url = new URL(request.url);
  const targetUrl = `${apiBase}${url.pathname}${url.search}`;

  const headers = new Headers(request.headers);
  headers.set("Host", apiBaseURL.host);
  headers.delete("cf-connecting-ip");
  headers.delete("cf-ipcountry");
  headers.delete("cf-ray");
  headers.delete("cf-visitor");

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "follow",
  };

  if (
    request.method !== "GET" &&
    request.method !== "HEAD" &&
    request.body !== null
  ) {
    init.body = request.body;
  }

  const response = await fetch(targetUrl, init);

  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("set-cookie");
  responseHeaders.set("Access-Control-Allow-Origin", url.origin);
  responseHeaders.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  responseHeaders.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: responseHeaders,
    });
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
};

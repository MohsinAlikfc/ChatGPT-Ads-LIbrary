import type { AppLoadContext, EntryContext } from "react-router";
import { ServerRouter } from "react-router";
import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";

export const streamTimeout = 5_000;

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: AppLoadContext
) {
  const userAgent = request.headers.get("user-agent");
  const isBot = Boolean(userAgent && isbot(userAgent));

  const body = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      signal: request.signal,
      onError(error: unknown) {
        console.error(error);
        responseStatusCode = 500;
      },
    }
  );

  if (isBot) {
    await body.allReady;
  }

  responseHeaders.set("Content-Type", "text/html; charset=utf-8");

  // Add Cloudflare Edge Cache-Control headers for successful responses
  if (!responseHeaders.has("Cache-Control") && responseStatusCode === 200) {
    responseHeaders.set(
      "Cache-Control",
      "public, max-age=60, s-maxage=3600, stale-while-revalidate=86400"
    );
  }

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}

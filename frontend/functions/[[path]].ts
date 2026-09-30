import { createPagesFunctionHandler } from "@react-router/cloudflare";
// @ts-ignore
import * as build from "../build/server";

const handler = createPagesFunctionHandler({ build });

export const onRequest: PagesFunction = async (context) => {
  const { request } = context;
  const url = new URL(request.url);

  if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
    const cleanPath = url.pathname.replace(/\/+$/, "");
    const cleanUrl = new URL(cleanPath + url.search + url.hash, url.origin);
    const status = request.method === "GET" || request.method === "HEAD" ? 301 : 308;
    return Response.redirect(cleanUrl.toString(), status);
  }

  return handler(context);
};


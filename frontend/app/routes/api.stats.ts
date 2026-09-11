import { type LoaderFunctionArgs } from "react-router";
import { getStats } from "../lib/db";

export async function loader({ context }: LoaderFunctionArgs) {
  const db = (context?.cloudflare?.env?.DB ?? (context as any)?.env?.DB) as any;
  const stats = await getStats(db);
  return Response.json(stats);
}

import { VercelRequest } from "@vercel/node";

export function getSiteUrl(req: VercelRequest) {
  return `${req.headers['x-forwarded-proto']}://${req.headers['x-forwarded-host']}`
}

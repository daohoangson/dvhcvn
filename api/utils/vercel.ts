import { VercelRequest } from "@vercel/node";

export function getGis(req: VercelRequest): boolean {
  const { gis } = req.query;
  switch (gis) {
    case '1':
    case 'yes':
      return true;
  }

  return false;
}

export function getSiteUrl(req: VercelRequest) {
  return `${req.headers['x-forwarded-proto']}://${req.headers['x-forwarded-host']}`
}

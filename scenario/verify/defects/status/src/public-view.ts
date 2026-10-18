import type { IncomingMessage, ServerResponse } from 'node:http';

type Handler = (req: IncomingMessage, res: ServerResponse) => Promise<void>;

/** The listing statuses clients know; a listing leaves the server with its status in this vocabulary. */
export const PUBLIC_STATUS: Record<string, string> = { active: 'active' };

function toPublic(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(toPublic);
  if (value && typeof value === 'object' && 'rankScore' in value && 'status' in value) {
    const listing = value as Record<string, unknown>;
    return { ...listing, status: PUBLIC_STATUS[String(listing.status)] };
  }
  return value;
}

/** Serves every JSON response through the public view of a listing (see server.ts). */
export function withPublicView(app: Handler): Handler {
  return async (req, res) => {
    const end = res.end.bind(res) as (chunk?: unknown) => ServerResponse;
    res.end = ((chunk?: unknown) => {
      if (typeof chunk !== 'string') return end(chunk);
      try {
        return end(JSON.stringify(toPublic(JSON.parse(chunk))));
      } catch {
        return end(chunk);
      }
    }) as typeof res.end;
    return app(req, res);
  };
}

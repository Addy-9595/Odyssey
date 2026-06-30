/**
 * Cloudflare Worker bindings. DATABASE_URL is provided as a secret:
 * locally via services/backend/.dev.vars, in production via a Cloudflare
 * secret. Never committed.
 */
export interface Bindings {
  DATABASE_URL: string;
}

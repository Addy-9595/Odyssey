import { z } from "@hono/zod-openapi";

/**
 * One typed error shape for every failure response, so the generated client
 * gets a single ErrorResponse type.
 *
 * Status-code scheme (consistent across the orders slice):
 *  - 400 Bad Request          — payload/query fails schema validation
 *  - 404 Not Found            — the order id in the URL path does not exist
 *  - 409 Conflict             — illegal order state transition
 *  - 422 Unprocessable Entity — create body is well-formed but semantically
 *                               invalid (customer/menu item missing, item
 *                               unavailable)
 */
export const ErrorResponseSchema = z
  .object({
    error: z.string(), // human-readable message
    code: z.string(), // stable machine code, e.g. "ORDER_NOT_FOUND"
    details: z.array(z.string()).optional(), // e.g. per-field validation notes
  })
  .openapi("ErrorResponse", {
    example: { error: "Order not found", code: "ORDER_NOT_FOUND" },
  });

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

export function errorBody(
  code: string,
  error: string,
  details?: string[],
): ErrorResponse {
  return details ? { code, error, details } : { code, error };
}

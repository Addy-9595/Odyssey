import { createRoute, type OpenAPIHono, z } from "@hono/zod-openapi";
import { and, desc, eq, inArray } from "drizzle-orm";
import type { Bindings } from "../env.ts";
import { withDb, type PoolDb } from "../db/client.ts";
import { customers, menuItems, orderItems, orders } from "../db/schema.ts";
import {
  CreateOrderBodySchema,
  ListOrdersQuerySchema,
  OrderDetailSchema,
  OrderIdParamSchema,
  OrderListItemSchema,
} from "../contract/orders.ts";
import { ErrorResponseSchema, errorBody } from "../contract/errors.ts";
import { computeOrderTotal } from "../domain/order-total.ts";
import {
  canTransition,
  ORDER_ACTION_TARGET,
  type OrderAction,
  type OrderStatus,
} from "../domain/order-transitions.ts";

type App = OpenAPIHono<{ Bindings: Bindings }>;

/* -------------------------------------------------------------------------- */
/* Shared helpers                                                             */
/* -------------------------------------------------------------------------- */

/** Loads an order with its customer and items (each item with its menu item). */
function loadOrderDetail(db: PoolDb, id: number) {
  return db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: {
      customer: true,
      items: { with: { menuItem: true } },
    },
  });
}

type OrderDetailRow = NonNullable<Awaited<ReturnType<typeof loadOrderDetail>>>;

function jsonError(description: string) {
  return {
    description,
    content: { "application/json": { schema: ErrorResponseSchema } },
  };
}

/**
 * Core of the five action endpoints: load, check the transition against the
 * shared state machine, persist if legal. Returns a discriminated result so
 * each route maps it to a precisely-typed response.
 */
type ActionResult =
  | { kind: "not_found" }
  | { kind: "illegal"; from: OrderStatus; to: OrderStatus }
  | { kind: "ok"; detail: OrderDetailRow };

async function applyOrderAction(
  db: PoolDb,
  id: number,
  action: OrderAction,
): Promise<ActionResult> {
  const existing = await db.query.orders.findFirst({
    where: eq(orders.id, id),
  });
  if (!existing) return { kind: "not_found" };

  const to = ORDER_ACTION_TARGET[action];
  if (!canTransition(existing.status, to)) {
    return { kind: "illegal", from: existing.status, to };
  }

  await db
    .update(orders)
    .set({ status: to, updatedAt: new Date() })
    .where(eq(orders.id, id));

  const detail = await loadOrderDetail(db, id);
  return { kind: "ok", detail: detail! };
}

/* -------------------------------------------------------------------------- */
/* Route definitions                                                          */
/* -------------------------------------------------------------------------- */

const createOrderRoute = createRoute({
  method: "post",
  path: "/orders",
  operationId: "createOrder",
  summary: "Create an order",
  tags: ["orders"],
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: CreateOrderBodySchema } },
    },
  },
  responses: {
    201: {
      description: "Order created",
      content: { "application/json": { schema: OrderDetailSchema } },
    },
    400: jsonError("Invalid payload"),
    422: jsonError(
      "Unprocessable: customer or menu item missing, or item unavailable",
    ),
  },
});

const listOrdersRoute = createRoute({
  method: "get",
  path: "/orders",
  operationId: "listOrders",
  summary: "List orders (optionally filtered by status and type)",
  tags: ["orders"],
  request: { query: ListOrdersQuerySchema },
  responses: {
    200: {
      description: "Orders",
      content: {
        "application/json": { schema: z.array(OrderListItemSchema) },
      },
    },
    400: jsonError("Invalid query"),
  },
});

const getOrderRoute = createRoute({
  method: "get",
  path: "/orders/{id}",
  operationId: "getOrder",
  summary: "Get an order with its items and customer",
  tags: ["orders"],
  request: { params: OrderIdParamSchema },
  responses: {
    200: {
      description: "Order detail",
      content: { "application/json": { schema: OrderDetailSchema } },
    },
    400: jsonError("Invalid id"),
    404: jsonError("Order not found"),
  },
});

function actionRoute(action: OrderAction, summary: string) {
  return createRoute({
    method: "post",
    path: `/orders/{id}/${action}`,
    operationId: `${action}Order`,
    summary,
    tags: ["orders"],
    request: { params: OrderIdParamSchema },
    responses: {
      200: {
        description: "Updated order detail",
        content: { "application/json": { schema: OrderDetailSchema } },
      },
      400: jsonError("Invalid id"),
      404: jsonError("Order not found"),
      409: jsonError("Illegal state transition from the order's current status"),
    },
  });
}

const confirmOrderRoute = actionRoute("confirm", "Confirm a pending order");
const preparingOrderRoute = actionRoute("preparing", "Move an order to preparing");
const readyOrderRoute = actionRoute("ready", "Mark an order ready");
const completeOrderRoute = actionRoute("complete", "Complete an order");
const cancelOrderRoute = actionRoute("cancel", "Cancel an order");

/* -------------------------------------------------------------------------- */
/* Registration                                                               */
/* -------------------------------------------------------------------------- */

export function registerOrderRoutes(app: App) {
  // --- Create -------------------------------------------------------------
  app.openapi(createOrderRoute, async (c) => {
    const body = c.req.valid("json");
    return withDb(c.env.DATABASE_URL, async (db) => {
      // 1. Customer must exist.
      const customer = await db.query.customers.findFirst({
        where: eq(customers.id, body.customerId),
      });
      if (!customer) {
        return c.json(
          errorBody(
            "CUSTOMER_NOT_FOUND",
            `Customer ${body.customerId} does not exist`,
          ),
          422,
        );
      }

      // 2. Every referenced menu item must exist and be available.
      const ids = body.items.map((i) => i.menuItemId);
      const found = await db.query.menuItems.findMany({
        where: inArray(menuItems.id, ids),
      });
      const byId = new Map(found.map((m) => [m.id, m]));

      for (const line of body.items) {
        const menuItem = byId.get(line.menuItemId);
        if (!menuItem) {
          return c.json(
            errorBody(
              "MENU_ITEM_NOT_FOUND",
              `Menu item ${line.menuItemId} does not exist`,
            ),
            422,
          );
        }
        if (!menuItem.isAvailable) {
          return c.json(
            errorBody(
              "MENU_ITEM_UNAVAILABLE",
              `Menu item "${menuItem.name}" is unavailable`,
            ),
            422,
          );
        }
      }

      // 3. Snapshot current prices and compute the total SERVER-SIDE.
      const lines = body.items.map((line) => ({
        menuItemId: line.menuItemId,
        quantity: line.quantity,
        unitPriceCents: byId.get(line.menuItemId)!.priceCents,
      }));
      const totalCents = computeOrderTotal(lines);

      // 4. Initial status comes from settings, never from the client.
      const settingsRow = await db.query.settings.findFirst();
      const initialStatus: OrderStatus = settingsRow?.autoAcceptOrders
        ? "confirmed"
        : "pending";

      // 5. Order + items commit atomically — no half-orders.
      const createdId = await db.transaction(async (tx) => {
        const [order] = await tx
          .insert(orders)
          .values({
            customerId: body.customerId,
            type: body.type,
            status: initialStatus,
            totalCents,
          })
          .returning();
        await tx
          .insert(orderItems)
          .values(lines.map((l) => ({ orderId: order!.id, ...l })));
        return order!.id;
      });

      const detail = await loadOrderDetail(db, createdId);
      return c.json(detail!, 201);
    });
  });

  // --- List ---------------------------------------------------------------
  app.openapi(listOrdersRoute, async (c) => {
    const { status, type } = c.req.valid("query");
    return withDb(c.env.DATABASE_URL, async (db) => {
      const conditions = [];
      if (status) conditions.push(eq(orders.status, status));
      if (type) conditions.push(eq(orders.type, type));

      const rows = await db.query.orders.findMany({
        where: conditions.length ? and(...conditions) : undefined,
        with: { customer: true },
        orderBy: desc(orders.createdAt),
      });
      return c.json(rows, 200);
    });
  });

  // --- Detail -------------------------------------------------------------
  app.openapi(getOrderRoute, async (c) => {
    const { id } = c.req.valid("param");
    return withDb(c.env.DATABASE_URL, async (db) => {
      const detail = await loadOrderDetail(db, id);
      if (!detail) {
        return c.json(errorBody("ORDER_NOT_FOUND", `Order ${id} not found`), 404);
      }
      return c.json(detail, 200);
    });
  });

  // --- Status actions (one named endpoint each, no generic setter) ---------
  app.openapi(confirmOrderRoute, async (c) => {
    const { id } = c.req.valid("param");
    return withDb(c.env.DATABASE_URL, async (db) => {
      const r = await applyOrderAction(db, id, "confirm");
      if (r.kind === "not_found")
        return c.json(errorBody("ORDER_NOT_FOUND", `Order ${id} not found`), 404);
      if (r.kind === "illegal")
        return c.json(
          errorBody(
            "ILLEGAL_TRANSITION",
            `Cannot confirm order ${id}: ${r.from} -> ${r.to} is not allowed`,
          ),
          409,
        );
      return c.json(r.detail, 200);
    });
  });

  app.openapi(preparingOrderRoute, async (c) => {
    const { id } = c.req.valid("param");
    return withDb(c.env.DATABASE_URL, async (db) => {
      const r = await applyOrderAction(db, id, "preparing");
      if (r.kind === "not_found")
        return c.json(errorBody("ORDER_NOT_FOUND", `Order ${id} not found`), 404);
      if (r.kind === "illegal")
        return c.json(
          errorBody(
            "ILLEGAL_TRANSITION",
            `Cannot move order ${id} to preparing: ${r.from} -> ${r.to} is not allowed`,
          ),
          409,
        );
      return c.json(r.detail, 200);
    });
  });

  app.openapi(readyOrderRoute, async (c) => {
    const { id } = c.req.valid("param");
    return withDb(c.env.DATABASE_URL, async (db) => {
      const r = await applyOrderAction(db, id, "ready");
      if (r.kind === "not_found")
        return c.json(errorBody("ORDER_NOT_FOUND", `Order ${id} not found`), 404);
      if (r.kind === "illegal")
        return c.json(
          errorBody(
            "ILLEGAL_TRANSITION",
            `Cannot mark order ${id} ready: ${r.from} -> ${r.to} is not allowed`,
          ),
          409,
        );
      return c.json(r.detail, 200);
    });
  });

  app.openapi(completeOrderRoute, async (c) => {
    const { id } = c.req.valid("param");
    return withDb(c.env.DATABASE_URL, async (db) => {
      const r = await applyOrderAction(db, id, "complete");
      if (r.kind === "not_found")
        return c.json(errorBody("ORDER_NOT_FOUND", `Order ${id} not found`), 404);
      if (r.kind === "illegal")
        return c.json(
          errorBody(
            "ILLEGAL_TRANSITION",
            `Cannot complete order ${id}: ${r.from} -> ${r.to} is not allowed`,
          ),
          409,
        );
      return c.json(r.detail, 200);
    });
  });

  app.openapi(cancelOrderRoute, async (c) => {
    const { id } = c.req.valid("param");
    return withDb(c.env.DATABASE_URL, async (db) => {
      const r = await applyOrderAction(db, id, "cancel");
      if (r.kind === "not_found")
        return c.json(errorBody("ORDER_NOT_FOUND", `Order ${id} not found`), 404);
      if (r.kind === "illegal")
        return c.json(
          errorBody(
            "ILLEGAL_TRANSITION",
            `Cannot cancel order ${id}: ${r.from} -> ${r.to} is not allowed`,
          ),
          409,
        );
      return c.json(r.detail, 200);
    });
  });
}

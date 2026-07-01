import { z } from "@hono/zod-openapi";
import { createSelectSchema } from "drizzle-zod";
import {
  categories,
  customers,
  menuItems,
  orderItems,
  orders,
  orderStatus,
  orderType,
} from "../db/schema.ts";
import {
  ORDER_ACTIONS,
  type OrderAction,
} from "../domain/order-transitions.ts";

/**
 * All API shapes for the orders slice. Response schemas are DERIVED from the
 * Drizzle tables via drizzle-zod — never hand-written — so they track the
 * schema automatically. The enums are read from the pgEnums (single source)
 * and registered ONCE here as named components reused everywhere.
 */

export const OrderStatusSchema = z
  .enum(orderStatus.enumValues)
  .openapi("OrderStatus");

export const OrderTypeSchema = z.enum(orderType.enumValues).openapi("OrderType");

// Action names surfaced to the client. Derived from ORDER_ACTIONS (itself
// derived from ORDER_ACTION_TARGET) so it can never drift from the state machine.
export const OrderActionSchema = z
  .enum(ORDER_ACTIONS as [OrderAction, ...OrderAction[]])
  .openapi("OrderAction");

/* -------------------------------------------------------------------------- */
/* Entity schemas (drizzle-zod derived)                                       */
/* -------------------------------------------------------------------------- */

export const CategorySchema = createSelectSchema(categories).openapi("Category");
export const CustomerSchema = createSelectSchema(customers).openapi("Customer");
export const MenuItemSchema = createSelectSchema(menuItems).openapi("MenuItem");
export const OrderItemSchema =
  createSelectSchema(orderItems).openapi("OrderItem");

// Base order shape with the registered enum components substituted in for the
// inline drizzle-zod enums, so status/type resolve to the shared $refs.
const orderBase = createSelectSchema(orders).extend({
  status: OrderStatusSchema,
  type: OrderTypeSchema,
});

export const OrderSchema = orderBase.openapi("Order");

// Order line with its menu item joined in, for the detail view.
export const OrderItemDetailSchema = OrderItemSchema.extend({
  menuItem: MenuItemSchema,
}).openapi("OrderItemDetail");

// List row: enough for a list view (id, customer, status, type, total, created).
export const OrderListItemSchema = orderBase
  .extend({ customer: CustomerSchema })
  .openapi("OrderListItem");

// Detail: the order with its items (snapshotted unit prices) and customer,
// plus the server-computed set of legal next actions (computed on read).
export const OrderDetailSchema = orderBase
  .extend({
    customer: CustomerSchema,
    items: z.array(OrderItemDetailSchema),
    allowedActions: z.array(OrderActionSchema),
  })
  .openapi("OrderDetail");

// Customer detail: the customer plus spend aggregates COMPUTED ON READ (there
// is no stored total_spend column — locked design decision) and their order
// history. Reuses OrderListItemSchema for the history rows.
export const CustomerDetailSchema = CustomerSchema.extend({
  totalSpendCents: z.number().int(),
  orderCount: z.number().int(),
  orders: z.array(OrderListItemSchema),
}).openapi("CustomerDetail");

/* -------------------------------------------------------------------------- */
/* Request schemas                                                            */
/* -------------------------------------------------------------------------- */

// Create payload. strictObject REJECTS any extra field — the client cannot
// send price, total, status, or unitPrice. Only customer, type, and lines.
export const CreateOrderBodySchema = z
  .strictObject({
    customerId: z.number().int().positive(),
    type: OrderTypeSchema,
    items: z
      .array(
        z.strictObject({
          menuItemId: z.number().int().positive(),
          quantity: z.number().int().min(1),
        }),
      )
      .min(1),
  })
  .openapi("CreateOrderBody", {
    example: {
      customerId: 1,
      type: "dine_in",
      items: [{ menuItemId: 1, quantity: 2 }],
    },
  });

export type CreateOrderBody = z.infer<typeof CreateOrderBodySchema>;

// Optional filters for the list endpoint.
export const ListOrdersQuerySchema = z.object({
  status: OrderStatusSchema.optional(),
  type: OrderTypeSchema.optional(),
});

// Path param shared by the detail + action endpoints.
export const OrderIdParamSchema = z.object({
  id: z.coerce.number().int().positive().openapi({
    param: { name: "id", in: "path" },
    example: 1,
  }),
});

// Path param for the customer detail endpoint.
export const CustomerIdParamSchema = z.object({
  id: z.coerce.number().int().positive().openapi({
    param: { name: "id", in: "path" },
    example: 1,
  }),
});

// Path param for the menu-item update endpoint.
export const MenuItemIdParamSchema = z.object({
  id: z.coerce.number().int().positive().openapi({
    param: { name: "id", in: "path" },
    example: 1,
  }),
});

// Partial update for a menu item. strictObject REJECTS unknown fields and the
// id is never accepted here (it lives in the path). Every field is optional;
// the route additionally rejects a completely empty body.
export const UpdateMenuItemBodySchema = z
  .strictObject({
    name: z.string().min(1),
    description: z.string().nullable(),
    priceCents: z.number().int().positive(),
    isAvailable: z.boolean(),
    categoryId: z.number().int().positive(),
  })
  .partial()
  .openapi("UpdateMenuItemBody", {
    example: { isAvailable: false },
  });

export type UpdateMenuItemBody = z.infer<typeof UpdateMenuItemBodySchema>;

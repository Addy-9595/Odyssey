import { z } from "@hono/zod-openapi";
import { createSelectSchema } from "drizzle-zod";
import {
  customers,
  menuItems,
  orderItems,
  orders,
  orderStatus,
  orderType,
} from "../db/schema.ts";

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

/* -------------------------------------------------------------------------- */
/* Entity schemas (drizzle-zod derived)                                       */
/* -------------------------------------------------------------------------- */

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

// Detail: the order with its items (snapshotted unit prices) and customer.
export const OrderDetailSchema = orderBase
  .extend({
    customer: CustomerSchema,
    items: z.array(OrderItemDetailSchema),
  })
  .openapi("OrderDetail");

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

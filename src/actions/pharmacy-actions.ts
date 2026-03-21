"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { getServiceSupabase } from "@/lib/supabase/service";
import { z } from "zod";

const isPharmacySchemaMissing = (message: string): boolean => {
  const m = message.toLowerCase();
  return (
    m.includes("could not find the table") ||
    m.includes("schema cache") ||
    m.includes("does not exist") ||
    m.includes("infinite recursion detected in policy")
  );
};

const GetProductsSchema = z.object({
  categoryId: z.number().optional(),
  q: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

export async function getPharmacyProducts(input: z.infer<typeof GetProductsSchema>) {
  const supabase = createServerSupabase();
  const { categoryId, q, page, limit } = GetProductsSchema.parse(input);
  const search = String(q || "").trim();

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  if (search.length > 0) {
    const { data, error } = await supabase.rpc("pharmacy_fuzzy_search_products", {
      p_query: search,
      p_category_id: categoryId ?? null,
      p_limit: limit,
      p_offset: from,
    });

    if (error) {
      if (isPharmacySchemaMissing(error.message)) {
        return { data: [], count: 0 };
      }
      throw new Error(error.message);
    }

    const rows = (data || []) as Array<Record<string, unknown>>;
    const totalCount = rows.length > 0 ? Number(rows[0]?.total_count || 0) : 0;
    const normalized = rows.map(({ total_count, ...rest }) => rest);
    return { data: normalized as any[], count: totalCount };
  }

  let query = supabase
    .from("pharmacy_products")
    .select("*, pharmacy_categories(name, slug), pharmacy_stores(name, slug)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data, error, count } = await query;

  if (error) {
    if (isPharmacySchemaMissing(error.message)) {
      return { data: [], count: 0 };
    }
    throw new Error(error.message);
  }

  return { data, count };
}

const GetOrderDetailsSchema = z.object({
  accessToken: z.string().min(1),
  orderId: z.number().int().positive(),
});

export async function getPharmacyOrderDetails(input: z.infer<typeof GetOrderDetailsSchema>) {
  const svc = getServiceSupabase();
  const { accessToken, orderId } = GetOrderDetailsSchema.parse(input);

  const {
    data: { user },
    error: authError,
  } = await svc.auth.getUser(accessToken);

  if (authError || !user) {
    throw new Error("User not authenticated");
  }

  const { data: order, error } = await svc
    .from("pharmacy_orders")
    .select(
      "*, pharmacy_order_items(*, pharmacy_products(*, pharmacy_categories(name, slug)))",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!order) {
    throw new Error("Order not found");
  }

  const orderCustomerId = (order as any).customer_id as string | null;
  const orderStoreId = (order as any).store_id as string;
  if (orderCustomerId === user.id) {
    return order;
  }

  const { data: member, error: memberError } = await svc
    .from("pharmacy_store_members")
    .select("role")
    .eq("store_id", orderStoreId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (memberError || !member) {
    throw new Error("Unauthorized");
  }

  return order;
}

export async function getPharmacyCategories() {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("pharmacy_categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    if (isPharmacySchemaMissing(error.message)) {
      return [];
    }
    throw new Error(error.message);
  }

  return data;
}

const CreateOrderSchema = z.object({
  accessToken: z.string().min(1),
  storeId: z.string().uuid(),
  items: z.array(
    z.object({
      productId: z.number(),
      quantity: z.number().min(1),
    })
  ),
  shippingAddress: z.record(z.string(), z.unknown()),
});

export async function createPharmacyOrder(input: z.infer<typeof CreateOrderSchema>) {
  const svc = getServiceSupabase();
  const { accessToken, storeId, items, shippingAddress } = CreateOrderSchema.parse(input);

  const {
    data: { user },
    error: authError,
  } = await svc.auth.getUser(accessToken);

  if (authError || !user) {
    throw new Error("User not authenticated");
  }

  const { data: orderId, error } = await svc.rpc("pharmacy_create_order_as_customer", {
    p_customer_id: user.id,
    p_store_id: storeId,
    p_items: items,
    p_shipping_address: shippingAddress,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { orderId: Number(orderId) };
}

const GetOrdersSchema = z.object({
  accessToken: z.string().min(1),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  storeId: z.string().uuid().optional(),
});

export async function getPharmacyOrders(input: z.infer<typeof GetOrdersSchema>) {
  const svc = getServiceSupabase();
  const { accessToken, page, limit, storeId } = GetOrdersSchema.parse(input);

  const {
    data: { user },
    error: authError,
  } = await svc.auth.getUser(accessToken);

  if (authError || !user) {
    throw new Error("User not authenticated");
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = svc
    .from("pharmacy_orders")
    .select("*, pharmacy_order_items(quantity, unit_price, pharmacy_products(name, currency, image_urls))", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (storeId) {
    const { data: member, error: memberError } = await svc
      .from("pharmacy_store_members")
      .select("role")
      .eq("store_id", storeId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberError || !member) {
      throw new Error("Unauthorized");
    }

    query = query.eq("store_id", storeId);
  } else {
    query = query.eq("customer_id", user.id);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return { data, count };
}

const GetProductByIdSchema = z.object({ id: z.number() });

export async function getPharmacyProductById(input: z.infer<typeof GetProductByIdSchema>) {
  const supabase = createServerSupabase();
  const { id } = GetProductByIdSchema.parse(input);
  const { data, error } = await supabase
    .from("pharmacy_products")
    .select("*, pharmacy_categories(name, slug), pharmacy_stores(name, slug)")
    .eq("id", id)
    .single();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

const SlugSchema = z
  .string()
  .min(3)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const CreateStoreSchema = z.object({
  accessToken: z.string().min(1),
  name: z.string().min(2).max(120),
  slug: z.string().optional(),
  description: z.string().max(1000).optional(),
  contactPhone: z.string().max(32).optional(),
  address: z
    .object({
      street: z.string().max(200).optional(),
      city: z.string().max(120).optional(),
      state: z.string().max(120).optional(),
      country: z.string().max(120).optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
    })
    .optional(),
});

const slugify = (value: string): string => {
  const base = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
  return base.length > 64 ? base.slice(0, 64).replace(/-+$/, "") : base;
};

export async function createPharmacyStore(input: z.infer<typeof CreateStoreSchema>) {
  const svc = getServiceSupabase();
  const parsed = CreateStoreSchema.parse(input);

  const {
    data: { user },
    error: authError,
  } = await svc.auth.getUser(parsed.accessToken);

  if (authError || !user) {
    throw new Error("User not authenticated");
  }

  const slugRaw = parsed.slug ? parsed.slug.trim().toLowerCase() : slugify(parsed.name);
  const slug = SlugSchema.parse(slugRaw);

  const { data, error } = await svc
    .from("pharmacy_stores")
    .insert({
      owner_id: user.id,
      name: parsed.name.trim(),
      slug,
      description: parsed.description?.trim() || null,
      contact_phone: parsed.contactPhone?.trim() || null,
      address: parsed.address ?? null,
      is_approved: false,
      is_active: true,
    })
    .select("id, name, slug, is_approved, is_active, created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await svc.from("pharmacy_audit_log").insert({
    store_id: (data as any).id,
    actor_id: user.id,
    action: "create",
    entity: "store",
    entity_id: String((data as any).id),
    changes: { name: parsed.name.trim(), slug },
  });

  return data;
}

const UpdateStoreSchema = z.object({
  accessToken: z.string().min(1),
  storeId: z.string().uuid(),
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(1000).optional(),
  contactPhone: z.string().max(32).optional(),
  address: z
    .object({
      street: z.string().max(200).optional(),
      city: z.string().max(120).optional(),
      state: z.string().max(120).optional(),
      country: z.string().max(120).optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
    })
    .nullable()
    .optional(),
  isActive: z.boolean().optional(),
});

const requireStoreRole = async (args: {
  svc: ReturnType<typeof getServiceSupabase>;
  storeId: string;
  userId: string;
  roles: Array<"owner" | "manager" | "staff">;
}) => {
  const { data, error } = await args.svc
    .from("pharmacy_store_members")
    .select("role")
    .eq("store_id", args.storeId)
    .eq("user_id", args.userId)
    .maybeSingle();
  if (error || !data) {
    throw new Error("Unauthorized");
  }
  const role = String((data as any).role || "");
  if (!args.roles.includes(role as any)) {
    throw new Error("Unauthorized");
  }
  return role as "owner" | "manager" | "staff";
};

export async function updatePharmacyStore(input: z.infer<typeof UpdateStoreSchema>) {
  const svc = getServiceSupabase();
  const parsed = UpdateStoreSchema.parse(input);

  const {
    data: { user },
    error: authError,
  } = await svc.auth.getUser(parsed.accessToken);

  if (authError || !user) {
    throw new Error("User not authenticated");
  }

  await requireStoreRole({ svc, storeId: parsed.storeId, userId: user.id, roles: ["owner"] });

  const patch: Record<string, unknown> = {};
  if (typeof parsed.name === "string") patch.name = parsed.name.trim();
  if (typeof parsed.description === "string") patch.description = parsed.description.trim() || null;
  if (typeof parsed.contactPhone === "string") patch.contact_phone = parsed.contactPhone.trim() || null;
  if (parsed.address !== undefined) patch.address = parsed.address;
  if (typeof parsed.isActive === "boolean") patch.is_active = parsed.isActive;
  if (!Object.keys(patch).length) {
    return { success: true };
  }

  const { error } = await svc.from("pharmacy_stores").update(patch).eq("id", parsed.storeId);
  if (error) {
    throw new Error(error.message);
  }

  await svc.from("pharmacy_audit_log").insert({
    store_id: parsed.storeId,
    actor_id: user.id,
    action: "update",
    entity: "store",
    entity_id: parsed.storeId,
    changes: patch,
  });

  return { success: true };
}

const ListMyStoresSchema = z.object({
  accessToken: z.string().min(1),
});

export async function listMyPharmacyStores(input: z.infer<typeof ListMyStoresSchema>) {
  const svc = getServiceSupabase();
  const { accessToken } = ListMyStoresSchema.parse(input);

  const {
    data: { user },
    error: authError,
  } = await svc.auth.getUser(accessToken);

  if (authError || !user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await svc
    .from("pharmacy_store_members")
    .select("role, pharmacy_stores(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data || []) as Array<{ role: string; pharmacy_stores: any }>;
  return rows
    .map((r) => ({
      role: String(r.role),
      store: r.pharmacy_stores,
    }))
    .filter((r) => r.store);
}

const UpsertProductSchema = z.object({
  accessToken: z.string().min(1),
  storeId: z.string().uuid(),
  productId: z.number().int().positive().optional(),
  name: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  price: z.number().positive(),
  currency: z.string().min(1).max(8).default("NGN"),
  sku: z.string().min(1).max(64),
  stockQuantity: z.number().int().min(0).default(0),
  categoryId: z.number().int().positive().nullable().optional(),
  imageUrls: z.array(z.string().min(1).max(1000)).max(8).optional(),
  isActive: z.boolean().optional(),
});

export async function upsertPharmacyProduct(input: z.infer<typeof UpsertProductSchema>) {
  const svc = getServiceSupabase();
  const parsed = UpsertProductSchema.parse(input);

  const {
    data: { user },
    error: authError,
  } = await svc.auth.getUser(parsed.accessToken);

  if (authError || !user) {
    throw new Error("User not authenticated");
  }

  await requireStoreRole({ svc, storeId: parsed.storeId, userId: user.id, roles: ["owner", "manager"] });

  const payload: Record<string, unknown> = {
    store_id: parsed.storeId,
    name: parsed.name.trim(),
    description: parsed.description?.trim() || null,
    price: parsed.price,
    currency: parsed.currency,
    sku: parsed.sku.trim(),
    stock_quantity: parsed.stockQuantity,
    category_id: parsed.categoryId ?? null,
    image_urls: parsed.imageUrls ?? [],
  };
  if (typeof parsed.isActive === "boolean") payload.is_active = parsed.isActive;

  if (parsed.productId) {
    const { error } = await svc
      .from("pharmacy_products")
      .update(payload)
      .eq("id", parsed.productId)
      .eq("store_id", parsed.storeId);
    if (error) {
      throw new Error(error.message);
    }
    await svc.from("pharmacy_audit_log").insert({
      store_id: parsed.storeId,
      actor_id: user.id,
      action: "update",
      entity: "product",
      entity_id: String(parsed.productId),
      changes: payload,
    });
    return { success: true };
  }

  const { data, error } = await svc
    .from("pharmacy_products")
    .insert(payload)
    .select("id")
    .single();
  if (error) {
    throw new Error(error.message);
  }
  const id = Number((data as any).id);
  await svc.from("pharmacy_audit_log").insert({
    store_id: parsed.storeId,
    actor_id: user.id,
    action: "create",
    entity: "product",
    entity_id: String(id),
    changes: payload,
  });
  return { success: true, productId: id };
}

const DeleteProductSchema = z.object({
  accessToken: z.string().min(1),
  storeId: z.string().uuid(),
  productId: z.number().int().positive(),
});

export async function deletePharmacyProduct(input: z.infer<typeof DeleteProductSchema>) {
  const svc = getServiceSupabase();
  const parsed = DeleteProductSchema.parse(input);

  const {
    data: { user },
    error: authError,
  } = await svc.auth.getUser(parsed.accessToken);

  if (authError || !user) {
    throw new Error("User not authenticated");
  }

  await requireStoreRole({ svc, storeId: parsed.storeId, userId: user.id, roles: ["owner", "manager"] });

  const { error } = await svc
    .from("pharmacy_products")
    .delete()
    .eq("id", parsed.productId)
    .eq("store_id", parsed.storeId);
  if (error) {
    throw new Error(error.message);
  }
  await svc.from("pharmacy_audit_log").insert({
    store_id: parsed.storeId,
    actor_id: user.id,
    action: "delete",
    entity: "product",
    entity_id: String(parsed.productId),
    changes: null,
  });
  return { success: true };
}

const OrderStatusSchema = z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]);
const PaymentStatusSchema = z.enum(["unpaid", "pending", "paid", "refunded", "failed"]);
const DeliveryStatusSchema = z.enum(["not_shipped", "in_transit", "delivered", "returned", "cancelled"]);

const UpdateOrderSchema = z.object({
  accessToken: z.string().min(1),
  storeId: z.string().uuid(),
  orderId: z.number().int().positive(),
  status: OrderStatusSchema.optional(),
  paymentStatus: PaymentStatusSchema.optional(),
  deliveryStatus: DeliveryStatusSchema.optional(),
  deliveryProvider: z.string().max(120).optional(),
  trackingNumber: z.string().max(120).optional(),
});

export async function updatePharmacyOrder(input: z.infer<typeof UpdateOrderSchema>) {
  const svc = getServiceSupabase();
  const parsed = UpdateOrderSchema.parse(input);

  const {
    data: { user },
    error: authError,
  } = await svc.auth.getUser(parsed.accessToken);

  if (authError || !user) {
    throw new Error("User not authenticated");
  }

  await requireStoreRole({ svc, storeId: parsed.storeId, userId: user.id, roles: ["owner", "manager", "staff"] });

  const patch: Record<string, unknown> = {};
  if (parsed.status) patch.status = parsed.status;
  if (parsed.paymentStatus) patch.payment_status = parsed.paymentStatus;
  if (parsed.deliveryStatus) patch.delivery_status = parsed.deliveryStatus;
  if (typeof parsed.deliveryProvider === "string") patch.delivery_provider = parsed.deliveryProvider.trim() || null;
  if (typeof parsed.trackingNumber === "string") patch.tracking_number = parsed.trackingNumber.trim() || null;
  if (!Object.keys(patch).length) {
    return { success: true };
  }

  const { error } = await svc
    .from("pharmacy_orders")
    .update(patch)
    .eq("id", parsed.orderId)
    .eq("store_id", parsed.storeId);
  if (error) {
    throw new Error(error.message);
  }

  await svc.from("pharmacy_audit_log").insert({
    store_id: parsed.storeId,
    actor_id: user.id,
    action: "update",
    entity: "order",
    entity_id: String(parsed.orderId),
    changes: patch,
  });

  return { success: true };
}

const GetSalesSchema = z.object({
  accessToken: z.string().min(1),
  storeId: z.string().uuid(),
  fromDay: z.string().optional(),
  toDay: z.string().optional(),
});

export async function getPharmacyStoreSalesDaily(input: z.infer<typeof GetSalesSchema>) {
  const svc = getServiceSupabase();
  const parsed = GetSalesSchema.parse(input);

  const {
    data: { user },
    error: authError,
  } = await svc.auth.getUser(parsed.accessToken);

  if (authError || !user) {
    throw new Error("User not authenticated");
  }

  await requireStoreRole({ svc, storeId: parsed.storeId, userId: user.id, roles: ["owner", "manager", "staff"] });

  let q = svc
    .from("pharmacy_store_sales_daily")
    .select("store_id, day, orders_count, gross_sales")
    .eq("store_id", parsed.storeId)
    .order("day", { ascending: false });

  if (parsed.fromDay) {
    q = q.gte("day", parsed.fromDay);
  }
  if (parsed.toDay) {
    q = q.lte("day", parsed.toDay);
  }

  const { data, error } = await q;
  if (error) {
    throw new Error(error.message);
  }
  return data || [];
}

const ListStoreProductsSchema = z.object({
  accessToken: z.string().min(1),
  storeId: z.string().uuid(),
});

export async function listPharmacyStoreProducts(input: z.infer<typeof ListStoreProductsSchema>) {
  const svc = getServiceSupabase();
  const parsed = ListStoreProductsSchema.parse(input);

  const {
    data: { user },
    error: authError,
  } = await svc.auth.getUser(parsed.accessToken);

  if (authError || !user) {
    throw new Error("User not authenticated");
  }

  await requireStoreRole({ svc, storeId: parsed.storeId, userId: user.id, roles: ["owner", "manager", "staff"] });

  const { data, error } = await svc
    .from("pharmacy_products")
    .select("id, store_id, name, description, price, currency, sku, stock_quantity, category_id, image_urls, is_active, created_at")
    .eq("store_id", parsed.storeId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return data || [];
}

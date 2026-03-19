"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { z } from "zod";

const GetProductsSchema = z.object({
  categoryId: z.number().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

export async function getPharmacyProducts(input: z.infer<typeof GetProductsSchema>) {
  const supabase = createServerSupabase();
  const { categoryId, page, limit } = GetProductsSchema.parse(input);

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("pharmacy_products")
    .select("*, pharmacy_categories(name, slug)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return { data, count };
}

const GetOrderDetailsSchema = z.object({
  orderId: z.number(),
});

export async function getPharmacyOrderDetails(input: z.infer<typeof GetOrderDetailsSchema>) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { orderId } = GetOrderDetailsSchema.parse(input);

  const { data: order, error } = await supabase
    .from("pharmacy_orders")
    .select("*, pharmacy_order_items(*, pharmacy_products(*, pharmacy_categories(name, slug)))")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single();

  if (error) {
    throw new Error(error.message);
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
    throw new Error(error.message);
  }

  return data;
}

const CreateOrderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.number(),
      quantity: z.number().min(1),
    })
  ),
  shippingAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    country: z.string(),
  }),
});

export async function createPharmacyOrder(input: z.infer<typeof CreateOrderSchema>) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { items, shippingAddress } = CreateOrderSchema.parse(input);

  const productIds = items.map((item) => item.productId);
  const { data: products, error: productsError } = await supabase
    .from("pharmacy_products")
    .select("id, price, stock_quantity")
    .in("id", productIds);

  if (productsError) {
    throw new Error(productsError.message);
  }

  let totalAmount = 0;
  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) {
      throw new Error(`Product with ID ${item.productId} not found`);
    }
    if (product.stock_quantity < item.quantity) {
      throw new Error(`Not enough stock for product with ID ${item.productId}`);
    }
    totalAmount += Number(product.price) * item.quantity;
  }

  const { data: order, error: orderError } = await supabase
    .from("pharmacy_orders")
    .insert({
      user_id: user.id,
      total_amount: totalAmount,
      shipping_address: shippingAddress,
    })
    .select("id")
    .single();

  if (orderError) {
    throw new Error(orderError.message);
  }

  const orderItems = items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    return {
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      price: product!.price,
    };
  });

  const { error: orderItemsError } = await supabase.from("pharmacy_order_items").insert(orderItems);

  if (orderItemsError) {
    throw new Error(orderItemsError.message);
  }

  // a transaction to update the stock quantities
  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    const newStock = product!.stock_quantity - item.quantity;
    await supabase
      .from("pharmacy_products")
      .update({ stock_quantity: newStock })
      .eq("id", item.productId);
  }

  return { orderId: order.id };
}

const GetOrdersSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

export async function getPharmacyOrders(input: z.infer<typeof GetOrdersSchema>) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { page, limit } = GetOrdersSchema.parse(input);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from("pharmacy_orders")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(from, to);

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
    .select("*, pharmacy_categories(name, slug)")
    .eq("id", id)
    .single();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

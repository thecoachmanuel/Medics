CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS pharmacy_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  contact_phone TEXT,
  address JSONB,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pharmacy_store_members (
  store_id UUID NOT NULL REFERENCES pharmacy_stores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner','manager','staff')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (store_id, user_id)
);

CREATE OR REPLACE FUNCTION pharmacy_ensure_store_owner_membership()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO pharmacy_store_members(store_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT (store_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pharmacy_store_owner_member ON pharmacy_stores;
CREATE TRIGGER trg_pharmacy_store_owner_member
AFTER INSERT ON pharmacy_stores
FOR EACH ROW
EXECUTE FUNCTION pharmacy_ensure_store_owner_membership();

CREATE TABLE IF NOT EXISTS pharmacy_categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pharmacy_products (
  id BIGSERIAL PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES pharmacy_stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  sku TEXT NOT NULL,
  stock_quantity INT NOT NULL DEFAULT 0,
  category_id BIGINT REFERENCES pharmacy_categories(id) ON DELETE SET NULL,
  image_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (store_id, sku)
);

CREATE TABLE IF NOT EXISTS pharmacy_orders (
  id BIGSERIAL PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES pharmacy_stores(id) ON DELETE RESTRICT,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  total_amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','shipped','delivered','cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','pending','paid','refunded','failed')),
  delivery_status TEXT NOT NULL DEFAULT 'not_shipped' CHECK (delivery_status IN ('not_shipped','in_transit','delivered','returned','cancelled')),
  shipping_address JSONB,
  delivery_provider TEXT,
  tracking_number TEXT,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pharmacy_order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES pharmacy_orders(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES pharmacy_stores(id) ON DELETE RESTRICT,
  product_id BIGINT NOT NULL REFERENCES pharmacy_products(id) ON DELETE RESTRICT,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(order_id, product_id)
);

CREATE TABLE IF NOT EXISTS pharmacy_product_reviews (
  id BIGSERIAL PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES pharmacy_stores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES pharmacy_products(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS pharmacy_audit_log (
  id BIGSERIAL PRIMARY KEY,
  store_id UUID REFERENCES pharmacy_stores(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  changes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_products_store_id ON pharmacy_products(store_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_products_category_id ON pharmacy_products(category_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_products_name_trgm ON pharmacy_products USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_pharmacy_products_desc_trgm ON pharmacy_products USING GIN (description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_pharmacy_orders_store_id ON pharmacy_orders(store_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_orders_customer_id ON pharmacy_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_order_items_order_id ON pharmacy_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_order_items_product_id ON pharmacy_order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_product_reviews_product_id ON pharmacy_product_reviews(product_id);

ALTER TABLE pharmacy_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_store_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pharmacy_stores_public_select ON pharmacy_stores;
CREATE POLICY pharmacy_stores_public_select ON pharmacy_stores
FOR SELECT
USING (is_active = TRUE AND is_approved = TRUE);

DROP POLICY IF EXISTS pharmacy_stores_member_select ON pharmacy_stores;
CREATE POLICY pharmacy_stores_member_select ON pharmacy_stores
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM pharmacy_store_members m
    WHERE m.store_id = pharmacy_stores.id
      AND m.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS pharmacy_stores_insert ON pharmacy_stores;
CREATE POLICY pharmacy_stores_insert ON pharmacy_stores
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND owner_id = auth.uid());

DROP POLICY IF EXISTS pharmacy_stores_update ON pharmacy_stores;
CREATE POLICY pharmacy_stores_update ON pharmacy_stores
FOR UPDATE
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS pharmacy_stores_delete ON pharmacy_stores;
CREATE POLICY pharmacy_stores_delete ON pharmacy_stores
FOR DELETE
USING (owner_id = auth.uid());

DROP POLICY IF EXISTS pharmacy_members_select ON pharmacy_store_members;
CREATE POLICY pharmacy_members_select ON pharmacy_store_members
FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM pharmacy_stores s
    WHERE s.id = pharmacy_store_members.store_id
      AND s.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS pharmacy_members_write ON pharmacy_store_members;
CREATE POLICY pharmacy_members_write ON pharmacy_store_members
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM pharmacy_stores s
    WHERE s.id = pharmacy_store_members.store_id
      AND s.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM pharmacy_stores s
    WHERE s.id = pharmacy_store_members.store_id
      AND s.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS pharmacy_products_public_select ON pharmacy_products;
CREATE POLICY pharmacy_products_public_select ON pharmacy_products
FOR SELECT
USING (
  is_active = TRUE
  AND EXISTS (
    SELECT 1
    FROM pharmacy_stores s
    WHERE s.id = pharmacy_products.store_id
      AND s.is_active = TRUE
      AND s.is_approved = TRUE
  )
);

DROP POLICY IF EXISTS pharmacy_products_member_select ON pharmacy_products;
CREATE POLICY pharmacy_products_member_select ON pharmacy_products
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM pharmacy_store_members m
    WHERE m.store_id = pharmacy_products.store_id
      AND m.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS pharmacy_products_write ON pharmacy_products;
CREATE POLICY pharmacy_products_write ON pharmacy_products
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM pharmacy_store_members m
    WHERE m.store_id = pharmacy_products.store_id
      AND m.user_id = auth.uid()
      AND m.role IN ('owner','manager')
  )
);

DROP POLICY IF EXISTS pharmacy_products_update ON pharmacy_products;
CREATE POLICY pharmacy_products_update ON pharmacy_products
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM pharmacy_store_members m
    WHERE m.store_id = pharmacy_products.store_id
      AND m.user_id = auth.uid()
      AND m.role IN ('owner','manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM pharmacy_store_members m
    WHERE m.store_id = pharmacy_products.store_id
      AND m.user_id = auth.uid()
      AND m.role IN ('owner','manager')
  )
);

DROP POLICY IF EXISTS pharmacy_products_delete ON pharmacy_products;
CREATE POLICY pharmacy_products_delete ON pharmacy_products
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM pharmacy_store_members m
    WHERE m.store_id = pharmacy_products.store_id
      AND m.user_id = auth.uid()
      AND m.role IN ('owner','manager')
  )
);

DROP POLICY IF EXISTS pharmacy_orders_customer_select ON pharmacy_orders;
CREATE POLICY pharmacy_orders_customer_select ON pharmacy_orders
FOR SELECT
USING (customer_id = auth.uid());

DROP POLICY IF EXISTS pharmacy_orders_store_select ON pharmacy_orders;
CREATE POLICY pharmacy_orders_store_select ON pharmacy_orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM pharmacy_store_members m
    WHERE m.store_id = pharmacy_orders.store_id
      AND m.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS pharmacy_orders_insert ON pharmacy_orders;
CREATE POLICY pharmacy_orders_insert ON pharmacy_orders
FOR INSERT
WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS pharmacy_orders_update_store ON pharmacy_orders;
CREATE POLICY pharmacy_orders_update_store ON pharmacy_orders
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM pharmacy_store_members m
    WHERE m.store_id = pharmacy_orders.store_id
      AND m.user_id = auth.uid()
      AND m.role IN ('owner','manager','staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM pharmacy_store_members m
    WHERE m.store_id = pharmacy_orders.store_id
      AND m.user_id = auth.uid()
      AND m.role IN ('owner','manager','staff')
  )
);

DROP POLICY IF EXISTS pharmacy_order_items_customer_select ON pharmacy_order_items;
CREATE POLICY pharmacy_order_items_customer_select ON pharmacy_order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM pharmacy_orders o
    WHERE o.id = pharmacy_order_items.order_id
      AND o.customer_id = auth.uid()
  )
);

DROP POLICY IF EXISTS pharmacy_order_items_store_select ON pharmacy_order_items;
CREATE POLICY pharmacy_order_items_store_select ON pharmacy_order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM pharmacy_store_members m
    WHERE m.store_id = pharmacy_order_items.store_id
      AND m.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS pharmacy_reviews_public_select ON pharmacy_product_reviews;
CREATE POLICY pharmacy_reviews_public_select ON pharmacy_product_reviews
FOR SELECT
USING (
  EXISTS (SELECT 1 FROM pharmacy_products p WHERE p.id = pharmacy_product_reviews.product_id AND p.is_active = TRUE)
);

DROP POLICY IF EXISTS pharmacy_reviews_write ON pharmacy_product_reviews;
CREATE POLICY pharmacy_reviews_write ON pharmacy_product_reviews
FOR INSERT
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS pharmacy_audit_select ON pharmacy_audit_log;
CREATE POLICY pharmacy_audit_select ON pharmacy_audit_log
FOR SELECT
USING (
  store_id IS NULL
  OR EXISTS (
    SELECT 1 FROM pharmacy_store_members m
    WHERE m.store_id = pharmacy_audit_log.store_id
      AND m.user_id = auth.uid()
      AND m.role IN ('owner','manager')
  )
);

CREATE OR REPLACE FUNCTION pharmacy_fuzzy_search_products(
  p_query TEXT,
  p_category_id BIGINT DEFAULT NULL,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE(
  id BIGINT,
  store_id UUID,
  name TEXT,
  description TEXT,
  price NUMERIC,
  currency TEXT,
  sku TEXT,
  stock_quantity INT,
  category_id BIGINT,
  image_urls JSONB,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  total_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    p.id,
    p.store_id,
    p.name,
    p.description,
    p.price,
    p.currency,
    p.sku,
    p.stock_quantity,
    p.category_id,
    p.image_urls,
    p.is_active,
    p.created_at,
    p.updated_at,
    COUNT(*) OVER()::BIGINT AS total_count
  FROM pharmacy_products p
  JOIN pharmacy_stores s ON s.id = p.store_id
  WHERE p.is_active = TRUE
    AND s.is_active = TRUE
    AND s.is_approved = TRUE
    AND (p_category_id IS NULL OR p.category_id = p_category_id)
    AND (p.name % p_query OR COALESCE(p.description,'') % p_query)
  ORDER BY GREATEST(similarity(p.name, p_query), similarity(COALESCE(p.description,''), p_query)) DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

CREATE OR REPLACE FUNCTION pharmacy_create_order(
  p_store_id UUID,
  p_items JSONB,
  p_shipping_address JSONB
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_uid UUID;
  v_order_id BIGINT;
  v_total NUMERIC(12,2) := 0;
  v_item JSONB;
  v_product RECORD;
  v_pid BIGINT;
  v_qty INT;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pharmacy_stores s
    WHERE s.id = p_store_id
      AND s.is_active = TRUE
      AND s.is_approved = TRUE
  ) THEN
    RAISE EXCEPTION 'invalid_store';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_pid := (v_item->>'productId')::BIGINT;
    v_qty := (v_item->>'quantity')::INT;
    IF v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'invalid_quantity';
    END IF;

    SELECT * INTO v_product
    FROM pharmacy_products
    WHERE id = v_pid AND store_id = p_store_id AND is_active = TRUE
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'product_not_found';
    END IF;
    IF v_product.stock_quantity < v_qty THEN
      RAISE EXCEPTION 'out_of_stock';
    END IF;

    v_total := v_total + (v_product.price * v_qty);
  END LOOP;

  INSERT INTO pharmacy_orders(store_id, customer_id, total_amount, currency, status, payment_status, delivery_status, shipping_address)
  VALUES (p_store_id, v_uid, v_total, 'NGN', 'pending', 'pending', 'not_shipped', p_shipping_address)
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_pid := (v_item->>'productId')::BIGINT;
    v_qty := (v_item->>'quantity')::INT;
    SELECT * INTO v_product
    FROM pharmacy_products
    WHERE id = v_pid AND store_id = p_store_id AND is_active = TRUE
    FOR UPDATE;

    INSERT INTO pharmacy_order_items(order_id, store_id, product_id, quantity, unit_price)
    VALUES (v_order_id, p_store_id, v_pid, v_qty, v_product.price);

    UPDATE pharmacy_products
    SET stock_quantity = stock_quantity - v_qty
    WHERE id = v_pid;
  END LOOP;

  INSERT INTO pharmacy_audit_log(store_id, actor_id, action, entity, entity_id, changes)
  VALUES (p_store_id, v_uid, 'create', 'order', v_order_id::TEXT, jsonb_build_object('total', v_total));

  RETURN v_order_id;
END;
$$;

CREATE OR REPLACE FUNCTION pharmacy_create_order_as_customer(
  p_customer_id UUID,
  p_store_id UUID,
  p_items JSONB,
  p_shipping_address JSONB
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id BIGINT;
  v_total NUMERIC(12,2) := 0;
  v_item JSONB;
  v_product RECORD;
  v_pid BIGINT;
  v_qty INT;
BEGIN
  IF p_customer_id IS NULL THEN
    RAISE EXCEPTION 'invalid_customer';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pharmacy_stores s
    WHERE s.id = p_store_id
      AND s.is_active = TRUE
      AND s.is_approved = TRUE
  ) THEN
    RAISE EXCEPTION 'invalid_store';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_pid := (v_item->>'productId')::BIGINT;
    v_qty := (v_item->>'quantity')::INT;
    IF v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'invalid_quantity';
    END IF;

    SELECT * INTO v_product
    FROM pharmacy_products
    WHERE id = v_pid AND store_id = p_store_id AND is_active = TRUE
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'product_not_found';
    END IF;
    IF v_product.stock_quantity < v_qty THEN
      RAISE EXCEPTION 'out_of_stock';
    END IF;

    v_total := v_total + (v_product.price * v_qty);
  END LOOP;

  INSERT INTO pharmacy_orders(store_id, customer_id, total_amount, currency, status, payment_status, delivery_status, shipping_address)
  VALUES (p_store_id, p_customer_id, v_total, 'NGN', 'pending', 'pending', 'not_shipped', p_shipping_address)
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_pid := (v_item->>'productId')::BIGINT;
    v_qty := (v_item->>'quantity')::INT;
    SELECT * INTO v_product
    FROM pharmacy_products
    WHERE id = v_pid AND store_id = p_store_id AND is_active = TRUE
    FOR UPDATE;

    INSERT INTO pharmacy_order_items(order_id, store_id, product_id, quantity, unit_price)
    VALUES (v_order_id, p_store_id, v_pid, v_qty, v_product.price);

    UPDATE pharmacy_products
    SET stock_quantity = stock_quantity - v_qty
    WHERE id = v_pid;
  END LOOP;

  INSERT INTO pharmacy_audit_log(store_id, actor_id, action, entity, entity_id, changes)
  VALUES (p_store_id, p_customer_id, 'create', 'order', v_order_id::TEXT, jsonb_build_object('total', v_total));

  RETURN v_order_id;
END;
$$;

REVOKE ALL ON FUNCTION pharmacy_create_order_as_customer(UUID, UUID, JSONB, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION pharmacy_create_order_as_customer(UUID, UUID, JSONB, JSONB) TO service_role;

CREATE OR REPLACE VIEW pharmacy_store_sales_daily WITH (security_invoker = true) AS
SELECT
  store_id,
  (created_at AT TIME ZONE 'UTC')::date AS day,
  COUNT(*) FILTER (WHERE status <> 'cancelled') AS orders_count,
  SUM(total_amount) FILTER (WHERE payment_status IN ('paid','pending') AND status <> 'cancelled') AS gross_sales
FROM pharmacy_orders
GROUP BY store_id, (created_at AT TIME ZONE 'UTC')::date;

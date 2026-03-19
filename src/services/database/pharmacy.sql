-- Pharmacy Categories Table
CREATE TABLE pharmacy_categories (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    slug TEXT NOT NULL UNIQUE,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pharmacy Products Table
CREATE TABLE pharmacy_products (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    sku TEXT NOT NULL UNIQUE,
    stock_quantity INT NOT NULL DEFAULT 0,
    category_id BIGINT REFERENCES pharmacy_categories(id) ON DELETE SET NULL,
    image_urls JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pharmacy Orders Table
CREATE TABLE pharmacy_orders (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    total_amount NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- e.g., pending, processing, shipped, delivered, cancelled
    shipping_address JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pharmacy Order Items Table
CREATE TABLE pharmacy_order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES pharmacy_orders(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES pharmacy_products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pharmacy Product Reviews Table
CREATE TABLE pharmacy_product_reviews (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES pharmacy_products(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_pharmacy_products_category_id ON pharmacy_products(category_id);
CREATE INDEX idx_pharmacy_orders_user_id ON pharmacy_orders(user_id);
CREATE INDEX idx_pharmacy_order_items_order_id ON pharmacy_order_items(order_id);
CREATE INDEX idx_pharmacy_order_items_product_id ON pharmacy_order_items(product_id);
CREATE INDEX idx_pharmacy_product_reviews_product_id ON pharmacy_product_reviews(product_id);
CREATE INDEX idx_pharmacy_product_reviews_user_id ON pharmacy_product_reviews(user_id);

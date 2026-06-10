-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "billing_email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "address" TEXT,
    "phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "price_monthly" INTEGER NOT NULL DEFAULT 0,
    "max_branches" INTEGER,
    "max_users" INTEGER,
    "features" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_subscriptions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'TRIAL',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_subscriptions_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "users" ADD COLUMN "tenant_id" TEXT, ADD COLUMN "branch_id" TEXT;
ALTER TABLE "customers" ADD COLUMN "tenant_id" TEXT, ADD COLUMN "branch_id" TEXT;
ALTER TABLE "service_categories" ADD COLUMN "tenant_id" TEXT, ADD COLUMN "branch_id" TEXT;
ALTER TABLE "service_catalogs" ADD COLUMN "tenant_id" TEXT, ADD COLUMN "branch_id" TEXT;
ALTER TABLE "sparepart_categories" ADD COLUMN "tenant_id" TEXT, ADD COLUMN "branch_id" TEXT;
ALTER TABLE "spareparts" ADD COLUMN "tenant_id" TEXT, ADD COLUMN "branch_id" TEXT;
ALTER TABLE "stock_movements" ADD COLUMN "tenant_id" TEXT, ADD COLUMN "branch_id" TEXT;
ALTER TABLE "customer_vehicles" ADD COLUMN "tenant_id" TEXT, ADD COLUMN "branch_id" TEXT;
ALTER TABLE "bookings" ADD COLUMN "tenant_id" TEXT, ADD COLUMN "branch_id" TEXT;
ALTER TABLE "service_orders" ADD COLUMN "tenant_id" TEXT, ADD COLUMN "branch_id" TEXT;
ALTER TABLE "service_history" ADD COLUMN "tenant_id" TEXT, ADD COLUMN "branch_id" TEXT;
ALTER TABLE "invoices" ADD COLUMN "tenant_id" TEXT, ADD COLUMN "branch_id" TEXT;
ALTER TABLE "payments" ADD COLUMN "tenant_id" TEXT, ADD COLUMN "branch_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");
CREATE INDEX "tenants_status_idx" ON "tenants"("status");
CREATE UNIQUE INDEX "branches_tenant_id_code_key" ON "branches"("tenant_id", "code");
CREATE INDEX "branches_tenant_id_idx" ON "branches"("tenant_id");
CREATE INDEX "branches_status_idx" ON "branches"("status");
CREATE UNIQUE INDEX "subscription_plans_code_key" ON "subscription_plans"("code");
CREATE INDEX "subscription_plans_is_active_idx" ON "subscription_plans"("is_active");
CREATE INDEX "tenant_subscriptions_tenant_id_idx" ON "tenant_subscriptions"("tenant_id");
CREATE INDEX "tenant_subscriptions_plan_id_idx" ON "tenant_subscriptions"("plan_id");
CREATE INDEX "tenant_subscriptions_status_idx" ON "tenant_subscriptions"("status");

CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");
CREATE INDEX "users_branch_id_idx" ON "users"("branch_id");
CREATE INDEX "customers_tenant_id_idx" ON "customers"("tenant_id");
CREATE INDEX "customers_branch_id_idx" ON "customers"("branch_id");
CREATE INDEX "service_categories_tenant_id_idx" ON "service_categories"("tenant_id");
CREATE INDEX "service_categories_branch_id_idx" ON "service_categories"("branch_id");
CREATE INDEX "service_catalogs_tenant_id_idx" ON "service_catalogs"("tenant_id");
CREATE INDEX "service_catalogs_branch_id_idx" ON "service_catalogs"("branch_id");
CREATE INDEX "sparepart_categories_tenant_id_idx" ON "sparepart_categories"("tenant_id");
CREATE INDEX "sparepart_categories_branch_id_idx" ON "sparepart_categories"("branch_id");
CREATE INDEX "spareparts_tenant_id_idx" ON "spareparts"("tenant_id");
CREATE INDEX "spareparts_branch_id_idx" ON "spareparts"("branch_id");
CREATE INDEX "stock_movements_tenant_id_idx" ON "stock_movements"("tenant_id");
CREATE INDEX "stock_movements_branch_id_idx" ON "stock_movements"("branch_id");
CREATE INDEX "customer_vehicles_tenant_id_idx" ON "customer_vehicles"("tenant_id");
CREATE INDEX "customer_vehicles_branch_id_idx" ON "customer_vehicles"("branch_id");
CREATE INDEX "bookings_tenant_id_idx" ON "bookings"("tenant_id");
CREATE INDEX "bookings_branch_id_idx" ON "bookings"("branch_id");
CREATE INDEX "service_orders_tenant_id_idx" ON "service_orders"("tenant_id");
CREATE INDEX "service_orders_branch_id_idx" ON "service_orders"("branch_id");
CREATE INDEX "service_history_tenant_id_idx" ON "service_history"("tenant_id");
CREATE INDEX "service_history_branch_id_idx" ON "service_history"("branch_id");
CREATE INDEX "invoices_tenant_id_idx" ON "invoices"("tenant_id");
CREATE INDEX "invoices_branch_id_idx" ON "invoices"("branch_id");
CREATE INDEX "payments_tenant_id_idx" ON "payments"("tenant_id");
CREATE INDEX "payments_branch_id_idx" ON "payments"("branch_id");

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tenant_subscriptions" ADD CONSTRAINT "tenant_subscriptions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tenant_subscriptions" ADD CONSTRAINT "tenant_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "users" ADD CONSTRAINT "users_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "customers" ADD CONSTRAINT "customers_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "service_categories" ADD CONSTRAINT "service_categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "service_categories" ADD CONSTRAINT "service_categories_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "service_catalogs" ADD CONSTRAINT "service_catalogs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "service_catalogs" ADD CONSTRAINT "service_catalogs_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sparepart_categories" ADD CONSTRAINT "sparepart_categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sparepart_categories" ADD CONSTRAINT "sparepart_categories_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "spareparts" ADD CONSTRAINT "spareparts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "spareparts" ADD CONSTRAINT "spareparts_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "customer_vehicles" ADD CONSTRAINT "customer_vehicles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "customer_vehicles" ADD CONSTRAINT "customer_vehicles_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "service_history" ADD CONSTRAINT "service_history_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "service_history" ADD CONSTRAINT "service_history_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

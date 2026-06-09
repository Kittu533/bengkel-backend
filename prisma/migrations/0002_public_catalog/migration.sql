CREATE TABLE "service_categories" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "service_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "service_catalogs" (
  "id" TEXT NOT NULL,
  "category_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "vehicle_type" TEXT NOT NULL,
  "price" INTEGER NOT NULL,
  "estimated_duration_minutes" INTEGER NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "service_catalogs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sparepart_categories" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "sparepart_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "spareparts" (
  "id" TEXT NOT NULL,
  "category_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "sku" TEXT NOT NULL,
  "brand" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "vehicle_type" TEXT NOT NULL,
  "stock" INTEGER NOT NULL,
  "min_stock" INTEGER NOT NULL,
  "sell_price" INTEGER NOT NULL,
  "cost_price" INTEGER NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "spareparts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "service_catalogs_slug_key" ON "service_catalogs"("slug");
CREATE INDEX "service_catalogs_category_id_idx" ON "service_catalogs"("category_id");
CREATE INDEX "service_catalogs_vehicle_type_idx" ON "service_catalogs"("vehicle_type");
CREATE UNIQUE INDEX "spareparts_sku_key" ON "spareparts"("sku");
CREATE INDEX "spareparts_category_id_idx" ON "spareparts"("category_id");
CREATE INDEX "spareparts_brand_idx" ON "spareparts"("brand");

ALTER TABLE "service_catalogs"
  ADD CONSTRAINT "service_catalogs_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "service_categories"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "spareparts"
  ADD CONSTRAINT "spareparts_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "sparepart_categories"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

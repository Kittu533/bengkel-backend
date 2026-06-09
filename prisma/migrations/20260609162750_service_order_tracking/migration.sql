-- AlterTable
ALTER TABLE "service_orders" ADD COLUMN     "check_in_at" TIMESTAMP(3),
ADD COLUMN     "customer_complaint" TEXT,
ADD COLUMN     "finished_at" TIMESTAMP(3),
ADD COLUMN     "grand_total" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "initial_diagnosis" TEXT,
ADD COLUMN     "mechanic_id" TEXT,
ADD COLUMN     "mileage_in" INTEGER,
ADD COLUMN     "total_service_price" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_sparepart_price" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "service_order_service_items" (
    "id" TEXT NOT NULL,
    "service_order_id" TEXT NOT NULL,
    "service_catalog_id" TEXT,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "subtotal" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_order_service_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_order_sparepart_items" (
    "id" TEXT NOT NULL,
    "service_order_id" TEXT NOT NULL,
    "sparepart_id" TEXT,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_order_sparepart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_order_notes" (
    "id" TEXT NOT NULL,
    "service_order_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'INTERNAL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_order_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_order_photos" (
    "id" TEXT NOT NULL,
    "service_order_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'CUSTOMER_VISIBLE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_order_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_order_service_items_service_order_id_idx" ON "service_order_service_items"("service_order_id");

-- CreateIndex
CREATE INDEX "service_order_service_items_service_catalog_id_idx" ON "service_order_service_items"("service_catalog_id");

-- CreateIndex
CREATE INDEX "service_order_sparepart_items_service_order_id_idx" ON "service_order_sparepart_items"("service_order_id");

-- CreateIndex
CREATE INDEX "service_order_sparepart_items_sparepart_id_idx" ON "service_order_sparepart_items"("sparepart_id");

-- CreateIndex
CREATE INDEX "service_order_notes_service_order_id_idx" ON "service_order_notes"("service_order_id");

-- CreateIndex
CREATE INDEX "service_order_notes_user_id_idx" ON "service_order_notes"("user_id");

-- CreateIndex
CREATE INDEX "service_order_notes_visibility_idx" ON "service_order_notes"("visibility");

-- CreateIndex
CREATE INDEX "service_order_photos_service_order_id_idx" ON "service_order_photos"("service_order_id");

-- CreateIndex
CREATE INDEX "service_order_photos_visibility_idx" ON "service_order_photos"("visibility");

-- CreateIndex
CREATE INDEX "service_orders_mechanic_id_idx" ON "service_orders"("mechanic_id");

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_mechanic_id_fkey" FOREIGN KEY ("mechanic_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_service_items" ADD CONSTRAINT "service_order_service_items_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_sparepart_items" ADD CONSTRAINT "service_order_sparepart_items_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_notes" ADD CONSTRAINT "service_order_notes_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_notes" ADD CONSTRAINT "service_order_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_photos" ADD CONSTRAINT "service_order_photos_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "service_order_checklists" (
    "id" TEXT NOT NULL,
    "service_order_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "is_done" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_order_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_order_checklists_service_order_id_idx" ON "service_order_checklists"("service_order_id");

-- CreateIndex
CREATE INDEX "service_order_checklists_user_id_idx" ON "service_order_checklists"("user_id");

-- CreateIndex
CREATE INDEX "service_order_checklists_is_done_idx" ON "service_order_checklists"("is_done");

-- AddForeignKey
ALTER TABLE "service_order_checklists" ADD CONSTRAINT "service_order_checklists_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_checklists" ADD CONSTRAINT "service_order_checklists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

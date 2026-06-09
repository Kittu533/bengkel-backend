CREATE TABLE "customer_vehicles" (
  "id" TEXT NOT NULL,
  "customer_id" TEXT NOT NULL,
  "plate_number" TEXT NOT NULL,
  "brand" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "vehicle_type" TEXT NOT NULL,
  "year" INTEGER,
  "color" TEXT,
  "notes" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "customer_vehicles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bookings" (
  "id" TEXT NOT NULL,
  "customer_id" TEXT NOT NULL,
  "vehicle_id" TEXT,
  "code" TEXT NOT NULL,
  "service_name" TEXT NOT NULL,
  "schedule_at" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'WAITING_CONFIRMATION',
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "service_orders" (
  "id" TEXT NOT NULL,
  "customer_id" TEXT NOT NULL,
  "vehicle_id" TEXT,
  "code" TEXT NOT NULL,
  "service_name" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
  "current_step" TEXT NOT NULL,
  "started_at" TIMESTAMP(3),
  "estimated_finished_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "service_orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "service_history" (
  "id" TEXT NOT NULL,
  "customer_id" TEXT NOT NULL,
  "vehicle_id" TEXT,
  "service_name" TEXT NOT NULL,
  "service_date" TIMESTAMP(3) NOT NULL,
  "odometer" INTEGER,
  "total_price" INTEGER NOT NULL,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "service_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "invoices" (
  "id" TEXT NOT NULL,
  "customer_id" TEXT NOT NULL,
  "invoice_number" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'UNPAID',
  "issued_at" TIMESTAMP(3) NOT NULL,
  "due_at" TIMESTAMP(3),
  "total_amount" INTEGER NOT NULL,
  "paid_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "bookings_code_key" ON "bookings"("code");
CREATE UNIQUE INDEX "service_orders_code_key" ON "service_orders"("code");
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

CREATE INDEX "customer_vehicles_customer_id_idx" ON "customer_vehicles"("customer_id");
CREATE INDEX "customer_vehicles_plate_number_idx" ON "customer_vehicles"("plate_number");
CREATE INDEX "bookings_customer_id_idx" ON "bookings"("customer_id");
CREATE INDEX "bookings_vehicle_id_idx" ON "bookings"("vehicle_id");
CREATE INDEX "bookings_status_idx" ON "bookings"("status");
CREATE INDEX "service_orders_customer_id_idx" ON "service_orders"("customer_id");
CREATE INDEX "service_orders_vehicle_id_idx" ON "service_orders"("vehicle_id");
CREATE INDEX "service_orders_status_idx" ON "service_orders"("status");
CREATE INDEX "service_history_customer_id_idx" ON "service_history"("customer_id");
CREATE INDEX "service_history_vehicle_id_idx" ON "service_history"("vehicle_id");
CREATE INDEX "invoices_customer_id_idx" ON "invoices"("customer_id");
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

ALTER TABLE "customer_vehicles"
  ADD CONSTRAINT "customer_vehicles_customer_id_fkey"
  FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_customer_id_fkey"
  FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_vehicle_id_fkey"
  FOREIGN KEY ("vehicle_id") REFERENCES "customer_vehicles"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "service_orders"
  ADD CONSTRAINT "service_orders_customer_id_fkey"
  FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "service_orders"
  ADD CONSTRAINT "service_orders_vehicle_id_fkey"
  FOREIGN KEY ("vehicle_id") REFERENCES "customer_vehicles"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "service_history"
  ADD CONSTRAINT "service_history_customer_id_fkey"
  FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "service_history"
  ADD CONSTRAINT "service_history_vehicle_id_fkey"
  FOREIGN KEY ("vehicle_id") REFERENCES "customer_vehicles"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "invoices"
  ADD CONSTRAINT "invoices_customer_id_fkey"
  FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "BengkelPro API",
    version: "1.5.0",
    description:
      "API contract untuk auth, public catalog, customer area, booking, service order, mechanic workspace, invoice, admin dashboard, dan super admin audit.",
  },
  servers: [{ url: "/api", description: "Current API host" }],
  tags: [
    { name: "Health" },
    { name: "Auth" },
    { name: "Public Catalog" },
    { name: "Customer" },
    { name: "Booking" },
    { name: "Service Order" },
    { name: "Mechanic" },
    { name: "Inventory" },
    { name: "Invoice" },
    { name: "Payment" },
    { name: "Admin Dashboard" },
    { name: "Owner Dashboard" },
    { name: "Reports" },
    { name: "Super Admin" },
    { name: "Master Data" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      ApiSuccess: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string" },
          data: { nullable: true },
        },
      },
      ApiError: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string" },
          errors: { type: "array", items: { type: "object" } },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["name", "email", "phone", "password", "confirmPassword"],
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email" },
          phone: { type: "string" },
          password: { type: "string", minLength: 8 },
          confirmPassword: { type: "string", minLength: 8 },
        },
      },
      VehicleRequest: {
        type: "object",
        required: ["plateNumber", "brand", "model", "vehicleType"],
        properties: {
          plateNumber: { type: "string", example: "B 1234 ABC" },
          brand: { type: "string", example: "Honda" },
          model: { type: "string", example: "Beat" },
          vehicleType: { type: "string", enum: ["MOTOR", "CAR"] },
          year: { type: "integer", example: 2024 },
          color: { type: "string", example: "Hitam" },
          notes: { type: "string" },
        },
      },
      BookingRequest: {
        type: "object",
        required: [
          "vehicleId",
          "serviceCatalogId",
          "bookingDate",
          "bookingTime",
          "complaint",
        ],
        properties: {
          vehicleId: { type: "string", format: "uuid" },
          serviceCatalogId: { type: "string", format: "uuid" },
          bookingDate: { type: "string", example: "2026-06-10" },
          bookingTime: { type: "string", example: "09:00" },
          complaint: { type: "string", minLength: 5 },
        },
      },
      BookingRejectRequest: {
        type: "object",
        required: ["reason"],
        properties: { reason: { type: "string", minLength: 5 } },
      },
      BookingRescheduleRequest: {
        type: "object",
        required: ["bookingDate", "bookingTime", "reason"],
        properties: {
          bookingDate: { type: "string", example: "2026-06-10" },
          bookingTime: { type: "string", example: "10:30" },
          reason: { type: "string", minLength: 5 },
        },
      },
      BookingCancelRequest: {
        type: "object",
        properties: { reason: { type: "string" } },
      },
      ServiceOrderRequest: {
        type: "object",
        required: ["customerId", "vehicleId", "customerComplaint"],
        properties: {
          customerId: { type: "string" },
          vehicleId: { type: "string" },
          serviceCatalogId: { type: "string" },
          mechanicId: { type: "string" },
          customerComplaint: { type: "string", minLength: 5 },
          initialDiagnosis: { type: "string" },
          mileageIn: { type: "integer" },
          estimatedFinishedAt: { type: "string", format: "date-time" },
        },
      },
      ServiceOrderStatusRequest: {
        type: "object",
        required: ["status"],
        properties: {
          status: {
            type: "string",
            enum: [
              "WAITING",
              "CHECKED_IN",
              "DIAGNOSIS",
              "WAITING_APPROVAL",
              "IN_PROGRESS",
              "WAITING_SPAREPART",
              "QUALITY_CHECK",
              "READY_TO_PICKUP",
              "COMPLETED",
              "CANCELLED",
            ],
          },
        },
      },
      AssignMechanicRequest: {
        type: "object",
        required: ["mechanicId"],
        properties: { mechanicId: { type: "string" } },
      },
      ServiceOrderServiceItemRequest: {
        type: "object",
        required: ["serviceCatalogId"],
        properties: {
          serviceCatalogId: { type: "string" },
          quantity: { type: "integer", minimum: 1, default: 1 },
        },
      },
      ServiceOrderSparepartItemRequest: {
        type: "object",
        required: ["sparepartId"],
        properties: {
          sparepartId: { type: "string" },
          quantity: { type: "integer", minimum: 1, default: 1 },
        },
      },
      ServiceOrderNoteRequest: {
        type: "object",
        required: ["note"],
        properties: {
          note: { type: "string" },
          visibility: { type: "string", enum: ["INTERNAL", "CUSTOMER_VISIBLE"] },
        },
      },
      ServiceOrderPhotoRequest: {
        type: "object",
        required: ["url"],
        properties: {
          url: { type: "string", format: "uri" },
          caption: { type: "string" },
          visibility: { type: "string", enum: ["INTERNAL", "CUSTOMER_VISIBLE"] },
        },
      },
      ServiceOrderChecklistRequest: {
        type: "object",
        required: ["title"],
        properties: {
          title: { type: "string", minLength: 3 },
          isDone: { type: "boolean", default: false },
          note: { type: "string" },
        },
      },
      StockAdjustmentRequest: {
        type: "object",
        required: ["type", "quantity"],
        properties: {
          type: { type: "string", enum: ["IN", "OUT", "ADJUSTMENT"] },
          quantity: { type: "integer", example: 5 },
          note: { type: "string" },
          referenceType: {
            type: "string",
            enum: ["PURCHASE", "MANUAL_ADJUSTMENT"],
          },
          referenceId: { type: "string" },
        },
      },
      InvoiceRequest: {
        type: "object",
        required: ["serviceOrderId"],
        properties: {
          serviceOrderId: { type: "string" },
          issuedAt: { type: "string", format: "date-time" },
          dueAt: { type: "string", format: "date-time" },
        },
      },
      InvoiceUpdateRequest: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["UNPAID", "PARTIAL", "PAID", "CANCELLED", "REFUNDED"],
          },
          dueAt: { type: "string", format: "date-time", nullable: true },
          pdfUrl: { type: "string", nullable: true },
        },
      },
      PaymentRequest: {
        type: "object",
        required: ["invoiceId", "amount", "method"],
        properties: {
          invoiceId: { type: "string" },
          amount: { type: "integer", minimum: 1 },
          method: {
            type: "string",
            enum: ["CASH", "BANK_TRANSFER", "QRIS_MANUAL", "MIDTRANS", "XENDIT"],
          },
          status: {
            type: "string",
            enum: ["PENDING", "CONFIRMED", "FAILED", "CANCELLED", "REFUNDED"],
          },
          paidAt: { type: "string", format: "date-time" },
          referenceNumber: { type: "string" },
          note: { type: "string" },
        },
      },
      TenantRequest: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string" },
          slug: { type: "string" },
          status: { type: "string", enum: ["ACTIVE", "INACTIVE", "SUSPENDED"] },
          billingEmail: { type: "string", format: "email" },
          phone: { type: "string" },
          address: { type: "string" },
          branchName: { type: "string" },
          branchCode: { type: "string" },
          planId: { type: "string" },
          subscriptionStatus: {
            type: "string",
            enum: ["TRIAL", "ACTIVE", "PAST_DUE", "CANCELLED"],
          },
        },
      },
      SubscriptionPlanRequest: {
        type: "object",
        required: ["name", "priceMonthly"],
        properties: {
          name: { type: "string" },
          code: { type: "string" },
          priceMonthly: { type: "integer", minimum: 0 },
          maxBranches: { type: "integer", minimum: 1 },
          maxUsers: { type: "integer", minimum: 1 },
          features: { type: "string" },
          isActive: { type: "boolean" },
        },
      },
      AuditLog: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          actorId: { type: "string", nullable: true },
          action: { type: "string", example: "tenant.create" },
          entityType: { type: "string", example: "Tenant" },
          entityId: { type: "string", nullable: true },
          metadata: { type: "object", nullable: true },
          ipAddress: { type: "string", nullable: true },
          userAgent: { type: "string", nullable: true },
          requestId: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          actor: {
            type: "object",
            nullable: true,
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              email: { type: "string", format: "email" },
              role: { type: "string" },
            },
          },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: { 200: { description: "API berjalan" } },
      },
    },
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register customer",
        requestBody: jsonBody("RegisterRequest"),
        responses: { 201: { description: "Register berhasil" } },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login user",
        requestBody: jsonBody("LoginRequest"),
        responses: { 200: { description: "Login berhasil" } },
      },
    },
    "/auth/me": protectedGet("Auth", "Current user"),
    "/auth/refresh-token": {
      post: {
        tags: ["Auth"],
        summary: "Refresh access token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["refreshToken"],
                properties: { refreshToken: { type: "string" } },
              },
            },
          },
        },
        responses: { 200: { description: "Token berhasil diperbarui" } },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout and revoke refresh token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["refreshToken"],
                properties: { refreshToken: { type: "string" } },
              },
            },
          },
        },
        responses: { 200: { description: "Logout berhasil" } },
      },
    },
    "/super-admin/tenants": {
      get: {
        ...protectedOperation("Super Admin", "List tenants"),
        parameters: [
          queryParam("search"),
          queryParam("status"),
          queryParam("page", "integer"),
          queryParam("limit", "integer"),
        ],
      },
      post: {
        ...protectedOperation("Super Admin", "Create tenant"),
        requestBody: jsonBody("TenantRequest"),
      },
    },
    "/super-admin/tenants/{id}": {
      get: protectedOperation("Super Admin", "Get tenant detail"),
      patch: {
        ...protectedOperation("Super Admin", "Update tenant"),
        requestBody: jsonBody("TenantRequest"),
      },
      delete: protectedOperation("Super Admin", "Deactivate tenant"),
    },
    "/super-admin/plans": {
      get: protectedOperation("Super Admin", "List subscription plans"),
      post: {
        ...protectedOperation("Super Admin", "Create subscription plan"),
        requestBody: jsonBody("SubscriptionPlanRequest"),
      },
    },
    "/super-admin/plans/{id}": {
      patch: {
        ...protectedOperation("Super Admin", "Update subscription plan"),
        requestBody: jsonBody("SubscriptionPlanRequest"),
      },
      delete: protectedOperation("Super Admin", "Deactivate subscription plan"),
    },
    "/super-admin/audit-logs": {
      get: {
        ...protectedOperation("Super Admin", "List audit logs"),
        parameters: [
          queryParam("search"),
          queryParam("action"),
          queryParam("entityType"),
          queryParam("actorId"),
          queryParam("page", "integer"),
          queryParam("limit", "integer"),
        ],
        responses: {
          200: {
            description: "Audit log berhasil diambil",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/AuditLog" },
                    },
                    meta: { type: "object" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/public/service-catalogs": listEndpoint("Public Catalog", "List service catalogs"),
    "/public/service-catalogs/{id}": detailEndpoint(
      "Public Catalog",
      "Get service catalog detail"
    ),
    "/public/spareparts": listEndpoint("Public Catalog", "List spareparts"),
    "/public/spareparts/{id}": detailEndpoint(
      "Public Catalog",
      "Get sparepart detail"
    ),
    "/customer/dashboard": protectedGet("Customer", "Customer dashboard summary"),
    "/customer/vehicles": {
      get: protectedOperation("Customer", "List customer vehicles"),
      post: {
        ...protectedOperation("Customer", "Create customer vehicle"),
        requestBody: jsonBody("VehicleRequest"),
      },
    },
    "/customer/vehicles/{id}": {
      get: protectedOperation("Customer", "Get customer vehicle detail"),
      patch: {
        ...protectedOperation("Customer", "Update customer vehicle"),
        requestBody: jsonBody("VehicleRequest"),
      },
      delete: protectedOperation("Customer", "Delete customer vehicle"),
    },
    "/customer/bookings": protectedGet("Customer", "List customer bookings"),
    "/bookings": {
      get: {
        ...protectedOperation("Booking", "List bookings"),
        parameters: [
          queryParam("search"),
          queryParam("status"),
          queryParam("page", "integer"),
          queryParam("limit", "integer"),
        ],
      },
      post: {
        ...protectedOperation("Booking", "Create customer booking"),
        requestBody: jsonBody("BookingRequest"),
        responses: {
          201: { description: "Booking created" },
          409: { description: "Slot conflict" },
        },
      },
    },
    "/bookings/{id}": {
      get: protectedOperation("Booking", "Get booking detail"),
    },
    "/bookings/{id}/accept": {
      patch: protectedOperation("Booking", "Accept booking"),
    },
    "/bookings/{id}/reject": {
      patch: {
        ...protectedOperation("Booking", "Reject booking"),
        requestBody: jsonBody("BookingRejectRequest"),
      },
    },
    "/bookings/{id}/reschedule": {
      patch: {
        ...protectedOperation("Booking", "Reschedule booking"),
        requestBody: jsonBody("BookingRescheduleRequest"),
      },
    },
    "/bookings/{id}/cancel": {
      patch: {
        ...protectedOperation("Booking", "Cancel booking"),
        requestBody: jsonBody("BookingCancelRequest"),
      },
    },
    "/bookings/{id}/convert-to-service-order": {
      post: protectedOperation("Booking", "Convert booking to service order"),
    },
    "/customer/service-orders/active": protectedGet(
      "Customer",
      "List active customer service orders"
    ),
    "/customer/service-orders/{id}/tracking": protectedGet(
      "Customer",
      "Get customer service order tracking"
    ),
    "/service-orders": {
      get: {
        ...protectedOperation("Service Order", "List service orders"),
        parameters: [
          queryParam("search"),
          queryParam("status"),
          queryParam("mechanicId"),
          queryParam("page", "integer"),
          queryParam("limit", "integer"),
        ],
      },
      post: {
        ...protectedOperation("Service Order", "Create service order"),
        requestBody: jsonBody("ServiceOrderRequest"),
      },
    },
    "/service-orders/{id}": {
      get: protectedOperation("Service Order", "Get service order detail"),
      patch: {
        ...protectedOperation("Service Order", "Update service order"),
        requestBody: jsonBody("ServiceOrderRequest"),
      },
    },
    "/service-orders/{id}/status": {
      patch: {
        ...protectedOperation("Service Order", "Update service order status"),
        requestBody: jsonBody("ServiceOrderStatusRequest"),
      },
    },
    "/service-orders/{id}/assign-mechanic": {
      patch: {
        ...protectedOperation("Service Order", "Assign mechanic"),
        requestBody: jsonBody("AssignMechanicRequest"),
      },
    },
    "/service-orders/{id}/service-items": {
      post: {
        ...protectedOperation("Service Order", "Add service item"),
        requestBody: jsonBody("ServiceOrderServiceItemRequest"),
      },
    },
    "/service-orders/{id}/sparepart-items": {
      post: {
        ...protectedOperation("Service Order", "Add sparepart item"),
        requestBody: jsonBody("ServiceOrderSparepartItemRequest"),
      },
    },
    "/service-orders/{id}/notes": {
      post: {
        ...protectedOperation("Service Order", "Add service order note"),
        requestBody: jsonBody("ServiceOrderNoteRequest"),
      },
    },
    "/service-orders/{id}/photos": {
      post: {
        ...protectedOperation("Service Order", "Add progress photo URL"),
        requestBody: jsonBody("ServiceOrderPhotoRequest"),
      },
    },
    "/service-orders/{id}/complete": {
      patch: protectedOperation("Service Order", "Complete service order"),
    },
    "/mechanic/tasks": {
      get: {
        ...protectedOperation("Mechanic", "List assigned mechanic tasks"),
        parameters: [
          queryParam("search"),
          queryParam("status"),
          queryParam("page", "integer"),
          queryParam("limit", "integer"),
        ],
      },
    },
    "/mechanic/tasks/{id}": {
      get: protectedOperation("Mechanic", "Get mechanic task detail"),
    },
    "/mechanic/tasks/{id}/status": {
      patch: {
        ...protectedOperation("Mechanic", "Update mechanic task status"),
        requestBody: jsonBody("ServiceOrderStatusRequest"),
      },
    },
    "/mechanic/tasks/{id}/notes": {
      post: {
        ...protectedOperation("Mechanic", "Add mechanic note"),
        requestBody: jsonBody("ServiceOrderNoteRequest"),
      },
    },
    "/mechanic/tasks/{id}/photos": {
      post: {
        ...protectedOperation("Mechanic", "Add mechanic progress photo"),
        requestBody: jsonBody("ServiceOrderPhotoRequest"),
      },
    },
    "/mechanic/tasks/{id}/checklist": {
      post: {
        ...protectedOperation("Mechanic", "Add mechanic checklist item"),
        requestBody: jsonBody("ServiceOrderChecklistRequest"),
      },
    },
    "/owner/dashboard/summary": protectedGet(
      "Owner Dashboard",
      "Owner dashboard summary"
    ),
    "/reports/revenue": {
      get: {
        ...protectedOperation("Reports", "Revenue report"),
        parameters: [queryParam("startDate"), queryParam("endDate")],
      },
    },
    "/reports/services": {
      get: {
        ...protectedOperation("Reports", "Top service report"),
        parameters: [queryParam("startDate"), queryParam("endDate")],
      },
    },
    "/reports/spareparts": {
      get: {
        ...protectedOperation("Reports", "Top sparepart report"),
        parameters: [queryParam("startDate"), queryParam("endDate")],
      },
    },
    "/reports/mechanics": {
      get: {
        ...protectedOperation("Reports", "Mechanic performance report"),
        parameters: [queryParam("startDate"), queryParam("endDate")],
      },
    },
    "/reports/unpaid-invoices": protectedGet(
      "Reports",
      "List unpaid invoices"
    ),
    "/reports/low-stock": protectedGet("Reports", "List low-stock spareparts"),
    "/customer/service-history": protectedGet(
      "Customer",
      "List customer service history"
    ),
    "/customer/invoices": protectedGet("Customer", "List customer invoices"),
    "/customer/invoices/{id}": protectedGet(
      "Customer",
      "Get customer invoice detail"
    ),
    "/customers": masterCollectionEndpoint("Master Data", "Manage customers"),
    "/customers/{id}": masterDetailEndpoint("Master Data", "Manage customer detail"),
    "/vehicles": masterCollectionEndpoint("Master Data", "Manage vehicles"),
    "/vehicles/{id}": masterDetailEndpoint("Master Data", "Manage vehicle detail"),
    "/service-categories": masterCollectionEndpoint(
      "Master Data",
      "Manage service categories"
    ),
    "/service-categories/{id}": masterMutationEndpoint(
      "Master Data",
      "Manage service category detail"
    ),
    "/service-catalogs": masterCollectionEndpoint(
      "Master Data",
      "Manage service catalogs"
    ),
    "/service-catalogs/{id}": masterDetailEndpoint(
      "Master Data",
      "Manage service catalog detail"
    ),
    "/sparepart-categories": masterCollectionEndpoint(
      "Master Data",
      "Manage sparepart categories"
    ),
    "/sparepart-categories/{id}": masterMutationEndpoint(
      "Master Data",
      "Manage sparepart category detail"
    ),
    "/spareparts": masterCollectionEndpoint("Master Data", "Manage spareparts"),
    "/spareparts/low-stock": protectedGet(
      "Inventory",
      "List low-stock spareparts"
    ),
    "/spareparts/{id}": masterDetailEndpoint(
      "Master Data",
      "Manage sparepart detail"
    ),
    "/spareparts/{id}/stock-adjustment": {
      post: {
        ...protectedOperation("Inventory", "Create stock adjustment"),
        requestBody: jsonBody("StockAdjustmentRequest"),
      },
    },
    "/spareparts/{id}/stock-movements": protectedGet(
      "Inventory",
      "List stock movements by sparepart"
    ),
    "/stock-movements": protectedGet(
      "Inventory",
      "List stock movements"
    ),
    "/invoices": {
      get: {
        ...protectedOperation("Invoice", "List invoices"),
        parameters: [
          queryParam("search"),
          queryParam("status"),
          queryParam("page", "integer"),
          queryParam("limit", "integer"),
        ],
      },
      post: {
        ...protectedOperation("Invoice", "Create invoice from service order"),
        requestBody: jsonBody("InvoiceRequest"),
      },
    },
    "/invoices/{id}": {
      get: protectedOperation("Invoice", "Get invoice detail"),
      patch: {
        ...protectedOperation("Invoice", "Update invoice"),
        requestBody: jsonBody("InvoiceUpdateRequest"),
      },
    },
    "/invoices/{id}/generate-pdf": {
      post: protectedOperation("Invoice", "Generate placeholder invoice PDF"),
    },
    "/payments": {
      get: {
        ...protectedOperation("Payment", "List payments"),
        parameters: [
          queryParam("invoiceId"),
          queryParam("status"),
          queryParam("method"),
          queryParam("page", "integer"),
          queryParam("limit", "integer"),
        ],
      },
      post: {
        ...protectedOperation("Payment", "Create payment"),
        requestBody: jsonBody("PaymentRequest"),
      },
    },
    "/payments/{id}": {
      get: protectedOperation("Payment", "Get payment detail"),
      patch: {
        ...protectedOperation("Payment", "Update payment"),
        requestBody: jsonBody("PaymentRequest"),
      },
    },
    "/admin/dashboard/summary": protectedGet(
      "Admin Dashboard",
      "Admin dashboard summary"
    ),
    "/admin/dashboard/today-bookings": protectedGet(
      "Admin Dashboard",
      "Today bookings"
    ),
    "/admin/dashboard/active-service-orders": protectedGet(
      "Admin Dashboard",
      "Active service orders"
    ),
    "/admin/dashboard/low-stock": protectedGet(
      "Admin Dashboard",
      "Low stock spareparts"
    ),
    "/admin/dashboard/revenue-chart": protectedGet(
      "Admin Dashboard",
      "Revenue chart"
    ),
  },
};

function jsonBody(schemaName) {
  return {
    required: true,
    content: {
      "application/json": {
        schema: { $ref: `#/components/schemas/${schemaName}` },
      },
    },
  };
}

function protectedOperation(tag, summary) {
  return {
    tags: [tag],
    summary,
    security: [{ bearerAuth: [] }],
    responses: {
      200: { description: "Success" },
      401: { description: "Unauthorized" },
      403: { description: "Forbidden" },
    },
  };
}

function protectedGet(tag, summary) {
  return { get: protectedOperation(tag, summary) };
}

function listEndpoint(tag, summary) {
  return {
    get: {
      tags: [tag],
      summary,
      parameters: [
        queryParam("search"),
        queryParam("categoryId"),
        queryParam("vehicleType"),
        queryParam("brand"),
        queryParam("page", "integer"),
        queryParam("limit", "integer"),
      ],
      responses: { 200: { description: "Success" } },
    },
  };
}

function detailEndpoint(tag, summary) {
  return {
    get: {
      tags: [tag],
      summary,
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: { 200: { description: "Success" }, 404: { description: "Not found" } },
    },
  };
}

function queryParam(name, type = "string") {
  return {
    name,
    in: "query",
    required: false,
    schema: { type },
  };
}

function masterCollectionEndpoint(tag, summary) {
  return {
    get: {
      ...protectedOperation(tag, `List ${summary.toLowerCase()}`),
      parameters: [queryParam("search"), queryParam("page", "integer"), queryParam("limit", "integer")],
    },
    post: protectedOperation(tag, `Create ${summary.toLowerCase()}`),
  };
}

function masterDetailEndpoint(tag, summary) {
  return {
    get: protectedOperation(tag, `Get ${summary.toLowerCase()}`),
    patch: protectedOperation(tag, `Update ${summary.toLowerCase()}`),
    delete: protectedOperation(tag, `Delete ${summary.toLowerCase()}`),
  };
}

function masterMutationEndpoint(tag, summary) {
  return {
    patch: protectedOperation(tag, `Update ${summary.toLowerCase()}`),
    delete: protectedOperation(tag, `Delete ${summary.toLowerCase()}`),
  };
}

module.exports = { openApiSpec };

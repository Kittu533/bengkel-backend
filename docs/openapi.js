const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "BengkelPro API",
    version: "0.8.0",
    description:
      "API contract untuk auth, public catalog, customer area, booking service, dan admin dashboard.",
  },
  servers: [{ url: "/api", description: "Current API host" }],
  tags: [
    { name: "Health" },
    { name: "Auth" },
    { name: "Public Catalog" },
    { name: "Customer" },
    { name: "Booking" },
    { name: "Admin Dashboard" },
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
    "/spareparts/{id}": masterDetailEndpoint(
      "Master Data",
      "Manage sparepart detail"
    ),
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

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceBookingRequestSchema = exports.BookingRequestSchema = void 0;
const zod_1 = require("zod");
// Schema for Item Booking
exports.BookingRequestSchema = zod_1.z.object({
    itemId: zod_1.z.string().min(1, "Item ID is required"),
    startDate: zod_1.z.string().datetime(), // ISO 8601 strings
    endDate: zod_1.z.string().datetime(),
});
// Schema for Service Booking
exports.ServiceBookingRequestSchema = zod_1.z.object({
    serviceId: zod_1.z.string().min(1, "Service ID is required"),
    scheduledAt: zod_1.z.string().datetime(),
    durationHours: zod_1.z.number().positive("Duration must be positive"),
    address: zod_1.z.object({
        line1: zod_1.z.string().min(1),
        line2: zod_1.z.string().optional(),
        city: zod_1.z.string().min(1),
        state: zod_1.z.string().min(1),
        pincode: zod_1.z.string().min(6).max(6)
    })
});
//# sourceMappingURL=booking.js.map
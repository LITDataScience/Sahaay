import { z } from "zod";

// Schema for Item Booking
export const BookingRequestSchema = z.object({
    itemId: z.string().min(1, "Item ID is required"),
    startDate: z.string().datetime(), // ISO 8601 strings
    endDate: z.string().datetime(),
});

export type BookingRequest = z.infer<typeof BookingRequestSchema>;

// Schema for Service Booking
export const ServiceBookingRequestSchema = z.object({
    serviceId: z.string().min(1, "Service ID is required"),
    scheduledAt: z.string().datetime(),
    durationHours: z.number().positive("Duration must be positive"),
    address: z.object({
        line1: z.string().min(1),
        line2: z.string().optional(),
        city: z.string().min(1),
        state: z.string().min(1),
        pincode: z.string().min(6).max(6)
    })
});

export type ServiceBookingRequest = z.infer<typeof ServiceBookingRequestSchema>;

import { z } from 'zod';

export const ListingLocationSchema = z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    locality: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
});

export const CreateListingSchema = z.object({
    title: z.string().min(3).max(80),
    description: z.string().min(20).max(1200),
    category: z.string().min(1).max(50),
    condition: z.enum(['new', 'excellent', 'good', 'fair']),
    images: z.array(z.string().url()).min(1).max(6),
    pricePerDay: z.number().positive(),
    deposit: z.number().min(0),
    radiusKm: z.number().min(1).max(50),
    payoutMethod: z.enum(['upi', 'bank']),
    location: ListingLocationSchema,
});

export const SearchListingsSchema = z.object({
    query: z.string().default(''),
    category: z.string().default('All'),
    budgetMax: z.number().min(0).optional(),
    depositMax: z.number().min(0).optional(),
    desiredStartDate: z.string().datetime().optional(),
    desiredEndDate: z.string().datetime().optional(),
    sortIntent: z.enum(['balanced', 'nearest', 'best_value']).default('balanced'),
    trustPreference: z.enum(['balanced', 'most_trusted']).default('balanced'),
    naturalLanguageIntent: z.string().max(240).optional(),
    userLat: z.number().min(-90).max(90).optional(),
    userLng: z.number().min(-180).max(180).optional(),
    limit: z.number().int().min(1).max(50).default(24),
});

export const AnalyzeListingDraftSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    condition: z.enum(['new', 'excellent', 'good', 'fair']).optional(),
    images: z.array(z.string()).optional(),
    pricePerDay: z.number().min(0).optional(),
    deposit: z.number().min(0).optional(),
    radiusKm: z.number().min(1).max(50).optional(),
    payoutMethod: z.enum(['upi', 'bank']).optional(),
    location: ListingLocationSchema.partial().optional(),
});

export type CreateListingInput = z.infer<typeof CreateListingSchema>;
export type SearchListingsInput = z.infer<typeof SearchListingsSchema>;
export type AnalyzeListingDraftInput = z.infer<typeof AnalyzeListingDraftSchema>;

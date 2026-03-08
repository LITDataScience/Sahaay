import { z } from 'zod';

export const MarketplaceEventSchema = z.object({
    name: z.string().min(1).max(80),
    entityId: z.string().max(120).optional(),
    entityType: z.string().max(60).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    occurredAt: z.number().int().optional(),
});

export type MarketplaceEventInput = z.infer<typeof MarketplaceEventSchema>;

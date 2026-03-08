import { z } from 'zod';

export const SubmitVerificationSchema = z.object({
    method: z.enum(['digilocker', 'pan']),
    livenessConfidence: z.number().min(0).max(1),
    notes: z.string().max(500).optional(),
});

export const ReviewVerificationSchema = z.object({
    userId: z.string().min(1),
    decision: z.enum(['approved', 'rejected', 'needs_resubmission']),
    reviewNote: z.string().min(3).max(500),
});

export type SubmitVerificationInput = z.infer<typeof SubmitVerificationSchema>;
export type ReviewVerificationInput = z.infer<typeof ReviewVerificationSchema>;

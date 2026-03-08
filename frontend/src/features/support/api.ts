import { useMutation, useQuery } from '@tanstack/react-query';
import functions from '@react-native-firebase/functions';

export async function askSupportCopilot(question: string) {
    const callable = functions().httpsCallable('tRPC');
    const response = await callable({
        path: 'askSupportCopilot',
        input: { question },
    });

    return response.data as { answer: string; citations: string[] };
}

export async function getOpsCopilotSummary() {
    const callable = functions().httpsCallable('tRPC');
    const response = await callable({
        path: 'getOpsCopilotSummary',
        input: {},
    });

    return response.data as {
        summary: string;
        metrics: Record<string, number>;
    };
}

export async function getVerificationReviewQueue(limit = 25) {
    const callable = functions().httpsCallable('tRPC');
    const response = await callable({
        path: 'getVerificationReviewQueue',
        input: { limit },
    });

    return response.data as {
        items: {
            userId: string;
            name: string;
            phone: string;
            method: 'digilocker' | 'pan' | null;
            status: 'submitted' | 'under_review' | 'needs_resubmission' | 'approved' | 'rejected' | 'not_started';
            reviewNote: string;
            submittedAt: number | null;
            reviewedAt: number | null;
            livenessConfidence: number | null;
        }[];
    };
}

export async function reviewVerificationCase(input: {
    userId: string;
    decision: 'approved' | 'rejected' | 'needs_resubmission';
    reviewNote: string;
}) {
    const callable = functions().httpsCallable('tRPC');
    const response = await callable({
        path: 'reviewVerification',
        input,
    });

    return response.data as {
        status: string;
        isVerified: boolean;
        reviewNote: string;
    };
}

export const useAskSupportCopilot = () =>
    useMutation({
        mutationFn: askSupportCopilot,
    });

export const useReviewVerificationCase = () =>
    useMutation({
        mutationFn: reviewVerificationCase,
    });

export const useOpsCopilotSummary = (enabled = false) =>
    useQuery({
        queryKey: ['ops-copilot-summary'],
        queryFn: getOpsCopilotSummary,
        enabled,
        staleTime: 1000 * 60,
    });

export const useVerificationReviewQueue = (enabled = false, limit = 25) =>
    useQuery({
        queryKey: ['verification-review-queue', limit],
        queryFn: () => getVerificationReviewQueue(limit),
        enabled,
        staleTime: 1000 * 20,
    });

import * as admin from 'firebase-admin';
import * as path from 'path';
import { promises as fs } from 'fs';
import { AIProviderService } from './AIProviderService';

type SupportAnswer = {
    answer: string;
    citations: string[];
};

export class RagService {
    private readonly db = admin.firestore();

    async answerSupportQuestion(question: string): Promise<SupportAnswer> {
        const corpus = await this.loadDocs();
        const ranked = rankDocs(question, corpus).slice(0, 4);
        const context = ranked.map((doc) => `Source: ${doc.path}\n${doc.content.slice(0, 1600)}`).join('\n\n---\n\n');
        const fallback = `Based on the current Sahaay docs, here is the best grounded answer:\n\n${ranked.map((doc) => `- ${doc.path}`).join('\n')}`;
        const answer = await AIProviderService.generateText(
            `Answer the support question using only the supplied Sahaay context.\nQuestion: ${question}\n\nContext:\n${context}`,
            fallback
        );

        return {
            answer,
            citations: ranked.map((doc) => doc.path),
        };
    }

    async buildOpsSummary() {
        const [flaggedItems, pendingVerifications, pendingBookings, processingPayments] = await Promise.all([
            this.countWhere('items', 'status', '==', 'flagged_by_ai'),
            this.countWhere('users', 'verificationStatus', 'in', ['submitted', 'under_review']),
            this.countWhere('bookings', 'status', '==', 'awaiting_payment'),
            this.countWhere('payments', 'status', '==', 'awaiting_payment'),
        ]);

        const fallback = [
            `Flagged listings awaiting review: ${flaggedItems}`,
            `Verification cases awaiting action: ${pendingVerifications}`,
            `Bookings awaiting payment progression: ${pendingBookings}`,
            `Payments still processing: ${processingPayments}`,
        ].join('\n');

        const summary = await AIProviderService.generateText(
            `Summarize this Sahaay ops snapshot in a concise executive style.\n${fallback}`,
            fallback
        );

        return {
            summary,
            metrics: {
                flaggedItems,
                pendingVerifications,
                pendingBookings,
                processingPayments,
            },
        };
    }

    private async loadDocs() {
        const candidates = [
            path.resolve(__dirname, '../../../../docs/README.md'),
            path.resolve(__dirname, '../../../../docs/ARCHITECTURE.md'),
            path.resolve(__dirname, '../../../../docs/API_SPEC.md'),
        ];

        const docs = await Promise.all(candidates.map(async (docPath) => {
            try {
                const content = await fs.readFile(docPath, 'utf8');
                return { path: path.basename(docPath), content };
            } catch {
                return null;
            }
        }));

        return docs.filter(Boolean) as Array<{ path: string; content: string }>;
    }

    private async countWhere(collection: string, field: string, operator: FirebaseFirestore.WhereFilterOp, value: any) {
        const snapshot = await this.db.collection(collection).where(field, operator, value).count().get();
        return snapshot.data().count;
    }
}

function rankDocs(question: string, docs: Array<{ path: string; content: string }>) {
    const tokens = question.toLowerCase().split(/\s+/).filter(Boolean);
    return docs
        .map((doc) => ({
            ...doc,
            score: tokens.reduce((score, token) => score + (doc.content.toLowerCase().includes(token) ? 1 : 0), 0),
        }))
        .sort((left, right) => right.score - left.score);
}

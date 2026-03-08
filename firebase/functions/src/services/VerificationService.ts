import * as admin from 'firebase-admin';

export type VerificationStatus =
    | 'not_started'
    | 'submitted'
    | 'under_review'
    | 'approved'
    | 'rejected'
    | 'needs_resubmission';

export type VerificationMethod = 'digilocker' | 'pan';

export type VerificationSubmissionInput = {
    method: VerificationMethod;
    livenessConfidence: number;
    notes?: string;
};

export type VerificationQueueItem = {
    userId: string;
    name: string;
    phone: string;
    method: VerificationMethod | null;
    status: VerificationStatus;
    reviewNote: string;
    submittedAt: number | null;
    reviewedAt: number | null;
    livenessConfidence: number | null;
};

export class VerificationService {
    private readonly db = admin.firestore();

    async submitVerification(userId: string, input: VerificationSubmissionInput) {
        const submissionRef = this.db.collection('verification_submissions').doc(userId);
        const userRef = this.db.collection('users').doc(userId);

        const payload = {
            userId,
            method: input.method,
            status: 'submitted' as VerificationStatus,
            livenessConfidence: input.livenessConfidence,
            notes: input.notes || '',
            submittedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        await Promise.all([
            submissionRef.set(payload, { merge: true }),
            userRef.set({
                verificationStatus: 'submitted',
                verificationMethod: input.method,
                kycStatus: 'pending',
                isVerified: false,
                verificationReviewNote: '',
                verificationSubmittedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true }),
        ]);

        return {
            status: 'submitted' as VerificationStatus,
            method: input.method,
            submittedAt: Date.now(),
        };
    }

    async getVerificationStatus(userId: string) {
        const [userSnap, submissionSnap] = await Promise.all([
            this.db.collection('users').doc(userId).get(),
            this.db.collection('verification_submissions').doc(userId).get(),
        ]);

        const userData = userSnap.data() || {};
        const submissionData = submissionSnap.data() || {};

        return {
            status: (userData.verificationStatus || submissionData.status || 'not_started') as VerificationStatus,
            method: (userData.verificationMethod || submissionData.method || null) as VerificationMethod | null,
            isVerified: userData.isVerified === true,
            kycStatus: (userData.kycStatus || 'pending') as 'pending' | 'verified' | 'failed',
            reviewNote: String(userData.verificationReviewNote || ''),
            submittedAt: toMillis(userData.verificationSubmittedAt || submissionData.submittedAt),
            reviewedAt: toMillis(userData.verificationReviewedAt),
        };
    }

    async listVerificationQueue(limit = 25): Promise<VerificationQueueItem[]> {
        const userSnapshot = await this.db
            .collection('users')
            .where('verificationStatus', 'in', ['submitted', 'under_review', 'needs_resubmission'])
            .limit(limit)
            .get();

        const submissionIds = userSnapshot.docs.map((doc) => doc.id);
        const submissionMap = new Map<string, FirebaseFirestore.DocumentData>();

        if (submissionIds.length > 0) {
            const submissionReads = await Promise.all(
                submissionIds.map((userId) => this.db.collection('verification_submissions').doc(userId).get())
            );
            submissionReads.forEach((snap) => {
                if (snap.exists) {
                    submissionMap.set(snap.id, snap.data() || {});
                }
            });
        }

        return userSnapshot.docs
            .map((doc) => {
                const userData = doc.data() || {};
                const submissionData = submissionMap.get(doc.id) || {};

                return {
                    userId: doc.id,
                    name: String(userData.name || 'Unknown user'),
                    phone: String(userData.phone || ''),
                    method: (userData.verificationMethod || submissionData.method || null) as VerificationMethod | null,
                    status: (userData.verificationStatus || submissionData.status || 'submitted') as VerificationStatus,
                    reviewNote: String(userData.verificationReviewNote || submissionData.reviewNote || ''),
                    submittedAt: toMillis(userData.verificationSubmittedAt || submissionData.submittedAt),
                    reviewedAt: toMillis(userData.verificationReviewedAt || submissionData.reviewedAt),
                    livenessConfidence: typeof submissionData.livenessConfidence === 'number'
                        ? submissionData.livenessConfidence
                        : null,
                };
            })
            .sort((left, right) => (right.submittedAt || 0) - (left.submittedAt || 0));
    }

    async reviewVerification(
        reviewerId: string,
        userId: string,
        decision: 'approved' | 'rejected' | 'needs_resubmission',
        reviewNote: string
    ) {
        const submissionRef = this.db.collection('verification_submissions').doc(userId);
        const userRef = this.db.collection('users').doc(userId);
        const isApproved = decision === 'approved';

        await Promise.all([
            submissionRef.set({
                status: decision,
                reviewNote,
                reviewedBy: reviewerId,
                reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true }),
            userRef.set({
                verificationStatus: decision,
                verificationReviewNote: reviewNote,
                verificationReviewedAt: admin.firestore.FieldValue.serverTimestamp(),
                isVerified: isApproved,
                kycStatus: isApproved ? 'verified' : 'failed',
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true }),
        ]);

        return {
            status: decision,
            isVerified: isApproved,
            reviewNote,
        };
    }
}

function toMillis(value: any) {
    return typeof value?.toMillis === 'function' ? value.toMillis() : null;
}

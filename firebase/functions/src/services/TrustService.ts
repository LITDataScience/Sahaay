import * as admin from 'firebase-admin';

export type TrustedUserProfile = {
    name?: string;
    phone?: string;
    isVerified?: boolean;
    kycStatus?: 'pending' | 'verified' | 'failed';
    verificationStatus?: 'not_started' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'needs_resubmission';
    beneficiaryId?: string | null;
    reputationScore?: number;
};

export class TrustService {
    private readonly db = admin.firestore();

    async assertPayoutEligibleUser(userId: string): Promise<TrustedUserProfile> {
        const userSnap = await this.db.collection('users').doc(userId).get();

        if (!userSnap.exists) {
            throw new Error('Complete secure phone sign-in before using listings or bookings.');
        }

        const userData = userSnap.data() as TrustedUserProfile | undefined;

        if (
            !userData ||
            userData.isVerified !== true ||
            userData.kycStatus !== 'verified' ||
            userData.verificationStatus !== 'approved'
        ) {
            throw new Error('Complete KYC verification before publishing listings or booking items.');
        }

        return userData;
    }
}

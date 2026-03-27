// SPDX-Header-Start
// SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
// © 2026 Sahaay Technologies Pvt. Ltd. All rights reserved.
// SPDX-Header-End

import functions from '@react-native-firebase/functions';

export type PaymentStatus = 'processing' | 'success' | 'failed' | 'timeout';

export const PaymentPollingService = {
    /**
     * Exponential Backoff Poller for Server-to-Server (S2S) Webhook Confirmation.
     *
     * WHY THIS IS CRITICAL IN INDIA:
     * Fraudsters use Xposed/Frida frameworks to intercept the Android `Intent` return data
     * from UPI apps (GPay, PhonePe) and force the client to read a falsified "SUCCESS".
     * We NEVER trust the client callback. We mathematically await the S2S Webhook.
     *
     * @param bookingId The ID of the transaction to verify
     * @param maxAttempts Maximum polling attempts before timing out
     * @param baseDelayMs Starting delay in milliseconds
     */
    async awaitS2SPaymentConfirmation(
        bookingId: string,
        maxAttempts = 7, // 7 attempts with exponentiation is roughly 30-40 seconds
        baseDelayMs = 1000
    ): Promise<PaymentStatus> {
        console.log(`[Zero-Trust] Initiating S2S Webhook Poll for Booking: ${bookingId}`);

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                console.log(`[Poll Attempt ${attempt}/${maxAttempts}] Querying Backend booking status...`);
                const status = await this.fetchBackendStatus(bookingId);

                if (status === 'success' || status === 'failed') {
                    console.log(`[Zero-Trust] Definitive Payment State Received: ${status.toUpperCase()}`);
                    return status;
                }

                // If 'processing', we wait and exponentially back off
                const delay = baseDelayMs * Math.pow(1.5, attempt - 1);
                console.log(`[Poll Status: PROCESSING] Backing off for ${Math.round(delay)}ms...`);
                await this.wait(delay);

            } catch (error) {
                console.error(`[Poll Error]:`, error);
                // Continue polling despite network errors, rely on attempt exhaustion
            }
        }

        console.warn(`[Zero-Trust] Polling TIMEOUT for Booking: ${bookingId}. Assuming intervention required.`);
        return 'timeout';
    },

    /**
     * Real HTTP Callable that represents our Node.js Backend reading the database
     * state which is mutated exclusively by Razorpay/Cashfree Webhooks.
     */
    async fetchBackendStatus(bookingId: string): Promise<PaymentStatus> {
        try {
            const response = await functions().httpsCallable('tRPC')({
                path: 'paymentStatus',
                input: { bookingId }
            });
            const data = response.data as any;
            return data.status || 'processing';
        } catch (e) {
            console.error('tRPC paymentStatus error:', e);
            return 'processing';
        }
    },

    wait(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
};

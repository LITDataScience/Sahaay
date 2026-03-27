import { afterEach, describe, it, expect } from 'vitest';
import { appRouter } from '../router/index';

const originalAppCheckEnforcement = process.env.APP_CHECK_ENFORCEMENT;

afterEach(() => {
    if (originalAppCheckEnforcement === undefined) {
        delete process.env.APP_CHECK_ENFORCEMENT;
        return;
    }

    process.env.APP_CHECK_ENFORCEMENT = originalAppCheckEnforcement;
});

describe('tRPC Router', () => {
    it('should return health check', async () => {
        const caller = appRouter.createCaller({ app: 'mock-app-check' });
        const result = await caller.health();
        expect(result).toBe('Sahaay Engine is alive 🚀');
    });

    it('should fail initiateBooking without auth', async () => {
        const caller = appRouter.createCaller({ app: 'mock-app-check' });
        
        await expect(caller.initiateBooking({
            itemId: '123',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 86400000).toISOString()
        })).rejects.toThrow('User must be authenticated.');
    });

    it('should allow missing AppCheck when enforcement is optional', async () => {
        const caller = appRouter.createCaller({ auth: { uid: 'user_1', token: 'mock' } });

        await expect(caller.health()).resolves.toBe('Sahaay Engine is alive 🚀');
    });

    it('should fail if AppCheck is missing when enforcement is required', async () => {
        process.env.APP_CHECK_ENFORCEMENT = 'required';

        const caller = appRouter.createCaller({ auth: { uid: 'user_1', token: 'mock' } });

        await expect(caller.health()).rejects.toThrow('Suspicious origin. AppCheck missing.');
    });
});

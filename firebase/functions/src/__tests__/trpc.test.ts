import { describe, it, expect } from 'vitest';
import { appRouter } from '../router/index';

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

    it('should fail if AppCheck is missing', async () => {
        const caller = appRouter.createCaller({ auth: { uid: 'user_1', token: 'mock' } });
        
        await expect(caller.health()).rejects.toThrow('Suspicious origin. AppCheck missing.');
    });
});

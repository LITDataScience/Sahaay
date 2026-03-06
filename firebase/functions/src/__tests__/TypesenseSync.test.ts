import { describe, it, expect, vi } from 'vitest';
import { TypesenseSync } from '../services/TypesenseSync';

vi.mock('../services/TypesenseSync', () => {
    return {
        TypesenseSync: {
            handleItemWrite: vi.fn().mockResolvedValue(true)
        }
    };
});

describe('TypesenseSync', () => {
    it('should handle item write events', async () => {
        const mockEvent = {
            data: {
                before: { exists: false, data: () => null },
                after: { exists: true, data: () => ({ title: 'Test Item' }) }
            }
        } as any;

        await TypesenseSync.handleItemWrite(mockEvent);
        expect(TypesenseSync.handleItemWrite).toHaveBeenCalledWith(mockEvent);
    });
});

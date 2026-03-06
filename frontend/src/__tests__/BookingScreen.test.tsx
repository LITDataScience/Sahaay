import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import BookingScreen from '../../app/booking';
import { useAuth } from '../context/AuthContext';
import { useMachine } from '@xstate/react';

// Mock dependencies
jest.mock('expo-router', () => ({
    useLocalSearchParams: () => ({ itemData: JSON.stringify({ title: 'Test Drill', price: 500, deposit: 2000, lenderId: 'lender_1' }) }),
    useRouter: () => ({ replace: jest.fn(), back: jest.fn() }),
}));

jest.mock('../context/AuthContext', () => ({
    useAuth: jest.fn(),
}));

jest.mock('@xstate/react', () => ({
    useMachine: jest.fn(),
}));

jest.mock('../services/PaymentPollingService', () => ({
    PaymentPollingService: {
        awaitS2SPaymentConfirmation: jest.fn(),
    }
}));

describe('BookingScreen', () => {
    beforeEach(() => {
        (useAuth as jest.Mock).mockReturnValue({ user: { id: 'borrower_1' } });
        (useMachine as jest.Mock).mockReturnValue([{ matches: () => false }, jest.fn()]);
    });

    it('renders the item details correctly', () => {
        const { getByText } = render(<BookingScreen />);
        expect(getByText('Test Drill')).toBeTruthy();
        expect(getByText('Daily Rate: ₹500')).toBeTruthy();
        expect(getByText('Security Deposit: ₹2000')).toBeTruthy();
    });

    it('handles confirm booking button press', async () => {
        const mockSend = jest.fn();
        (useMachine as jest.Mock).mockReturnValue([{ matches: () => false }, mockSend]);

        const { getByText } = render(<BookingScreen />);
        
        fireEvent.press(getByText('Confirm Booking & Pay'));
        
        expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
            type: 'INITIATE_BOOKING',
            lenderId: 'lender_1',
            amount: 500,
        }));
    });
});

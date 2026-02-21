import { appSchema, tableSchema } from '@nozbe/watermelondb'

export const mySchema = appSchema({
    version: 1,
    tables: [
        tableSchema({
            name: 'items',
            columns: [
                { name: 'title', type: 'string' },
                { name: 'description', type: 'string', isOptional: true },
                { name: 'price_per_day', type: 'number' },
                { name: 'deposit', type: 'number' },
                { name: 'category', type: 'string' },
                { name: 'image', type: 'string', isOptional: true },
                { name: 'owner_id', type: 'string' },
                { name: 'status', type: 'string' },
                { name: 'created_at', type: 'number' },
            ]
        }),
        tableSchema({
            name: 'bookings',
            columns: [
                { name: 'item_id', type: 'string', isIndexed: true },
                { name: 'renter_id', type: 'string' },
                { name: 'start_date', type: 'number' },
                { name: 'end_date', type: 'number' },
                { name: 'status', type: 'string' },
                { name: 'created_at', type: 'number' },
            ]
        }),
        tableSchema({
            name: 'users',
            columns: [
                { name: 'email', type: 'string' },
                { name: 'role', type: 'string' },
                { name: 'reputation_score', type: 'number' },
            ]
        }),
    ]
})

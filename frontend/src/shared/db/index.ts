import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { mySchema } from './schema';
import { Item, Booking, User } from './models'; // We will create these next

const adapter = new SQLiteAdapter({
    schema: mySchema,
    // (You might want to pass migrations here if you have them)
    // migrations,
    jsi: true, // JSI (JavaScript Interface) for faster SQLite operations
    onSetUpError: error => {
        // Database failed to load -- offer the user to reload the app or log out
        console.error("WatermelonDB Setup Error", error);
    }
});

export const database = new Database({
    adapter,
    modelClasses: [
        Item,
        Booking,
        User,
    ],
});

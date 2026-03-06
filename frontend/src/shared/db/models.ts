import { Model } from '@nozbe/watermelondb';
import { field, text, date } from '@nozbe/watermelondb/decorators';

export class Item extends Model {
    static table = 'items';

    @text('title') title!: string;
    @text('description') description?: string;
    @field('price_per_day') pricePerDay!: number;
    @field('deposit') deposit!: number;
    @text('category') category!: string;
    @text('image') image?: string;
    @text('owner_id') ownerId!: string;
    @text('status') status!: string;
    @date('created_at') createdAt!: number;
}

export class Booking extends Model {
    static table = 'bookings';

    @text('item_id') itemId!: string;
    @text('renter_id') renterId!: string;
    @date('start_date') startDate!: number;
    @date('end_date') endDate!: number;
    @text('status') status!: string;
    @date('created_at') createdAt!: number;
}

export class User extends Model {
    static table = 'users';

    @text('email') email!: string;
    @text('role') role!: string;
    @field('reputation_score') reputationScore!: number;
}

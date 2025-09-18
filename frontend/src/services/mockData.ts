// SPDX-Header-Start
// SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
// © 2025 Sahaay Technologies Pvt. Ltd. All rights reserved.
// SPDX-Header-End

import { Item } from '../components/ItemCard';

export const categories = ['All', 'Electronics', 'Tools', 'Appliances', 'Fashion', 'Sports'];

export const items: Item[] = [
	{ id: '1', title: 'Professional Camera', price: 500, deposit: 5000, image: 'https://images.unsplash.com/photo-1519183071298-a2962be96f83?q=80&w=800&auto=format&fit=crop', owner: 'Rahul Sharma', distance: '2.3 km' },
	{ id: '2', title: 'Gaming Laptop', price: 800, deposit: 8000, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800&auto=format&fit=crop', owner: 'Priya Patel', distance: '1.8 km' },
	{ id: '3', title: 'Power Drill Set', price: 300, deposit: 2000, image: 'https://images.unsplash.com/photo-1504148455329-4ff0802cfb7e?q=80&w=800&auto=format&fit=crop', owner: 'Amit Kumar', distance: '3.1 km' },
	{ id: '4', title: 'Wrist Watch', price: 120, deposit: 900, image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6b?q=80&w=800&auto=format&fit=crop', owner: 'Neha Gupta', distance: '0.9 km' },
	{ id: '5', title: 'Soccer Ball', price: 80, deposit: 300, image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800&auto=format&fit=crop', owner: 'Vikas Yadav', distance: '1.2 km' },
];

export const searchItems = (query: string, category: string): Item[] => {
	const q = query.trim().toLowerCase();
	return items.filter((item) => {
		const matchesQuery = !q || item.title.toLowerCase().includes(q) || item.owner.toLowerCase().includes(q);
		const matchesCategory = category === 'All' || category === '' || item.title.toLowerCase().includes(category.toLowerCase());
		return matchesQuery && matchesCategory;
	});
};



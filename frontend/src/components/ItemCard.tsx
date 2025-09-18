// SPDX-Header-Start
// SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
// © 2025 Sahaay Technologies Pvt. Ltd. All rights reserved.
// SPDX-Header-End

import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type Item = {
	id: string;
	title: string;
	price: number;
	deposit: number;
	image: string;
	owner: string;
	distance: string;
};

type Props = {
	item: Item;
	onPress?: () => void;
};

const ItemCard: React.FC<Props> = ({ item, onPress }) => {
	return (
		<TouchableOpacity style={styles.itemCard} onPress={onPress}>
			<Image source={{ uri: item.image }} style={styles.itemImage} />
			<View style={styles.itemInfo}>
				<Text style={styles.itemTitle}>{item.title}</Text>
				<Text style={styles.itemPrice}>₹{item.price}/day</Text>
				<Text style={styles.itemDeposit}>Deposit: ₹{item.deposit}</Text>
				<View style={styles.row}>
					<Text style={styles.itemOwner}>{item.owner}</Text>
					<Text style={styles.itemDistance}>{item.distance}</Text>
				</View>
			</View>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	itemCard: {
		backgroundColor: '#fff',
		borderRadius: 10,
		marginBottom: 15,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 3.84,
		elevation: 5,
		flexDirection: 'row',
		overflow: 'hidden',
	},
	itemImage: {
		width: 100,
		height: 100,
		borderTopLeftRadius: 10,
		borderBottomLeftRadius: 10,
	},
	itemInfo: {
		flex: 1,
		padding: 15,
	},
	itemTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#333',
		marginBottom: 5,
	},
	itemPrice: {
		fontSize: 14,
		color: '#007AFF',
		fontWeight: '600',
		marginBottom: 3,
	},
	itemDeposit: {
		fontSize: 12,
		color: '#666',
		marginBottom: 6,
	},
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	itemOwner: {
		fontSize: 12,
		color: '#666',
	},
	itemDistance: {
		fontSize: 12,
		color: '#007AFF',
		fontWeight: '500',
	},
});

export default ItemCard;



// SPDX-Header-Start
// SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
// © 2025 Sahaay Technologies Pvt. Ltd. All rights reserved.
// SPDX-Header-End

import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MapPin, User } from 'lucide-react-native';
import Colors from '../../../constants/Colors';
import Theme from '../../../constants/Theme';

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
				<Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>

				<View style={styles.priceContainer}>
					<Text style={styles.itemPrice}>₹{item.price}</Text>
					<Text style={styles.perDay}>/day</Text>
				</View>

				<View style={styles.depositLabel}>
					<Text style={styles.depositText}>Deposit: ₹{item.deposit}</Text>
				</View>

				<View style={styles.divider} />

				<View style={styles.row}>
					<View style={styles.metaItem}>
						<User size={12} color={Colors.text.secondary} />
						<Text style={styles.metaText}>{item.owner}</Text>
					</View>
					<View style={styles.metaItem}>
						<MapPin size={12} color={Colors.text.secondary} />
						<Text style={styles.metaText}>{item.distance}</Text>
					</View>
				</View>
			</View>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	itemCard: {
		backgroundColor: Colors.surface,
		borderRadius: Theme.borderRadius.md,
		marginBottom: Theme.spacing.md,
		...Theme.shadows.small,
		flexDirection: 'row',
		overflow: 'hidden',
		borderWidth: 1,
		borderColor: Colors.border,
	},
	itemImage: {
		width: 120,
		height: 'auto',
		minHeight: 120,
	},
	itemInfo: {
		flex: 1,
		padding: Theme.spacing.md,
		justifyContent: 'space-between',
	},
	itemTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		color: Colors.text.primary,
		marginBottom: 4,
	},
	priceContainer: {
		flexDirection: 'row',
		alignItems: 'baseline',
		marginBottom: 4,
	},
	itemPrice: {
		fontSize: 18,
		color: Colors.primary, // Yellow accent
		fontWeight: 'bold',
	},
	perDay: {
		fontSize: 12,
		color: Colors.text.secondary,
		marginLeft: 2,
	},
	depositLabel: {
		backgroundColor: Colors.background,
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 4,
		alignSelf: 'flex-start',
		marginBottom: 8,
	},
	depositText: {
		fontSize: 10,
		color: Colors.text.secondary,
		fontWeight: '600',
	},
	divider: {
		height: 1,
		backgroundColor: Colors.border,
		marginVertical: 6,
	},
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	metaItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
	metaText: {
		fontSize: 12,
		color: Colors.text.secondary,
	},
});

export default ItemCard;



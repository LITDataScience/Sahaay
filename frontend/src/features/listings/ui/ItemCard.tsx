// SPDX-Header-Start
// SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
// © 2025 Sahaay Technologies Pvt. Ltd. All rights reserved.
// SPDX-Header-End

import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ArrowUpRight, MapPin, ShieldCheck, User } from 'lucide-react-native';
import { useAppTheme } from '../../../theme/provider';

export type Item = {
	id: string;
	title: string;
	price: number;
	deposit: number;
	image: string;
	owner: string;
	distance: string;
    locality?: string;
    radiusKm?: number;
};

type Props = {
	item: Item;
	onPress?: () => void;
};

const ItemCard: React.FC<Props> = ({ item, onPress }) => {
    const { theme } = useAppTheme();
    const styles = createStyles(theme);

	return (
		<TouchableOpacity style={styles.itemCard} onPress={onPress}>
			<Image source={{ uri: item.image }} style={styles.itemImage} />
            <View style={styles.imageBadge}>
                <ShieldCheck size={12} color={theme.colors.accentStrong} />
                <Text style={styles.imageBadgeText}>Verified</Text>
            </View>
			<View style={styles.itemInfo}>
				<Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.itemSubtext} numberOfLines={1}>
                    {item.locality ?? item.owner}
                </Text>

				<View style={styles.priceContainer}>
					<Text style={styles.itemPrice}>₹{item.price}</Text>
					<Text style={styles.perDay}>/day</Text>
				</View>

				<View style={styles.depositLabel}>
					<Text style={styles.depositText}>Deposit ₹{item.deposit}</Text>
				</View>

				<View style={styles.divider} />

				<View style={styles.row}>
					<View style={styles.metaItem}>
						<User size={12} color={theme.colors.textSecondary} />
						<Text style={styles.metaText}>{item.owner}</Text>
					</View>
					<View style={styles.metaItem}>
						<MapPin size={12} color={theme.colors.textSecondary} />
						<Text style={styles.metaText}>{item.distance}</Text>
					</View>
				</View>
                <View style={styles.ctaRow}>
                    <Text style={styles.ctaText}>See details</Text>
                    <ArrowUpRight size={14} color={theme.colors.accentStrong} />
                </View>
			</View>
		</TouchableOpacity>
	);
};

const createStyles = (theme: ReturnType<typeof useAppTheme>['theme']) => StyleSheet.create({
	itemCard: {
		backgroundColor: theme.colors.surface,
		borderRadius: theme.radius.lg,
		marginBottom: theme.spacing.md,
		...theme.shadows.soft,
		flexDirection: 'row',
		overflow: 'hidden',
		borderWidth: 1,
		borderColor: theme.colors.border,
        position: 'relative',
	},
	itemImage: {
		width: 120,
		height: 'auto',
		minHeight: 120,
	},
	itemInfo: {
		flex: 1,
		padding: theme.spacing.md,
		justifyContent: 'space-between',
	},
    imageBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: 'rgba(23, 20, 17, 0.82)',
    },
    imageBadgeText: {
        color: '#F8F3EB',
        fontSize: 11,
        fontWeight: '700',
    },
	itemTitle: {
		fontSize: 16,
		fontWeight: '700',
		color: theme.colors.textPrimary,
		marginBottom: 2,
	},
    itemSubtext: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginBottom: 8,
    },
	priceContainer: {
		flexDirection: 'row',
		alignItems: 'baseline',
		marginBottom: 4,
	},
	itemPrice: {
		fontSize: 20,
		color: theme.colors.accentStrong,
		fontWeight: '800',
	},
	perDay: {
		fontSize: 12,
		color: theme.colors.textSecondary,
		marginLeft: 2,
	},
	depositLabel: {
		backgroundColor: theme.colors.surfaceAlt,
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: theme.radius.pill,
		alignSelf: 'flex-start',
		marginBottom: 8,
	},
	depositText: {
		fontSize: 11,
		color: theme.colors.bhasm,
		fontWeight: '600',
	},
	divider: {
		height: 1,
		backgroundColor: theme.colors.border,
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
		color: theme.colors.textSecondary,
	},
    ctaRow: {
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 4,
    },
    ctaText: {
        color: theme.colors.accentStrong,
        fontSize: 12,
        fontWeight: '700',
    },
});

export default ItemCard;



// SPDX-Header-Start
// SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
// © 2025 Sahaay Technologies Pvt. Ltd. All rights reserved.
// SPDX-Header-End

import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '../../../theme/provider';

type Props = {
	categories: string[];
	selected?: string;
	onSelect?: (category: string) => void;
};

const CategoryChips: React.FC<Props> = ({ categories, selected, onSelect }) => {
    const { theme } = useAppTheme();
    const styles = createStyles(theme);

	return (
		<View style={styles.wrapper}>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.container}
			>
				{categories.map((c) => {
					const isActive = selected === c;
					return (
						<TouchableOpacity key={c} style={[styles.chip, isActive && styles.chipActive]} onPress={() => onSelect?.(c)}>
							<Text style={[styles.text, isActive && styles.textActive]}>{c}</Text>
						</TouchableOpacity>
					);
				})}
			</ScrollView>
		</View>
	);
};

const createStyles = (theme: ReturnType<typeof useAppTheme>['theme']) => StyleSheet.create({
	wrapper: {
		backgroundColor: 'transparent',
	},
	container: {
		paddingHorizontal: 0,
		paddingVertical: 4,
	},
	chip: {
		backgroundColor: theme.colors.surfaceElevated,
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderRadius: theme.radius.pill,
		marginRight: 10,
        borderWidth: 1,
        borderColor: theme.colors.border,
	},
	chipActive: {
		backgroundColor: theme.colors.accent,
        borderColor: theme.colors.accent,
	},
	text: {
		fontSize: 14,
		color: theme.colors.textPrimary,
        fontWeight: '600',
	},
	textActive: {
		color: '#181411',
		fontWeight: '600',
	},
});

export default CategoryChips;



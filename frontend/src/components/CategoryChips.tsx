// SPDX-Header-Start
// SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
// © 2025 Sahaay Technologies Pvt. Ltd. All rights reserved.
// SPDX-Header-End

import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
	categories: string[];
	selected?: string;
	onSelect?: (category: string) => void;
};

const CategoryChips: React.FC<Props> = ({ categories, selected, onSelect }) => {
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

const styles = StyleSheet.create({
	wrapper: {
		backgroundColor: '#fff',
	},
	container: {
		paddingHorizontal: 15,
		paddingVertical: 10,
	},
	chip: {
		backgroundColor: '#f0f0f0',
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 18,
		marginRight: 10,
	},
	chipActive: {
		backgroundColor: '#007AFF',
	},
	text: {
		fontSize: 14,
		color: '#333',
	},
	textActive: {
		color: '#fff',
		fontWeight: '600',
	},
});

export default CategoryChips;



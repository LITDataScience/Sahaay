// SPDX-Header-Start
// SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
// © 2025 Sahaay Technologies Pvt. Ltd. All rights reserved.
// SPDX-Header-End

import React, { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';

type Props = {
	placeholder?: string;
	value?: string;
	onChangeText?: (text: string) => void;
};

const SearchBar: React.FC<Props> = ({ placeholder = 'Search items, categories, users…', value, onChangeText }) => {
	const [internal, setInternal] = useState('');
	const text = value !== undefined ? value : internal;
	const setText = (t: string) => {
		setInternal(t);
		onChangeText?.(t);
	};
	return (
		<View style={styles.container}>
			<TextInput
				value={text}
				style={styles.input}
				placeholder={placeholder}
				returnKeyType="search"
				onChangeText={setText}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		backgroundColor: '#fff',
		borderRadius: 10,
		paddingHorizontal: 12,
		paddingVertical: 10,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.08,
		shadowRadius: 2,
		elevation: 2,
	},
	input: {
		fontSize: 16,
	},
});

export default SearchBar;



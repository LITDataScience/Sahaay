import React, { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Search } from 'lucide-react-native';
import Colors from '../../constants/Colors';
import Theme from '../../constants/Theme';

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
			<Search size={20} color={Colors.text.placeholder} style={styles.icon} />
			<TextInput
				value={text}
				style={styles.input}
				placeholder={placeholder}
				placeholderTextColor={Colors.text.placeholder}
				returnKeyType="search"
				onChangeText={setText}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		backgroundColor: Colors.surface,
		borderRadius: Theme.borderRadius.full, // Pill shape
		paddingHorizontal: Theme.spacing.md,
		paddingVertical: 12, // Slightly taller
		flexDirection: 'row',
		alignItems: 'center',
		...Theme.shadows.small,
		borderWidth: 1,
		borderColor: Colors.border,
	},
	icon: {
		marginRight: 10,
	},
	input: {
		flex: 1,
		fontSize: 16,
		color: Colors.text.primary,
	},
});

export default SearchBar;



import React, { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Search } from 'lucide-react-native';
import { useAppTheme } from '../../theme/provider';

type Props = {
	placeholder?: string;
	value?: string;
	onChangeText?: (text: string) => void;
};

const SearchBar: React.FC<Props> = ({ placeholder = 'Search items, categories, users…', value, onChangeText }) => {
	const [internal, setInternal] = useState('');
    const { theme } = useAppTheme();
	const text = value !== undefined ? value : internal;
	const setText = (t: string) => {
		setInternal(t);
		onChangeText?.(t);
	};

    const styles = createStyles(theme);

	return (
		<View style={styles.container}>
			<Search size={20} color={theme.colors.textMuted} style={styles.icon} />
			<TextInput
				value={text}
				style={styles.input}
				placeholder={placeholder}
				placeholderTextColor={theme.colors.textMuted}
				returnKeyType="search"
				onChangeText={setText}
			/>
		</View>
	);
};

const createStyles = (theme: ReturnType<typeof useAppTheme>['theme']) => StyleSheet.create({
	container: {
		backgroundColor: theme.colors.surfaceElevated,
		borderRadius: theme.radius.pill,
		paddingHorizontal: theme.spacing.md,
		paddingVertical: 14,
		flexDirection: 'row',
		alignItems: 'center',
		...theme.shadows.soft,
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	icon: {
		marginRight: 10,
	},
	input: {
		flex: 1,
		fontSize: 16,
		color: theme.colors.textPrimary,
	},
});

export default SearchBar;



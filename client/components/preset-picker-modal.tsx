import {
	View,
	Text,
	TextInput,
	Pressable,
	StyleSheet,
	Modal,
	ScrollView,
	KeyboardAvoidingView,
	Platform,
	TouchableWithoutFeedback,
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { MaterialIcons } from '@expo/vector-icons';

interface PresetPickerModalProps {
	presets: readonly string[];
	selectedItems: string[];
	onSelect: (value: string) => void;
	hasError?: boolean;
	placeholder?: string;
}

export default function PresetPickerModal({
	presets,
	selectedItems,
	onSelect,
	hasError = false,
	placeholder = 'Select from common options',
}: PresetPickerModalProps) {
	const [visible, setVisible] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [showCustomInput, setShowCustomInput] = useState(false);
	const [customValue, setCustomValue] = useState('');
	const customInputRef = useRef<TextInput>(null);

	useEffect(() => {
		if (showCustomInput && customInputRef.current) {
			customInputRef.current.focus();
		}
	}, [showCustomInput]);

	const handleClose = () => {
		setVisible(false);
		setShowCustomInput(false);
		setCustomValue('');
		setSearchTerm('');
	};

	const handleSelectPreset = (value: string) => {
		if (!selectedItems.includes(value)) {
			onSelect(value);
		}
	};

	const handleAddCustom = () => {
		const trimmed = customValue.trim();
		if (trimmed) {
			onSelect(trimmed);
			setCustomValue('');
		}
	};

	const filteredPresets = presets.filter((preset) =>
		preset.toLowerCase().includes(searchTerm.trim().toLowerCase()),
	);

	return (
		<>
			<Pressable
				onPress={() => setVisible(true)}
				style={[styles.trigger, hasError && styles.triggerError]}
			>
				<Text style={styles.triggerText}>{placeholder}</Text>
				<MaterialIcons name="expand-more" size={20} color="#6B7280" />
			</Pressable>

			<Modal
				visible={visible}
				transparent
				animationType="slide"
				onRequestClose={handleClose}
			>
				<TouchableWithoutFeedback onPress={handleClose}>
					<View style={styles.backdrop} />
				</TouchableWithoutFeedback>

				<KeyboardAvoidingView
					behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
					style={styles.sheetWrapper}
					pointerEvents="box-none"
				>
					<View style={styles.sheet}>
						<View style={styles.sheetHeader}>
							<Text style={styles.sheetTitle}>Select Options</Text>
							<Pressable onPress={handleClose} hitSlop={8}>
								<MaterialIcons name="close" size={20} color="#6B7280" />
							</Pressable>
						</View>

						<View style={styles.searchContainer}>
							<MaterialIcons
								name="search"
								size={18}
								color="#9CA3AF"
								style={styles.searchIcon}
							/>
							<TextInput
								value={searchTerm}
								onChangeText={setSearchTerm}
								placeholder="Search options"
								placeholderTextColor="#9CA3AF"
								style={styles.searchInput}
							/>
						</View>

						<ScrollView
							style={styles.list}
							keyboardShouldPersistTaps="handled"
							showsVerticalScrollIndicator={false}
						>
							{filteredPresets.length === 0 && (
								<Text style={styles.emptyText}>No matching options found.</Text>
							)}
							{filteredPresets.map((preset) => {
								const isSelected = selectedItems.includes(preset);
								return (
									<Pressable
										key={preset}
										disabled={isSelected}
										onPress={() => handleSelectPreset(preset)}
										style={({ pressed }) => [
											styles.presetItem,
											isSelected && styles.presetItemSelected,
											!isSelected && pressed && styles.presetItemPressed,
										]}
									>
										{isSelected ? (
											<MaterialIcons name="check" size={14} color="#3A52A6" />
										) : (
											<View style={styles.iconPlaceholder} />
										)}
										<Text
											style={[
												styles.presetText,
												isSelected && styles.presetTextSelected,
											]}
										>
											{preset}
										</Text>
									</Pressable>
								);
							})}
						</ScrollView>

						<View style={styles.customSection}>
							{!showCustomInput ? (
								<Pressable
									onPress={() => setShowCustomInput(true)}
									style={({ pressed }) => [
										styles.addCustomButton,
										pressed && styles.addCustomButtonPressed,
									]}
								>
									<MaterialIcons name="add" size={16} color="#3A52A6" />
									<Text style={styles.addCustomText}>Add your own requirement</Text>
								</Pressable>
							) : (
								<View style={styles.customInputRow}>
									<TextInput
										ref={customInputRef}
										value={customValue}
										onChangeText={setCustomValue}
										placeholder="Please specify..."
										placeholderTextColor="#9CA3AF"
										style={styles.customInput}
										onSubmitEditing={handleAddCustom}
										returnKeyType="done"
										blurOnSubmit={false}
									/>
									<Pressable
										onPress={handleAddCustom}
										disabled={!customValue.trim()}
										style={[
											styles.customAddBtn,
											!customValue.trim() && styles.customAddBtnDisabled,
										]}
									>
										<MaterialIcons name="add" size={16} color="#F0F7FF" />
									</Pressable>
								</View>
							)}
						</View>
					</View>
				</KeyboardAvoidingView>
			</Modal>
		</>
	);
}

const styles = StyleSheet.create({
	trigger: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		borderWidth: 1,
		borderColor: '#C4CBD5',
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: 10,
		backgroundColor: 'transparent',
	},
	triggerError: {
		borderColor: '#EF4444',
	},
	triggerText: {
		fontSize: 14,
		color: '#A0AEC0',
		flex: 1,
	},
	backdrop: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.4)',
	},
	sheetWrapper: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
	},
	sheet: {
		backgroundColor: '#FFFFFF',
		borderTopLeftRadius: 16,
		borderTopRightRadius: 16,
		paddingBottom: Platform.OS === 'ios' ? 32 : 16,
		maxHeight: '75%',
	},
	sheetHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingVertical: 14,
		borderBottomWidth: 1,
		borderBottomColor: '#E5E7EB',
	},
	sheetTitle: {
		fontSize: 15,
		fontWeight: '600',
		color: '#111827',
	},
	searchContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		margin: 10,
		borderWidth: 1,
		borderColor: '#C4CBD5',
		borderRadius: 8,
		paddingHorizontal: 10,
	},
	searchIcon: {
		marginRight: 6,
	},
	searchInput: {
		flex: 1,
		fontSize: 14,
		color: '#111827',
		paddingVertical: 8,
	},
	list: {
		maxHeight: 280,
		paddingHorizontal: 8,
	},
	emptyText: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		fontSize: 14,
		color: '#6B7280',
	},
	presetItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderRadius: 8,
	},
	presetItemSelected: {
		opacity: 0.5,
	},
	presetItemPressed: {
		backgroundColor: '#F3F4F6',
	},
	iconPlaceholder: {
		width: 14,
	},
	presetText: {
		fontSize: 14,
		color: '#111827',
		flex: 1,
	},
	presetTextSelected: {
		color: '#6B7280',
	},
	customSection: {
		borderTopWidth: 1,
		borderTopColor: '#E5E7EB',
		paddingHorizontal: 8,
		paddingVertical: 6,
	},
	addCustomButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderRadius: 8,
	},
	addCustomButtonPressed: {
		backgroundColor: '#F3F4F6',
	},
	addCustomText: {
		fontSize: 14,
		color: '#3A52A6',
	},
	customInputRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		paddingHorizontal: 4,
		paddingVertical: 4,
	},
	customInput: {
		flex: 1,
		borderWidth: 1,
		borderColor: '#C4CBD5',
		borderRadius: 6,
		paddingHorizontal: 12,
		paddingVertical: 8,
		fontSize: 14,
		color: '#111827',
		backgroundColor: 'transparent',
	},
	customAddBtn: {
		backgroundColor: '#3A52A6',
		borderRadius: 6,
		padding: 8,
	},
	customAddBtnDisabled: {
		opacity: 0.5,
	},
});

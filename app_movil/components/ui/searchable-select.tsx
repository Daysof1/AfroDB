import { useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

type SearchableSelectItem = {
  id: string | number;
  label: string;
  disabled?: boolean;
};

type SearchableSelectProps = {
  label: string;
  value: string;
  placeholder: string;
  items: SearchableSelectItem[];
  onSelect: (value: string) => void;
  disabled?: boolean;
  noResultsText?: string;
  searchPlaceholder?: string;
};

export function SearchableSelect({
  label,
  value,
  placeholder,
  items,
  onSelect,
  disabled = false,
  noResultsText = 'No se encontraron opciones.',
  searchPlaceholder,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) {
      setSearch('');
    }
  }, [open]);

  const filteredItems = useMemo(
    () =>
      items.filter((item) =>
        item.label.toLowerCase().includes(search.toLowerCase().trim())
      ),
    [items, search]
  );

  const selectedLabel = useMemo(
    () => items.find((item) => String(item.id) === String(value))?.label,
    [items, value]
  );

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={[styles.selectButton, disabled && styles.selectButtonDisabled]}
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
      >
        <Text style={[styles.selectText, disabled && styles.selectTextDisabled]}>
          {selectedLabel ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={disabled ? '#a8a29e' : '#6b5344'} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalPanel}>
            <TextInput
              placeholder={searchPlaceholder ?? `Buscar ${label.toLowerCase()}...`}
              value={search}
              onChangeText={setSearch}
              style={styles.modalSearchInput}
              placeholderTextColor="#999"
              autoFocus
            />
            <ScrollView keyboardShouldPersistTaps="handled">
              {filteredItems.length === 0 ? (
                <Text style={styles.modalEmptyText}>{noResultsText}</Text>
              ) : (
                filteredItems.map((item) => (
                  <Pressable
                    key={String(item.id)}
                    style={styles.modalOption}
                    onPress={() => {
                      onSelect(String(item.id));
                      setOpen(false);
                    }}
                    disabled={item.disabled}
                  >
                    <Text style={[styles.modalOptionText, item.disabled && styles.modalOptionTextDisabled]}>
                      {item.label}
                    </Text>
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 10 },
  label: { color: '#3e2f25', fontWeight: '700', marginBottom: 8 },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d1bfa3',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  selectButtonDisabled: { opacity: 0.6, backgroundColor: '#f3efe9' },
  selectText: { color: '#5f4638', fontWeight: '600' },
  selectTextDisabled: { color: '#8d8a8a' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalPanel: { backgroundColor: '#fff', borderRadius: 18, padding: 16, maxHeight: '70%' },
  modalSearchInput: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12, color: '#111827', backgroundColor: '#f8fafc' },
  modalOption: { paddingVertical: 14, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#f3e6d8' },
  modalOptionText: { color: '#3e2f25', fontWeight: '700' },
  modalOptionTextDisabled: { color: '#a8a29e' },
  modalEmptyText: { color: '#7b6758', textAlign: 'center', paddingVertical: 14 },
});

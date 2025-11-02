import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import { ChevronDown, X } from 'lucide-react-native';
import { CategoriaGasto } from '@/types/database';

interface CategoryPickerProps {
  categories: CategoriaGasto[];
  selectedCategory: CategoriaGasto | null;
  onSelectCategory: (category: CategoriaGasto) => void;
  placeholder?: string;
}

export default function CategoryPicker({
  categories,
  selectedCategory,
  onSelectCategory,
  placeholder = 'Seleccionar categoría',
}: CategoryPickerProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  const handleSelect = (category: CategoriaGasto) => {
    onSelectCategory(category);
    setIsVisible(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setIsVisible(true)}
      >
        <Text
          style={[
            styles.selectorText,
            !selectedCategory && styles.placeholderText,
          ]}
        >
          {selectedCategory ? selectedCategory.descripcion : placeholder}
        </Text>
        <ChevronDown size={20} color="#666" />
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Categoría</Text>
              <TouchableOpacity
                onPress={() => setIsVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.categoriesList}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.idcategoriagastos}
                  style={[
                    styles.categoryItem,
                    selectedCategory?.idcategoriagastos ===
                      category.idcategoriagastos && styles.selectedItem,
                  ]}
                  onPress={() => handleSelect(category)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory?.idcategoriagastos ===
                        category.idcategoriagastos && styles.selectedText,
                    ]}
                  >
                    {category.descripcion}
                  </Text>
                  {category.descripcion && (
                    <Text style={styles.categoryDescription}>
                      {category.descripcion}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#fff',
  },
  selectorText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  placeholderText: {
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  categoriesList: {
    maxHeight: 400,
  },
  categoryItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedItem: {
    backgroundColor: '#e3f2fd',
  },
  categoryText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  selectedText: {
    color: '#1976d2',
    fontWeight: '600',
  },
  categoryDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});

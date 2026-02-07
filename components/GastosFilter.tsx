import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { ChevronDown, X } from 'lucide-react-native';
import { gastosService } from '@/services/gastosService';
import { CategoriaGasto } from '@/types/database';

interface GastosFilterProps {
  selectedCategory: CategoriaGasto | null;
  onCategoryChange: (category: CategoriaGasto | null) => void;
  minAmount: number;
  maxAmount: number;
  onAmountChange: (min: number, max: number) => void;
}

export function GastosFilter({
  selectedCategory,
  onCategoryChange,
  minAmount,
  maxAmount,
  onAmountChange,
}: GastosFilterProps) {
  const [categories, setCategories] = useState<CategoriaGasto[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await gastosService.getCategorias();
        setCategories(data);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };

    loadCategories();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowCategoryModal(true)}
        >
          <View style={styles.filterContent}>
            <Text style={styles.filterLabel}>Categoría</Text>
            <Text style={styles.filterValue} numberOfLines={1}>
              {selectedCategory?.descripcion || 'Todas'}
            </Text>
          </View>
          <ChevronDown size={18} color="#666" />
        </TouchableOpacity>

        {selectedCategory && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => onCategoryChange(null)}
          >
            <X size={16} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtrar por Categoría</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.categoryList}>
              <TouchableOpacity
                style={[
                  styles.categoryOption,
                  !selectedCategory && styles.selectedCategoryOption,
                ]}
                onPress={() => {
                  onCategoryChange(null);
                  setShowCategoryModal(false);
                }}
              >
                <Text
                  style={[
                    styles.categoryOptionText,
                    !selectedCategory && styles.selectedCategoryText,
                  ]}
                >
                  Todas las categorías
                </Text>
              </TouchableOpacity>

              {categories.map((category) => (
                <TouchableOpacity
                  key={category.idcategoriagastos}
                  style={[
                    styles.categoryOption,
                    selectedCategory?.idcategoriagastos ===
                      category.idcategoriagastos &&
                      styles.selectedCategoryOption,
                  ]}
                  onPress={() => {
                    onCategoryChange(category);
                    setShowCategoryModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.categoryOptionText,
                      selectedCategory?.idcategoriagastos ===
                        category.idcategoriagastos &&
                        styles.selectedCategoryText,
                    ]}
                  >
                    {category.descripcion}
                  </Text>
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
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  filterContent: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
    marginBottom: 2,
  },
  filterValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#E63946',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  categoryList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f8f8f8',
  },
  selectedCategoryOption: {
    backgroundColor: '#4CAF50',
  },
  categoryOptionText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: '#fff',
    fontWeight: '600',
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Save, Calendar } from 'lucide-react-native';
import { gastosService } from '@/services/gastosService';
import { CategoriaGasto } from '@/types/database';
import CategoryPicker from './CategoryPicker';

interface ExpenseFormProps {
  onExpenseAdded: () => void;
}

export default function ExpenseForm({ onExpenseAdded }: ExpenseFormProps) {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [notas, setNotas] = useState('');
  const [selectedCategory, setSelectedCategory] =
    useState<CategoriaGasto | null>(null);
  const [categories, setCategories] = useState<CategoriaGasto[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      try {
        if (isMounted) setLoadingCategories(true);
        const data = await gastosService.getCategorias();
        if (isMounted) setCategories(data);
      } catch (error) {
        if (isMounted)
          Alert.alert('Error', 'No se pudieron cargar las categorías');
      } finally {
        if (isMounted) setLoadingCategories(false);
      }
    };

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async () => {
    if (!monto || !descripcion || !selectedCategory) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    const montoNumber = parseFloat(monto);
    if (isNaN(montoNumber) || montoNumber <= 0) {
      Alert.alert('Error', 'El monto debe ser un número válido mayor a 0');
      return;
    }

    try {
      setLoading(true);

      await gastosService.createGasto({
        fecha,
        monto: montoNumber,
        descripcion,
        notas: notas || '',
        idcategoriagastos: selectedCategory.idcategoriagastos,
        app: '1',
        id_created_at: 1,
      });

      // Limpiar formulario
      setMonto('');
      setDescripcion('');
      setNotas('');
      setSelectedCategory(null);
      setFecha(new Date().toISOString().split('T')[0]);

      Alert.alert('Éxito', 'Gasto registrado correctamente');
      onExpenseAdded();
    } catch (error) {
      Alert.alert('Error', 'No se pudo registrar el gasto');
      console.error('Error creating expense:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loadingCategories) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando categorías...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.form}>
          <Text style={styles.title}>Registrar Gasto</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fecha *</Text>
            <View style={styles.dateContainer}>
              <Calendar size={20} color="#666" style={styles.dateIcon} />
              <TextInput
                style={styles.dateInput}
                value={fecha}
                onChangeText={setFecha}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Monto *</Text>
            <TextInput
              style={styles.input}
              value={monto}
              onChangeText={setMonto}
              placeholder="0.00"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descripción *</Text>
            <TextInput
              style={styles.input}
              value={descripcion}
              onChangeText={setDescripcion}
              placeholder="Descripción del gasto"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Categoría *</Text>
            <CategoryPicker
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              placeholder="Seleccionar categoría"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notas</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notas}
              onChangeText={setNotas}
              placeholder="Notas adicionales (opcional)"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Save size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.submitButtonText}>
              {loading ? 'Guardando...' : 'Guardar Gasto'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  textArea: {
    height: 80,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },
  dateIcon: {
    marginRight: 12,
  },
  dateInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

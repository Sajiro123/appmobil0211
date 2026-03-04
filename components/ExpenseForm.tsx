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
  Modal,
} from 'react-native';
import {
  CalendarDays,
  X,
  UtensilsCrossed,
  Bus,
  Home,
  Gamepad2,
  HeartPulse,
  ShoppingBag,
  Tag,
} from 'lucide-react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';

// Configurar calendario en español
LocaleConfig.locales['es'] = {
  monthNames: [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ],
  monthNamesShort: [
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic',
  ],
  dayNames: [
    'Domingo',
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
  ],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  today: 'Hoy',
};
LocaleConfig.defaultLocale = 'es';
import { gastosService } from '@/services/gastosService';
import { CategoriaGasto } from '@/types/database';

interface ExpenseFormProps {
  onExpenseAdded: () => void;
}

// Map category names to icons and colors
const CATEGORY_ICON_MAP: Record<
  string,
  { icon: any; color: string; bgColor: string }
> = {
  comida: {
    icon: UtensilsCrossed,
    color: '#E65100',
    bgColor: '#FFF3E0',
  },
  transporte: {
    icon: Bus,
    color: '#1565C0',
    bgColor: '#E3F2FD',
  },
  hogar: {
    icon: Home,
    color: '#2E7D32',
    bgColor: '#E8F5E9',
  },
  ocio: {
    icon: Gamepad2,
    color: '#6A1B9A',
    bgColor: '#F3E5F5',
  },
  salud: {
    icon: HeartPulse,
    color: '#C62828',
    bgColor: '#FFEBEE',
  },
  compras: {
    icon: ShoppingBag,
    color: '#AD1457',
    bgColor: '#FCE4EC',
  },
};

function getCategoryVisual(descripcion: string) {
  const key = (descripcion || '').toLowerCase().trim();
  for (const [mapKey, value] of Object.entries(CATEGORY_ICON_MAP)) {
    if (key.includes(mapKey)) {
      return value;
    }
  }
  return {
    icon: Tag,
    color: '#546E7A',
    bgColor: '#ECEFF1',
  };
}

export default function ExpenseForm({ onExpenseAdded }: ExpenseFormProps) {
  const getISODate = () => new Date().toISOString().split('T')[0];

  const formatDateDisplay = (isoDate: string) => {
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  };

  const [fecha, setFecha] = useState(getISODate());
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [notas, setNotas] = useState('');
  const [selectedCategory, setSelectedCategory] =
    useState<CategoriaGasto | null>(null);
  const [categories, setCategories] = useState<CategoriaGasto[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);

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

  // Float validation: only allow digits and one decimal point
  const handleMontoChange = (text: string) => {
    // Remove any character that is not a digit or dot
    let cleaned = text.replace(/[^0-9.]/g, '');
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    // Limit to 2 decimal places
    if (parts.length === 2 && parts[1].length > 2) {
      cleaned = parts[0] + '.' + parts[1].substring(0, 2);
    }
    setMonto(cleaned);
  };

  const handleDayPress = (day: any) => {
    setFecha(day.dateString);
    setShowCalendar(false);
  };

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
      setFecha(getISODate());

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
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.title}>Nuevo Gasto</Text>

        {/* Fecha y Monto */}
        <View style={styles.card}>
          <View style={styles.row}>
            {/* Fecha - Calendar Picker */}
            <View style={styles.fieldHalf}>
              <Text style={styles.label}>FECHA</Text>
              <TouchableOpacity
                style={styles.dateInputContainer}
                onPress={() => setShowCalendar(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.dateDisplayText}>
                  {formatDateDisplay(fecha)}
                </Text>
                <CalendarDays size={20} color="#4CAF50" />
              </TouchableOpacity>
            </View>

            {/* Monto */}
            <View style={styles.fieldHalf}>
              <Text style={styles.label}>MONTO</Text>
              <View style={styles.montoInputContainer}>
                <Text style={styles.currencySymbol}>S/</Text>
                <TextInput
                  style={styles.montoInput}
                  value={monto}
                  onChangeText={handleMontoChange}
                  placeholder="0.00"
                  placeholderTextColor="#999"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Descripción */}
        <View style={styles.card}>
          <Text style={styles.label}>DESCRIPCIÓN</Text>
          <TextInput
            style={styles.input}
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="¿En qué gastaste?"
            placeholderTextColor="#999"
          />
        </View>

        {/* Categoría - Grid de 5 columnas */}
        <View style={styles.card}>
          <Text style={styles.label}>CATEGORÍA</Text>
          <View style={styles.categoryGrid}>
            {categories.map((category) => {
              const visual = getCategoryVisual(category.descripcion || '');
              const IconComponent = visual.icon;
              const isSelected =
                selectedCategory?.idcategoriagastos ===
                category.idcategoriagastos;

              return (
                <TouchableOpacity
                  key={category.idcategoriagastos}
                  style={[
                    styles.categoryItem,
                    isSelected && styles.categoryItemSelected,
                  ]}
                  onPress={() => setSelectedCategory(category)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.categoryIconCircle,
                      {
                        backgroundColor: isSelected
                          ? visual.color
                          : visual.bgColor,
                      },
                    ]}
                  >
                    <IconComponent
                      size={20}
                      color={isSelected ? '#fff' : visual.color}
                    />
                  </View>
                  <Text
                    style={[
                      styles.categoryLabel,
                      isSelected && { color: visual.color, fontWeight: '700' },
                    ]}
                    numberOfLines={1}
                  >
                    {category.descripcion}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Notas */}
        <View style={styles.card}>
          <Text style={styles.label}>NOTAS</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notas}
            onChangeText={setNotas}
            placeholder="Detalles adicionales..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* Botón Guardar fijo en la parte inferior */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Guardando...' : 'Guardar Movimiento'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Calendar Modal */}
      <Modal
        visible={showCalendar}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Fecha</Text>
              <TouchableOpacity
                onPress={() => setShowCalendar(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Calendar
              current={fecha}
              onDayPress={handleDayPress}
              markedDates={{
                [fecha]: {
                  selected: true,
                  selectedColor: '#4CAF50',
                  selectedTextColor: '#fff',
                },
              }}
              theme={{
                selectedDayBackgroundColor: '#4CAF50',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#4CAF50',
                dayTextColor: '#2d4150',
                textDisabledColor: '#d9e1e8',
                arrowColor: '#4CAF50',
                monthTextColor: '#2d4150',
                indicatorColor: '#4CAF50',
                textDayFontWeight: '500',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '500',
                textDayFontSize: 16,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 13,
              }}
            />

            <View style={styles.calendarButtonContainer}>
              <TouchableOpacity
                style={styles.calendarCancelButton}
                onPress={() => setShowCalendar(false)}
              >
                <Text style={styles.calendarCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F8F5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },

  // Header
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 24,
  },

  // Cards
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },

  // Row layout
  row: {
    flexDirection: 'row',
    gap: 14,
  },
  fieldHalf: {
    flex: 1,
  },

  // Labels
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#555',
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  // Date picker button
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F7F8FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAECF0',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dateDisplayText: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '500',
  },

  // Monto input
  montoInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F8FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAECF0',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 4,
  },
  currencySymbol: {
    fontSize: 18,
    color: '#1a1a1a',
    fontWeight: '600',
    marginRight: 4,
  },
  montoInput: {
    flex: 1,
    fontSize: 18,
    color: '#1a1a1a',
    fontWeight: '500',
    padding: 0,
  },

  // Text inputs
  input: {
    backgroundColor: '#F7F8FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAECF0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1a1a1a',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },

  // Category Grid - 5 columns
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  categoryItem: {
    width: '20%',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  categoryItemSelected: {
    backgroundColor: '#F0FAF0',
  },
  categoryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#555',
    textAlign: 'center',
  },

  // Bottom button
  bottomButtonContainer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    paddingTop: 10,
    backgroundColor: '#F6F8F5',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 28,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Calendar Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  calendarButtonContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  calendarCancelButton: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  calendarCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});

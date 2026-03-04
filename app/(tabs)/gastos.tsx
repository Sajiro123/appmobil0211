import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Platform,
  Modal,
  ScrollView,
} from 'react-native';
import {
  TrendingDown,
  CalendarDays,
  X,
  UtensilsCrossed,
  Bus,
  Home,
  Gamepad2,
  HeartPulse,
  ShoppingBag,
  Tag,
  MoreVertical,
  ChevronLeft,
  TrendingUp,
} from 'lucide-react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { gastosService } from '@/services/gastosService';
import { Gasto, CategoriaGasto } from '@/types/database';

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

// Category icon mapping
const CATEGORY_ICON_MAP: Record<
  string,
  { icon: any; color: string; bgColor: string }
> = {
  comida: { icon: UtensilsCrossed, color: '#E65100', bgColor: '#FFF3E0' },
  transporte: { icon: Bus, color: '#1565C0', bgColor: '#E3F2FD' },
  hogar: { icon: Home, color: '#2E7D32', bgColor: '#E8F5E9' },
  ocio: { icon: Gamepad2, color: '#6A1B9A', bgColor: '#F3E5F5' },
  salud: { icon: HeartPulse, color: '#C62828', bgColor: '#FFEBEE' },
  compras: { icon: ShoppingBag, color: '#AD1457', bgColor: '#FCE4EC' },
  personal: { icon: Tag, color: '#0277BD', bgColor: '#E1F5FE' },
  pago: { icon: Tag, color: '#0277BD', bgColor: '#E1F5FE' },
  pescado: { icon: UtensilsCrossed, color: '#00897B', bgColor: '#E0F2F1' },
  abarrotes: { icon: ShoppingBag, color: '#6D4C41', bgColor: '#EFEBE9' },
};

function getCategoryVisual(descripcion: string) {
  const key = (descripcion || '').toLowerCase().trim();
  for (const [mapKey, value] of Object.entries(CATEGORY_ICON_MAP)) {
    if (key.includes(mapKey)) {
      return value;
    }
  }
  return { icon: Tag, color: '#546E7A', bgColor: '#ECEFF1' };
}

interface GastoAgrupado {
  fecha: string;
  gastos: any[];
  total: number;
}

export default function GastosScreen() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<CategoriaGasto | null>(null);
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);

  const getDefaultDates = () => {
    const today = new Date();
    const treintaDiasAgo = new Date(today);
    treintaDiasAgo.setDate(treintaDiasAgo.getDate() - 30);

    const formatPeru = (date: Date) =>
      date.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });

    return {
      startDate: formatPeru(treintaDiasAgo),
      endDate: formatPeru(today),
    };
  };

  const defaultDates = getDefaultDates();
  const [startDate, setStartDate] = useState(defaultDates.startDate);
  const [endDate, setEndDate] = useState(defaultDates.endDate);

  useEffect(() => {
    let isMounted = true;

    const loadGastos = async () => {
      try {
        if (isMounted) setLoading(true);
        const data = await gastosService.getGastos(startDate, endDate);
        if (isMounted) setGastos(data);
      } catch (error) {
        if (isMounted) Alert.alert('Error', 'No se pudieron cargar los gastos');
        console.error('Error loading gastos:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadGastos();

    return () => {
      isMounted = false;
    };
  }, [startDate, endDate]);

  const loadGastos = async () => {
    try {
      setLoading(true);
      const data = await gastosService.getGastos(startDate, endDate);
      setGastos(data);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los gastos');
      console.error('Error loading gastos:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGastos();
    setRefreshing(false);
  };

  const formatDateDisplay = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateForHeader = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-PE', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
    });
  };

  const formatMoney = (amount: number) => {
    return `S/ ${amount.toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Filtrar gastos por categoría
  const filteredGastos = selectedCategory
    ? gastos.filter(
        (g) => g.idcategoriagastos === selectedCategory.idcategoriagastos,
      )
    : gastos;

  // Agrupar gastos por fecha
  const groupGastosByDate = (): GastoAgrupado[] => {
    const grouped: { [key: string]: any[] } = {};

    filteredGastos.forEach((gasto) => {
      if (!grouped[gasto.fecha]) {
        grouped[gasto.fecha] = [];
      }
      grouped[gasto.fecha].push(gasto);
    });

    return Object.keys(grouped)
      .sort((a, b) => b.localeCompare(a))
      .map((fecha) => ({
        fecha,
        gastos: grouped[fecha],
        total: grouped[fecha].reduce((sum, g) => sum + g.monto, 0),
      }));
  };

  const calculateTotals = () => {
    const total = filteredGastos.reduce((sum, gasto) => sum + gasto.monto, 0);
    const byCategory = filteredGastos.reduce((acc: any, gasto) => {
      const categoria = gasto.categoriagastos?.descripcion || 'Sin categoría';
      if (!acc[categoria]) {
        acc[categoria] = 0;
      }
      acc[categoria] += gasto.monto;
      return acc;
    }, {});

    return { total, byCategory };
  };

  const { total, byCategory } = calculateTotals();
  const gastosPorFecha = groupGastosByDate();

  const handleStartDateSelect = (day: any) => {
    const date = day.dateString;
    if (date > endDate) {
      setStartDate(date);
      setEndDate(date);
    } else {
      setStartDate(date);
    }
    setShowStartCalendar(false);
  };

  const handleEndDateSelect = (day: any) => {
    const date = day.dateString;
    if (date < startDate) {
      setStartDate(date);
      setEndDate(date);
    } else {
      setEndDate(date);
    }
    setShowEndCalendar(false);
  };

  // Render header with total card + date pickers + categories (as ListHeaderComponent)
  const renderListHeader = () => (
    <View>
      {/* Total Card - Orange gradient style */}
      <View style={styles.totalCard}>
        <Text style={styles.totalCardLabel}>Gasto Total</Text>
        <Text style={styles.totalCardAmount}>{formatMoney(total)}</Text>
        <View style={styles.totalCardBadge}>
          <TrendingUp size={14} color="#fff" />
          <Text style={styles.totalCardBadgeText}>
            {gastos.length} registro{gastos.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Date Pickers */}
      <View style={styles.datePickerSection}>
        <View style={styles.datePickerRow}>
          <View style={styles.datePickerField}>
            <Text style={styles.datePickerLabel}>DESDE</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowStartCalendar(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.datePickerValue}>
                {formatDateDisplay(startDate)}
              </Text>
              <CalendarDays size={18} color="#888" />
            </TouchableOpacity>
          </View>

          <View style={styles.datePickerField}>
            <Text style={styles.datePickerLabel}>HASTA</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowEndCalendar(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.datePickerValue}>
                {formatDateDisplay(endDate)}
              </Text>
              <CalendarDays size={18} color="#888" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Categorías Summary */}
      {Object.keys(byCategory).length > 0 && (
        <View style={styles.categoriesSection}>
          <Text style={styles.categoriesSectionTitle}>
            Resumen por Categoría
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {Object.entries(byCategory)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .map(([categoria, monto]) => {
                const visual = getCategoryVisual(categoria);
                const IconComponent = visual.icon;
                const percentage =
                  total > 0 ? Math.round(((monto as number) / total) * 100) : 0;
                const isSelected = selectedCategory?.descripcion === categoria;

                return (
                  <TouchableOpacity
                    key={categoria}
                    style={[
                      styles.categoryCard,
                      isSelected && styles.categoryCardSelected,
                    ]}
                    onPress={() => {
                      if (isSelected) {
                        setSelectedCategory(null);
                      } else {
                        const cat = gastos.find(
                          (g) => g.categoriagastos?.descripcion === categoria,
                        )?.categoriagastos;
                        if (cat) setSelectedCategory(cat);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.categoryCardHeader}>
                      <View
                        style={[
                          styles.categoryCardIcon,
                          { backgroundColor: visual.bgColor },
                        ]}
                      >
                        <IconComponent size={18} color={visual.color} />
                      </View>
                      <Text style={styles.categoryCardPercentage}>
                        {percentage}%
                      </Text>
                    </View>
                    <Text style={styles.categoryCardName} numberOfLines={1}>
                      {categoria}
                    </Text>
                    <Text style={styles.categoryCardAmount}>
                      {formatMoney(monto as number)}
                    </Text>
                    {/* Progress bar */}
                    <View style={styles.categoryProgressBg}>
                      <View
                        style={[
                          styles.categoryProgressFill,
                          {
                            width: `${percentage}%`,
                            backgroundColor: visual.color,
                          },
                        ]}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
          </ScrollView>

          {selectedCategory && (
            <TouchableOpacity
              style={styles.clearFilterButton}
              onPress={() => setSelectedCategory(null)}
            >
              <X size={14} color="#E53935" />
              <Text style={styles.clearFilterText}>
                Limpiar filtro: {selectedCategory.descripcion}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  const renderDateHeader = (fecha: string) => {
    const dateTotal = gastosPorFecha.find((g) => g.fecha === fecha)?.total || 0;
    return (
      <View style={styles.dateHeaderContainer}>
        <Text style={styles.dateHeaderText}>{formatDateForHeader(fecha)}</Text>
        <Text style={styles.dateHeaderSubtotal}>
          Subtotal: {formatMoney(dateTotal)}
        </Text>
      </View>
    );
  };

  const renderGasto = (item: any) => {
    const visual = getCategoryVisual(item.categoriagastos?.descripcion || '');
    const IconComponent = visual.icon;

    return (
      <View style={styles.gastoCard}>
        <View
          style={[styles.gastoIconCircle, { backgroundColor: visual.bgColor }]}
        >
          <IconComponent size={20} color={visual.color} />
        </View>
        <View style={styles.gastoContent}>
          <Text style={styles.gastoDescripcion} numberOfLines={1}>
            {item.descripcion.toUpperCase()}
          </Text>
          {item.categoriagastos && (
            <Text style={[styles.gastoCategoryBadge, { color: visual.color }]}>
              {item.categoriagastos.descripcion}
            </Text>
          )}
        </View>
        <Text style={styles.gastoMonto}>- {formatMoney(item.monto)}</Text>
      </View>
    );
  };

  const renderGastoGroup = ({ item }: { item: GastoAgrupado }) => (
    <View>
      {renderDateHeader(item.fecha)}
      {item.gastos.map((gasto, index) => (
        <View
          key={
            gasto.idgastos
              ? gasto.idgastos.toString()
              : `${item.fecha}-${index}`
          }
        >
          {renderGasto(gasto)}
        </View>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <TrendingDown size={40} color="#ccc" />
        <Text style={styles.loadingText}>Cargando gastos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <View style={{ width: 24 }} />
        <Text style={styles.topBarTitle}>Reporte de Gastos</Text>
        <MoreVertical size={22} color="#333" />
      </View>

      {/* Main List */}
      <FlatList
        data={gastosPorFecha}
        renderItem={renderGastoGroup}
        keyExtractor={(item) => item.fecha}
        contentContainerStyle={styles.listContainer}
        scrollEnabled={true}
        ListHeaderComponent={renderListHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <TrendingDown size={48} color="#ddd" />
            <Text style={styles.emptyText}>
              {selectedCategory
                ? 'Sin gastos en esta categoría'
                : 'No hay gastos registrados'}
            </Text>
            <Text style={styles.emptySubtext}>
              {selectedCategory
                ? 'Intenta seleccionar otra categoría'
                : 'Ve a la pestaña "Nuevo" para agregar tu primer gasto'}
            </Text>
          </View>
        }
      />

      {/* Calendar Modal - Start Date */}
      <Modal
        visible={showStartCalendar}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStartCalendar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Fecha de inicio</Text>
              <TouchableOpacity
                onPress={() => setShowStartCalendar(false)}
                style={styles.modalCloseBtn}
              >
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <Calendar
              current={startDate}
              onDayPress={handleStartDateSelect}
              markedDates={{
                [startDate]: {
                  selected: true,
                  selectedColor: '#E8551E',
                  selectedTextColor: '#fff',
                },
              }}
              theme={{
                selectedDayBackgroundColor: '#E8551E',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#E8551E',
                dayTextColor: '#2d4150',
                textDisabledColor: '#d9e1e8',
                arrowColor: '#E8551E',
                monthTextColor: '#2d4150',
                indicatorColor: '#E8551E',
                textDayFontWeight: '500',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '500',
                textDayFontSize: 16,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 13,
              }}
            />
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowStartCalendar(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Calendar Modal - End Date */}
      <Modal
        visible={showEndCalendar}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEndCalendar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Fecha de fin</Text>
              <TouchableOpacity
                onPress={() => setShowEndCalendar(false)}
                style={styles.modalCloseBtn}
              >
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <Calendar
              current={endDate}
              onDayPress={handleEndDateSelect}
              markedDates={{
                [endDate]: {
                  selected: true,
                  selectedColor: '#E8551E',
                  selectedTextColor: '#fff',
                },
              }}
              theme={{
                selectedDayBackgroundColor: '#E8551E',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#E8551E',
                dayTextColor: '#2d4150',
                textDisabledColor: '#d9e1e8',
                arrowColor: '#E8551E',
                monthTextColor: '#2d4150',
                indicatorColor: '#E8551E',
                textDayFontWeight: '500',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '500',
                textDayFontSize: 16,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 13,
              }}
            />
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowEndCalendar(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F8FA',
  },
  loadingText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    fontWeight: '500',
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },

  // Total Card - Orange
  totalCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#E8551E',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#E8551E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  totalCardLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginBottom: 4,
  },
  totalCardAmount: {
    fontSize: 34,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  totalCardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  totalCardBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },

  // Date Picker Section
  datePickerSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  datePickerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  datePickerField: {
    flex: 1,
  },
  datePickerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAECF0',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  datePickerValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },

  // Categories Section
  categoriesSection: {
    paddingTop: 20,
    paddingBottom: 8,
  },
  categoriesSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 14,
    paddingHorizontal: 16,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    width: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  categoryCardSelected: {
    borderColor: '#E8551E',
    borderWidth: 2,
  },
  categoryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryCardPercentage: {
    fontSize: 14,
    fontWeight: '700',
    color: '#888',
  },
  categoryCardName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  categoryCardAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  categoryProgressBg: {
    height: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  categoryProgressFill: {
    height: 4,
    borderRadius: 2,
  },
  clearFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
    marginLeft: 16,
    gap: 6,
  },
  clearFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E53935',
  },

  // Lista
  listContainer: {
    paddingBottom: 20,
  },

  // Date Header
  dateHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: '#EAECF0',
  },
  dateHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
    textTransform: 'capitalize',
  },
  dateHeaderSubtotal: {
    fontSize: 13,
    fontWeight: '500',
    color: '#888',
  },

  // Gasto Card
  gastoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  gastoIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  gastoContent: {
    flex: 1,
  },
  gastoDescripcion: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 3,
  },
  gastoCategoryBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
  gastoMonto: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    marginLeft: 8,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
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
  modalCloseBtn: {
    padding: 4,
  },
  modalButtonRow: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  modalCancelBtn: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});

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
  TextInput,
  ActivityIndicator,
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
  Pencil,
  Check,
  Trash2,
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
  const [searchText, setSearchText] = useState('');

  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingGasto, setEditingGasto] = useState<any>(null);
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editMonto, setEditMonto] = useState('');
  const [editFecha, setEditFecha] = useState('');
  const [editCategoria, setEditCategoria] = useState<CategoriaGasto | null>(
    null,
  );
  const [categorias, setCategorias] = useState<CategoriaGasto[]>([]);
  const [saving, setSaving] = useState(false);
  const [showEditDateCalendar, setShowEditDateCalendar] = useState(false);

  // Confirm delete modal state
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [gastoToDelete, setGastoToDelete] = useState<any>(null);

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

  const handleEditGasto = async (gasto: any) => {
    setEditingGasto(gasto);
    setEditDescripcion(gasto.descripcion);
    setEditMonto(String(gasto.monto));
    setEditFecha(gasto.fecha);
    setEditCategoria(gasto.categoriagastos || null);
    // Load categorias if not loaded yet
    if (categorias.length === 0) {
      try {
        const cats = await gastosService.getCategorias();
        setCategorias(cats);
      } catch (e) {
        console.error('Error loading categorias:', e);
      }
    }
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingGasto) return;
    const montoNum = parseFloat(editMonto);
    if (!editDescripcion.trim()) {
      Alert.alert('Error', 'La descripción es requerida');
      return;
    }
    if (isNaN(montoNum) || montoNum <= 0) {
      Alert.alert('Error', 'Ingresa un monto válido');
      return;
    }
    try {
      setSaving(true);
      await gastosService.updateGasto(editingGasto.idgastos, {
        descripcion: editDescripcion.trim(),
        monto: montoNum,
        fecha: editFecha,
        idcategoriagastos: editCategoria?.idcategoriagastos,
      });
      setEditModalVisible(false);
      await loadGastos();
      Alert.alert('Éxito', 'Gasto actualizado correctamente');
    } catch (e) {
      Alert.alert('Error', 'No se pudo actualizar el gasto');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGasto = (gasto: any) => {
    setGastoToDelete(gasto);
    setConfirmDeleteVisible(true);
  };

  const confirmDelete = async () => {
    if (!gastoToDelete) return;
    try {
      setConfirmDeleteVisible(false);
      await gastosService.deleteGasto(gastoToDelete.idgastos);
      setGastoToDelete(null);
      await loadGastos();
    } catch (e) {
      Alert.alert('Error', 'No se pudo eliminar el gasto');
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

  // Filtrar gastos por categoría y texto
  const filteredGastos = gastos
    .filter((g) =>
      selectedCategory
        ? g.idcategoriagastos === selectedCategory.idcategoriagastos
        : true,
    )
    .filter((g) =>
      searchText.trim()
        ? g.descripcion.toLowerCase().includes(searchText.trim().toLowerCase())
        : true,
    );

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

  // Render header with date pickers + categories (as ListHeaderComponent)
  const renderListHeader = () => (
    <View>
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
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => handleEditGasto(item)}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Pencil size={16} color="#E8551E" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDeleteGasto(item)}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Trash2 size={16} color="#E53935" />
        </TouchableOpacity>
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

      {/* Total Card - fijo, encima del buscador */}
      <View style={styles.totalCard}>
        <View>
          <Text style={styles.totalCardLabel}>Gasto Total</Text>
          <Text style={styles.totalCardAmount}>{formatMoney(total)}</Text>
        </View>
        <View style={styles.totalCardBadge}>
          <TrendingUp size={14} color="#fff" />
          <Text style={styles.totalCardBadgeText}>
            {gastos.length} registro{gastos.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Buscador - fuera del FlatList para mantener el foco */}
      <View style={styles.searchSection}>
        <View style={styles.searchInputWrapper}>
          <Tag size={16} color="#aaa" />
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Buscar por descripción..."
            placeholderTextColor="#bbb"
            autoCapitalize="none"
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchText('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={16} color="#aaa" />
            </TouchableOpacity>
          )}
        </View>
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

      {/* ===== CONFIRM DELETE MODAL ===== */}
      <Modal
        visible={confirmDeleteVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmDeleteVisible(false)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <View style={styles.confirmIconWrap}>
              <Trash2 size={28} color="#E53935" />
            </View>
            <Text style={styles.confirmTitle}>Eliminar gasto</Text>
            <Text style={styles.confirmMsg} numberOfLines={3}>
              ¿Estás seguro de eliminar{''}
              <Text style={{ fontWeight: '700' }}>
                {gastoToDelete?.descripcion?.toUpperCase()}
              </Text>
              ?{''}Esta acción no se puede deshacer.
            </Text>
            <View style={styles.confirmBtnRow}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                onPress={() => setConfirmDeleteVisible(false)}
              >
                <Text style={styles.confirmCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDeleteBtn}
                onPress={confirmDelete}
              >
                <Trash2 size={15} color="#fff" />
                <Text style={styles.confirmDeleteText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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

      {/* ===== EDIT GASTO MODAL ===== */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.editModalContent]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Gasto</Text>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.editScrollView}
              contentContainerStyle={styles.editScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Descripcion */}
              <View style={styles.editFieldGroup}>
                <Text style={styles.editLabel}>DESCRIPCIÓN</Text>
                <TextInput
                  style={styles.editInput}
                  value={editDescripcion}
                  onChangeText={setEditDescripcion}
                  placeholder="Descripción del gasto"
                  placeholderTextColor="#bbb"
                  autoCapitalize="characters"
                />
              </View>

              {/* Monto */}
              <View style={styles.editFieldGroup}>
                <Text style={styles.editLabel}>MONTO (S/)</Text>
                <TextInput
                  style={styles.editInput}
                  value={editMonto}
                  onChangeText={setEditMonto}
                  placeholder="0.00"
                  placeholderTextColor="#bbb"
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Fecha */}
              <View style={styles.editFieldGroup}>
                <Text style={styles.editLabel}>FECHA</Text>
                <TouchableOpacity
                  style={[styles.editInput, styles.editDateButton]}
                  onPress={() => setShowEditDateCalendar(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.editDateValue}>
                    {editFecha
                      ? formatDateDisplay(editFecha)
                      : 'Seleccionar fecha'}
                  </Text>
                  <CalendarDays size={18} color="#888" />
                </TouchableOpacity>
              </View>

              {/* Categoría */}
              <View style={styles.editFieldGroup}>
                <Text style={styles.editLabel}>CATEGORÍA</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.editCategoryScroll}
                >
                  {categorias.map((cat) => {
                    const visual = getCategoryVisual(cat.descripcion ?? '');
                    const isSelected =
                      editCategoria?.idcategoriagastos ===
                      cat.idcategoriagastos;
                    return (
                      <TouchableOpacity
                        key={cat.idcategoriagastos.toString()}
                        style={[
                          styles.editCategoryChip,
                          isSelected && {
                            borderColor: visual.color,
                            backgroundColor: visual.bgColor,
                          },
                        ]}
                        onPress={() => setEditCategoria(cat)}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            styles.editCategoryChipText,
                            isSelected && {
                              color: visual.color,
                              fontWeight: '700',
                            },
                          ]}
                        >
                          {cat.descripcion}
                        </Text>
                        {isSelected && <Check size={13} color={visual.color} />}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </ScrollView>

            {/* Footer buttons */}
            <View style={styles.editModalFooter}>
              <TouchableOpacity
                style={styles.editCancelBtn}
                onPress={() => setEditModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.editCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editSaveBtn, saving && { opacity: 0.7 }]}
                onPress={handleSaveEdit}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.editSaveText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Calendar for edit date */}
      <Modal
        visible={showEditDateCalendar}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditDateCalendar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar fecha</Text>
              <TouchableOpacity
                onPress={() => setShowEditDateCalendar(false)}
                style={styles.modalCloseBtn}
              >
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <Calendar
              current={editFecha}
              onDayPress={(day: any) => {
                setEditFecha(day.dateString);
                setShowEditDateCalendar(false);
              }}
              markedDates={{
                [editFecha]: {
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
                onPress={() => setShowEditDateCalendar(false)}
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

  // Total Card - Orange (compacto)
  totalCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#E8551E',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#E8551E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  totalCardLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  totalCardAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  totalCardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
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
  editBtn: {
    marginLeft: 10,
    padding: 6,
    backgroundColor: '#FFF3EE',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD9C8',
  },
  deleteBtn: {
    marginLeft: 6,
    padding: 6,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFCDD2',
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

  // Edit Modal
  editModalContent: {
    maxHeight: '90%',
  },
  editScrollView: {
    flexGrow: 0,
  },
  editScrollContent: {
    padding: 20,
    gap: 18,
  },
  editFieldGroup: {
    gap: 6,
  },
  editLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 0.6,
  },
  editInput: {
    backgroundColor: '#F7F8FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAECF0',
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1a1a1a',
  },
  editDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editDateValue: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  editCategoryScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  editCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F7F8FA',
    borderWidth: 1.5,
    borderColor: '#EAECF0',
  },
  editCategoryChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#555',
  },
  editModalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  editCancelBtn: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  editCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  editSaveBtn: {
    flex: 2,
    backgroundColor: '#E8551E',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editSaveText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },

  // Search bar
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAECF0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a1a',
    padding: 0,
  },

  // Confirm Delete Modal
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  confirmBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  confirmIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  confirmMsg: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  confirmBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  confirmCancelBtn: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  confirmDeleteBtn: {
    flex: 1,
    backgroundColor: '#E53935',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  confirmDeleteText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});

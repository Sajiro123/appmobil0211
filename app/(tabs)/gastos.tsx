import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { TrendingDown } from 'lucide-react-native';
import { gastosService } from '@/services/gastosService';
import { Gasto, CategoriaGasto } from '@/types/database';
import { DateRangePicker } from '@/components/DateRangePicker';
import { GastosFilter } from '@/components/GastosFilter';
import {
  getCategoryColor,
  getContrastColor,
  getLighterColor,
  getLighterVariant,
} from '@/utils/colorPalette';

interface GastoAgrupado {
  fecha: string;
  gastos: any[];
  total: number;
}

export default function GastosScreen() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoriaGasto | null>(
    null
  );

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

  const handleDateChange = (newStartDate: string, newEndDate: string) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGastos();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateForHeader = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-PE', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(amount);
  };

  // Filtrar gastos por categoría
  const filteredGastos = selectedCategory
    ? gastos.filter(
        (g) =>
          g.idcategoriagastos === selectedCategory.idcategoriagastos
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

  const renderDateHeader = (fecha: string) => (
    <View style={styles.dateHeaderContainer}>
      <View style={styles.dateHeaderLine} />
      <Text style={styles.dateHeaderText}>{formatDateForHeader(fecha)}</Text>
      <View style={styles.dateHeaderLine} />
    </View>
  );

  const renderGasto = (item: any) => {
    const categoryColor = getCategoryColor(
      item.categoriagastos?.descripcion || ''
    );

    return (
      <View style={styles.gastoCard}>
        <View style={styles.gastoCardContent}>
          <View style={styles.gastoLeftContent}>
            <Text style={styles.gastoDescripcion} numberOfLines={1}>
              {item.descripcion}
            </Text>
            {item.categoriagastos && (
              <View style={styles.categoryBadgeContainer}>
                <View
                  style={[
                    styles.categoryIndicator,
                    { backgroundColor: categoryColor },
                  ]}
                />
                <Text style={styles.categoryBadgeText} numberOfLines={1}>
                  {item.categoriagastos.descripcion}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.gastoRightContent}>
            <Text style={styles.gastoMonto}>{formatMoney(item.monto)}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderGastoGroup = ({ item }: { item: GastoAgrupado }) => (
    <View>
      {renderDateHeader(item.fecha)}
      {item.gastos.map((gasto, index) => (
        <View key={gasto.idgastos ? gasto.idgastos.toString() : `${item.fecha}-${index}`}>
          {renderGasto(gasto)}
        </View>
      ))}
      <View style={styles.dateTotalCard}>
        <Text style={styles.dateTotalLabel}>Subtotal</Text>
        <Text style={styles.dateTotalAmount}>{formatMoney(item.total)}</Text>
      </View>
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
      {/* Header Mejorado */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerSubtitle}>Balance de Gastos</Text>
            <Text style={styles.headerTitle}>
              {gastos.length} registro{gastos.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <TrendingDown size={32} color="#E63946" />
        </View>

        {/* Card de Total */}
        <View style={styles.totalCardBig}>
          <Text style={styles.totalCardLabel}>Gasto Total</Text>
          <Text style={styles.totalCardAmount}>{formatMoney(total)}</Text>
          <Text style={styles.totalCardPeriod}>
            {startDate === endDate ? `${formatDate(startDate)}` : `${formatDate(startDate)} - ${formatDate(endDate)}`}
          </Text>
        </View>
      </View>

      {/* Filtros */}
      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onDateChange={handleDateChange}
      />

      <GastosFilter
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        minAmount={0}
        maxAmount={0}
        onAmountChange={() => {}}
      />

      {/* Categorías Cards */}
      {Object.keys(byCategory).length > 0 && (
        <View style={styles.categoriesSection}>
          <Text style={styles.categoriesTitle}>Por Categoría</Text>
          <View style={styles.categoriesGrid}>
            {Object.entries(byCategory)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .map(([categoria, monto]) => {
                const categoryColor = getCategoryColor(categoria);
                const bgColor = getLighterColor(categoryColor, 92);
                const lightColor = getLighterVariant(categoryColor, 60);

                return (
                  <TouchableOpacity
                    key={categoria}
                    style={[styles.categoryCard, { backgroundColor: bgColor }]}
                    onPress={() => {
                      const cat = gastos.find(
                        (g) => g.categoriagastos?.descripcion === categoria
                      )?.categoriagastos;
                      if (cat) {
                        setSelectedCategory(cat);
                      }
                    }}
                  >
                    <View
                      style={[
                        styles.categoryCardIndicator,
                        { backgroundColor: categoryColor },
                      ]}
                    />
                    <Text style={styles.categoryCardName} numberOfLines={2}>
                      {categoria}
                    </Text>
                    <Text style={[styles.categoryCardAmount, { color: lightColor }]}>
                      {formatMoney(monto as number)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
          </View>
        </View>
      )}

      {/* Lista de Gastos */}
      <FlatList
        data={gastosPorFecha}
        renderItem={renderGastoGroup}
        keyExtractor={(item) => item.fecha}
        contentContainerStyle={styles.listContainer}
        scrollEnabled={true}
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
                : 'Ve a la pestaña "Nuevo Gasto" para agregar tu primer gasto'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  loadingText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    fontWeight: '500',
  },

  // Header
  headerContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 9,
    color: '#999',
    fontWeight: '500',
    marginBottom: 0,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },

  // Total Card Grande
  totalCardBig: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 9,
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  totalCardLabel: {
    fontSize: 9,
    color: '#aaa',
    fontWeight: '500',
  },
  totalCardAmount: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 2,
    letterSpacing: -0.5,
  },
  totalCardPeriod: {
    fontSize: 8,
    color: '#888',
    marginTop: 3,
  },

  // Categorías Section
  categoriesSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoriesTitle: {
    fontSize: 9,
    fontWeight: '700',
    color: '#333',
    marginBottom: 5,
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  categoriesGrid: {
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 8,
  },
  categoryCard: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 'auto',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCardIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: 3,
  },
  categoryCardName: {
    fontSize: 9,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 2,
  },
  categoryCardAmount: {
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Lista
  listContainer: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },

  // Date Header
  dateHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    marginHorizontal: 4,
  },
  dateHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dateHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    marginHorizontal: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  // Gasto Card
  gastoCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 5,
    marginHorizontal: 2,
    overflow: 'hidden',
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  gastoCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  gastoLeftContent: {
    flex: 1,
  },
  gastoDescripcion: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  categoryBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryBadgeText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  gastoRightContent: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  gastoMonto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D6A4F',
  },

  // Date Total
  dateTotalCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 8,
    marginHorizontal: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateTotalLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
  },
  dateTotalAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
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
});

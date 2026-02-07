import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { gastosService } from '@/services/gastosService';
import { Gasto } from '@/types/database';
import { DateRangePicker } from '@/components/DateRangePicker';
import { getCategoryColor, getContrastColor, getLighterColor } from '@/utils/colorPalette';

interface GastoAgrupado {
  fecha: string;
  gastos: any[];
  total: number;
}

export default function GastosScreen() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getDefaultDates = () => {
    const today = new Date();

    // Restar 30 días a la fecha actual
    const treintaDiasAgo = new Date(today);
    treintaDiasAgo.setDate(treintaDiasAgo.getDate() - 30);

    // Convertir a formato YYYY-MM-DD en la zona horaria de Lima
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
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(amount);
  };

  // Agrupar gastos por fecha
  const groupGastosByDate = (): GastoAgrupado[] => {
    const grouped: { [key: string]: any[] } = {};

    gastos.forEach((gasto) => {
      if (!grouped[gasto.fecha]) {
        grouped[gasto.fecha] = [];
      }
      grouped[gasto.fecha].push(gasto);
    });

    return Object.keys(grouped)
      .sort((a, b) => b.localeCompare(a)) // Ordenar por fecha descendente (más recientes primero)
      .map((fecha) => ({
        fecha,
        gastos: grouped[fecha],
        total: grouped[fecha].reduce((sum, g) => sum + g.monto, 0),
      }));
  };

  const calculateTotals = () => {
    const total = gastos.reduce((sum, gasto) => sum + gasto.monto, 0);
    const byCategory = gastos.reduce((acc: any, gasto) => {
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
    <View style={styles.dateHeader}>
      <Text style={styles.dateHeaderText}>{formatDateForHeader(fecha)}</Text>
    </View>
  );

  const renderGasto = (item: any) => (
    <View style={styles.gastoCard}>
      <View style={styles.gastoRow}>
        <View style={styles.gastoInfo}>
          <Text style={styles.gastoDescripcion} numberOfLines={1}>
            {item.descripcion}
          </Text>
        </View>
        <View style={styles.gastoRight}>
          <Text style={styles.gastoMonto}>{formatMoney(item.monto)}</Text>
          {item.categoriagastos && (
            <View
              style={[
                styles.gastoCategoria,
                {
                  backgroundColor: getCategoryColor(
                    item.categoriagastos.descripcion
                  ),
                },
              ]}
            >
              <Text
                style={[
                  styles.gastoCategoriaText,
                  {
                    color: getContrastColor(
                      getCategoryColor(item.categoriagastos.descripcion)
                    ),
                  },
                ]}
                numberOfLines={1}
              >
                {item.categoriagastos.descripcion}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  const renderGastoGroup = ({ item }: { item: GastoAgrupado }) => (
    <View>
      {renderDateHeader(item.fecha)}
      {item.gastos.map((gasto) => (
        <View key={gasto.id}>
          {renderGasto(gasto)}
        </View>
      ))}
      <View style={styles.dateTotal}>
        <Text style={styles.dateTotalLabel}>Total del día</Text>
        <Text style={styles.dateTotalAmount}>{formatMoney(item.total)}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando gastos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Gastos</Text>
        <Text style={styles.subtitle}>Total de registros: {gastos.length}</Text>
      </View>

      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onDateChange={handleDateChange}
      />

      <View style={styles.summaryContainer}>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total General</Text>
          <Text style={styles.totalAmount}>{formatMoney(total)}</Text>
        </View>

        {Object.keys(byCategory).length > 0 && (
          <View style={styles.categoriesContainer}>
            <Text style={styles.categoriesTitle}>Por Categoría</Text>
            <View style={styles.categoriesGrid}>
              {Object.entries(byCategory).map(([categoria, monto]) => {
                const categoryColor = getCategoryColor(categoria);
                const textColor = getContrastColor(categoryColor);
                const bgColor = getLighterColor(categoryColor, 85);

                return (
                  <View
                    key={categoria}
                    style={[styles.categoryItem, { backgroundColor: bgColor }]}
                  >
                    <Text
                      style={[styles.categoryName, { color: textColor }]}
                      numberOfLines={1}
                    >
                      {categoria}
                    </Text>
                    <Text
                      style={[
                        styles.categoryAmount,
                        { color: getCategoryColor(categoria) },
                      ]}
                    >
                      {formatMoney(monto as number)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </View>

      <FlatList
        data={gastosPorFecha}
        renderItem={renderGastoGroup}
        keyExtractor={(item) => item.fecha}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay gastos registrados</Text>
            <Text style={styles.emptySubtext}>
              Ve a la pestaña "Nuevo Gasto" para agregar tu primer gasto
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
    backgroundColor: '#f5f5f5',
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
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  listContainer: {
    padding: 12,
  },
  summaryContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  totalCard: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  categoriesContainer: {
    marginTop: 8,
  },
  categoriesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryItem: {
    borderRadius: 8,
    padding: 10,
    minWidth: '30%',
    flex: 1,
    maxWidth: '48%',
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  dateHeader: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginTop: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  dateHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
  },
  gastoCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  gastoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  gastoInfo: {
    flex: 1,
    marginRight: 12,
  },
  gastoDescripcion: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  gastoRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  gastoMonto: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  gastoCategoria: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  gastoCategoriaText: {
    fontSize: 9,
    fontWeight: '600',
  },
  dateTotal: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateTotalLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  dateTotalAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

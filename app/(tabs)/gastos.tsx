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

export default function GastosScreen() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getDefaultDates = () => {
    const today = new Date();

    // Restar 8 días a la fecha actual
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 8);

    // Convertir a formato YYYY-MM-DD en la zona horaria de Lima
    const formatPeru = (date: Date) =>
      date.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });

    return {
      startDate: formatPeru(sevenDaysAgo),
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
  const date = new Date(year, month - 1, day); // crea fecha en hora local
  return date.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};


  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(amount);
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

  const renderGasto = ({ item }: { item: any }) => (
    <View style={styles.gastoCard}>
      <View style={styles.gastoRow}>
        <View style={styles.gastoInfo}>
          <Text style={styles.gastoDescripcion} numberOfLines={1}>
            {item.descripcion}
          </Text>
          <Text style={styles.gastoFecha}>{formatDate(item.fecha)}</Text>
        </View>
        <View style={styles.gastoRight}>
          <Text style={styles.gastoMonto}>{formatMoney(item.monto)}</Text>
          {item.categoriagastos && (
            <Text style={styles.gastoCategoria} numberOfLines={1}>
              {item.categoriagastos.descripcion}
            </Text>
          )}
        </View>
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
        <Text style={styles.subtitle}>Total de gastos: {gastos.length}</Text>
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
              {Object.entries(byCategory).map(([categoria, monto]) => (
                <View key={categoria} style={styles.categoryItem}>
                  <Text style={styles.categoryName} numberOfLines={1}>
                    {categoria}
                  </Text>
                  <Text style={styles.categoryAmount}>
                    {formatMoney(monto as number)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      <FlatList
        data={gastos}
        renderItem={renderGasto}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
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
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 10,
    minWidth: '30%',
    flex: 1,
    maxWidth: '48%',
  },
  categoryName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
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
    alignItems: 'center',
  },
  gastoInfo: {
    flex: 1,
    marginRight: 12,
  },
  gastoDescripcion: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  gastoFecha: {
    fontSize: 12,
    color: '#999',
  },
  gastoRight: {
    alignItems: 'flex-end',
  },
  gastoMonto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  gastoCategoria: {
    fontSize: 10,
    color: '#fff',
    backgroundColor: '#2196F3',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
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

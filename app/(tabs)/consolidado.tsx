import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { pedidosService } from '@/services/pedidosService';
import { gastosService } from '@/services/gastosService';
import { CalendarDatePicker } from '@/components/CalendarDatePicker';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  ShoppingCart,
  Calendar,
} from 'lucide-react-native';

export default function ConsolidadoScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getDefaultDates = () => {
    const today = new Date();
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const [selectedDates, setSelectedDates] = useState<string[]>(getDefaultDates());

  const [totalIngresos, setTotalIngresos] = useState(0);
  const [totalGastos, setTotalGastos] = useState(0);
  const [totalPedidos, setTotalPedidos] = useState(0);
  const [pedidosPorDia, setPedidosPorDia] = useState<
    Array<{ fecha: string; total: number; cantidad: number }>
  >([]);

  useEffect(() => {
    loadData();
  }, [selectedDates]);

  const loadData = async () => {
    try {
      setLoading(true);

      if (selectedDates.length === 0) {
        setTotalIngresos(0);
        setTotalPedidos(0);
        setPedidosPorDia([]);
        setTotalGastos(0);
        setLoading(false);
        return;
      }

      const [resumenVentas, gastosData] = await Promise.all([
        pedidosService.getResumenVentasBySpecificDates(selectedDates),
        gastosService.getGastosBySpecificDates(selectedDates),
      ]);

      setTotalIngresos(resumenVentas.totalVentas);
      setTotalPedidos(resumenVentas.totalPedidos);
      setPedidosPorDia(resumenVentas.pedidosPorDia);

      const totalGastosCalculado = gastosData.reduce(
        (sum, gasto) => sum + gasto.monto,
        0
      );
      setTotalGastos(totalGastosCalculado);
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar el reporte consolidado');
      console.error('Error loading consolidado:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDatesChange = (dates: string[]) => {
    setSelectedDates(dates);
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(amount);
  };

  const gananciaNeta = totalIngresos - totalGastos;
  const margenGanancia =
    totalIngresos > 0 ? ((gananciaNeta / totalIngresos) * 100).toFixed(2) : '0';
  const ticketPromedio =
    totalPedidos > 0 ? totalIngresos / totalPedidos : 0;

  const diaMasRentable =
    pedidosPorDia.length > 0
      ? pedidosPorDia.reduce((max, dia) =>
          dia.total > max.total ? dia : max
        )
      : null;

  const chartConfig = {
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
  };

  const pieData = [
    {
      name: 'Ingresos',
      population: totalIngresos,
      color: '#4CAF50',
      legendFontColor: '#333',
      legendFontSize: 14,
    },
    {
      name: 'Gastos',
      population: totalGastos,
      color: '#F44336',
      legendFontColor: '#333',
      legendFontSize: 14,
    },
  ];

  const barData = {
    labels: ['Ingresos', 'Gastos', 'Ganancia'],
    datasets: [
      {
        data: [totalIngresos, totalGastos, Math.max(0, gananciaNeta)],
        colors: [
          (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
          (opacity = 1) => `rgba(244, 67, 54, ${opacity})`,
          (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
        ],
      },
    ],
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando reporte...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reporte Consolidado</Text>
      </View>

      <CalendarDatePicker
        selectedDates={selectedDates}
        onDatesChange={handleDatesChange}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCards}>
          <View style={styles.summaryCard}>
            <View style={styles.cardHeader}>
              <TrendingUp size={24} color="#4CAF50" />
              <Text style={styles.cardLabel}>Ingresos</Text>
            </View>
            <Text style={[styles.cardValue, { color: '#4CAF50' }]}>
              {formatMoney(totalIngresos)}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.cardHeader}>
              <TrendingDown size={24} color="#F44336" />
              <Text style={styles.cardLabel}>Gastos</Text>
            </View>
            <Text style={[styles.cardValue, { color: '#F44336' }]}>
              {formatMoney(totalGastos)}
            </Text>
          </View>
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Comparación Ingresos vs Gastos</Text>
          <PieChart
            data={pieData}
            width={Dimensions.get('window').width - 32}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            center={[10, 0]}
            absolute
          />
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Análisis Financiero</Text>
          <BarChart
            data={barData}
            width={Dimensions.get('window').width - 32}
            height={220}
            chartConfig={chartConfig}
            verticalLabelRotation={0}
            fromZero
            showValuesOnTopOfBars
            withCustomBarColorFromData
            flatColor
          />
        </View>

        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <View style={styles.metricIconContainer}>
              <DollarSign size={24} color="#2196F3" />
            </View>
            <View style={styles.metricContent}>
              <Text style={styles.metricLabel}>Ganancia Neta</Text>
              <Text
                style={[
                  styles.metricValue,
                  { color: gananciaNeta >= 0 ? '#4CAF50' : '#F44336' },
                ]}
              >
                {formatMoney(gananciaNeta)}
              </Text>
            </View>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricIconContainer}>
              <Percent size={24} color="#9C27B0" />
            </View>
            <View style={styles.metricContent}>
              <Text style={styles.metricLabel}>Margen de Ganancia</Text>
              <Text style={styles.metricValue}>{margenGanancia}%</Text>
            </View>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricIconContainer}>
              <ShoppingCart size={24} color="#FF9800" />
            </View>
            <View style={styles.metricContent}>
              <Text style={styles.metricLabel}>Ticket Promedio</Text>
              <Text style={styles.metricValue}>
                {formatMoney(ticketPromedio)}
              </Text>
            </View>
          </View>

          {diaMasRentable && (
            <View style={styles.metricCard}>
              <View style={styles.metricIconContainer}>
                <Calendar size={24} color="#4CAF50" />
              </View>
              <View style={styles.metricContent}>
                <Text style={styles.metricLabel}>Día Más Rentable</Text>
                <Text style={styles.metricValue}>
                  {new Date(diaMasRentable.fecha).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </Text>
                <Text style={styles.metricSubvalue}>
                  {formatMoney(diaMasRentable.total)} ({diaMasRentable.cantidad}{' '}
                  pedidos)
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  summaryCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  cardValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  metricsContainer: {
    gap: 12,
  },
  metricCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  metricIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  metricContent: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  metricSubvalue: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
});

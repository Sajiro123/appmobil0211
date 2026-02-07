import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { CalendarDays, X } from 'lucide-react-native';
import { pedidosService } from '@/services/pedidosService';
import { gastosService } from '@/services/gastosService';
import { PaymentMethodData } from '@/types/database';
import PaymentMethodChart from '@/components/PaymentMethodChart';
import SalesCard from '@/components/SalesCard';
import ExpenseCard from '@/components/ExpenseCard';

export default function ReporteScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0],
  );

  // Estados para ventas
  const [totalVentas, setTotalVentas] = useState(0);
  const [totalPedidos, setTotalPedidos] = useState(0);
  const [paymentData, setPaymentData] = useState<PaymentMethodData[]>([]);

  // Estados para gastos
  const [totalGastos, setTotalGastos] = useState(0);
  const [cantidadGastos, setCantidadGastos] = useState(0);
  const [gastosPorCategoria, setGastosPorCategoria] = useState<
    Array<{
      categoria: string;
      total: number;
      cantidad: number;
    }>
  >([]);

  useEffect(() => {
    let isMounted = true;

    const loadReporte = async () => {
      try {
        if (isMounted) setLoading(true);

        // Cargar datos de ventas
        const resumenVentas =
          await pedidosService.getResumenVentasByDate(selectedDate);

        // Cargar datos de gastos
        const resumenGastos =
          await gastosService.getResumenGastosByDate(selectedDate);

        if (isMounted) {
          // Actualizar ventas
          setTotalVentas(resumenVentas.totalVentas);
          setTotalPedidos(resumenVentas.totalPedidos);

          // Preparar datos para el gráfico circular de ventas
          const chartData: PaymentMethodData[] = [
            {
              name: 'Visa',
              population: resumenVentas.metodoPago.visa,
              color: '#1976D2',
              legendFontColor: '#333',
              legendFontSize: 14,
            },
            {
              name: 'Yape',
              population: resumenVentas.metodoPago.yape,
              color: '#9C27B0',
              legendFontColor: '#333',
              legendFontSize: 14,
            },
            {
              name: 'Plin',
              population: resumenVentas.metodoPago.plin,
              color: '#FF9800',
              legendFontColor: '#333',
              legendFontSize: 14,
            },
            {
              name: 'Efectivo',
              population: resumenVentas.metodoPago.efectivo,
              color: '#4CAF50',
              legendFontColor: '#333',
              legendFontSize: 14,
            },
          ];

          setPaymentData(chartData);

          // Actualizar gastos
          setTotalGastos(resumenGastos.totalGastos);
          setCantidadGastos(resumenGastos.cantidadGastos);
          setGastosPorCategoria(resumenGastos.gastosPorCategoria);
        }
      } catch (error) {
        if (isMounted) {
          Alert.alert('Error', 'No se pudo cargar el reporte');
          console.error('Error loading reporte:', error);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadReporte();

    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Cargar datos de ventas
      const resumenVentas =
        await pedidosService.getResumenVentasByDate(selectedDate);

      // Cargar datos de gastos
      const resumenGastos =
        await gastosService.getResumenGastosByDate(selectedDate);

      // Actualizar ventas
      setTotalVentas(resumenVentas.totalVentas);
      setTotalPedidos(resumenVentas.totalPedidos);

      const chartData: PaymentMethodData[] = [
        {
          name: 'Visa',
          population: resumenVentas.metodoPago.visa,
          color: '#1976D2',
          legendFontColor: '#333',
          legendFontSize: 14,
        },
        {
          name: 'Yape',
          population: resumenVentas.metodoPago.yape,
          color: '#9C27B0',
          legendFontColor: '#333',
          legendFontSize: 14,
        },
        {
          name: 'Plin',
          population: resumenVentas.metodoPago.plin,
          color: '#FF9800',
          legendFontColor: '#333',
          legendFontSize: 14,
        },
        {
          name: 'Efectivo',
          population: resumenVentas.metodoPago.efectivo,
          color: '#4CAF50',
          legendFontColor: '#333',
          legendFontSize: 14,
        },
      ];

      setPaymentData(chartData);

      // Actualizar gastos
      setTotalGastos(resumenGastos.totalGastos);
      setCantidadGastos(resumenGastos.cantidadGastos);
      setGastosPorCategoria(resumenGastos.gastosPorCategoria);
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el reporte');
    } finally {
      setRefreshing(false);
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    // Separa manualmente para evitar que se interprete como UTC
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // crea fecha en hora local (Perú)

    return date.toLocaleDateString('es-PE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleDateSelect = (day: any) => {
    setSelectedDate(day.dateString);
    setShowCalendar(false);
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
        <Text style={styles.title}>Reporte del Día</Text>
        <TouchableOpacity
          style={styles.dateSelector}
          onPress={() => setShowCalendar(true)}
        >
          <CalendarDays size={20} color="#4CAF50" />
          <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Cards de resumen de ventas */}
        <View style={styles.summaryCards}>
          <SalesCard
            title="Ventas Totales"
            value={formatMoney(totalVentas)}
            subtitle="Ingresos"
            icon="sales"
            color="#4CAF50"
          />
          <SalesCard
            title="Total Pedidos"
            value={totalPedidos.toString()}
            subtitle="Órdenes"
            icon="orders"
            color="#2196F3"
          />
        </View>

        {/* Cards de resumen de gastos */}
        <View style={styles.summaryCards}>
          <ExpenseCard
            title="Gastos Totales"
            value={formatMoney(totalGastos)}
            subtitle="Egresos"
            icon="expenses"
            color="#F44336"
          />
          <ExpenseCard
            title="Cantidad Gastos"
            value={cantidadGastos.toString()}
            subtitle="Registros"
            icon="category"
            color="#FF9800"
          />
        </View>

        {/* Balance neto */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceTitle}>Balance Neto</Text>
          <Text
            style={[
              styles.balanceAmount,
              {
                color: totalVentas - totalGastos >= 0 ? '#4CAF50' : '#F44336',
              },
            ]}
          >
            {formatMoney(totalVentas - totalGastos)}
          </Text>
          <Text style={styles.balanceSubtitle}>
            {totalVentas - totalGastos >= 0 ? 'Ganancia' : 'Pérdida'}
          </Text>
        </View>

        {/* Gráfico circular de métodos de pago */}
        <PaymentMethodChart
          data={paymentData}
          title="Ventas por Método de Pago"
        />

        {/* Detalles por método de pago */}
        <View style={styles.paymentDetails}>
          <Text style={styles.sectionTitle}>Desglose por Método de Pago</Text>

          {paymentData.map((method) => (
            <View key={method.name} style={styles.paymentRow}>
              <View style={styles.paymentInfo}>
                <View
                  style={[
                    styles.colorIndicator,
                    { backgroundColor: method.color },
                  ]}
                />
                <Text style={styles.paymentName}>{method.name}</Text>
              </View>
              <Text style={styles.paymentAmount}>
                {formatMoney(method.population)}
              </Text>
            </View>
          ))}
        </View>

        {/* Gastos por categoría */}
        {gastosPorCategoria.length > 0 && (
          <View style={styles.expenseDetails}>
            <Text style={styles.sectionTitle}>Gastos por Categoría</Text>

            {gastosPorCategoria.map((categoria) => (
              <View key={categoria.categoria} style={styles.categoryRow}>
                <View style={styles.categoryInfo}>
                  <View style={styles.categoryIndicator} />
                  <View>
                    <Text style={styles.categoryName}>
                      {categoria.categoria}
                    </Text>
                    <Text style={styles.categoryCount}>
                      {categoria.cantidad} gasto
                      {categoria.cantidad !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
                <Text style={styles.categoryAmount}>
                  {formatMoney(categoria.total)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal del calendario */}
      <Modal
        visible={showCalendar}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModal}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>Seleccionar Fecha</Text>
              <TouchableOpacity
                onPress={() => setShowCalendar(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <Calendar
              onDayPress={handleDateSelect}
              markedDates={{
                [selectedDate]: {
                  selected: true,
                  selectedColor: '#4CAF50',
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
          </View>
        </View>
      </Modal>
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
    marginBottom: 8,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  dateText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  summaryCards: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
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
  balanceTitle: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  balanceSubtitle: {
    fontSize: 14,
    color: '#999',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  paymentDetails: {
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
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  paymentName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  expenseDetails: {
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
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F44336',
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  categoryCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F44336',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 20,
    width: '90%',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
});

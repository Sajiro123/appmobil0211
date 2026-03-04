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
  Platform,
  Dimensions,
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import Svg, { Circle, G } from 'react-native-svg';
import {
  CalendarDays,
  X,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Receipt,
  Wallet,
  CreditCard,
  Smartphone,
  Banknote,
  ChartPie,
  Tag,
  UtensilsCrossed,
  Bus,
  Home,
  Gamepad2,
  HeartPulse,
  ShoppingBag,
  ChevronLeft,
  ArrowUpRight,
  CircleDollarSign,
  ClipboardList,
  Layers,
  Wrench,
  Zap,
} from 'lucide-react-native';
import { pedidosService } from '@/services/pedidosService';
import { gastosService } from '@/services/gastosService';
import { PaymentMethodData } from '@/types/database';

// Español para calendario
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

const screenWidth = Dimensions.get('window').width;

// Expense category icon map
const EXPENSE_ICON_MAP: Record<
  string,
  { icon: any; color: string; bgColor: string }
> = {
  comida: { icon: UtensilsCrossed, color: '#E65100', bgColor: '#FFF3E0' },
  insumos: { icon: UtensilsCrossed, color: '#E65100', bgColor: '#FFF3E0' },
  cocina: { icon: UtensilsCrossed, color: '#E65100', bgColor: '#FFF3E0' },
  transporte: { icon: Bus, color: '#1565C0', bgColor: '#E3F2FD' },
  pasajes: { icon: Bus, color: '#1565C0', bgColor: '#E3F2FD' },
  logística: { icon: Bus, color: '#1565C0', bgColor: '#E3F2FD' },
  hogar: { icon: Home, color: '#2E7D32', bgColor: '#E8F5E9' },
  ocio: { icon: Gamepad2, color: '#6A1B9A', bgColor: '#F3E5F5' },
  salud: { icon: HeartPulse, color: '#C62828', bgColor: '#FFEBEE' },
  compras: { icon: ShoppingBag, color: '#AD1457', bgColor: '#FCE4EC' },
  personal: { icon: Tag, color: '#0277BD', bgColor: '#E1F5FE' },
  pago: { icon: Wallet, color: '#0277BD', bgColor: '#E1F5FE' },
  pescado: { icon: UtensilsCrossed, color: '#00897B', bgColor: '#E0F2F1' },
  abarrotes: { icon: ShoppingBag, color: '#6D4C41', bgColor: '#EFEBE9' },
  mercadería: { icon: ShoppingBag, color: '#E65100', bgColor: '#FFF3E0' },
  servicios: { icon: Zap, color: '#F9A825', bgColor: '#FFFDE7' },
  mantenimiento: { icon: Wrench, color: '#546E7A', bgColor: '#ECEFF1' },
};

function getExpenseIcon(categoria: string) {
  const key = (categoria || '').toLowerCase().trim();
  for (const [mapKey, value] of Object.entries(EXPENSE_ICON_MAP)) {
    if (key.includes(mapKey)) return value;
  }
  return { icon: Tag, color: '#546E7A', bgColor: '#ECEFF1' };
}

// Payment method config with colors matching the reference
const PAYMENT_CONFIG = [
  { key: 'visa', name: 'Visa', color: '#1976D2', icon: CreditCard },
  { key: 'yape', name: 'Yape', color: '#9C27B0', icon: Smartphone },
  { key: 'plin', name: 'Plin', color: '#FF9800', icon: Smartphone },
  { key: 'efectivo', name: 'Efectivo', color: '#4CAF50', icon: Banknote },
];

export default function ReporteScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0],
  );

  const [totalVentas, setTotalVentas] = useState(0);
  const [totalPedidos, setTotalPedidos] = useState(0);
  const [paymentData, setPaymentData] = useState<PaymentMethodData[]>([]);
  const [metodoPago, setMetodoPago] = useState({
    visa: 0,
    yape: 0,
    plin: 0,
    efectivo: 0,
  });

  const [totalGastos, setTotalGastos] = useState(0);
  const [cantidadGastos, setCantidadGastos] = useState(0);
  const [gastosPorCategoria, setGastosPorCategoria] = useState<
    Array<{ categoria: string; total: number; cantidad: number }>
  >([]);

  const loadData = async (fecha: string) => {
    const resumenVentas = await pedidosService.getResumenVentasByDate(fecha);
    const resumenGastos = await gastosService.getResumenGastosByDate(fecha);

    setTotalVentas(resumenVentas.totalVentas);
    setTotalPedidos(resumenVentas.totalPedidos);
    setMetodoPago(resumenVentas.metodoPago);

    setPaymentData([
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
    ]);

    setTotalGastos(resumenGastos.totalGastos);
    setCantidadGastos(resumenGastos.cantidadGastos);
    setGastosPorCategoria(resumenGastos.gastosPorCategoria);
  };

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        if (isMounted) setLoading(true);
        await loadData(selectedDate);
      } catch (error) {
        if (isMounted) Alert.alert('Error', 'No se pudo cargar el reporte');
        console.error(error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData(selectedDate);
    } catch {
      Alert.alert('Error', 'No se pudo actualizar');
    } finally {
      setRefreshing(false);
    }
  };

  const formatMoney = (amount: number) =>
    `S/ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatDateHeader = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const formatted = date.toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'long',
    });
    return isToday ? `Hoy, ${formatted}` : formatted;
  };

  const handleDateSelect = (day: any) => {
    setSelectedDate(day.dateString);
    setShowCalendar(false);
  };

  const balance = totalVentas - totalGastos;
  const totalPayments = paymentData.reduce((s, d) => s + d.population, 0);
  const filteredPaymentData = paymentData.filter((d) => d.population > 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ChartPie size={40} color="#ccc" />
        <Text style={styles.loadingText}>Cargando reporte...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Orange Header */}
      <View style={styles.orangeHeader}>
        <View style={styles.orangeHeaderContent}>
          <TouchableOpacity style={styles.backBtn}>
            <ChevronLeft size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.orangeTitle}>Reporte del Día</Text>
            <Text style={styles.orangeSubtitle}>
              {formatDateHeader(selectedDate)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.calendarBtn}
            onPress={() => setShowCalendar(true)}
            activeOpacity={0.7}
          >
            <CalendarDays size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Balance Card - Green Gradient */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>
            BALANCE NETO ({balance >= 0 ? 'GANANCIA' : 'PÉRDIDA'})
          </Text>
          <Text style={styles.balanceAmount}>{formatMoney(balance)}</Text>
          <View style={styles.balanceBadge}>
            <ArrowUpRight size={12} color="#fff" />
            <Text style={styles.balanceBadgeText}>
              +
              {totalVentas > 0
                ? ((balance / totalVentas) * 100).toFixed(1)
                : '0'}
              % vs ayer
            </Text>
          </View>
        </View>

        {/* KPI Row 1: Ventas + Pedidos */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <View style={styles.kpiCardHeader}>
              <View style={[styles.kpiIcon, { backgroundColor: '#E8F5E9' }]}>
                <CircleDollarSign size={16} color="#4CAF50" />
              </View>
              <Text style={styles.kpiTitle}>VENTAS TOTALES</Text>
            </View>
            <Text style={[styles.kpiValue, { color: '#1a1a1a' }]}>
              {formatMoney(totalVentas)}
            </Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiCardHeader}>
              <View style={[styles.kpiIcon, { backgroundColor: '#E3F2FD' }]}>
                <ClipboardList size={16} color="#1976D2" />
              </View>
              <Text style={styles.kpiTitle}>TOTAL PEDIDOS</Text>
            </View>
            <Text style={[styles.kpiValue, { color: '#1a1a1a' }]}>
              {totalPedidos} <Text style={styles.kpiUnit}>unid.</Text>
            </Text>
          </View>
        </View>

        {/* KPI Row 2: Gastos + Cant. */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <View style={styles.kpiCardHeader}>
              <View style={[styles.kpiIcon, { backgroundColor: '#FFEBEE' }]}>
                <TrendingDown size={16} color="#E53935" />
              </View>
              <Text style={styles.kpiTitle}>GASTOS TOTALES</Text>
            </View>
            <Text style={[styles.kpiValue, { color: '#1a1a1a' }]}>
              {formatMoney(totalGastos)}
            </Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiCardHeader}>
              <View style={[styles.kpiIcon, { backgroundColor: '#FFF3E0' }]}>
                <Layers size={16} color="#E65100" />
              </View>
              <Text style={styles.kpiTitle}>CANT.GASTOS</Text>
            </View>
            <Text style={[styles.kpiValue, { color: '#1a1a1a' }]}>
              {cantidadGastos} <Text style={styles.kpiUnit}>registros</Text>
            </Text>
          </View>
        </View>

        {/* Ventas por Método de Pago - Donut */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              <ChartPie size={18} color="#1a1a1a" />
              <Text style={styles.sectionTitle}>Ventas por Método de Pago</Text>
            </View>
          </View>

          {filteredPaymentData.length > 0 ? (
            <View style={styles.donutSection}>
              <View style={styles.donutContainer}>
                {/* Custom SVG Donut */}
                <Svg width={130} height={130} viewBox="0 0 130 130">
                  <G rotation="-90" origin="65, 65">
                    {(() => {
                      const radius = 50;
                      const strokeWidth = 18;
                      const circumference = 2 * Math.PI * radius;
                      let cumulativePercent = 0;

                      return filteredPaymentData.map((item, index) => {
                        const percent =
                          totalPayments > 0
                            ? item.population / totalPayments
                            : 0;
                        const strokeDasharray = `${circumference * percent} ${circumference * (1 - percent)}`;
                        const strokeDashoffset =
                          -circumference * cumulativePercent;
                        cumulativePercent += percent;

                        return (
                          <Circle
                            key={index}
                            cx="65"
                            cy="65"
                            r={radius}
                            fill="none"
                            stroke={item.color}
                            strokeWidth={strokeWidth}
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="butt"
                          />
                        );
                      });
                    })()}
                  </G>
                </Svg>
                {/* Center label */}
                <View style={styles.donutCenter}>
                  <Text style={styles.donutCenterSmall}>TOTAL</Text>
                  <Text style={styles.donutCenterBig}>100%</Text>
                </View>
              </View>

              {/* Legend with colored dots */}
              <View style={styles.donutLegend}>
                {PAYMENT_CONFIG.map((method) => {
                  const amount =
                    metodoPago[method.key as keyof typeof metodoPago];
                  const pct =
                    totalPayments > 0
                      ? Math.round((amount / totalPayments) * 100)
                      : 0;
                  return (
                    <View key={method.key} style={styles.donutLegendItem}>
                      <View style={styles.donutLegendLeft}>
                        <View
                          style={[
                            styles.donutLegendDot,
                            { backgroundColor: method.color },
                          ]}
                        />
                        <Text style={styles.donutLegendName}>
                          {method.name}
                        </Text>
                      </View>
                      <Text style={styles.donutLegendPct}>{pct}%</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : (
            <View style={styles.noDataBox}>
              <ChartPie size={36} color="#ddd" />
              <Text style={styles.noDataText}>Sin ventas registradas</Text>
            </View>
          )}
        </View>

        {/* Desglose por Método */}
        <View style={styles.sectionCard}>
          <Text style={styles.desgloseTitle}>Desglose por Método</Text>

          {PAYMENT_CONFIG.map((method, index) => {
            const amount = metodoPago[method.key as keyof typeof metodoPago];
            const MethodIcon = method.icon;

            return (
              <View
                key={method.key}
                style={[
                  styles.desgloseRow,
                  index < PAYMENT_CONFIG.length - 1 && styles.desgloseRowBorder,
                ]}
              >
                <View style={styles.desgloseLeft}>
                  <View
                    style={[
                      styles.desgloseIcon,
                      { backgroundColor: method.color },
                    ]}
                  >
                    <MethodIcon size={16} color="#fff" />
                  </View>
                  <Text style={styles.desgloseName}>{method.name}</Text>
                </View>
                <Text style={styles.desgloseAmount}>{formatMoney(amount)}</Text>
              </View>
            );
          })}
        </View>

        {/* Gastos por Categoría */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Gastos por Categoría</Text>
            <TouchableOpacity>
              <Text style={styles.verTodosText}>Ver todos</Text>
            </TouchableOpacity>
          </View>

          {gastosPorCategoria.length > 0 ? (
            gastosPorCategoria
              .sort((a, b) => b.total - a.total)
              .map((cat, index) => {
                const visual = getExpenseIcon(cat.categoria);
                const IconComp = visual.icon;
                const pct =
                  totalGastos > 0
                    ? Math.round((cat.total / totalGastos) * 100)
                    : 0;

                return (
                  <View
                    key={cat.categoria}
                    style={[
                      styles.gastoRow,
                      index < gastosPorCategoria.length - 1 &&
                        styles.gastoRowBorder,
                    ]}
                  >
                    <View
                      style={[
                        styles.gastoIcon,
                        { backgroundColor: visual.bgColor },
                      ]}
                    >
                      <IconComp size={18} color={visual.color} />
                    </View>
                    <View style={styles.gastoInfo}>
                      <Text style={styles.gastoName}>{cat.categoria}</Text>
                      <Text style={styles.gastoMeta}>
                        {cat.cantidad} gasto{cat.cantidad !== 1 ? 's' : ''}{' '}
                        realizados
                      </Text>
                    </View>
                    <View style={styles.gastoRight}>
                      <Text style={styles.gastoAmount}>
                        - {formatMoney(cat.total)}
                      </Text>
                      <Text style={styles.gastoPct}>{pct}% DEL TOTAL</Text>
                    </View>
                  </View>
                );
              })
          ) : (
            <View style={styles.noDataBox}>
              <TrendingDown size={36} color="#ddd" />
              <Text style={styles.noDataText}>Sin gastos registrados</Text>
            </View>
          )}
        </View>
      </ScrollView>

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
                style={styles.modalCloseBtn}
              >
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <Calendar
              current={selectedDate}
              onDayPress={handleDateSelect}
              markedDates={{
                [selectedDate]: {
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
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowCalendar(false)}
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
    backgroundColor: '#F5F6FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F6FA',
  },
  loadingText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },

  // Header
  orangeHeader: {
    paddingTop: Platform.OS === 'ios' ? 54 : 36,
    paddingBottom: 18,
    paddingHorizontal: 16,
  },
  orangeHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    padding: 2,
  },
  calendarBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#E8551E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  orangeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  orangeSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
    fontWeight: '500',
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },

  // Balance Card
  balanceCard: {
    backgroundColor: '#ae410bff',
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.75)',
    letterSpacing: 1,
    marginBottom: 6,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  balanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  balanceBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },

  // KPI Rows
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EAECF0',
  },
  kpiCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  kpiIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiTitle: {
    fontSize: 9,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 0.5,
    flex: 1,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  kpiUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: '#aaa',
  },

  // Section Card
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  verTodosText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E8551E',
  },

  // Donut Chart
  donutSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  donutContainer: {
    position: 'relative',
    width: 130,
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutCenter: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutCenterSmall: {
    fontSize: 9,
    fontWeight: '600',
    color: '#aaa',
    letterSpacing: 0.5,
  },
  donutCenterBig: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  donutLegend: {
    flex: 1,
    paddingLeft: 8,
    gap: 12,
  },
  donutLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  donutLegendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  donutLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  donutLegendName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
  },
  donutLegendPct: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
  },

  // Desglose
  desgloseTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 14,
  },
  desgloseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  desgloseRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  desgloseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  desgloseIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  desgloseName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  desgloseAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },

  // Gastos rows
  gastoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  gastoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  gastoIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  gastoInfo: {
    flex: 1,
  },
  gastoName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 3,
  },
  gastoMeta: {
    fontSize: 10,
    color: '#999',
    fontWeight: '500',
  },
  gastoRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  gastoAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E53935',
    marginBottom: 2,
  },
  gastoPct: {
    fontSize: 9,
    fontWeight: '600',
    color: '#aaa',
    letterSpacing: 0.3,
  },

  // No data
  noDataBox: {
    paddingVertical: 36,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 13,
    color: '#999',
    marginTop: 8,
  },

  // Calendar Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
  modalBtnRow: {
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

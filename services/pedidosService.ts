import { supabase } from '@/lib/supabase';
import { Pedido } from '@/types/database';

export const pedidosService = {
  // Obtener pedidos del día actual
  async getPedidosByDate(fecha: string): Promise<Pedido[]> {
    debugger;

    const { data, error } = await supabase
      .from('pedido')
      .select('*')
      .eq('fecha', fecha)
      .eq('estado', 3)
      .is('deleted', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pedidos:', error);
      throw error;
    }

    return data || [];
  },

  // Obtener pedidos del día actual
  async getPedidosHoy(): Promise<Pedido[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getPedidosByDate(today);
  },

  // Obtener resumen de ventas por método de pago del día
  async getResumenVentasByDate(fecha: string): Promise<{
    totalVentas: number;
    totalPedidos: number;
    metodoPago: {
      visa: number;
      yape: number;
      plin: number;
      efectivo: number;
    };
  }> {
    const pedidos = await this.getPedidosByDate(fecha);

    const resumen = pedidos.reduce(
      (acc, pedido) => {
        acc.totalVentas += pedido.total;
        acc.totalPedidos += 1;
        acc.metodoPago.visa += pedido.visa;
        acc.metodoPago.yape += pedido.yape;
        acc.metodoPago.plin += pedido.plin;
        acc.metodoPago.efectivo += pedido.efectivo;
        return acc;
      },
      {
        totalVentas: 0,
        totalPedidos: 0,
        metodoPago: {
          visa: 0,
          yape: 0,
          plin: 0,
          efectivo: 0,
        },
      }
    );

    return resumen;
  },

  // Obtener resumen de ventas del día actual
  async getResumenVentasHoy(): Promise<{
    totalVentas: number;
    totalPedidos: number;
    metodoPago: {
      visa: number;
      yape: number;
      plin: number;
      efectivo: number;
    };
  }> {
    const today = new Date().toISOString().split('T')[0];
    return this.getResumenVentasByDate(today);
  },

  // Obtener pedidos por rango de fechas
  async getPedidosByDateRange(fechaInicio: string, fechaFin: string): Promise<Pedido[]> {
    const { data, error } = await supabase
      .from('pedido')
      .select('*')
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin)
      .eq('estado', 3)
      .is('deleted', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pedidos by date range:', error);
      throw error;
    }

    return data || [];
  },

  // Obtener resumen de ventas por rango de fechas
  async getResumenVentasByDateRange(fechaInicio: string, fechaFin: string): Promise<{
    totalVentas: number;
    totalPedidos: number;
    metodoPago: {
      visa: number;
      yape: number;
      plin: number;
      efectivo: number;
    };
    pedidosPorDia: Array<{ fecha: string; total: number; cantidad: number }>;
  }> {
    const pedidos = await this.getPedidosByDateRange(fechaInicio, fechaFin);

    const pedidosPorDiaMap: { [key: string]: { total: number; cantidad: number } } = {};

    const resumen = pedidos.reduce(
      (acc, pedido) => {
        acc.totalVentas += pedido.total;
        acc.totalPedidos += 1;
        acc.metodoPago.visa += pedido.visa;
        acc.metodoPago.yape += pedido.yape;
        acc.metodoPago.plin += pedido.plin;
        acc.metodoPago.efectivo += pedido.efectivo;

        if (!pedidosPorDiaMap[pedido.fecha]) {
          pedidosPorDiaMap[pedido.fecha] = { total: 0, cantidad: 0 };
        }
        pedidosPorDiaMap[pedido.fecha].total += pedido.total;
        pedidosPorDiaMap[pedido.fecha].cantidad += 1;

        return acc;
      },
      {
        totalVentas: 0,
        totalPedidos: 0,
        metodoPago: {
          visa: 0,
          yape: 0,
          plin: 0,
          efectivo: 0,
        },
        pedidosPorDia: [] as Array<{ fecha: string; total: number; cantidad: number }>,
      }
    );

    resumen.pedidosPorDia = Object.entries(pedidosPorDiaMap).map(([fecha, data]) => ({
      fecha,
      total: data.total,
      cantidad: data.cantidad,
    }));

    return resumen;
  },

  // Obtener resumen de ventas por fechas específicas
  async getResumenVentasBySpecificDates(fechas: string[]): Promise<{
    totalVentas: number;
    totalPedidos: number;
    metodoPago: {
      visa: number;
      yape: number;
      plin: number;
      efectivo: number;
    };
    pedidosPorDia: Array<{ fecha: string; total: number; cantidad: number }>;
  }> {
    if (fechas.length === 0) {
      return {
        totalVentas: 0,
        totalPedidos: 0,
        metodoPago: {
          visa: 0,
          yape: 0,
          plin: 0,
          efectivo: 0,
        },
        pedidosPorDia: [],
      };
    }

    const { data, error } = await supabase
      .from('pedido')
      .select('*')
      .in('fecha', fechas)
      .eq('estado', 3)
      .is('deleted', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pedidos by specific dates:', error);
      throw error;
    }

    const pedidos = data || [];
    const pedidosPorDiaMap: { [key: string]: { total: number; cantidad: number } } = {};

    const resumen = pedidos.reduce(
      (acc, pedido) => {
        acc.totalVentas += pedido.total;
        acc.totalPedidos += 1;
        acc.metodoPago.visa += pedido.visa;
        acc.metodoPago.yape += pedido.yape;
        acc.metodoPago.plin += pedido.plin;
        acc.metodoPago.efectivo += pedido.efectivo;

        if (!pedidosPorDiaMap[pedido.fecha]) {
          pedidosPorDiaMap[pedido.fecha] = { total: 0, cantidad: 0 };
        }
        pedidosPorDiaMap[pedido.fecha].total += pedido.total;
        pedidosPorDiaMap[pedido.fecha].cantidad += 1;

        return acc;
      },
      {
        totalVentas: 0,
        totalPedidos: 0,
        metodoPago: {
          visa: 0,
          yape: 0,
          plin: 0,
          efectivo: 0,
        },
        pedidosPorDia: [] as Array<{ fecha: string; total: number; cantidad: number }>,
      }
    );

    resumen.pedidosPorDia = Object.entries(pedidosPorDiaMap).map(([fecha, data]) => ({
      fecha,
      total: data.total,
      cantidad: data.cantidad,
    }));

    return resumen;
  },
};



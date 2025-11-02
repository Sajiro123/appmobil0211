import { supabase } from '@/lib/supabase';
import { Gasto, CategoriaGasto } from '@/types/database';

export const gastosService = {
  // Obtener todas las categorías de gastos
  async getCategorias(): Promise<CategoriaGasto[]> {
    const { data, error } = await supabase
      .from('categoriagastos')
      .select('*')
      .order('descripcion');

    if (error) {
      console.error('Error fetching categorias:', error);
      throw error;
    }

    return data || [];
  },

  // Crear un nuevo gasto
  async createGasto(gasto: Omit<Gasto, 'id'>): Promise<Gasto> {
    const { data, error } = await supabase
      .from('gastos')
      .insert([gasto])
      .select()
      .single();

    if (error) {
      console.error('Error creating gasto:', error);
      throw error;
    }

    return data;
  },

  // Obtener todos los gastos
  async getGastos(fechaInicio?: string, fechaFin?: string): Promise<any[]> {
    let query = supabase
      .from('gastos')
      .select(
        `
      idgastos,
      monto,
      descripcion,
      fecha,
      idcategoriagastos,
      categoriagastos:idcategoriagastos (
        idcategoriagastos,
        descripcion
      )
    `
      )
      .eq('app', 1);

    if (fechaInicio) {
      query = query.gte('fecha', fechaInicio);
    }

    if (fechaFin) {
      query = query.lte('fecha', fechaFin);
    }

    const { data, error } = await query.order('fecha', { ascending: false });

    if (error) {
      console.error('Error fetching gastos:', error);
      throw error;
    }

    return data || [];
  },

  // Obtener gastos por fecha específica
  async getGastosByDate(fecha: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('gastos')
      .select(
        `
        idgastos,
        monto,
        descripcion,
        fecha,
        idcategoriagastos,
        categoriagastos:idcategoriagastos (
          idcategoriagastos,
          descripcion
        )
      `
      )
      .is('app', null)
      .eq('fecha', fecha)
      .order('fecha', { ascending: false });

    if (error) {
      console.error('Error fetching gastos by date:', error);
      throw error;
    }

    return data || [];
  },

  // Obtener resumen de gastos por fecha
  async getResumenGastosByDate(fecha: string): Promise<{
    totalGastos: number;
    cantidadGastos: number;
    gastosPorCategoria: Array<{
      categoria: string;
      total: number;
      cantidad: number;
    }>;
  }> {
    const gastos = await this.getGastosByDate(fecha);

    const resumen = gastos.reduce(
      (acc, gasto) => {
        acc.totalGastos += gasto.monto;
        acc.cantidadGastos += 1;

        const categoria = gasto.categoriagastos?.descripcion || 'Sin categoría';
        const existingCategory = acc.gastosPorCategoria.find(
          (cat) => cat.categoria === categoria
        );

        if (existingCategory) {
          existingCategory.total += gasto.monto;
          existingCategory.cantidad += 1;
        } else {
          acc.gastosPorCategoria.push({
            categoria,
            total: gasto.monto,
            cantidad: 1,
          });
        }

        return acc;
      },
      {
        totalGastos: 0,
        cantidadGastos: 0,
        gastosPorCategoria: [] as Array<{
          categoria: string;
          total: number;
          cantidad: number;
        }>,
      }
    );

    return resumen;
  },

  // Obtener gastos por fechas específicas
  async getGastosBySpecificDates(fechas: string[]): Promise<any[]> {
    if (fechas.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('gastos')
      .select(
        `
      idgastos,
      monto,
      descripcion,
      fecha,
      idcategoriagastos,
      categoriagastos:idcategoriagastos (
        idcategoriagastos,
        descripcion
      )
    `
      )
      .in('fecha', fechas)
      .order('fecha', { ascending: false });

    if (error) {
      console.error('Error fetching gastos by specific dates:', error);
      throw error;
    }

    return data || [];
  },
};

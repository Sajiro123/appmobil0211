export interface Gasto {
  id?: number;
  fecha: string;
  monto: number;
  notas?: string;
  idcategoriagastos: number;
  descripcion: string;
  app: string;
  id_created_at: number;
}

export interface CategoriaGasto {
  idcategoriagastos: number;
  descripcion?: string;
}

export interface Pedido {
  idpedido: number;
  fecha: string;
  total: number;
  total_pedidos: number;
  estado: string;
  mesa?: string;
  descuento?: number;
  acronimo?: string;
  created_at: string;
  updated_at?: string;
  deleted_at?: string;
  id_created_at: number;
  id_updated_at?: number;
  id_deleted_at?: number;
  deleted: boolean;
  comentario?: string;
  visa: number;
  yape: number;
  plin: number;
  efectivo: number;
  motivo?: string;
  responsable?: string;
  cliente?: string;
}

export interface PaymentMethodData {
  name: string;
  population: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

/**
 * Sistema de colores para categorías de gastos
 * Asigna colores consistentes basados en el nombre de la categoría
 */

const COLOR_PALETTE = [
  '#FF6B6B', // Rojo
  '#4ECDC4', // Turquesa
  '#45B7D1', // Azul cielo
  '#FFA07A', // Salmón
  '#98D8C8', // Menta
  '#F7DC6F', // Amarillo dorado
  '#BB8FCE', // Púrpura
  '#85C1E2', // Azul claro
  '#F8B88B', // Naranja
  '#81C995', // Verde
  '#E59866', // Naranja oscuro
  '#5DADE2', // Azul profundo
];

/**
 * Genera un color consistente basado en el nombre de la categoría
 * El mismo nombre siempre generará el mismo color
 */
export function getCategoryColor(categoryName: string): string {
  if (!categoryName) return COLOR_PALETTE[0];

  // Hash simple para generar un índice consistente
  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    const char = categoryName.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convertir a entero de 32 bits
  }

  const index = Math.abs(hash) % COLOR_PALETTE.length;
  return COLOR_PALETTE[index];
}

/**
 * Obtiene un color de texto óptimo (blanco o negro) basado en el color de fondo
 */
export function getContrastColor(hexColor: string): string {
  // Convertir hex a RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  // Calcular luminancia
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Retornar blanco o negro basado en luminancia
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Obtiene un color más claro para usar como fondo
 */
export function getLighterColor(hexColor: string, percent: number = 80): string {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  const newR = Math.round(r + (255 - r) * ((100 - percent) / 100));
  const newG = Math.round(g + (255 - g) * ((100 - percent) / 100));
  const newB = Math.round(b + (255 - b) * ((100 - percent) / 100));

  return `rgb(${newR}, ${newG}, ${newB})`;
}

import { useEffect } from 'react';

/**
 * Hook para suprimir advertencias conocidas de librerías terceros
 * Mejora la experiencia del desarrollador filtrando warnings que no afectan funcionalmente
 */
export function useConsoleWarningFilter() {
  useEffect(() => {
    // Solo aplicar en ambiente web
    if (typeof window === 'undefined') return;

    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    // Filtrar console.error
    console.error = function (...args: any[]) {
      const message = args[0];
      
      // Suprimir advertencia de transform-origin de react-native-calendars
      if (
        typeof message === 'string' &&
        message.includes('Invalid DOM property') &&
        (message.includes('transform-origin') || message.includes('transformOrigin'))
      ) {
        return;
      }

      // Suprimir otras advertencias de propiedades DOM inválidas de librerías web/calendar
      if (
        typeof message === 'string' &&
        message.includes('Invalid DOM property') &&
        (message.includes('aria-') || 
         message.includes('data-') ||
         message.includes('role'))
      ) {
        return;
      }

      originalConsoleError.apply(console, args);
    };

    // Filtrar console.warn también para advertencias menos críticas
    console.warn = function (...args: any[]) {
      const message = args[0];

      // Suprimir avisos específicos de react-native-calendars
      if (
        typeof message === 'string' &&
        (message.includes('Non-serializable values') ||
         message.includes('ViewPropTypes will be removed'))
      ) {
        return;
      }

      originalConsoleWarn.apply(console, args);
    };

    // Limpiar al desmontar (restaurar originales)
    return () => {
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, []);
}

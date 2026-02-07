import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { Calendar } from 'lucide-react-native';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onDateChange: (startDate: string, endDate: string) => void;
}

export function DateRangePicker({
  startDate,
  endDate,
  onDateChange,
}: DateRangePickerProps) {
  const [showStartPicker, setShowStartPicker] = React.useState(false);
  const [showEndPicker, setShowEndPicker] = React.useState(false);
  const parseLocalDate = (str: string) => {
    const [year, month, day] = str.split('-').map(Number);
    return new Date(year, month - 1, day); // siempre local
  };
  const formatDisplayDate = (dateString: string) => {
    debugger;
    const date = parseLocalDate(dateString);

    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'America/Lima', // 👈 asegura que se muestre según hora de Perú
    });
  };

  const generateDateOptions = () => {
    const options = [];
    const today = new Date();

    // helper para formatear en Perú
    const formatPeru = (d: Date) =>
      d.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });

    // Generar opciones para 365 días atrás (un año completo)
    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      options.push({
        value: formatPeru(date), // YYYY-MM-DD en horario Lima
        label: date.toLocaleDateString('es-ES', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          timeZone: 'America/Lima', // importante también en el label
        }),
      });
    }

    return options;
  };

  // Sin límite de días - permite cualquier rango de fechas
  const validateDateRange = (start: string, end: string) => {
    // Validar que la fecha final sea igual o posterior a la inicial
    return start <= end;
  };

  const handleStartDateSelect = (date: string) => {
    const formatPeru = (d: Date) =>
      d.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });

    const isValid = validateDateRange(date, endDate);

    if (isValid) {
      onDateChange(date, endDate);
      setShowStartPicker(false);
    } else {
      const newEndDate = new Date(date);
      newEndDate.setDate(newEndDate.getDate() + 8);

      onDateChange(date, formatPeru(newEndDate));
      setShowStartPicker(false);
    }
  };

  const handleEndDateSelect = (date: string) => {
    const formatPeru = (d: Date) =>
      d.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });

    const isValid = validateDateRange(startDate, date);

    if (isValid) {
      onDateChange(startDate, date);
      setShowEndPicker(false);
    } else {
      const newStartDate = new Date(date);
      newStartDate.setDate(newStartDate.getDate() - 8);

      onDateChange(formatPeru(newStartDate), date);
      setShowEndPicker(false);
    }
  };

  const dateOptions = generateDateOptions();

  return (
    <View style={styles.container}>
      <View style={styles.dateRow}>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowStartPicker(true)}
        >
          <Calendar size={18} color="#2196F3" />
          <View style={styles.dateTextContainer}>
            <Text style={styles.dateLabel}>Desde</Text>
            <Text style={styles.dateValue}>{formatDisplayDate(startDate)}</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.separator}>-</Text>

        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowEndPicker(true)}
        >
          <Calendar size={18} color="#2196F3" />
          <View style={styles.dateTextContainer}>
            <Text style={styles.dateLabel}>Hasta</Text>
            <Text style={styles.dateValue}>{formatDisplayDate(endDate)}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showStartPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStartPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar fecha de inicio</Text>
              <TouchableOpacity onPress={() => setShowStartPicker(false)}>
                <Text style={styles.closeButton}>Cerrar</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.dateList}>
              {dateOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.dateOption,
                    startDate === option.value && styles.selectedDateOption,
                  ]}
                  onPress={() => handleStartDateSelect(option.value)}
                >
                  <Text
                    style={[
                      styles.dateOptionText,
                      startDate === option.value &&
                        styles.selectedDateOptionText,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showEndPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEndPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar fecha de fin</Text>
              <TouchableOpacity onPress={() => setShowEndPicker(false)}>
                <Text style={styles.closeButton}>Cerrar</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.dateList}>
              {dateOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.dateOption,
                    endDate === option.value && styles.selectedDateOption,
                  ]}
                  onPress={() => handleEndDateSelect(option.value)}
                >
                  <Text
                    style={[
                      styles.dateOptionText,
                      endDate === option.value && styles.selectedDateOptionText,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateTextContainer: {
    marginLeft: 8,
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  separator: {
    fontSize: 18,
    color: '#666',
    marginHorizontal: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
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
  closeButton: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
  },
  dateList: {
    padding: 16,
  },
  dateOption: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f8f8f8',
  },
  selectedDateOption: {
    backgroundColor: '#2196F3',
  },
  dateOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedDateOptionText: {
    color: '#fff',
    fontWeight: '600',
  },
});

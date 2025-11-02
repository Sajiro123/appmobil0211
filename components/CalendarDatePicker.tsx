import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { CalendarDays, X } from 'lucide-react-native';

interface CalendarDatePickerProps {
  selectedDates: string[];
  onDatesChange: (dates: string[]) => void;
}

export function CalendarDatePicker({
  selectedDates,
  onDatesChange,
}: CalendarDatePickerProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [tempSelectedDates, setTempSelectedDates] = useState<string[]>(selectedDates);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  const formatDisplayDates = () => {
    if (selectedDates.length === 0) return 'Seleccionar rango de fechas';
    if (selectedDates.length === 1) {
      return new Date(selectedDates[0]).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
    const sortedDates = [...selectedDates].sort();
    const firstDate = new Date(sortedDates[0]).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
    });
    const lastDate = new Date(sortedDates[sortedDates.length - 1]).toLocaleDateString(
      'es-ES',
      { day: '2-digit', month: 'short', year: 'numeric' }
    );
    return `${firstDate} - ${lastDate} (${selectedDates.length} días)`;
  };

  const getDatesBetween = (start: string, end: string): string[] => {
    const dates: string[] = [];
    const startDateObj = new Date(start);
    const endDateObj = new Date(end);

    const currentDate = new Date(startDateObj);
    while (currentDate <= endDateObj) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  };

  const handleDayPress = (day: any) => {
    const dateString = day.dateString;

    if (!startDate || (startDate && endDate)) {
      setStartDate(dateString);
      setEndDate(null);
      setTempSelectedDates([dateString]);
    } else if (startDate && !endDate) {
      if (dateString < startDate) {
        setStartDate(dateString);
        setEndDate(startDate);
        const dates = getDatesBetween(dateString, startDate);
        setTempSelectedDates(dates);
      } else if (dateString > startDate) {
        setEndDate(dateString);
        const dates = getDatesBetween(startDate, dateString);
        setTempSelectedDates(dates);
      } else {
        setStartDate(dateString);
        setEndDate(null);
        setTempSelectedDates([dateString]);
      }
    }
  };

  const handleApply = () => {
    if (tempSelectedDates.length > 0) {
      onDatesChange(tempSelectedDates);
    }
    setShowCalendar(false);
  };

  const handleCancel = () => {
    setTempSelectedDates(selectedDates);
    const sortedDates = [...selectedDates].sort();
    if (sortedDates.length > 0) {
      setStartDate(sortedDates[0]);
      setEndDate(sortedDates[sortedDates.length - 1]);
    } else {
      setStartDate(null);
      setEndDate(null);
    }
    setShowCalendar(false);
  };

  const handleClearAll = () => {
    setTempSelectedDates([]);
    setStartDate(null);
    setEndDate(null);
  };

  const markedDates = tempSelectedDates.reduce((acc: any, date, index) => {
    const isStart = date === startDate;
    const isEnd = date === endDate;

    acc[date] = {
      selected: true,
      selectedColor: '#4CAF50',
      startingDay: isStart,
      endingDay: isEnd || (isStart && !endDate),
      color: '#4CAF50',
      textColor: '#ffffff',
    };
    return acc;
  }, {});

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowCalendar(true)}
      >
        <CalendarDays size={20} color="#4CAF50" />
        <View style={styles.dateTextContainer}>
          <Text style={styles.dateLabel}>Rango de fechas</Text>
          <Text style={styles.dateValue}>{formatDisplayDates()}</Text>
        </View>
      </TouchableOpacity>

      <Modal
        visible={showCalendar}
        transparent
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Rango de Fechas</Text>
              <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                {tempSelectedDates.length} día{tempSelectedDates.length !== 1 ? 's' : ''} seleccionado{tempSelectedDates.length !== 1 ? 's' : ''}
              </Text>
              {tempSelectedDates.length > 0 && (
                <TouchableOpacity onPress={handleClearAll}>
                  <Text style={styles.clearText}>Limpiar</Text>
                </TouchableOpacity>
              )}
            </View>

            <Calendar
              onDayPress={handleDayPress}
              markedDates={markedDates}
              markingType="period"
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

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.applyButton]}
                onPress={handleApply}
              >
                <Text style={styles.applyButtonText}>Aplicar</Text>
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
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateTextContainer: {
    marginLeft: 12,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
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
    padding: 4,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8f8f8',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  clearText: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  applyButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

import React from 'react';
import { View, StyleSheet } from 'react-native';
import ExpenseForm from '@/components/ExpenseForm';

export default function HomeScreen() {
  const handleExpenseAdded = () => {
    // Aquí podrías agregar lógica adicional después de agregar un gasto
    console.log('Gasto agregado exitosamente');
  };

  return (
    <View style={styles.container}>
      <ExpenseForm onExpenseAdded={handleExpenseAdded} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
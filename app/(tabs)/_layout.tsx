import { Tabs } from 'expo-router';
import { CirclePlus, Wallet, ChartPie, User } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          height: 60,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.3,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'NUEVO',
          tabBarIcon: ({ size, color }) => (
            <CirclePlus size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="gastos"
        options={{
          title: 'GASTOS',
          tabBarIcon: ({ size, color }) => <Wallet size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reporte"
        options={{
          title: 'REPORTE',
          tabBarIcon: ({ size, color }) => (
            <ChartPie size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="consolidado"
        options={{
          title: 'PERFIL',
          tabBarIcon: ({ size, color }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

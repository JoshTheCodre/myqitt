import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Colors } from '@/constants/theme'

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="assignment/[id]" />
        <Stack.Screen name="assignment/add" />
        <Stack.Screen name="course/[code]" />
        <Stack.Screen name="timetable/add" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="resources" />
        <Stack.Screen name="department" />
        <Stack.Screen name="classmates" />
        <Stack.Screen name="courses" />
      </Stack>
    </>
  )
}

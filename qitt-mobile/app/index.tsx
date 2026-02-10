import { Redirect } from 'expo-router'

export default function Index() {
  // In a real app, check auth state here
  // For now, redirect to auth
  return <Redirect href="/(auth)" />
}

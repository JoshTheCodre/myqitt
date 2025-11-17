import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyA0iqGS04NPAEqpvqmeWwMMT66ov0qr7i8",
  authDomain: "qitt-e87a1.firebaseapp.com",
  projectId: "qitt-e87a1",
  storageBucket: 'qitt-e87a1.firebasestorage.app',
  messagingSenderId: "935131186150",
  appId: "1:935131186150:web:f534f8e23ceede70b74c27",
  measurementId: "G-LYLJWBSR0B"
}

export const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)

export default app

import { initializeApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, collection, addDoc, doc, setDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyA0iqGS04NPAEqpvqmeWwMMT66ov0qr7i8',
  authDomain: 'qitt-e87a1.firebaseapp.com',
  projectId: 'qitt-e87a1',
  storageBucket: 'qitt-e87a1.firebasestorage.app',
  messagingSenderId: '935131186150',
  appId: '1:935131186150:web:f534f8e23ceede70b74c27',
  measurementId: 'G-LYLJWBSR0B',
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

const testUsers = [
  {
    email: 'john@example.com',
    password: 'Password123',
    fullName: 'John Doe',
    phoneNumber: '+234 801 234 5678',
    school: 'uniport',
    department: 'cs',
    level: '300',
    semester: '1',
  },
  {
    email: 'jane@example.com',
    password: 'Password123',
    fullName: 'Jane Smith',
    phoneNumber: '+234 802 345 6789',
    school: 'rsu',
    department: 'eng',
    level: '200',
    semester: '2',
  },
  {
    email: 'alex@example.com',
    password: 'Password123',
    fullName: 'Alex Johnson',
    phoneNumber: '+234 803 456 7890',
    school: 'uniport',
    department: 'cs',
    level: '100',
    semester: '1',
  },
]

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...')

    for (const userData of testUsers) {
      try {
        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          userData.email,
          userData.password
        )
        const uid = userCredential.user.uid

        // Create user profile in Firestore
        await setDoc(doc(db, 'users', uid), {
          uid,
          fullName: userData.fullName,
          email: userData.email,
          phoneNumber: userData.phoneNumber,
          school: userData.school,
          department: userData.department,
          level: userData.level,
          semester: userData.semester,
          createdAt: new Date(),
        })

        console.log(`✅ Created user: ${userData.email} (${userData.fullName})`)
      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
          console.log(`⚠️  User already exists: ${userData.email}`)
        } else {
          console.error(`❌ Error creating user ${userData.email}:`, error.message)
        }
      }
    }

    console.log('✨ Database seeding completed!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
}

seedDatabase()

# Database Seeding Script

This script seeds your Firestore database with test users for development and testing.

## Test Users Created

The script creates 3 test users:

| Email | Password | Name | School | Department | Level |
|-------|----------|------|--------|------------|-------|
| john@example.com | Password123 | John Doe | Uniport | CS | 300 |
| jane@example.com | Password123 | Jane Smith | RSU | Engineering | 200 |
| alex@example.com | Password123 | Alex Johnson | Uniport | CS | 100 |

## Prerequisites

1. **Firestore Enabled**: Make sure Firestore is enabled in your Firebase project
2. **Internet Connection**: You need a working internet connection to connect to Firebase
3. **Dependencies**: Install `tsx` package:
   ```bash
   npm install -D tsx
   ```

## How to Use

### 1. Run the Seed Script

```bash
npm run seed
```

### 2. What It Does

- Creates authentication accounts for each test user in Firebase Auth
- Creates user profile documents in Firestore `users` collection
- Each user gets a document keyed by their Firebase Auth UID

### 3. Expected Output

```
🌱 Starting database seeding...
✅ Created user: john@example.com (John Doe)
✅ Created user: jane@example.com (Jane Smith)
✅ Created user: alex@example.com (Alex Johnson)
✨ Database seeding completed!
```

## Testing the Seeded Data

After seeding, you can:

1. **Login with test users** in your app using their email and password
2. **View in Firebase Console**: https://console.firebase.google.com/project/qitt-e87a1/firestore/databases/-default-/data/~2Fusers
3. **Check auth** in Firebase Console: https://console.firebase.google.com/project/qitt-e87a1/authentication/users

## Troubleshooting

### Error: "email-already-in-use"
Users already exist in the database. This is fine - the script will skip them.

### Error: "Could not reach Cloud Firestore backend"
- Check your internet connection
- Verify Firestore is enabled in Firebase project
- Check Firebase security rules allow writes

### Error: "Permission denied"
Your Firestore security rules are too restrictive. Temporarily use:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## Notes

- The script uses your Firebase project config from `lib/firebase/config.ts`
- All created users use the same password for testing (`Password123`)
- Timestamps are set to the current date/time
- Run this script only in development - don't use in production

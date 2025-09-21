// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getDatabase } from 'firebase/database'
import { getAuth } from 'firebase/auth'
import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai'

const firebaseConfig = {
  apiKey: 'AIzaSyD8mrHHN6NBQFOvjmF8tSvtT-cgVhnOPcY',
  authDomain: 'aialibi.firebaseapp.com',
  projectId: 'aialibi',
  storageBucket: 'aialibi.firebasestorage.app',
  messagingSenderId: '254893776452',
  appId: '1:254893776452:web:8b0b8a7b9f1082e519a611',
  databaseURL: 'https://aialibi-default-rtdb.europe-west1.firebasedatabase.app',
  measurementId: 'G-QDPBED8WT6',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const analytics = getAnalytics(app)

export const auth = getAuth(app)
export const db = getDatabase(app)
export const ai = getAI(app, { backend: new GoogleAIBackend() })

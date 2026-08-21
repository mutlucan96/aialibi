import { initializeApp, getApps } from 'firebase-admin/app'
import { getDatabase, ServerValue } from 'firebase-admin/database'
import { getStorage } from 'firebase-admin/storage'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Firebase Admin SDK if not already initialized
const app = getApps().length === 0 ? initializeApp() : getApps()[0]
export const db = getDatabase(app)
export const storage = getStorage(app)
export { ServerValue }

export const DATABASE_INSTANCE = 'aialibi-default-rtdb'
export const FUNCTIONS_REGION = 'europe-west1'

// Initialize Google Generative AI with server-side environment key
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || ''
export const genAI = new GoogleGenerativeAI(geminiApiKey)

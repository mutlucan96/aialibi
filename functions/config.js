import { initializeApp, getApps } from 'firebase-admin/app'
import { getDatabase, ServerValue } from 'firebase-admin/database'
import { getStorage } from 'firebase-admin/storage'
import { GoogleGenAI } from '@google/genai'

export const DATABASE_INSTANCE = 'aialibi-default-rtdb'
export const FUNCTIONS_REGION = 'europe-west1'
export const DATABASE_URL = 'https://aialibi-default-rtdb.europe-west1.firebasedatabase.app'
export const STORAGE_BUCKET = 'aialibi.firebasestorage.app'

// Initialize Firebase Admin SDK
const app =
  getApps().length === 0
    ? initializeApp({
        databaseURL: DATABASE_URL,
        storageBucket: STORAGE_BUCKET,
      })
    : getApps()[0]

export const db = getDatabase(app)
export const storage = getStorage(app)
export { ServerValue }

// Initialize Google GenAI with Agent Platform (Vertex AI) global endpoint
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY

export const ai = geminiApiKey
  ? new GoogleGenAI({ apiKey: geminiApiKey })
  : new GoogleGenAI({
      vertexai: true,
      project: process.env.GCLOUD_PROJECT || 'aialibi',
      location: 'global',
    })

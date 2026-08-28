import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check'

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

// Enable App Check debug token for localhost / local dev testing
if (
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    import.meta.env.DEV)
) {
  // @ts-ignore
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true
}

// Initialize Firebase App Check with reCAPTCHA Enterprise
const siteKey =
  import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY || '6LctMpEtAAAAALaM_Kq-wUPynJ86TaRye758qgZe'

export const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider(siteKey),
  isTokenAutoRefreshEnabled: true,
})

export const auth = getAuth(app)
export const db = getDatabase(app)
export const storage = getStorage(app)




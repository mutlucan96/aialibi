<template>
  <v-card>
    <v-card-title>Create a New Game</v-card-title>
    <v-card-text>
      <div v-if="user" class="text-center">
        <p class="mb-4">Welcome!</p>
        <v-btn :loading="isCreating" color="primary" block class="mb-2" @click="createNewGame">
          Create a New Game
        </v-btn>
        <v-btn variant="text" block @click="logout">Log Out</v-btn>
      </div>
      <div v-else>
        <v-btn color="red" block @click="signInWithGoogle"> Login with Google </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { ref as dbRef, serverTimestamp, get, set } from 'firebase/database'
import { auth, db } from '../firebase'

const isCreating = ref(false)
const user = ref(null)
const router = useRouter()

/**
 * @description Generates a random 4-digit integer code as a string.
 * @returns {string} A 4-digit string representing the game code.
 */
const generateFourDigitCode = () => {
  return String(Math.floor(1000 + Math.random() * 9000))
}

/**
 * @description Checks if a game with the given 4-digit code already exists in the Firebase Realtime Database.
 * @param {string} code The 4-digit game code to check.
 * @returns {Promise<boolean>} True if a game with the code exists, false otherwise.
 */
const checkIfGameExists = async (code) => {
  const gameRef = dbRef(db, `games/${code}`)
  const snapshot = await get(gameRef)
  return snapshot.exists()
}

/**
 * @description Handles user authentication state changes.
 */
onMounted(() => {
  onAuthStateChanged(auth, (currentUser) => {
    user.value = currentUser
  })
})

/**
 * @description Initiates Google Sign-In popup flow.
 * @returns {Promise<void>}
 */
const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider()
  try {
    await signInWithPopup(auth, provider)
  } catch (error) {
    console.error('Error during sign-in:', error)
  }
}

/**
 * @description Logs the current user out.
 * @returns {Promise<void>}
 */
const logout = async () => {
  try {
    await signOut(auth)
  } catch (error) {
    console.error('Error during sign-out:', error)
  }
}

/**
 * @description Creates a new game in Firebase with a unique 4-digit code and navigates to the game lobby.
 * @returns {Promise<void>}
 */
const createNewGame = async () => {
  if (!user.value) return
  isCreating.value = true
  try {
    let gameCode
    let gameExists = true

    do {
      gameCode = generateFourDigitCode()
      gameExists = await checkIfGameExists(gameCode)
    } while (gameExists)

    const newGameRef = dbRef(db, `games/${gameCode}`)
    const newGame = {
      status: 'lobby',
      createdAt: serverTimestamp(),
      creatorId: user.value.uid,
    }
    await set(newGameRef, newGame)
    await router.push(`/game/${gameCode}`)
  } catch (error) {
    console.error('Error creating new game:', error)
    if (error.message.includes('PERMISSION_DENIED')) {
      alert('Permission denied. Please log out and sign in with Google.')
      return
    }
    alert('Error creating new game: ' + error)
  } finally {
    isCreating.value = false
  }
}
</script>

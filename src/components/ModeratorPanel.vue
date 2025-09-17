<template>
  <v-card>
    <v-card-title>Create a New Game</v-card-title>
    <v-card-text>
      <div v-if="user" class="text-center">
        <p class="mb-4">Welcome!</p>
        <v-btn
          :loading="isCreating"
          color="primary"
          block
          class="mb-2"
          @click="createNewGame"
        >
          Create a New Game
        </v-btn>
        <v-btn variant="text" block @click="logout">Log Out</v-btn>
      </div>
      <div v-else>
        <v-btn color="red" block @click="signInWithGoogle">
          Login with Google
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { ref as dbRef, push, serverTimestamp } from 'firebase/database';
import { auth, db } from '../firebase';

const isCreating = ref(false);
const user = ref(null);
const router = useRouter();

/**
 * @description Handles user authentication state changes.
 */
onMounted(() => {
  onAuthStateChanged(auth, (currentUser) => {
    user.value = currentUser;
  });
});

/**
 * @description Initiates Google Sign-In popup flow.
 * @returns {Promise<void>}
 */
const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error('Error during sign-in:', error);
  }
};

/**
 * @description Logs the current user out.
 * @returns {Promise<void>}
 */
const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error during sign-out:', error);
  }
};

/**
 * @description Creates a new game in Firebase and navigates to the game lobby.
 * @returns {Promise<void>}
 */
const createNewGame = async () => {
  if (!user.value) return;
  isCreating.value = true;
  try {
    const gamesRef = dbRef(db, 'games');
    const newGame = {
      status: 'lobby',
      createdAt: serverTimestamp(),
      moderatorId: user.value.uid,
    };
    const newGameRef = await push(gamesRef, newGame);
    await router.push(`/game/${newGameRef.key}`);
  } catch (error) {
    console.error('Error creating new game:', error);
  } finally {
    isCreating.value = false;
  }
};
</script>

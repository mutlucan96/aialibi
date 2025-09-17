<script setup>
import { onMounted, ref as vueRef } from 'vue';
import { ref as dbRef, onValue } from 'firebase/database';
import { db } from '@/firebase';

const firebaseData = vueRef(null);
const errorMessage = vueRef(null);

// This function will run when the component is first loaded
onMounted(() => {
  const testRef = dbRef(db, '/test');

  // onValue() listens for data changes at a specific location
  onValue(testRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      console.log("Successfully connected to Firebase! Data:", data);
      firebaseData.value = data;
    } else {
      console.error("No data available at /test. Did you add it in the Firebase console?");
      errorMessage.value = "Could not find data at /test in your Realtime Database.";
    }
  }, (error) => {
    console.error("Firebase read failed:", error);
    errorMessage.value = "Firebase connection failed. Check your console and .env.local file.";
  });
});
</script>

<template>
  <main>
    <h1>AI Alibi Firebase Connection Test</h1>
    <div v-if="errorMessage">
      <p style="color: red;"><strong>Error:</strong> {{ errorMessage }}</p>
    </div>
    <div v-else-if="firebaseData">
      <p style="color: green;"><strong>Success!</strong></p>
      <p>Data from Firebase at "/test": <strong>{{ firebaseData }}</strong></p>
    </div>
    <div v-else>
      <p>Connecting to Firebase...</p>
    </div>
  </main>
</template>

<style scoped>
main {
  font-family: sans-serif;
  padding: 1rem;
}
</style>
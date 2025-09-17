// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD8mrHHN6NBQFOvjmF8tSvtT-cgVhnOPcY",
  authDomain: "aialibi.firebaseapp.com",
  projectId: "aialibi",
  storageBucket: "aialibi.firebasestorage.app",
  messagingSenderId: "254893776452",
  appId: "1:254893776452:web:8b0b8a7b9f1082e519a611",
  measurementId: "G-QDPBED8WT6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
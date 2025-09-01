// frontend/src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// TODO: replace these with your Firebase project settings
const firebaseConfig = {
  apiKey: "AIzaSyC1DqoarsYOwyZem_-YABemmIBMbk6dBCI",
  authDomain: "webhook-runner-fb1d6.firebaseapp.com",
  projectId: "webhook-runner-fb1d6",
  storageBucket: "webhook-runner-fb1d6.firebasestorage.app",
  messagingSenderId: "962752873021",
  appId: "1:962752873021:web:829583346b22f23f2e6054",
  measurementId: "G-KYEXV4J3KH"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Suas credenciais do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBo7S68XD7RIxl9atSVepoHvkXRljQG_A8",
  authDomain: "confesso-app.firebaseapp.com",
  projectId: "confesso-app",
  storageBucket: "confesso-app.firebasestorage.app",
  messagingSenderId: "980180808886",
  appId: "1:980180808886:web:8365669b29d882934fa217",
  measurementId: "G-K5L6WG4L9T"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
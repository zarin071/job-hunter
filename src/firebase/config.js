import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your Firebase project config (job-hunter-8e9a7)
const firebaseConfig = {
  apiKey: "AIzaSyBjNhiUaEUmg5-WFz7O7P7c1TEnpcv_LPY",
  authDomain: "job-hunter-8e9a7.firebaseapp.com",
  projectId: "job-hunter-8e9a7",
  storageBucket: "job-hunter-8e9a7.firebasestorage.app",
  messagingSenderId: "112505323800",
  appId: "1:112505323800:web:cb9b3635d477b401271e6d",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;

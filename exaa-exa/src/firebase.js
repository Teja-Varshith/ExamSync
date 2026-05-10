import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAz8r4gyd1BK2Ao_3eFoF0yiuPOwTZU8KY",
  authDomain: "unisync-3b48b.firebaseapp.com",
  projectId: "unisync-3b48b",
  storageBucket: "unisync-3b48b.firebasestorage.app",
  messagingSenderId: "580979400430",
  appId: "1:580979400430:web:895c032c3afa53cb41ddff",
  measurementId: "G-T8QWHHQPTJ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
export default app;

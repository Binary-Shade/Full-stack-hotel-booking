import { initializeApp } from "firebase/app";
import {getStorage} from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyCTJYUotiKTJfPEMa32EdP6yBojOWjcltw",
  authDomain: "upload-4649b.firebaseapp.com",
  projectId: "upload-4649b",
  storageBucket: "upload-4649b.appspot.com",
  messagingSenderId: "1066914192254",
  appId: "1:1066914192254:web:e0ab6d418b3b24d878f12f"
};

const app = initializeApp(firebaseConfig);
export const imageDB = getStorage(app)
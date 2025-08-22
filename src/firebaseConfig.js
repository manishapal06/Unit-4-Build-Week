import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyCspd82MryQjqwbwwCWXO3xIjKL4FdBBSY",
  authDomain: "travel-budget-8b474.firebaseapp.com",
  projectId: "travel-budget-8b474",
  storageBucket: "travel-budget-8b474.firebasestorage.app",
  messagingSenderId: "569224590583",
  appId: "1:569224590583:web:1e6e85d7f3b2087ccd4ff2",
  measurementId: "G-KG7P2K24ZV"
};

export const app = initializeApp(firebaseConfig);
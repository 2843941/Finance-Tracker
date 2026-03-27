// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAVF4qjffeWA3C2UWB01wb6YSHVF3FP03A",
  authDomain: "finance-tracker-faf20.firebaseapp.com",
  projectId: "finance-tracker-faf20",
  storageBucket: "finance-tracker-faf20.firebasestorage.app",
  messagingSenderId: "1057913662452",
  appId: "1:1057913662452:web:4f6bf37ec5acd6bb95e7a1"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();

// Enable persistence
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

console.log("Firebase initialized with project:", firebaseConfig.projectId);
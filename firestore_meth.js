import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, getDocs, query, where, onSnapshot } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAlZJFpV4ApjkaQE0tH3P_VfSmK9PHgihk",
    authDomain: "volunteer-community-c691d.firebaseapp.com",
    projectId: "volunteer-community-c691d",
    storageBucket: "volunteer-community-c691d.appspot.com",
    messagingSenderId: "534367058264",
    appId: "1:534367058264:web:a6b3fa5bfb58f186a7cd2d",
    measurementId: "G-0HDWR98XPT"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const FirestoreService = {
  // ==================== POSTS ====================
  addPost: async (postData) => {
    await addDoc(collection(db, 'posts'), postData);
  },

  updatePost: async (postId, newData) => {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, newData);
  },

  deletePost: async (postId) => {
    const postRef = doc(db, 'posts', postId);
    await deleteDoc(postRef);
  },

  getPosts: async () => {
    const snapshot = await getDocs(collection(db, 'posts'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // ==================== NOTIFICATIONS ====================
  sendNotification: async (data) => {
    await addDoc(collection(db, 'notifications'), data);
  },

  getNotifications: (userId, callback) => {
    const q = query(collection(db, 'notifications'), where('receiverId', '==', userId));
    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(notifications);
    });
  },

  // ==================== RATINGS ====================
  rateVolunteer: async (volunteerId, rating, reviewerId) => {
    await addDoc(collection(db, 'ratings'), {
      volunteerId,
      rating,
      reviewerId,
      timestamp: new Date()
    });
  },

  getAverageRating: async (volunteerId) => {
    const q = query(collection(db, 'ratings'), where('volunteerId', '==', volunteerId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return 0.0;

    let total = 0;
    snapshot.forEach(doc => {
      total += doc.data().rating;
    });

    return total / snapshot.size;
  }
};

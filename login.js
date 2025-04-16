// Firestore Web Service

import { getFirestore, collection, addDoc, getDocs, query, where, updateDoc, doc, getDoc } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getStorage } from "firebase/storage";

const db = getFirestore();
const auth = getAuth();
const storage = getStorage();

const postsCollection = collection(db, 'Posts');
const usersCollection = collection(db, 'Users');
const notificationsCollection = collection(db, 'Notifications');
const ratingsCollection = collection(db, 'Ratings');

// User login function
export async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        if (!user.emailVerified) {
            throw new Error("Please verify your email before logging in.");
        }
        
        const userDoc = await getDoc(doc(db, "Users", email));
        if (!userDoc.exists()) {
            throw new Error("User document not found.");
        }

        const userType = userDoc.data().userType;
        if (!userType) {
            throw new Error("User type not found.");
        }

        return { success: true, userType };
    } catch (error) {
        console.error("Login error:", error);
        return { success: false, message: error.message };
    }
}

import { loginUser } from './firestoreService.js';

document.getElementById("loginButton").addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const result = await loginUser(email, password);
    if (result.success) {
        window.location.href = result.userType === 'Ngo' ? 'ngo_dashboard.html' :
                               result.userType === 'Volunteer' ? 'volunteer_dashboard.html' :
                               result.userType === 'Leader' ? 'leader_dashboard.html' :
                               result.userType === 'University' ? 'university_dashboard.html' :
                               'default_dashboard.html';
    } else {
        document.getElementById("errorMessage").innerText = result.message;
    }
});
 // Firebase Configuration
 const firebaseConfig = {
    apiKey: "AIzaSyAlZJFpV4ApjkaQE0tH3P_VfSmK9PHgihk",
    authDomain: "volunteer-community-c691d.firebaseapp.com",
    databaseURL: "https://volunteer-community-c691d-default-rtdb.firebaseio.com",
    projectId: "volunteer-community-c691d",
    storageBucket: "volunteer-community-c691d.appspot.com",
    messagingSenderId: "534367058264",
    appId: "1:534367058264:web:a6b3fa5bfb58f186a7cd2d",
    measurementId: "G-0HDWR98XPT"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
// const auth = firebase.auth();

function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const message = document.getElementById("message");

    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            message.textContent = "Login successful!";
            message.style.color = "green";
            // Redirect to home page (modify as needed)
            window.location.href = "home.html";
        })
        .catch(error => {
            message.textContent = error.message;
            message.style.color = "red";
        });
}

function redirectToForgotPassword() {
    window.location.href = "forgot_password.html"; // Redirect to forgot password page
}

// Add rating
export async function addRating({ raterEmail, ratedUserEmail, eventId, ratingValue, comment }) {
    try {
        await addDoc(ratingsCollection, {
            raterEmail,
            ratedUserEmail,
            eventId,
            ratingValue,
            comment: comment || "",
            timestamp: new Date()
        });
    } catch (error) {
        console.error("Error adding rating:", error);
    }
}

// Fetch ratings for an event
export async function getRatingsForEvent(eventId) {
    const q = query(ratingsCollection, where("eventId", "==", eventId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
}

// Fetch average rating for a user
export async function getAverageRating(userEmail) {
    try {
        const q = query(ratingsCollection, where("ratedUserEmail", "==", userEmail));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) return 0;

        let total = 0;
        querySnapshot.forEach(doc => total += doc.data().ratingValue);
        return total / querySnapshot.size;
    } catch (error) {
        console.error("Error fetching average rating:", error);
        return 0;
    }
}

// Add post
export async function addPost({ messages, imageUrl, leaderMaxCount = 7, targetCount = 30, eventDate, location, latitude, longitude }) {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error("User not authenticated");
        
        const userDoc = await getDocs(query(usersCollection, where("email", "==", user.email)));
        const userData = userDoc.docs[0]?.data() || {};

        await addDoc(postsCollection, {
            username: userData.username || "Unknown",
            userEmail: user.email,
            userType: userData.userType || "unknown",
            postMessage: messages,
            imageUrl: imageUrl || "",
            timestamp: new Date(),
            eventDate: eventDate ? new Date(eventDate) : null,
            currentCount: 0,
            targetCount,
            appliedUsers: [],
            leaders: [],
            leaderCount: 0,
            leaderMaxCount,
            status: 'upcoming',
            location,
            latitude,
            longitude
        });
    } catch (error) {
        console.error("Error adding post:", error);
    }
}

// Update event status
export async function updateEventStatus() {
    try {
        const now = new Date();
        const querySnapshot = await getDocs(postsCollection);

        querySnapshot.forEach(async (postDoc) => {
            const data = postDoc.data();
            const eventDate = data.eventDate ? new Date(data.eventDate.seconds * 1000) : null;
            if (!eventDate) return;

            let newStatus = "upcoming";
            if (eventDate < now) newStatus = "completed";
            else if (eventDate.toDateString() === now.toDateString()) newStatus = "in_progress";

            if (data.status !== newStatus) {
                await updateDoc(doc(db, "Posts", postDoc.id), { status: newStatus });
            }
        });
    } catch (error) {
        console.error("Error updating event statuses:", error);
    }
}
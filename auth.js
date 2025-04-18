// auth.js
import { getAuth, onAuthStateChanged } from "firebase/auth";

const auth = getAuth();

function checkAuthState() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("User is logged in:", user);
      // Call your function to load posts or any other user-specific data
      loadPosts(user); // Make sure to pass user object to your function
    } else {
      console.log("No user logged in");
      // Redirect to login page if not logged in
      window.location.href = "/login.html";
    }
  });
}

// Function to load posts (this will be used once the user is logged in)
function loadPosts(user) {
  console.log("Loading posts for user:", user.email);
  // You can now load posts or user-specific content here
  // You can also store the user data in the session for further use in the page
}

// Make this function available for other pages to use
export { checkAuthState };

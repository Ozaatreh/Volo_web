import { checkAuthState } from "./auth.js";

// Call checkAuthState when the page loads to verify the user session
window.addEventListener('load', () => {
  checkAuthState(); // This will check if the user is logged in
});


const db = firebase.firestore();
const auth = firebase.auth();

let currentUserEmail = null;
let appliedVolunteerPostIds = [];
let appliedVolunteerEventDates = [];

auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUserEmail = user.email;
    await fetchAppliedPosts();
    loadPosts();
  }
});

async function fetchAppliedPosts() {
  const snapshot = await db
    .collection("Posts") // ✅ Correct casing
    .where("AppliedUsers", "array-contains", currentUserEmail)
    .get();

  appliedVolunteerPostIds = snapshot.docs.map((doc) => doc.id);
  appliedVolunteerEventDates = snapshot.docs.map(
    (doc) => doc.data().EventDate.toDate()
  );
}

function shouldHidePost(postId, eventDate) {
  if (appliedVolunteerPostIds.includes(postId)) return false;
  return appliedVolunteerEventDates.some((date) =>
    date.toDateString() === eventDate.toDateString()
  );
}

async function loadPosts() {
  const postContainer = document.getElementById("postContainer");
  postContainer.innerHTML = "";

  const snapshot = await db
    .collection("Posts") // ✅ Correct casing
    .where("status", "==", "upcoming")
    .get();

  if (snapshot.empty) {
    postContainer.innerHTML = `<p>No Upcoming Events Yet.</p>`;
    return;
  }

  snapshot.forEach((doc) => {
    const post = doc.data();
    const postId = doc.id;

    const eventDate = post.EventDate.toDate();
    if (shouldHidePost(postId, eventDate)) return;

    const formattedDate = `${eventDate.getFullYear()}-${String(
      eventDate.getMonth() + 1
    ).padStart(2, "0")}-${String(eventDate.getDate()).padStart(2, "0")}`;

    const applied = post.AppliedUsers?.includes(currentUserEmail);
    const leaderCount = post.LeaderCount || 0;
    const maxLeaders = post.LeaderMaxCount || 5;
    const currentCount = post.CurrentCount || 0;
    const targetCount = post.TargetCount || 10;
    const message = post.PostMessage || "";
    const username = post.Username || "Unknown";
    const imageUrl = post.ImageUrl || null;
    const status = post.status || "unknown";
    const location = post.Location || null;

    const card = document.createElement("div");
    card.className = "event-card";

    card.innerHTML = `
      <div class="card-header">
        <span><b>${username}</b></span>
        <span>Status: ${status}</span>
      </div>
      <p>${message}</p>
      <p><b>Event Date:</b> ${formattedDate}</p>
      ${
        imageUrl
          ? `<img src="${imageUrl}" width="100" height="100" />`
          : `<i>No Image</i>`
      }
      <p><b>Leaders:</b> ${leaderCount} / ${maxLeaders}</p>
      <progress value="${leaderCount}" max="${maxLeaders}"></progress>
      <p><b>Volunteers:</b> ${currentCount} / ${targetCount}</p>
      <progress value="${currentCount}" max="${targetCount}"></progress>
      <button onclick="toggleApplication('${postId}', ${applied})">
        ${applied ? "Cancel" : "Apply"}
      </button>
    `;

    postContainer.appendChild(card);
  });
}

async function toggleApplication(postId, hasApplied) {
  const postRef = db.collection("Posts").doc(postId);

  if (hasApplied) {
    await postRef.update({
      AppliedUsers: firebase.firestore.FieldValue.arrayRemove(currentUserEmail),
    });
  } else {
    await postRef.update({
      AppliedUsers: firebase.firestore.FieldValue.arrayUnion(currentUserEmail),
    });
  }

  await fetchAppliedPosts();
  loadPosts();
}
async function loadPosts() {
    const postContainer = document.getElementById("postContainer");
    postContainer.innerHTML = "";
  
    const snapshot = await db.collection("Posts").where("status", "==", "upcoming").get();
  
    if (snapshot.empty) {
      console.log("No Upcoming Events Yet.");
      postContainer.innerHTML = `<p>No Upcoming Events Yet.</p>`;
      return;
    }
  
    snapshot.forEach((doc) => {
      const post = doc.data();
      console.log("Post Data:", post);
  
      // Simplified output for testing
      const postId = doc.id;
      const formattedDate = post.EventDate.toDate().toLocaleDateString();
  
      const card = document.createElement("div");
      card.className = "event-card";
      card.innerHTML = `
        <div class="card-header">
          <span><b>${post.Username || "Unknown"}</b></span>
          <span>Status: ${post.status || "Unknown"}</span>
        </div>
        <p>${post.PostMessage || "No message"}</p>
        <p><b>Event Date:</b> ${formattedDate}</p>
      `;
  
      postContainer.appendChild(card);
    });
  }
  
  loadPosts();
  

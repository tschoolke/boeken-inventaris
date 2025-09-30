// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD6MVGAjfWWzw5LfiykYAA0Dyc9AgFPt5U",
  authDomain: "inventaris-kleuterboeken-bsow.firebaseapp.com",
  projectId: "inventaris-kleuterboeken-bsow",
  storageBucket: "inventaris-kleuterboeken-bsow.firebasestorage.app",
  messagingSenderId: "892488979059",
  appId: "1:892488979059:web:27de8ca6923aa0cc315006"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

// Login-knop
const loginBtn = document.getElementById("loginBtn");
const boekgegevensDiv = document.getElementById("boekgegevens");

loginBtn.addEventListener("click", async () => {
  if (auth.currentUser) {
    await signOut(auth);
  } else {
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      alert("Login mislukt");
    }
  }
});

onAuthStateChanged(auth, (user) => {
  if (user && user.email.endsWith("@bsow.be")) {
    loginBtn.textContent = `Uitloggen (${user.displayName})`;
    boekgegevensDiv.textContent = `Welkom ${user.displayName}, je kunt nu boeken toevoegen.`;
  } else {
    loginBtn.textContent = "Inloggen met Google";
    boekgegevensDiv.textContent = "Nog geen boek gescand.";
  }
});

// Formulier opslaan
const boekForm = document.getElementById("boekForm");
const melding = document.getElementById("melding");

boekForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!auth.currentUser || !auth.currentUser.email.endsWith("@bsow.be")) {
    alert("Je hebt geen rechten om boeken toe te voegen");
    return;
  }

  const isbn = document.getElementById("isbn").value.trim();
  const titel = document.getElementById("titel").value.trim();
  const auteur = document.getElementById("auteur").value.trim();
  const klas = document.getElementById("klas").value.trim() || null;
  const categorie = document.getElementById("categorie").value.trim() || null;
  const doelgroep = document.getElementById("doelgroep").value.trim() || null;
  const cover = document.getElementById("cover").value.trim() || null;

  try {
    await addDoc(collection(db, "boeken"), {
      isbn, titel, auteur, klas, categorie, doelgroep, cover,
      toegevoegdDoor: auth.currentUser.displayName,
      tijd: new Date()
    });
    melding.textContent = `✅ Boek "${titel}" opgeslagen!`;
    boekForm.reset();
    document.getElementById("coverPreview").style.display = "none";
  } catch (err) {
    console.error(err);
    melding.textContent = "❌ Opslaan mislukt.";
  }
});

// ISBN → auto aanvullen
const isbnInput = document.getElementById("isbn");
isbnInput.addEventListener("blur", async () => {
  const isbn = isbnInput.value.trim();
  if (!isbn) return;

  try {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
    const data = await res.json();

    if (data.totalItems > 0) {
      const boek = data.items[0].volumeInfo;
      document.getElementById("titel").value = boek.title || "";
      document.getElementById("auteur").value = boek.authors ? boek.authors.join(", ") : "";
      document.getElementById("categorie").value = boek.categories ? boek.categories.join(", ") : "";
      document.getElementById("doelgroep").value = boek.maturityRating === "NOT_MATURE" ? "Kinderen / Jeugd" : "Volwassenen";
      if (boek.imageLinks && boek.imageLinks.thumbnail) {
        document.getElementById("cover").value = boek.imageLinks.thumbnail;
        const img = document.getElementById("coverPreview");
        img.src = boek.imageLinks.thumbnail;
        img.style.display = "block";
      }
    }
  } catch (err) {
    console.error("ISBN lookup fout:", err);
  }
});

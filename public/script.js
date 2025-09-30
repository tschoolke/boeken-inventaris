// ============================
// Firebase setup
// ============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyD6MVGAjfWWzw5LfiykYAA0Dyc9AgFPt5U",
  authDomain: "inventaris-kleuterboeken-bsow.firebaseapp.com",
  projectId: "inventaris-kleuterboeken-bsow",
  storageBucket: "inventaris-kleuterboeken-bsow.firebasestorage.app",
  messagingSenderId: "892488979059",
  appId: "1:892488979059:web:27de8ca6923aa0cc315006"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// ============================
// UI elementen
// ============================
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const boekInfoDiv = document.getElementById("boekinfo");
const saveBtn = document.getElementById("saveBtn");

let huidigBoek = null; // tijdelijk boek object

// ============================
// Login / logout
// ============================
loginBtn.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    alert("Inloggen mislukt: " + err.message);
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    loginBtn.style.display = "none";
    logoutBtn.style.display = "block";
  } else {
    loginBtn.style.display = "block";
    logoutBtn.style.display = "none";
  }
});

// ============================
// ISBN scannen → info ophalen
// ============================
async function fetchBookInfo(isbn) {
  try {
    // OpenLibrary API
    const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&jscmd=details&format=json`;
    const res = await fetch(url);
    const data = await res.json();
    const details = data[`ISBN:${isbn}`]?.details;

    if (!details) {
      boekInfoDiv.innerHTML = `<p>Geen gegevens gevonden voor ISBN ${isbn}</p>`;
      huidigBoek = null;
      saveBtn.style.display = "none";
      return;
    }

    huidigBoek = {
      isbn: isbn,
      titel: details.title || "Onbekende titel",
      auteur: details.authors ? details.authors.map(a => a.name).join(", ") : "Onbekend",
      categorie: details.subjects ? details.subjects.join(", ") : "Onbekend",
      doelgroep: details.audience || "Onbekend",
      cover: details.covers ? `https://covers.openlibrary.org/b/id/${details.covers[0]}-M.jpg` : null,
      toegevoegdDoor: auth.currentUser?.displayName || "Onbekend",
      klas: ""
    };

    // Toon in UI
    boekInfoDiv.innerHTML = `
      <p><b>ISBN:</b> ${huidigBoek.isbn}</p>
      <p><b>Titel:</b> ${huidigBoek.titel}</p>
      <p><b>Auteur(s):</b> ${huidigBoek.auteur}</p>
      <p><b>Categorieën:</b> ${huidigBoek.categorie}</p>
      <p><b>Doelgroep:</b> ${huidigBoek.doelgroep}</p>
      ${huidigBoek.cover ? `<img src="${huidigBoek.cover}" alt="cover" style="max-height:200px;">` : ""}
    `;

    saveBtn.style.display = "block";
  } catch (err) {
    console.error(err);
    boekInfoDiv.innerHTML = `<p>Fout bij ophalen boekgegevens</p>`;
  }
}

// ============================
// Boek opslaan in Firestore
// ============================
saveBtn.addEventListener("click", async () => {
  if (!huidigBoek) {
    alert("Geen boek om op te slaan!");
    return;
  }

  try {
    await addDoc(collection(db, "boeken"), {
      ...huidigBoek,
      tijd: new Date()
    });
    alert("✅ Boek opgeslagen!");
    saveBtn.style.display = "none";
    boekInfoDiv.innerHTML = "Nog geen boek gescand.";
    huidigBoek = null;
  } catch (err) {
    alert("❌ Opslaan mislukt: " + err.message);
  }
});

// ============================
// Demo scanner (mock)
// ============================
// Hier kan je je echte QuaggaJS scanner aanroepen.
// Voor test: gewoon manueel ISBN meegeven:
window.scanISBN = (isbn) => {
  fetchBookInfo(isbn);
};

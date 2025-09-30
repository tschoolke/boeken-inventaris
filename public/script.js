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
// Boekgegevens ophalen (Google Books + OpenLibrary)
// ============================
async function fetchBookInfo(isbn) {
  try {
    let boekGB = null;
    let boekOL = null;

    // 1. Google Books
    try {
      const urlGB = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;
      const resGB = await fetch(urlGB);
      const dataGB = await resGB.json();
      boekGB = dataGB.items?.[0]?.volumeInfo || null;
    } catch (e) {
      console.warn("Google Books fout:", e);
    }

    // 2. OpenLibrary
    try {
      const urlOL = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&jscmd=details&format=json`;
      const resOL = await fetch(urlOL);
      const dataOL = await resOL.json();
      boekOL = dataOL[`ISBN:${isbn}`]?.details || null;
    } catch (e) {
      console.warn("OpenLibrary fout:", e);
    }

    // 3. Als helemaal niets gevonden
    if (!boekGB && !boekOL) {
      toonEigenInputFormulier(isbn);
      return;
    }

    // 4. Gegevens combineren
    huidigBoek = {
      isbn,
      titel: boekGB?.title || boekOL?.title || "Onbekend",
      auteur: boekGB?.authors
        ? boekGB.authors.join(", ")
        : (boekOL?.authors ? boekOL.authors.map(a => a.name).join(", ") : "Onbekend"),
      categorie: boekGB?.categories?.join(", ") || (boekOL?.subjects ? boekOL.subjects.join(", ") : "Onbekend"),
      doelgroep: boekGB?.maturityRating === "NOT_MATURE"
        ? "Kinderen / Jeugd"
        : (boekOL?.audience || "Onbekend"),
      cover: boekGB?.imageLinks?.thumbnail ||
        (boekOL?.covers ? `https://covers.openlibrary.org/b/id/${boekOL.covers[0]}-M.jpg` : null),
      toegevoegdDoor: auth.currentUser?.displayName || "Onbekend",
      klas: ""
    };

    // 5. Info tonen in UI
    toonBoekInfo(huidigBoek);

  } catch (err) {
    console.error(err);
    boekInfoDiv.innerHTML = `<p>Fout bij ophalen boekgegevens</p>`;
  }
}

// ============================
// Boek tonen in UI
// ============================
function toonBoekInfo(boek) {
  boekInfoDiv.innerHTML = `
    <p><b>ISBN:</b> ${boek.isbn}</p>
    <p><b>Titel:</b> ${boek.titel}</p>
    <p><b>Auteur(s):</b> ${boek.auteur}</p>
    <p><b>Categorieën:</b> ${boek.categorie}</p>
    <p><b>Doelgroep:</b> ${boek.doelgroep}</p>
    ${boek.cover ? `<img src="${boek.cover}" alt="cover" style="max-height:200px;">` : ""}
  `;
  saveBtn.style.display = "block";
}

// ============================
// Eigen input formulier tonen
// ============================
function toonEigenInputFormulier(isbn) {
  boekInfoDiv.innerHTML = `
    <p>Geen gegevens gevonden voor ISBN ${isbn}. Vul zelf in:</p>
    <div class="mb-2"><input id="titelInput" class="form-control" placeholder="Titel"></div>
    <div class="mb-2"><input id="auteurInput" class="form-control" placeholder="Auteur"></div>
    <div class="mb-2"><input id="categorieInput" class="form-control" placeholder="Categorieën"></div>
    <div class="mb-2"><input id="doelgroepInput" class="form-control" placeholder="Doelgroep"></div>
    <div class="mb-2"><input id="coverInput" class="form-control" placeholder="Cover-URL"></div>
  `;

  huidigBoek = {
    isbn,
    titel: "",
    auteur: "",
    categorie: "",
    doelgroep: "",
    cover: null,
    toegevoegdDoor: auth.currentUser?.displayName || "Onbekend",
    klas: ""
  };

  saveBtn.style.display = "block";
}

// ============================
// Opslaan in Firestore
// ============================
saveBtn.addEventListener("click", async () => {
  if (!huidigBoek) {
    alert("Geen boek om op te slaan!");
    return;
  }

  // Als gebruiker zelf ingevuld heeft
  if (document.getElementById("titelInput")) {
    huidigBoek.titel = document.getElementById("titelInput").value || "Onbekend";
    huidigBoek.auteur = document.getElementById("auteurInput").value || "Onbekend";
    huidigBoek.categorie = document.getElementById("categorieInput").value || "Onbekend";
    huidigBoek.doelgroep = document.getElementById("doelgroepInput").value || "Onbekend";
    huidigBoek.cover = document.getElementById("coverInput").value || null;
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
// Scanner trigger (ook via Enter in index.html)
// ============================
window.scanISBN = (isbn) => {
  fetchBookInfo(isbn);
};

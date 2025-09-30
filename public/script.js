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
// Boekgegevens ophalen
// ============================
async function fetchBookInfo(isbn) {
  try {
    // Eerst Google Books
    const urlGB = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;
    const resGB = await fetch(urlGB);
    const dataGB = await resGB.json();
    let info = dataGB.items?.[0]?.volumeInfo;

    if (!info) {
      // Fallback naar OpenLibrary
      const urlOL = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&jscmd=details&format=json`;
      const resOL = await fetch(urlOL);
      const dataOL = await resOL.json();
      info = dataOL[`ISBN:${isbn}`]?.details;
    }

    if (!info) {
      toonEigenInputFormulier(isbn);
      return;
    }

    huidigBoek = {
      isbn,
      titel: info.title || "Onbekende titel",
      auteur: info.authors
        ? Array.isArray(info.authors)
          ? info.authors.map(a => a.name || a).join(", ")
          : info.authors
        : "Onbekend",
      categorie: info.categories ? info.categories.join(", ") : "Onbekend",
      doelgroep: info.audience || "Onbekend",
      cover: info.imageLinks?.thumbnail || (info.covers ? `https://covers.openlibrary.org/b/id/${info.covers[0]}-M.jpg` : null),
      toegevoegdDoor: auth.currentUser?.displayName || "Onbekend",
      klas: ""
    };

    toonBoekInfo(huidigBoek);

  } catch (err) {
    console.error(err);
    boekInfoDiv.innerHTML = `<p>Fout bij ophalen boekgegevens</p>`;
  }
}

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

  // Als gebruiker eigen input formulier invult → neem waarden over
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
// Scanner trigger (simulatie)
// ============================
window.scanISBN = (isbn) => {
  fetchBookInfo(isbn);
};

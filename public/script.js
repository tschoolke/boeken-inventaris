// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 🔹 Jouw Firebase configuratie
const firebaseConfig = {
  apiKey: "AIzaSyD6MVGAjfWWzw5LfiykYAA0Dyc9AgFPt5U",
  authDomain: "inventaris-kleuterboeken-bsow.firebaseapp.com",
  projectId: "inventaris-kleuterboeken-bsow",
  storageBucket: "inventaris-kleuterboeken-bsow.firebasestorage.app",
  messagingSenderId: "892488979059",
  appId: "1:892488979059:web:27de8ca6923aa0cc315006"
};

// 🔹 Firebase initialiseren
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

// 🔹 Login knop
const loginBtn = document.getElementById("loginBtn");

loginBtn.addEventListener("click", async () => {
  if (auth.currentUser) {
    // Als gebruiker al ingelogd is → log uit
    await signOut(auth);
  } else {
    // Anders → log in
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login mislukt:", error);
      alert("Er ging iets mis bij het inloggen.");
    }
  }
});

// 🔹 Controleer login status
onAuthStateChanged(auth, (user) => {
  if (user) {
    loginBtn.textContent = `Uitloggen (${user.displayName})`;
    document.getElementById("boekgegevens").textContent =
      `Welkom ${user.displayName}, je kunt nu boeken toevoegen.`;
  } else {
    loginBtn.textContent = "Inloggen met Google";
    document.getElementById("boekgegevens").textContent =
      "Nog geen boek gescand.";
  }
});

// 🔹 Voorbeeldfunctie: boek toevoegen aan Firestore
async function voegBoekToe(isbn, titel, auteur) {
  try {
    await addDoc(collection(db, "boeken"), {
      isbn: isbn,
      titel: titel,
      auteur: auteur,
      gebruiker: auth.currentUser ? auth.currentUser.uid : null,
      tijd: new Date()
    });
    console.log("Boek toegevoegd:", titel);
  } catch (e) {
    console.error("Fout bij opslaan:", e);
  }
}

// 🔹 Test (later vervang je dit door scanfunctie)
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && auth.currentUser) {
    voegBoekToe("9789024551234", "Voorbeeldboek", "Jan Jansen");
  }
});

// 🔹 Boek toevoegen via formulier
const boekForm = document.getElementById("boekForm");
const melding = document.getElementById("melding");

if (boekForm) {
  boekForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!auth.currentUser) {
      alert("Je moet eerst inloggen!");
      return;
    }

    const isbn = document.getElementById("isbn").value;
    const titel = document.getElementById("titel").value;
    const auteur = document.getElementById("auteur").value;
    const klas = document.getElementById("klas").value;

    try {
      await addDoc(collection(db, "boeken"), {
        isbn: isbn,
        titel: titel,
        auteur: auteur,
        klas: klas,
        toegevoegdDoor: auth.currentUser.displayName,
        tijd: new Date()
      });

      melding.textContent = `✅ Boek "${titel}" opgeslagen!`;
      boekForm.reset();
    } catch (e) {
      console.error("Fout bij opslaan:", e);
      melding.textContent = "❌ Er ging iets mis bij opslaan.";
    }
  });
}

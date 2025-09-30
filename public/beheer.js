// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 🔹 Firebase configuratie
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
const db = getFirestore(app);

const boekenTabel = document.getElementById("boekenTabel");
const klasFilter = document.getElementById("klasFilter");

// 🔹 Boeken ophalen uit Firestore
async function laadBoeken() {
  boekenTabel.innerHTML = "";
  const querySnapshot = await getDocs(collection(db, "boeken"));

  let klassenSet = new Set();
  let boeken = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    boeken.push(data);
    if (data.klas) klassenSet.add(data.klas);
  });

  // Klasfilter automatisch opbouwen
  klasFilter.innerHTML = '<option value="alle">Alle klassen</option>';
  klassenSet.forEach((klas) => {
    klasFilter.innerHTML += `<option value="${klas}">${klas}</option>`;
  });

  toonBoeken(boeken);
}

// 🔹 Boeken tonen in tabel
function toonBoeken(boeken) {
  boekenTabel.innerHTML = "";
  const geselecteerdeKlas = klasFilter.value;

  boeken
    .filter((b) => geselecteerdeKlas === "alle" || b.klas === geselecteerdeKlas)
    .forEach((b) => {
      boekenTabel.innerHTML += `
        <tr>
          <td>${b.isbn || ""}</td>
          <td>${b.titel || ""}</td>
          <td>${b.auteur || ""}</td>
          <td>${b.klas || ""}</td>
          <td>${b.toegevoegdDoor || ""}</td>
        </tr>
      `;
    });
}

// 🔹 Event listener voor filter
klasFilter.addEventListener("change", () => laadBoeken());

// 🔹 Init
laadBoeken();

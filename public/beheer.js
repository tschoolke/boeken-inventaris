// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  deleteDoc, 
  doc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

let alleBoeken = []; // hier houden we alle boeken bij met hun id

// 🔹 Boeken ophalen uit Firestore
async function laadBoeken() {
  boekenTabel.innerHTML = "";
  const querySnapshot = await getDocs(collection(db, "boeken"));

  let klassenSet = new Set();
  alleBoeken = [];

  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    alleBoeken.push({ id: docSnap.id, ...data }); // id meenemen voor wissen
    if (data.klas) klassenSet.add(data.klas);
  });

  // Klasfilter automatisch opbouwen
  klasFilter.innerHTML = '<option value="alle">Alle klassen</option>';
  klassenSet.forEach((klas) => {
    klasFilter.innerHTML += `<option value="${klas}">${klas}</option>`;
  });

  toonBoeken();
}

// 🔹 Boeken tonen in tabel
function toonBoeken() {
  boekenTabel.innerHTML = "";
  const geselecteerdeKlas = klasFilter.value;

  alleBoeken
    .filter((b) => geselecteerdeKlas === "alle" || b.klas === geselecteerdeKlas)
    .forEach((b) => {
      boekenTabel.innerHTML += `
        <tr>
          <td>${b.isbn || ""}</td>
          <td>${b.titel || ""}</td>
          <td>${b.auteur || ""}</td>
          <td>${b.klas || ""}</td>
          <td>${b.toegevoegdDoor || ""}</td>
          <td>
            <button class="btn btn-sm btn-danger" onclick="verwijderBoek('${b.id}')">Verwijder</button>
          </td>
        </tr>
      `;
    });
}

// 🔹 Boek verwijderen
window.verwijderBoek = async function(id) {
  if (confirm("Weet je zeker dat je dit boek wil verwijderen?")) {
    try {
      await deleteDoc(doc(db, "boeken", id));
      alert("Boek verwijderd ✅");
      laadBoeken(); // tabel opnieuw laden
    } catch (e) {
      console.error("Fout bij verwijderen:", e);
      alert("❌ Verwijderen mislukt");
    }
  }
};

// 🔹 Event listener voor filter
klasFilter.addEventListener("change", toonBoeken);

// 🔹 Init
laadBoeken();

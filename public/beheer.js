// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  deleteDoc, 
  doc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 🔹 Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD6MVGAjfWWzw5LfiykYAA0Dyc9AgFPt5U",
  authDomain: "inventaris-kleuterboeken-bsow.firebaseapp.com",
  projectId: "inventaris-kleuterboeken-bsow",
  storageBucket: "inventaris-kleuterboeken-bsow.firebasestorage.app",
  messagingSenderId: "892488979059",
  appId: "1:892488979059:web:27de8ca6923aa0cc315006"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const boekenTabel = document.getElementById("boekenTabel");
const klasFilter = document.getElementById("klasFilter");

let alleBoeken = [];

// 🔹 Login/out knoppen
document.getElementById("loginBtn").addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Login fout:", error);
  }
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
});

// 🔹 State change → check user
onAuthStateChanged(auth, (user) => {
  if (user && user.email.endsWith("@bsow.be")) {
    document.getElementById("loginBtn").style.display = "none";
    document.getElementById("logoutBtn").style.display = "inline-block";

    laadBoeken(); // pas na login boeken ophalen
  } else {
    boekenTabel.innerHTML = "";
    alert("❌ Je moet inloggen met een @bsow.be account om deze pagina te gebruiken.");
    document.getElementById("loginBtn").style.display = "inline-block";
    document.getElementById("logoutBtn").style.display = "none";
  }
});

// 🔹 Boeken laden
async function laadBoeken() {
  boekenTabel.innerHTML = "";
  const querySnapshot = await getDocs(collection(db, "boeken"));

  let klassenSet = new Set();
  alleBoeken = [];

  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    alleBoeken.push({ id: docSnap.id, ...data });
    if (data.klas) klassenSet.add(data.klas);
  });

  klasFilter.innerHTML = '<option value="alle">Alle klassen</option>';
  klassenSet.forEach((klas) => {
    klasFilter.innerHTML += `<option value="${klas}">${klas}</option>`;
  });

  toonBoeken();
}

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

// 🔹 Verwijderen
window.verwijderBoek = async function(id) {
  if (confirm("Weet je zeker dat je dit boek wil verwijderen?")) {
    try {
      await deleteDoc(doc(db, "boeken", id));
      alert("Boek verwijderd ✅");
      laadBoeken();
    } catch (e) {
      console.error("Fout bij verwijderen:", e);
      alert("❌ Verwijderen mislukt");
    }
  }
};

// 🔹 Filter
klasFilter.addEventListener("change", toonBoeken);

// 🔹 Exporteer naar CSV
document.getElementById("exportCsvBtn").addEventListener("click", () => {
  let csv = "ISBN,Titel,Auteur,Klas,Toegevoegd door\n";
  alleBoeken.forEach((b) => {
    csv += `"${b.isbn || ""}","${b.titel || ""}","${b.auteur || ""}","${b.klas || ""}","${b.toegevoegdDoor || ""}"\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "boeken.csv");
  link.click();
});

// 🔹 Exporteer naar PDF
document.getElementById("exportPdfBtn").addEventListener("click", () => {
  const printWindow = window.open("", "_blank");
  let html = `
    <html>
      <head>
        <title>Boekenlijst</title>
        <style>
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #000; padding: 4px; font-size: 12px; }
          th { background: #f0f0f0; }
        </style>
      </head>
      <body>
        <h2>Boekenlijst</h2>
        <table>
          <tr>
            <th>ISBN</th>
            <th>Titel</th>
            <th>Auteur</th>
            <th>Klas</th>
            <th>Toegevoegd door</th>
          </tr>
          ${alleBoeken.map(b => `
            <tr>
              <td>${b.isbn || ""}</td>
              <td>${b.titel || ""}</td>
              <td>${b.auteur || ""}</td>
              <td>${b.klas || ""}</td>
              <td>${b.toegevoegdDoor || ""}</td>
            </tr>
          `).join("")}
        </table>
      </body>
    </html>
  `;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.print();
});

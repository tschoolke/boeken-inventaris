// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// Firebase config (zelfde als in script.js)
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

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const boekenTabel = document.getElementById("boekenTabel");
const klasFilter = document.getElementById("klasFilter");

let alleBoeken = [];

// ===== LOGIN =====
loginBtn.addEventListener("click", async () => { await signInWithPopup(auth, provider); });
logoutBtn.addEventListener("click", async () => { await signOut(auth); });

onAuthStateChanged(auth, (user) => {
  if (user && user.email.endsWith("@bsow.be")) {
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    laadBoeken();
  } else {
    boekenTabel.innerHTML = "";
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    alert("Je moet inloggen met een @bsow.be account.");
  }
});

// ===== BOEKEN LADEN =====
async function laadBoeken() {
  const snapshot = await getDocs(collection(db, "boeken"));
  alleBoeken = [];
  let klassenSet = new Set();

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    alleBoeken.push({ id: docSnap.id, ...data });
    if (data.klas) klassenSet.add(data.klas);
  });

  klasFilter.innerHTML = '<option value="alle">Alle klassen</option>';
  klassenSet.forEach((klas) => klasFilter.innerHTML += `<option value="${klas}">${klas}</option>`);

  toonBoeken();
}

function toonBoeken() {
  boekenTabel.innerHTML = "";
  const filter = klasFilter.value;

  alleBoeken
    .filter(b => filter === "alle" || b.klas === filter)
    .forEach(b => {
      boekenTabel.innerHTML += `
        <tr>
          <td>${b.isbn || ""}</td>
          <td>${b.titel || ""}</td>
          <td>${b.auteur || ""}</td>
          <td>${b.klas || ""}</td>
          <td>${b.categorie || ""}</td>
          <td>${b.doelgroep || ""}</td>
          <td>${b.cover ? `<img src="${b.cover}" style="max-height:80px;">` : ""}</td>
          <td>${b.toegevoegdDoor || ""}</td>
          <td><button class="btn btn-sm btn-danger" onclick="verwijderBoek('${b.id}')">Verwijder</button></td>
        </tr>`;
    });
}

window.verwijderBoek = async function(id) {
  if (confirm("Boek verwijderen?")) {
    await deleteDoc(doc(db, "boeken", id));
    laadBoeken();
  }
};

klasFilter.addEventListener("change", toonBoeken);

// ===== EXPORT CSV =====
document.getElementById("exportCsvBtn").addEventListener("click", () => {
  let csv = "ISBN,Titel,Auteur,Klas,Categorie,Doelgroep,Cover,Toegevoegd door\n";
  alleBoeken.forEach(b => {
    csv += `"${b.isbn || ""}","${b.titel || ""}","${b.auteur || ""}","${b.klas || ""}","${b.categorie || ""}","${b.doelgroep || ""}","${b.cover || ""}","${b.toegevoegdDoor || ""}"\n`;
  });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "boeken.csv";
  link.click();
});

// ===== EXPORT PDF =====
document.getElementById("exportPdfBtn").addEventListener("click", () => {
  const win = window.open("", "_blank");
  let html = `<html><head><title>Boekenlijst</title><style>
    table { width:100%; border-collapse: collapse; }
    th,td { border:1px solid #000; padding:4px; font-size:12px; }
    th { background:#eee; }
    img { max-height:60px; }
  </style></head><body>
  <h2>Boekenlijst</h2><table><tr>
  <th>ISBN</th><th>Titel</th><th>Auteur</th><th>Klas</th><th>Categorie</th><th>Doelgroep</th><th>Cover</th><th>Toegevoegd door</th>
  </tr>`;
  alleBoeken.forEach(b => {
    html += `<tr>
      <td>${b.isbn || ""}</td>
      <td>${b.titel || ""}</td>
      <td>${b.auteur || ""}</td>
      <td>${b.klas || ""}</td>
      <td>${b.categorie || ""}</td>
      <td>${b.doelgroep || ""}</td>
      <td>${b.cover ? `<img src="${b.cover}">` : ""}</td>
      <td>${b.toegevoegdDoor || ""}</td>
    </tr>`;
  });
  html += "</table></body></html>";
  win.document.write(html);
  win.document.close();
  win.print();
});

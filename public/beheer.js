// 🔑 Firebase config (jouw gegevens)
const firebaseConfig = {
  apiKey: "AIzaSyD6MVGAjfWWzw5LfiykYAA0Dyc9AgFPt5U",
  authDomain: "inventaris-kleuterboeken-bsow.firebaseapp.com",
  projectId: "inventaris-kleuterboeken-bsow",
  storageBucket: "inventaris-kleuterboeken-bsow.firebasestorage.app",
  messagingSenderId: "892488979059",
  appId: "1:892488979059:web:27de8ca6923aa0cc315006"
};

// Init Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const zoekveld = document.getElementById("zoekveld");
const klasFilter = document.getElementById("klasFilter");
const boekenBody = document.getElementById("boekenBody");

let alleBoeken = [];

// 🔄 Data ophalen in realtime
db.collection("boeken").orderBy("titel").onSnapshot(snapshot => {
  alleBoeken = [];
  snapshot.forEach(doc => {
    let boek = doc.data();
    boek.id = doc.id; // id nodig voor updates
    alleBoeken.push(boek);
  });
  updateKlasFilter();
  toonBoeken();
});

// 📋 Helper: gefilterde lijst
function getGefilterdeBoeken() {
  let zoekterm = zoekveld.value.toLowerCase();
  let klas = klasFilter.value;

  return alleBoeken.filter(b => {
    let matchZoek =
      (b.titel || "").toLowerCase().includes(zoekterm) ||
      (b.auteur || "").toLowerCase().includes(zoekterm);
    let matchKlas = klas ? (b.klas === klas) : true;
    return matchZoek && matchKlas;
  });
}

// 🏷️ Automatisch klasfilter opbouwen
function updateKlasFilter() {
  let klassen = [...new Set(alleBoeken.map(b => b.klas).filter(Boolean))].sort();
  klasFilter.innerHTML = `<option value="">Alle klassen</option>`;
  klassen.forEach(k => {
    let opt = document.createElement("option");
    opt.value = k;
    opt.textContent = k;
    klasFilter.appendChild(opt);
  });
}

// 📋 Boeken tonen in tabel
function toonBoeken() {
  boekenBody.innerHTML = "";
  let gefilterd = getGefilterdeBoeken();

  if (gefilterd.length === 0) {
    boekenBody.innerHTML = `<tr><td colspan="7">❌ Geen boeken gevonden</td></tr>`;
    return;
  }

  gefilterd.forEach(b => {
    let rij = document.createElement("tr");
    rij.innerHTML = `
      <td>${b.isbn || ""}</td>
      <td>${b.titel || ""}</td>
      <td>${b.auteur || ""}</td>
      <td>${b.klas || "-"}</td>
      <td>
        <select data-id="${b.id}" class="statusSelect">
          <option value="aanwezig" ${b.status === "aanwezig" ? "selected" : ""}>Aanwezig</option>
          <option value="uitgeleend" ${b.status === "uitgeleend" ? "selected" : ""}>Uitgeleend</option>
          <option value="beschadigd" ${b.status === "beschadigd" ? "selected" : ""}>Beschadigd</option>
        </select>
      </td>
      <td>${b.cover ? `<img src="${b.cover}" height="60">` : ""}</td>
      <td>${b.laatstGewijzigd ? new Date(b.laatstGewijzigd.toDate ? b.laatstGewijzigd.toDate() : b.laatstGewijzigd).toLocaleString() : ""}</td>
    `;
    boekenBody.appendChild(rij);
  });

  // Status dropdowns koppelen
  document.querySelectorAll(".statusSelect").forEach(sel => {
    sel.addEventListener("change", e => {
      let boekId = e.target.dataset.id;
      let nieuweStatus = e.target.value;
      db.collection("boeken").doc(boekId).update({
        status: nieuweStatus,
        laatstGewijzigd: firebase.firestore.FieldValue.serverTimestamp()
      });
    });
  });
}

// 🔍 Live filter
zoekveld.addEventListener("input", toonBoeken);
klasFilter.addEventListener("change", toonBoeken);

// 📥 CSV export
document.getElementById("exportBtn").addEventListener("click", () => {
  let boeken = getGefilterdeBoeken();
  if (boeken.length === 0) return alert("Geen boeken om te exporteren!");

  let csv = "ISBN;Titel;Auteur;Uitgever;Jaar;Paginas;Klas;Status;Laatst gewijzigd\n";
  boeken.forEach(b => {
    csv += `"${b.isbn || ""}";"${b.titel || ""}";"${b.auteur || ""}";"${b.uitgever || ""}";"${b.jaar || ""}";"${b.paginas || ""}";"${b.klas || ""}";"${b.status || ""}";"${b.laatstGewijzigd ? (b.laatstGewijzigd.toDate ? b.laatstGewijzigd.toDate().toLocaleString() : b.laatstGewijzigd) : ""}"\n`;
  });

  let blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  let url = URL.createObjectURL(blob);
  let link = document.createElement("a");
  link.href = url;
  link.download = "boeken_inventaris.csv";
  link.click();
});

// 📊 Excel export
document.getElementById("exportXlsxBtn").addEventListener("click", () => {
  let boeken = getGefilterdeBoeken();
  if (boeken.length === 0) return alert("Geen boeken om te exporteren!");

  let data = [["ISBN", "Titel", "Auteur", "Uitgever", "Jaar", "Paginas", "Klas", "Status", "Laatst gewijzigd"]];
  boeken.forEach(b => {
    data.push([
      b.isbn || "",
      b.titel || "",
      b.auteur || "",
      b.uitgever || "",
      b.jaar || "",
      b.paginas || "",
      b.klas || "",
      b.status || "",
      b.laatstGewijzigd ? (b.laatstGewijzigd.toDate ? b.laatstGewijzigd.toDate().toLocaleString() : b.laatstGewijzigd) : ""
    ]);
  });

  let ws = XLSX.utils.aoa_to_sheet(data);
  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Boeken");
  XLSX.writeFile(wb, "boeken_inventaris.xlsx");
});

// 🖨️ PDF export per klas
document.getElementById("exportPdfBtn").addEventListener("click", () => {
  let boeken = getGefilterdeBoeken();
  if (boeken.length === 0) return alert("Geen boeken om te exporteren!");

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Groepeer per klas
  let perKlas = {};
  boeken.forEach(b => {
    let klas = b.klas || "Onbekend";
    if (!perKlas[klas]) perKlas[klas] = [];
    perKlas[klas].push(b);
  });

  let eerstePagina = true;

  for (let klas in perKlas) {
    if (!eerstePagina) doc.addPage();
    eerstePagina = false;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`Inventaris Kleuterboeken - ${klas}`, 14, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    // Header
    let startY = 30;
    doc.text("ISBN", 14, startY);
    doc.text("Titel", 40, startY);
    doc.text("Auteur", 100, startY);
    doc.text("Status", 170, startY);
    doc.text("Gewijzigd", 200, startY);

    // Inhoud
    let y = startY + 6;
    perKlas[klas].forEach(b => {
      doc.text(b.isbn || "", 14, y);
      doc.text((b.titel || "").substring(0, 35), 40, y);
      doc.text((b.auteur || "").substring(0, 25), 100, y);
      doc.text(b.status || "", 170, y);
      doc.text(b.laatstGewijzigd ? (b.laatstGewijzigd.toDate ? b.laatstGewijzigd.toDate().toLocaleDateString() : b.laatstGewijzigd) : "", 200, y);

      y += 6;
      if (y > 280) { doc.addPage(); y = 20; }
    });
  }

  doc.save("boeken_inventaris_per_klas.pdf");
});

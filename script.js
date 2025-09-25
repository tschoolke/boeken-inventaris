// 🔑 Firebase config (jouw gegevens)
const firebaseConfig = {
  apiKey: "AIzaSyD6MVGAjfWWzw5LfiykYAA0Dyc9AgFPt5U",
  authDomain: "inventaris-kleuterboeken-bsow.firebaseapp.com",
  projectId: "inventaris-kleuterboeken-bsow",
  storageBucket: "inventaris-kleuterboeken-bsow.firebasestorage.app",
  messagingSenderId: "892488979059",
  appId: "1:892488979059:web:27de8ca6923aa0cc315006"
};

// Firebase initialiseren
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

let huidigBoek = {};

// 🔐 Login / logout
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const scanner = document.getElementById("scanner");
const saveBtn = document.getElementById("saveBtn");

loginBtn.addEventListener("click", () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider);
});
logoutBtn.addEventListener("click", () => auth.signOut());

auth.onAuthStateChanged(user => {
  if (user) {
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    scanner.style.display = "block";
    saveBtn.style.display = "inline-block";
  } else {
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    scanner.style.display = "none";
    saveBtn.style.display = "none";
  }
});

// 🎥 Start scanner
document.getElementById("scanBtn").addEventListener("click", () => {
  Quagga.init({
    inputStream: {
      name: "Live",
      type: "LiveStream",
      target: document.querySelector('#camera')
    },
    decoder: {
      readers: ["ean_reader"]
    }
  }, function(err) {
    if (err) { console.error(err); return }
    Quagga.start();
  });

  Quagga.onDetected(data => {
    let isbn = data.codeResult.code;
    console.log("Gescand ISBN:", isbn);
    Quagga.stop();
    haalBoekGegevens(isbn);
  });
});

// 📖 Boekgegevens ophalen via Google Books
async function haalBoekGegevens(isbn) {
  try {
    let res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
    let json = await res.json();

    if (json.totalItems > 0) {
      let boek = json.items[0].volumeInfo;
      huidigBoek = {
        isbn: isbn,
        titel: boek.title,
        auteur: (boek.authors || []).join(", "),
        uitgever: boek.publisher || "",
        jaar: boek.publishedDate || "",
        paginas: boek.pageCount || "",
        cover: boek.imageLinks?.thumbnail || "",
        status: "aanwezig",
        laatstGewijzigd: firebase.firestore.FieldValue.serverTimestamp()
      };

      document.getElementById("boekinfo").innerHTML = `
        <p><b>${huidigBoek.titel}</b></p>
        <p>Auteur: ${huidigBoek.auteur}</p>
        <p>Uitgever: ${huidigBoek.uitgever}</p>
        <p>Jaar: ${huidigBoek.jaar}</p>
        <p>Paginas: ${huidigBoek.paginas}</p>
        <img src="${huidigBoek.cover}" alt="Cover">
      `;
    } else {
      huidigBoek = { isbn: isbn };
      document.getElementById("boekinfo").innerHTML = `<p>Geen gegevens gevonden voor ISBN: ${isbn}</p>`;
    }
  } catch (err) {
    console.error("Fout bij ophalen boekgegevens:", err);
  }
}

// 💾 Opslaan
document.getElementById("saveBtn").addEventListener("click", () => {
  if (!huidigBoek.isbn) return alert("Geen boek gescand!");
  let klas = prompt("In welke klas hoort dit boek? (bv. K1A, K2B)");
  huidigBoek.klas = klas || "";

  db.collection("boeken").add(huidigBoek).then(() => {
    alert("Boek opgeslagen!");
    huidigBoek = {};
    document.getElementById("boekinfo").innerText = "Nog geen boek gescand.";
  });
});

// Firebase Kütüphanelerini İçe Aktarıyoruz (İnternetten çekiyor)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- 1. ADIM: FIREBASE AYARLARI ---
// Firebase Konsolundan aldığın "const firebaseConfig" kodunu AŞAĞIYA YAPIŞTIR:
const firebaseConfig = {
    apiKey: "SENIN_API_KEYIN_BURAYA",
    authDomain: "SENIN_PROJEN.firebaseapp.com",
    projectId: "SENIN_PROJEN",
    storageBucket: "SENIN_PROJEN.appspot.com",
    messagingSenderId: "SAYILAR",
    appId: "SAYILAR"
};
// ----------------------------------

// Firebase'i Başlat
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// --- HTML ELEMENTLERİNİ SEÇ ---
const loginScreen = document.getElementById('login-screen');
const registerScreen = document.getElementById('register-screen');
const mainApp = document.getElementById('main-app');
const userInfoText = document.getElementById('user-info');

// --- BUTON TIKLAMA OLAYLARI (Event Listeners) ---
// Butonların çalışmama sebebi HTML'de onclick kullanmaktı.
// Modül sisteminde addEventListener kullanılır:

// Sayfa Geçişleri
document.getElementById('btnShowRegister').addEventListener('click', () => {
    loginScreen.classList.add('hidden');
    registerScreen.classList.remove('hidden');
});

document.getElementById('btnShowLogin').addEventListener('click', () => {
    registerScreen.classList.add('hidden');
    loginScreen.classList.remove('hidden');
});

// Kayıt Ol (Email/Şifre)
document.getElementById('btnRegister').addEventListener('click', () => {
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-pass').value;
    createUserWithEmailAndPassword(auth, email, pass)
        .then((userCredential) => {
            alert("Kayıt Başarılı! Hoşgeldin: " + userCredential.user.email);
        })
        .catch((error) => {
            alert("Hata: " + error.message);
        });
});

// Giriş Yap (Email/Şifre)
document.getElementById('btnLogin').addEventListener('click', () => {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    signInWithEmailAndPassword(auth, email, pass)
        .catch((error) => {
            alert("Giriş Hatası: " + error.message);
        });
});

// Google ile Giriş
document.getElementById('btnGoogle').addEventListener('click', () => {
    signInWithPopup(auth, provider)
        .catch((error) => {
            alert("Google Giriş Hatası: " + error.message);
        });
});

// Çıkış Yap
document.getElementById('btnLogout').addEventListener('click', () => {
    signOut(auth);
});

// --- KULLANICI DURUMUNU DİNLE ---
// Kullanıcı giriş yaptığında veya çıktığında bu kod otomatik çalışır
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Kullanıcı Giriş Yapmış
        loginScreen.classList.add('hidden');
        registerScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');
        userInfoText.innerText = "Giriş Yapan: " + user.email;
    } else {
        // Kullanıcı Çıkış Yapmış
        mainApp.classList.add('hidden');
        loginScreen.classList.remove('hidden');
    }
});

// --- DİĞER FONKSİYONLAR (İl/İlçe, Tema) ---
const locationData = {
    "İstanbul": ["Kadıköy", "Beşiktaş", "Şişli"],
    "Ankara": ["Çankaya", "Keçiören", "Mamak"],
    "İzmir": ["Konak", "Karşıyaka", "Buca"]
};

// İlleri Yükle
const citySelect = document.getElementById("citySelect");
for (let city in locationData) {
    let option = document.createElement("option");
    option.text = city;
    option.value = city;
    citySelect.add(option);
}

// İlçe Değişimi
citySelect.addEventListener('change', () => {
    const districtSelect = document.getElementById("districtSelect");
    const city = citySelect.value;
    districtSelect.innerHTML = '<option value="">Seçiniz...</option>';
    
    if(city && locationData[city]) {
        districtSelect.disabled = false;
        locationData[city].forEach(d => {
            let opt = document.createElement("option");
            opt.text = d;
            districtSelect.add(opt);
        });
    } else {
        districtSelect.disabled = true;
    }
});

// Tema Değişimi
document.getElementById('theme-toggle').addEventListener('change', (e) => {
    if(e.target.checked) document.body.setAttribute('data-theme', 'dark');
    else document.body.removeAttribute('data-theme');
});

// Navigasyon
document.getElementById('nav-home').addEventListener('click', () => {
    document.getElementById('home-page').classList.add('active');
    document.getElementById('settings-page').classList.remove('active');
});
document.getElementById('nav-settings').addEventListener('click', () => {
    document.getElementById('home-page').classList.remove('active');
    document.getElementById('settings-page').classList.add('active');
});
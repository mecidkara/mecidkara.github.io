// Firebase Kütüphanelerini İnternetten Çekiyoruz (CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

// ********************************************
// SENİN GERÇEK FIREBASE AYARLARIN
// ********************************************
const firebaseConfig = {
  apiKey: "AIzaSyDJJNsf69H_LgwTvAgEVDBCvU_Axt2z-tE",
  authDomain: "okulproje-1c121.firebaseapp.com",
  projectId: "okulproje-1c121",
  storageBucket: "okulproje-1c121.firebasestorage.app",
  messagingSenderId: "562872201266",
  appId: "1:562872201266:web:d7bed6512608b12b150c2b",
  measurementId: "G-YG6GDVNE5K"
};

// Firebase'i Başlatma
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app); // Analitik servisini de ekledim
const provider = new GoogleAuthProvider();

// --- HTML ELEMENTLERİNİ SEÇME ---
const loginContainer = document.getElementById('login-container');
const registerContainer = document.getElementById('register-container');
const dashboard = document.getElementById('dashboard');

// --- BUTON TIKLAMALARI (Event Listeners) ---

// Kayıt Ol Butonu
document.getElementById('btn-register').addEventListener('click', async () => {
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-pass').value;
    const username = document.getElementById('reg-username').value;
    const name = document.getElementById('reg-name').value;
    const phone = document.getElementById('reg-phone').value;
    const address = document.getElementById('reg-address').value;

    if(pass.length < 6) { alert("Şifre en az 6 karakter olmalı!"); return; }

    try {
        const userCred = await createUserWithEmailAndPassword(auth, email, pass);
        const user = userCred.user;
        
        // Etiket Üret (Rastgele 4 haneli sayı)
        const etiket = Math.floor(1000 + Math.random() * 9000);
        const tamAd = `${username}#${etiket}`;

        // Veritabanına Yazma
        await setDoc(doc(db, "users", user.uid), {
            ad_soyad: name,
            kullanici_adi: username,
            etiket: etiket.toString(),
            tam_etiket: tamAd,
            telefon: phone,
            adres: address,
            email: email,
            arkadaslar: [],
            gelen_istekler: []
        });

        alert("Kayıt Başarılı! Kodun: " + tamAd);
    } catch (error) {
        console.error(error);
        alert("Hata: " + error.message);
    }
});

// Giriş Yap Butonu
document.getElementById('btn-login').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
        console.error(error);
        alert("Giriş Başarısız: " + error.message);
    }
});

// Google Giriş (Hem Kayıt Hem Giriş için aynı)
const googleLogin = async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            // İlk kez giriyorsa veritabanına kaydet
            const etiket = Math.floor(1000 + Math.random() * 9000);
            const username = user.displayName ? user.displayName.split(" ")[0] : "Anonim";
            const tamAd = `${username}#${etiket}`;

            await setDoc(doc(db, "users", user.uid), {
                ad_soyad: user.displayName,
                kullanici_adi: username,
                tam_etiket: tamAd,
                email: user.email,
                arkadaslar: []
            });
            alert("Google ile hesap açıldı: " + tamAd);
        }
    } catch (error) {
        console.error(error);
        alert("Google Hatası: " + error.message);
    }
};

document.getElementById('btn-google-login').addEventListener('click', googleLogin);
document.getElementById('btn-google-register').addEventListener('click', googleLogin);

// Çıkış Yap
document.getElementById('btn-logout').addEventListener('click', async () => {
    await signOut(auth);
    window.location.reload();
});

// Ekranlar Arası Geçiş
document.getElementById('to-register').addEventListener('click', () => {
    loginContainer.classList.add('hidden');
    registerContainer.classList.remove('hidden');
});
document.getElementById('to-login').addEventListener('click', () => {
    registerContainer.classList.add('hidden');
    loginContainer.classList.remove('hidden');
});

// --- KULLANICI DURUM KONTROLÜ ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Giriş yapılmışsa
        loginContainer.classList.add('hidden');
        registerContainer.classList.add('hidden');
        dashboard.classList.remove('hidden');

        // Kullanıcı verisini çek
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if(docSnap.exists()) {
            document.getElementById('user-display-name').innerText = docSnap.data().tam_etiket;
        }
    } else {
        // Çıkış yapılmışsa
        dashboard.classList.add('hidden');
        loginContainer.classList.remove('hidden');
    }
});
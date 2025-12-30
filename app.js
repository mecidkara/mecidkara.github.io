// --- AYARLAR VE VERİTABANI ---
// Versiyonu v2 yaptık ki temiz bir başlangıç olsun
const DB_KEY = 'logitrans_db_v2'; 
const USER_KEY = 'logitrans_active_user';
let isRegisterMode = true;
let currentUser = null;

// Varsayılan boş veriler
const DEFAULT_DATA = {
    loads: [
        { id: 1, route: "Ankara ➔ İzmir", p: "22.500 TL", type: "Sanayi", weight: "24 Ton" },
        { id: 2, route: "İstanbul ➔ Antalya", p: "19.000 TL", type: "Gıda", weight: "18 Ton" }
    ],
    myAds: [],
    messages: [],
    users: [] // Kullanıcı bilgileri burada saklanacak
};

// Veriyi çek veya oluştur
let DATA = JSON.parse(localStorage.getItem(DB_KEY)) || DEFAULT_DATA;
let selectedLoad = null;

// Sayfa açılınca oturum kontrolü
document.addEventListener('DOMContentLoaded', () => {
    checkSession();
});

// --- YARDIMCI FONKSİYONLAR ---
function saveDB() {
    localStorage.setItem(DB_KEY, JSON.stringify(DATA));
}

function saveUserSession(userObj) {
    localStorage.setItem(USER_KEY, JSON.stringify(userObj));
    currentUser = userObj;
}

function clearSession() {
    localStorage.removeItem(USER_KEY);
    location.reload();
}

function checkSession() {
    const savedUser = localStorage.getItem(USER_KEY);
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        
        // Giriş yapılmışsa paneli aç
        document.getElementById('auth-layer').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        
        document.getElementById('nav-name').innerText = currentUser.name || currentUser.username;
        document.getElementById('nav-phone').innerText = currentUser.phone || "Sürücü";
        if(currentUser.address) document.getElementById('nav-address').innerText = "📍 " + currentUser.address;
        if(currentUser.avatar) document.getElementById('nav-avatar').src = currentUser.avatar;
        
        renderLoads();
        renderMyAds();
    }
}

// --- KAYIT VE GİRİŞ (GÜVENLİKLİ) ---
function toggleAuthMode() {
    isRegisterMode = !isRegisterMode;
    const card = document.getElementById('auth-card');
    const subtitle = document.getElementById('auth-subtitle');
    const toggleText = document.getElementById('toggle-auth-text');
    const btn = document.getElementById('auth-submit-btn');

    if (isRegisterMode) {
        card.classList.remove('login-mode');
        subtitle.innerText = "Kurumsal Sürücü Kayıt Sistemi";
        toggleText.innerText = "Zaten hesabınız var mı? Giriş Yap";
        btn.innerText = "Sisteme Kayıt Ol ve Gir";
    } else {
        card.classList.add('login-mode');
        subtitle.innerText = "Sürücü Giriş Paneli";
        toggleText.innerText = "Hesabınız yok mu? Yeni Kayıt Oluştur";
        btn.innerText = "Giriş Yap";
    }
}

function handleSubmit() {
    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;

    if (!username || !password) return alert("Kullanıcı adı ve şifre zorunludur!");

    let activeUser = null;

    if (isRegisterMode) {
        // --- KAYIT ---
        // Kullanıcı adı kontrolü
        const existingUser = DATA.users.find(u => u.username === username);
        if (existingUser) return alert("Bu kullanıcı adı zaten alınmış!");

        const name = document.getElementById('reg-fullname').value;
        const tc = document.getElementById('reg-tc').value;
        const phone = document.getElementById('reg-phone').value;
        const address = document.getElementById('reg-address').value;
        const vehicle = document.getElementById('reg-vehicle').value;
        const avatarSrc = document.getElementById('user-preview').src;

        if (!name || tc.length !== 11 || !phone || !address) {
            return alert("Lütfen tüm alanları doldurun!");
        }

        activeUser = { 
            username, password, name, tc, phone, address, vehicle, avatar: avatarSrc, type: 'driver' 
        };

        DATA.users.push(activeUser);
        saveDB();
        alert("Kayıt Başarılı!");

    } else {
        // --- GİRİŞ (ŞİFRE KONTROLLÜ) ---
        const foundUser = DATA.users.find(u => u.username === username && u.password === password);
        
        if (!foundUser) {
            return alert("Hatalı kullanıcı adı veya şifre!");
        }
        activeUser = foundUser;
    }

    saveUserSession(activeUser);
    checkSession();
}

// --- İŞLEMLER ---
function renderLoads() {
    document.getElementById('load-grid').innerHTML = DATA.loads.map(l => `
        <div class="card">
            <h3>${l.route}</h3><p>${l.type} | ${l.weight}</p><strong style="color:green; display:block; margin:10px 0;">${l.p}</strong>
            <button class="btn-primary full" onclick="openOfferModal(${l.id})">Teklif Ver</button>
        </div>
    `).join('');
}

function saveAd() {
    const route = document.getElementById('ad-route').value;
    const date = document.getElementById('ad-date').value;
    if(!route || !date) return alert("Eksik bilgi!");

    DATA.myAds.push({ id: Date.now(), route, date, owner: currentUser.username });
    saveDB();
    renderMyAds();
    closeModal('ad-modal');
}

function renderMyAds() {
    const container = document.getElementById('my-ads-grid');
    // Sadece kendi ilanlarını gör
    const myAds = DATA.myAds.filter(ad => ad.owner === currentUser.username);

    if(myAds.length === 0) {
        container.innerHTML = "<p style='padding:10px; color:#999;'>Henüz ilanınız yok.</p>";
        return;
    }

    container.innerHTML = myAds.map(ad => `
        <div class="card" style="border-left-color:#3498db">
            <h3>${ad.route}</h3><p>📅 ${ad.date}</p>
            <button onclick="deleteAd(${ad.id})" style="color:red; border:none; background:none; cursor:pointer; float:right;">Sil 🗑️</button>
        </div>
    `).join('');
}

function deleteAd(id) {
    if(confirm("Silmek istiyor musunuz?")) {
        DATA.myAds = DATA.myAds.filter(ad => ad.id !== id);
        saveDB();
        renderMyAds();
    }
}

// --- DİĞER FONKSİYONLAR ---
function openOfferModal(id) {
    selectedLoad = DATA.loads.find(l => l.id === id);
    document.getElementById('offer-title').innerText = selectedLoad.route;
    document.getElementById('offer-info').innerText = "Fiyat: " + selectedLoad.p;
    openModal('offer-modal');
}

function confirmOffer() {
    closeModal('offer-modal');
    switchTab('messages', document.getElementById('btn-messages'));
    const chatBox = document.getElementById('chat-box');
    chatBox.innerHTML = `<div class="bubble in"><b>Sistem:</b> Teklif iletildi.</div><div class="bubble out">Hazırım.</div>`;
    setTimeout(() => {
        chatBox.innerHTML += `<div class="bubble in">Onaylandı, işi başlat?</div>`;
        document.getElementById('approval-panel').classList.remove('hidden');
    }, 1500);
}

function completeDeal() {
    document.getElementById('approval-panel').classList.add('hidden');
    document.getElementById('chat-box').innerHTML += `<div class="bubble in" style="background:#d4edda; color:#155724; align-self:center;">✅ İŞ BAŞLADI!</div>`;
}

function switchTab(id, btn) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById('tab-' + id).classList.remove('hidden');
    document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');
}

function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

function sendMessage() {
    const inp = document.getElementById('chat-input-field');
    if(!inp.value) return;
    document.getElementById('chat-box').innerHTML += `<div class="bubble out">${inp.value}</div>`;
    inp.value = "";
}

document.getElementById('image-input').addEventListener('change', function(e) {
    if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (ev) => document.getElementById('user-preview').src = ev.target.result;
        reader.readAsDataURL(e.target.files[0]);
    }
});
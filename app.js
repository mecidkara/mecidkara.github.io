// --- VERİTABANI VE AYARLAR ---
const DB_KEY = 'logitrans_final_v1';
const USER_KEY = 'logitrans_active_user';
const THEME_KEY = 'logitrans_theme';

let isRegisterMode = true;
let currentUser = null;
let currentChatPartner = null; // Şu an kiminle mesajlaşıyoruz?

const DEFAULT_DATA = {
    loads: [
        { id: 1, from: "Ankara", to: "İzmir", type: "Sanayi", weight: "24 Ton", price: "22.500 TL", date: "2023-11-20", owner: "sistem" },
        { id: 2, from: "İstanbul", to: "Antalya", type: "Gıda", weight: "18 Ton", price: "19.000 TL", date: "2023-11-21", owner: "sistem" }
    ],
    myAds: [],
    users: [],
    messages: [] // {from: 'mecid#1234', to: 'ahmet#5678', text: 'selam', time: ...}
};

let DATA = JSON.parse(localStorage.getItem(DB_KEY)) || DEFAULT_DATA;

document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    loadTheme();
});

// --- YARDIMCILAR ---
function saveDB() { localStorage.setItem(DB_KEY, JSON.stringify(DATA)); }
function saveUserSession(u) { localStorage.setItem(USER_KEY, JSON.stringify(u)); currentUser = u; }
function clearSession() { localStorage.removeItem(USER_KEY); location.reload(); }

// --- AUTH & ETİKET OLUŞTURMA ---
function checkSession() {
    const saved = localStorage.getItem(USER_KEY);
    if (saved) {
        currentUser = JSON.parse(saved);
        // Kullanıcının güncel halini veritabanından çek (Arkadaş ekleyince session eskimesin)
        const freshUser = DATA.users.find(u => u.username === currentUser.username && u.tag === currentUser.tag);
        if(freshUser) currentUser = freshUser;

        document.getElementById('auth-layer').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        
        // Sidebar Bilgileri
        document.getElementById('nav-name').innerText = currentUser.name;
        document.getElementById('nav-tag').innerText = "#" + currentUser.tag;
        document.getElementById('nav-avatar').src = currentUser.avatar;

        renderLoads();
        renderMyAds();
        renderContacts();
    }
}

function handleSubmit() {
    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;

    if (!username || !password) return alert("Kullanıcı adı ve şifre zorunlu!");

    if (isRegisterMode) {
        // Kayıt Olma
        const name = document.getElementById('reg-fullname').value;
        const phone = document.getElementById('reg-phone').value;
        
        // RASTGELE ETİKET OLUŞTURMA (Örn: 1024)
        const tag = Math.floor(1000 + Math.random() * 9000).toString();

        // Benzersizlik Kontrolü
        if (DATA.users.find(u => u.username === username && u.tag === tag)) {
            return alert("Şanssızlık! Bu etiket dolu, tekrar dene.");
        }

        const newUser = {
            username, password, name, phone, tag,
            avatar: document.getElementById('user-preview').src,
            friends: [] // Arkadaş listesi boş başlar
        };

        DATA.users.push(newUser);
        saveDB();
        alert(`Kayıt Başarılı! LogiTrans Etiketiniz: #${tag}`);
    } else {
        // Giriş Yapma
        const found = DATA.users.find(u => u.username === username && u.password === password);
        if (!found) return alert("Hatalı kullanıcı adı veya şifre!");
        currentUser = found;
    }
    saveUserSession(currentUser);
    checkSession();
}

// --- ARKADAŞ SİSTEMİ ---
function addFriend() {
    const input = document.getElementById('friend-tag-input').value; // Örn: mecid#1234
    if (!input.includes('#')) return alert("Lütfen 'isim#1234' formatında girin!");

    const [targetName, targetTag] = input.split('#');

    // 1. Kendini ekleyemesin
    if (targetName === currentUser.username && targetTag === currentUser.tag) {
        return alert("Kendinizi ekleyemezsiniz!");
    }

    // 2. Kullanıcı var mı?
    const friend = DATA.users.find(u => u.username === targetName && u.tag === targetTag);
    if (!friend) return alert("Böyle bir kullanıcı bulunamadı!");

    // 3. Zaten ekli mi?
    const alreadyFriend = currentUser.friends && currentUser.friends.some(f => f.fullTag === input);
    if (alreadyFriend) return alert("Bu kişi zaten arkadaşınız.");

    // 4. Ekleme İşlemi
    if (!currentUser.friends) currentUser.friends = [];
    
    // Arkadaş objesini oluştur
    const newFriendObj = {
        fullTag: input, // mecid#1234
        name: friend.name,
        avatar: friend.avatar
    };

    // Benim listeme ekle
    const myIndex = DATA.users.findIndex(u => u.username === currentUser.username && u.tag === currentUser.tag);
    DATA.users[myIndex].friends.push(newFriendObj);
    
    // (Opsiyonel) Karşı tarafın da listesine beni ekle
    const friendIndex = DATA.users.findIndex(u => u.username === friend.username && u.tag === friend.tag);
    DATA.users[friendIndex].friends.push({
        fullTag: `${currentUser.username}#${currentUser.tag}`,
        name: currentUser.name,
        avatar: currentUser.avatar
    });

    saveDB();
    saveUserSession(DATA.users[myIndex]); // Session güncelle
    renderContacts();
    closeModal('add-friend-modal');
    alert(`${friend.name} arkadaş listesine eklendi!`);
}

function renderContacts() {
    const container = document.getElementById('contact-container');
    container.innerHTML = "";

    if (!currentUser.friends || currentUser.friends.length === 0) {
        container.innerHTML = "<p style='padding:10px; font-size:12px; color:#888;'>Henüz arkadaşın yok.</p>";
        return;
    }

    currentUser.friends.forEach(f => {
        const div = document.createElement('div');
        div.className = 'contact-item';
        div.innerHTML = `<img src="${f.avatar}"><div><strong>${f.name}</strong><br><small>${f.fullTag}</small></div>`;
        div.onclick = () => openChat(f);
        container.appendChild(div);
    });
}

// --- MESAJLAŞMA (FİLTRELİ) ---
function openChat(friend) {
    currentChatPartner = friend;
    document.getElementById('chat-header-name').innerText = friend.name + " ile sohbet";
    document.getElementById('chat-input-area').classList.remove('hidden');
    
    // Aktif class ekle
    document.querySelectorAll('.contact-item').forEach(el => el.classList.remove('active'));
    // (Görsel seçim efekti için burada event.target kullanılabilir ama basit tutuyoruz)

    renderMessages();
}

function sendMessage() {
    const input = document.getElementById('chat-input-field');
    if (!input.value || !currentChatPartner) return;

    const myTag = `${currentUser.username}#${currentUser.tag}`;
    
    const msgObj = {
        from: myTag,
        to: currentChatPartner.fullTag,
        text: input.value,
        time: Date.now()
    };

    DATA.messages.push(msgObj);
    saveDB();
    renderMessages();
    input.value = "";
}

function renderMessages() {
    if (!currentChatPartner) return;
    const box = document.getElementById('chat-box');
    const myTag = `${currentUser.username}#${currentUser.tag}`;
    const partnerTag = currentChatPartner.fullTag;

    // Sadece bu ikili arasındaki mesajları filtrele
    const chatHistory = DATA.messages.filter(m => 
        (m.from === myTag && m.to === partnerTag) || 
        (m.from === partnerTag && m.to === myTag)
    );

    box.innerHTML = chatHistory.map(m => {
        const isMe = m.from === myTag;
        return `<div class="bubble ${isMe ? 'out' : 'in'}">${m.text}</div>`;
    }).join('');
    
    box.scrollTop = box.scrollHeight;
}

// --- İLAN SİSTEMİ (GELİŞMİŞ) ---
function saveAd() {
    const from = document.getElementById('ad-from').value;
    const to = document.getElementById('ad-to').value;
    const type = document.getElementById('ad-type').value;
    const weight = document.getElementById('ad-weight').value;
    const price = document.getElementById('ad-price').value;
    const date = document.getElementById('ad-date').value;

    if(!from || !to || !price) return alert("Lütfen ana bilgileri doldurun!");

    DATA.myAds.push({
        id: Date.now(),
        from, to, type, weight, price, date,
        owner: `${currentUser.username}#${currentUser.tag}`
    });

    // Ana havuza da ekleyelim (Basitleştirilmiş mantık)
    DATA.loads.push({
        id: Date.now(), from, to, type, weight, price, date, owner: currentUser.name
    });

    saveDB();
    renderMyAds();
    renderLoads();
    closeModal('ad-modal');
}

function renderLoads() {
    document.getElementById('load-grid').innerHTML = DATA.loads.map(l => `
        <div class="card">
            <h3>${l.from} ➔ ${l.to}</h3>
            <p>${l.type} | ${l.weight}</p>
            <p style="font-size:12px; color:#888">📅 ${l.date}</p>
            <strong style="color:green; display:block; margin:10px 0;">${l.price}</strong>
            <button class="btn-primary full">Teklif Ver</button>
        </div>
    `).join('');
}

function renderMyAds() {
    const myTag = `${currentUser.username}#${currentUser.tag}`;
    const ads = DATA.myAds.filter(ad => ad.owner === myTag);
    
    document.getElementById('my-ads-grid').innerHTML = ads.length ? ads.map(ad => `
        <div class="card" style="border-left-color:#3498db">
            <h3>${ad.from} ➔ ${ad.to}</h3>
            <p>${ad.price}</p>
            <button onclick="deleteAd(${ad.id})" style="color:red; background:none; border:none; float:right;">Sil 🗑️</button>
        </div>
    `).join('') : "<p>Henüz ilan yok.</p>";
}

function deleteAd(id) {
    DATA.myAds = DATA.myAds.filter(a => a.id !== id);
    saveDB();
    renderMyAds();
}

// --- TEMA VE DİĞERLERİ ---
function loadTheme() {
    const theme = localStorage.getItem(THEME_KEY);
    if(theme === 'dark') document.body.classList.add('dark-mode');
    updateThemeBtn();
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem(THEME_KEY, document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    updateThemeBtn();
}

function updateThemeBtn() {
    const btn = document.getElementById('theme-btn');
    if(btn) btn.innerText = document.body.classList.contains('dark-mode') ? "🌙 Koyu Mod" : "☀️ Açık Mod";
}

// Genel UI Fonksiyonları
function toggleAuthMode() {
    isRegisterMode = !isRegisterMode;
    const card = document.getElementById('auth-card');
    const btn = document.getElementById('auth-submit-btn');
    const toggle = document.getElementById('toggle-auth-text');

    if(isRegisterMode) {
        card.classList.remove('login-mode');
        btn.innerText = "Kayıt Ol ve Gir";
        toggle.innerText = "Zaten hesabınız var mı? Giriş Yap";
    } else {
        card.classList.add('login-mode');
        btn.innerText = "Giriş Yap";
        toggle.innerText = "Hesabınız yok mu? Kayıt Ol";
    }
}

function switchTab(id, btn) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById('tab-' + id).classList.remove('hidden');
    document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

// Fotoğraf Yükleme
function setupPreview(inputId, imgId) {
    const el = document.getElementById(inputId);
    if(el) el.addEventListener('change', e => {
        if(e.target.files[0]) {
            const r = new FileReader();
            r.onload = ev => document.getElementById(imgId).src = ev.target.result;
            r.readAsDataURL(e.target.files[0]);
        }
    });
}
setupPreview('image-input', 'user-preview');
setupPreview('edit-image-input', 'edit-preview');

// Ayar Kaydetme
function openSettings() {
    openModal('settings-modal');
    document.getElementById('edit-name').value = currentUser.name;
    document.getElementById('edit-phone').value = currentUser.phone;
    document.getElementById('edit-preview').src = currentUser.avatar;
}

function saveSettings() {
    // Basit güncelleme
    currentUser.name = document.getElementById('edit-name').value;
    currentUser.phone = document.getElementById('edit-phone').value;
    currentUser.avatar = document.getElementById('edit-preview').src;
    const pass = document.getElementById('edit-password').value;
    
    // Veritabanında güncelle
    const idx = DATA.users.findIndex(u => u.username === currentUser.username && u.tag === currentUser.tag);
    if(idx > -1) {
        DATA.users[idx] = {...DATA.users[idx], ...currentUser}; // Bilgileri birleştir
        if(pass) DATA.users[idx].password = pass;
        saveDB();
        saveUserSession(DATA.users[idx]);
        checkSession();
        closeModal('settings-modal');
        alert("Güncellendi!");
    }
}
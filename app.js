let isRegisterMode = true;
const DATA = {
    loads: [
        { id: 1, route: "Ankara ➔ İzmir", p: "22.500 TL", type: "Sanayi", weight: "24 Ton" },
        { id: 2, route: "İstanbul ➔ Antalya", p: "19.000 TL", type: "Gıda", weight: "18 Ton" }
    ],
    myAds: []
};
let selectedLoad = null;

// --- AUTH MANTIĞI ---
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
    const user = document.getElementById('reg-username').value;
    if (!user) return alert("Kullanıcı adı boş bırakılamaz!");

    if (isRegisterMode) {
        const name = document.getElementById('reg-fullname').value;
        const tc = document.getElementById('reg-tc').value;
        const phone = document.getElementById('reg-phone').value;
        const address = document.getElementById('reg-address').value;

        if (!name || tc.length !== 11 || !phone || !address) {
            return alert("Lütfen kurumsal kayıt için tüm alanları doldurun!");
        }
        document.getElementById('nav-name').innerText = name;
        document.getElementById('nav-phone').innerText = phone;
        document.getElementById('nav-address').innerText = "📍 " + address;
    } else {
        document.getElementById('nav-name').innerText = user;
        document.getElementById('nav-phone').innerText = "Kayıtlı Sürücü";
    }

    document.getElementById('nav-avatar').src = document.getElementById('user-preview').src;
    document.getElementById('auth-layer').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    renderLoads();
}

// --- YÜK VE İLAN YÖNETİMİ ---
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
    if(!route || !date) return alert("Lütfen detayları girin!");
    DATA.myAds.push({ route, date });
    renderMyAds();
    closeModal('ad-modal');
}

function renderMyAds() {
    document.getElementById('my-ads-grid').innerHTML = DATA.myAds.map(ad => `
        <div class="card" style="border-left-color:#3498db">
            <h3>${ad.route}</h3><p>📅 Tarih: ${ad.date}</p>
        </div>
    `).join('');
}

// --- MESAJLAR VE ONAY ---
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
    chatBox.innerHTML = `<div class="bubble in"><b>Sistem:</b> Teklifiniz iletildi.</div>
                         <div class="bubble out">Yük için hazırım kaptan.</div>`;
    setTimeout(() => {
        chatBox.innerHTML += `<div class="bubble in">Teklifini onayladım, işi başlatmak için son onayı verir misin?</div>`;
        document.getElementById('approval-panel').classList.remove('hidden');
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 2000);
}

function completeDeal() {
    document.getElementById('approval-panel').classList.add('hidden');
    document.getElementById('chat-box').innerHTML += `<div class="bubble in" style="background:#d4edda; color:#155724; align-self:center; width:90%; text-align:center;">✅ İŞ KARŞILIKLI ONAYLANDI!</div>`;
}

// --- GENEL ---
function switchTab(id, btn) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById('tab-' + id).classList.remove('hidden');
    document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
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
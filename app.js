// 1. İLLER VE İLÇELER VERİTABANI
const locationData = {
    "Adana": ["Seyhan", "Çukurova", "Yüreğir", "Sarıçam"],
    "Ankara": ["Çankaya", "Keçiören", "Mamak", "Yenimahalle", "Etimesgut", "Sincan"],
    "Antalya": ["Muratpaşa", "Kepez", "Konyaaltı", "Alanya", "Manavgat"],
    "Bursa": ["Osmangazi", "Nilüfer", "Yıldırım", "Gemlik"],
    "İstanbul": ["Kadıköy", "Beşiktaş", "Üsküdar", "Fatih", "Şişli", "Maltepe", "Pendik", "Esenyurt"],
    "İzmir": ["Konak", "Karşıyaka", "Bornova", "Buca", "Çiğli"],
    "Trabzon": ["Ortahisar", "Akçaabat"],
    "Samsun": ["İlkadım", "Atakum"],
    "Van": ["İpekyolu", "Tuşba"]
};

// Sayfa yüklendiğinde İlleri Doldur
document.addEventListener("DOMContentLoaded", () => {
    const citySelect = document.getElementById("citySelect");
    for (let city in locationData) {
        let option = document.createElement("option");
        option.text = city;
        option.value = city;
        citySelect.add(option);
    }
    
    // Arkadaş listesini doldur
    loadFriends();
});

// İlçeleri Getir
function loadDistricts() {
    const citySelect = document.getElementById("citySelect");
    const districtSelect = document.getElementById("districtSelect");
    const selectedCity = citySelect.value;
    
    districtSelect.innerHTML = '<option value="">Seçiniz...</option>';

    if (selectedCity && locationData[selectedCity]) {
        districtSelect.disabled = false;
        locationData[selectedCity].forEach(dist => {
            let option = document.createElement("option");
            option.text = dist;
            districtSelect.add(option);
        });
    } else {
        districtSelect.disabled = true;
    }
}

// 2. GİRİŞ SİSTEMİ
function showRegister() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('register-screen').classList.remove('hidden');
}

function showLogin() {
    document.getElementById('register-screen').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
}

function login() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
}

function registerUser() {
    alert("Kayıt Başarılı! Giriş yapılıyor...");
    login();
}

function googleLogin() {
    alert("Google Hesabı Seçme Ekranı Açılıyor... (Simülasyon)");
    login();
}

function logout() {
    document.getElementById('main-app').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
    switchTab('home');
}

// 3. SEKMELER ARASI GEÇİŞ
function switchTab(tabName) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(tabName + '-page').classList.add('active');

    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    
    if(tabName === 'home') document.querySelectorAll('.nav-item')[0].classList.add('active');
    if(tabName === 'friends') document.querySelectorAll('.nav-item')[1].classList.add('active');
    if(tabName === 'settings') document.querySelectorAll('.nav-item')[2].classList.add('active');
}

// 4. ARKADAŞ LİSTESİ
function loadFriends() {
    const friends = [
        { name: "Ahmet Yılmaz", status: "Çevrimiçi", img: "A" },
        { name: "Ayşe Demir", status: "10 dk önce", img: "A" },
        { name: "Mehmet Çelik", status: "Çevrimdışı", img: "M" },
        { name: "Zeynep Kaya", status: "Çevrimiçi", img: "Z" }
    ];

    const friendListContainer = document.getElementById("friend-list");
    friends.forEach(friend => {
        friendListContainer.innerHTML += `
            <div class="list-item">
                <div style="display:flex; align-items:center;">
                    <div class="avatar">${friend.img}</div>
                    <div>
                        <div style="font-weight:bold;">${friend.name}</div>
                        <div style="font-size:12px; color:gray;">${friend.status}</div>
                    </div>
                </div>
                <i class="fas fa-comment-dots" style="color:var(--primary-color); font-size:20px;"></i>
            </div>
        `;
    });
}

// 5. KOYU TEMA
function toggleTheme() {
    const isDark = document.getElementById('theme-toggle').checked;
    if (isDark) {
        document.body.setAttribute('data-theme', 'dark');
    } else {
        document.body.removeAttribute('data-theme');
    }
}
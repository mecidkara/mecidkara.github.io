// --- VERİTABANI SİMÜLASYONU (ŞEHİRLER VE İLÇELER) ---
const citiesData = {
    "İstanbul": ["Kadıköy", "Esenyurt", "Pendik", "Beşiktaş", "Tuzla", "Başakşehir"],
    "Ankara": ["Çankaya", "Mamak", "Keçiören", "Yenimahalle", "Sincan"],
    "İzmir": ["Bornova", "Karşıyaka", "Konak", "Buca", "Gaziemir"],
    "Antalya": ["Muratpaşa", "Kepez", "Alanya", "Manavgat"],
    "Bursa": ["Nilüfer", "Osmangazi", "Yıldırım", "İnegöl"],
    "Adana": ["Seyhan", "Çukurova", "Yüreğir"],
    "Konya": ["Selçuklu", "Meram", "Karatay"]
};

// --- MEVCUT YÜK İLANLARI (MOCK DATA) ---
let loads = [
    { 
        id: 1, 
        company: "Yılmaz Lojistik", 
        fromCity: "İstanbul", fromDist: "Tuzla", 
        toCity: "Ankara", toDist: "Mamak", 
        address: "Organize Sanayi Bölgesi 5. Cadde No:12", 
        type: "Tenteli", 
        price: "18.000 TL", 
        isFriend: true 
    },
    { 
        id: 2, 
        company: "Ege Trans", 
        fromCity: "İzmir", fromDist: "Bornova", 
        toCity: "Bursa", toDist: "Nilüfer", 
        address: "Liman Depoları A Blok", 
        type: "Frigo", 
        price: "12.500 TL", 
        isFriend: false 
    },
    { 
        id: 3, 
        company: "Kardeşler Nakliyat", 
        fromCity: "Antalya", fromDist: "Kepez", 
        toCity: "İstanbul", toDist: "Kadıköy", 
        address: "Hal Kompleksi No:45", 
        type: "Damper", 
        price: "25.000 TL", 
        isFriend: false 
    },
    { 
        id: 4, 
        company: "Anadolu Taşımacılık", 
        fromCity: "Konya", fromDist: "Selçuklu", 
        toCity: "Adana", toDist: "Seyhan", 
        address: "Toptancılar Sitesi 3. Blok", 
        type: "Sal Kasa", 
        price: "9.500 TL", 
        isFriend: false 
    }
];

// --- SAYFA YÜKLENİNCE ÇALIŞACAKLAR ---
window.onload = () => {
    renderLoads(loads);        // Yükleri ekrana bas
    populateCitySelects();     // Şehir listelerini (select) doldur
};

// --- YÜKLERİ HTML OLARAK OLUŞTURMA ---
const container = document.getElementById('loadContainer');
const countLabel = document.getElementById('resultCount');

function renderLoads(data) {
    container.innerHTML = ""; // Önce temizle
    countLabel.innerText = `Toplam ${data.length} ilan bulundu`;

    if (data.length === 0) {
        container.innerHTML = "<p style='text-align:center; color:#666; margin-top:20px'>Aradığınız kriterlere uygun ilan bulunamadı.</p>";
        return;
    }

    data.forEach(load => {
        // Arkadaşlık durumu kontrolü
        const friendBtn = load.isFriend 
            ? `<button class="btn-friend added"><i class="fa-solid fa-user-check"></i> Arkadaşın</button>` 
            : `<button class="btn-friend" onclick="addFriend(${load.id})"><i class="fa-solid fa-user-plus"></i> Takip Et</button>`;

        const card = `
            <div class="load-card">
                <div class="card-header-mobile">
                    <span class="company-name"><i class="fa-solid fa-building"></i> ${load.company}</span>
                    ${friendBtn}
                </div>
                
                <div class="route-info">
                    <h4>${load.fromCity} (${load.fromDist}) <i class="fa-solid fa-arrow-right" style="color:var(--primary); margin:0 5px;"></i> ${load.toCity} (${load.toDist})</h4>
                    <span class="address-text"><i class="fa-solid fa-map-pin"></i> ${load.address}</span>
                </div>
                
                <div class="specs">
                    <span class="tag"><i class="fa-solid fa-truck"></i> ${load.type}</span>
                    <span class="price-tag">${load.price}</span>
                </div>
                
                <div class="action-area">
                    <button class="btn-offer" onclick="openModal('${load.company} firmasına teklifiniz iletildi. En kısa sürede dönüş yapılacaktır.')">Teklif Ver</button>
                </div>
            </div>
        `;
        container.innerHTML += card;
    });
}

// --- ŞEHİR VE İLÇE SEÇİM MANTIĞI ---
function populateCitySelects() {
    const citySelects = [document.getElementById('inputCityFrom'), document.getElementById('inputCityTo')];
    const cityNames = Object.keys(citiesData);

    citySelects.forEach(select => {
        cityNames.forEach(city => {
            let option = document.createElement("option");
            option.value = city;
            option.text = city;
            select.appendChild(option);
        });
    });
}

function loadDistricts(citySelectId, districtSelectId) {
    const citySelect = document.getElementById(citySelectId);
    const districtSelect = document.getElementById(districtSelectId);
    const selectedCity = citySelect.value;

    districtSelect.innerHTML = '<option value="">İlçe Seçin</option>';

    if (selectedCity && citiesData[selectedCity]) {
        districtSelect.disabled = false;
        citiesData[selectedCity].forEach(dist => {
            let option = document.createElement("option");
            option.value = dist;
            option.text = dist;
            districtSelect.appendChild(option);
        });
    } else {
        districtSelect.disabled = true;
    }
}

// --- YENİ İLAN KAYDETME FONKSİYONU ---
function saveLoad(e) {
    e.preventDefault(); 

    const newLoad = {
        id: loads.length + 1,
        company: "Benim Lojistik A.Ş.", 
        fromCity: document.getElementById('inputCityFrom').value,
        fromDist: document.getElementById('inputDistrictFrom').value,
        toCity: document.getElementById('inputCityTo').value,
        toDist: document.getElementById('inputDistrictTo').value,
        address: document.getElementById('inputAddressFrom').value,
        type: document.getElementById('inputType').value,
        price: document.getElementById('inputPrice').value,
        isFriend: true
    };

    loads.unshift(newLoad); // Listeye ekle
    renderLoads(loads);     // Ekranı güncelle
    closeAddModal();        // Formu kapat
    openModal("İlanınız başarıyla yayınlandı!");
    
    // Formu sıfırla
    document.getElementById('addLoadForm').reset();
    document.getElementById('inputDistrictFrom').disabled = true;
    document.getElementById('inputDistrictTo').disabled = true;
}

// --- ARKADAŞ EKLEME FONKSİYONU ---
function addFriend(id) {
    const load = loads.find(l => l.id === id);
    if (load) {
        load.isFriend = true;
        renderLoads(loads); 
        openModal(`${load.company} arkadaş listenize eklendi!`);
    }
}

// --- FİLTRELEME FONKSİYONU ---
function filterLoads() {
    const fromVal = document.getElementById('filterFrom').value.toLowerCase();
    const toVal = document.getElementById('filterTo').value.toLowerCase();
    const typeVal = document.getElementById('filterType').value;

    const filtered = loads.filter(load => {
        const matchFrom = load.fromCity.toLowerCase().includes(fromVal);
        const matchTo = load.toCity.toLowerCase().includes(toVal);
        const matchType = typeVal === "all" || load.type === typeVal;

        return matchFrom && matchTo && matchType;
    });

    renderLoads(filtered);
}

// --- MODAL AÇMA / KAPAMA YARDIMCILARI ---
const msgModal = document.getElementById('customModal');
const addModal = document.getElementById('addLoadModal');
const msgText = document.getElementById('modalMessage');

function openModal(message) {
    msgText.innerText = message;
    msgModal.style.display = 'flex';
}

function closeModal() { msgModal.style.display = 'none'; }
function openAddModal() { addModal.style.display = 'flex'; }
function closeAddModal() { addModal.style.display = 'none'; }

// Dışarı tıklayınca kapatma
window.onclick = function(event) {
    if (event.target == msgModal) closeModal();
    if (event.target == addModal) closeAddModal();
}
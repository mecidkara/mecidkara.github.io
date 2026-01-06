document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    loadTheme();
    loadExampleData();
    setupPhotoUpload();
    setupRegisterPhotoUpload();
});

// === GLOBAL DEĞİŞKENLER ===
let tempRegisterPhoto = ''; 

// ==========================================
// === YARDIMCI FONKSİYON: RESİM Mİ İKON MU? ===
// ==========================================
// Bu fonksiyon, fotoğraf varsa resmi, yoksa ikonu basar.
function renderProfileImage(photoRaw, className) {
    if (photoRaw && photoRaw.length > 20) { // Basit kontrol: Veri varsa ve uzunsa (base64 ise)
        return `<img src="${photoRaw}" class="${className}" style="object-fit:cover;">`;
    }
    
    // Fotoğraf yoksa ikon göster (CSS classlarını koruyarak div oluşturuyoruz)
    let iconSize = className.includes('lg') ? '4rem' : '1.2rem';
    let bgColor = document.body.classList.contains('dark-mode') ? '#374151' : '#e5e7eb';
    let iconColor = document.body.classList.contains('dark-mode') ? '#9ca3af' : '#6b7280';
    
    return `<div class="${className}" style="background:${bgColor}; display:flex; align-items:center; justify-content:center; overflow:hidden;">
                <i class="fa-solid fa-user" style="font-size:${iconSize}; color:${iconColor};"></i>
            </div>`;
}

// ==========================================
// === ÖZEL UYARI VE ONAY SİSTEMİ (MODAL) ===
// ==========================================

function emmiUyarisi(mesaj) {
    const modalMsg = document.getElementById('modal-msg');
    const customAlert = document.getElementById('custom-alert');
    if(modalMsg && customAlert) {
        modalMsg.innerText = mesaj;
        customAlert.classList.remove('hidden-screen');
    }
}
function closeCustomAlert() {
    document.getElementById('custom-alert').classList.add('hidden-screen');
}

function emmiSoruyor(mesaj, evetIslemi) {
    const confirmMsg = document.getElementById('confirm-msg');
    const customConfirm = document.getElementById('custom-confirm');
    const yesBtn = document.getElementById('confirm-yes-btn');

    if(confirmMsg && customConfirm && yesBtn) {
        confirmMsg.innerText = mesaj;
        customConfirm.classList.remove('hidden-screen');
        yesBtn.onclick = function() {
            evetIslemi(); 
            closeCustomConfirm(); 
        };
    }
}
function closeCustomConfirm() {
    document.getElementById('custom-confirm').classList.add('hidden-screen');
}

// === DATABASE YÖNETİMİ ===
function getAllUsers() { try { return JSON.parse(localStorage.getItem('users_db')) || []; } catch (e) { return []; } }
function saveAllUsers(users) { localStorage.setItem('users_db', JSON.stringify(users)); }

function getCurrentUserFull() {
    let sessionUser = JSON.parse(localStorage.getItem('currentUser'));
    if(!sessionUser) return null;
    let users = getAllUsers();
    let guncelUser = users.find(u => u.username === sessionUser.username);
    if(guncelUser) { localStorage.setItem('currentUser', JSON.stringify(guncelUser)); return guncelUser; }
    return sessionUser;
}

function updateAnyUser(updatedUser) {
    let users = getAllUsers();
    let index = users.findIndex(u => u.username === updatedUser.username);
    if(index !== -1) {
        users[index] = updatedUser;
        saveAllUsers(users);
        let current = JSON.parse(localStorage.getItem('currentUser'));
        if(current && current.username === updatedUser.username) {
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }
    }
}

// === EKRAN GEÇİŞLERİ ===
function showScreen(screenId) {
    document.querySelectorAll('section').forEach(el => { el.classList.remove('active-screen'); el.classList.add('hidden-screen'); });
    const target = document.getElementById(screenId);
    if(target) { target.classList.remove('hidden-screen'); target.classList.add('active-screen'); window.scrollTo(0, 0); }
}
function closeUserProfile() { showScreen('app-screen'); }

// ==========================================
// === FOTOĞRAF İŞLEMLERİ VE SIKIŞTIRMA ===
// ==========================================

function compressImage(base64Str, maxWidth = 300, quality = 0.7) {
    return new Promise((resolve) => {
        let img = new Image();
        img.src = base64Str;
        img.onload = () => {
            let canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            if (width > maxWidth) {
                height *= maxWidth / width;
                width = maxWidth;
            }
            canvas.width = width;
            canvas.height = height;
            let ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(base64Str);
    });
}

function setupRegisterPhotoUpload() {
    const regInput = document.getElementById('regFileInput');
    const regPreviewImg = document.getElementById('regPhotoPreviewImg');
    const regPreviewBox = document.getElementById('regPhotoPreviewBox');
    if(!regInput) return;

    regInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async function(readerEvent) {
                tempRegisterPhoto = await compressImage(readerEvent.target.result);
                // Preview için img etiketini göster
                regPreviewImg.src = tempRegisterPhoto;
                regPreviewImg.classList.remove('hidden-screen');
                regPreviewBox.classList.add('hidden-screen');
            }
            reader.readAsDataURL(file);
        }
    });
}

function setupPhotoUpload() {
    const fileInput = document.getElementById('fileInput');
    if(!fileInput) return;
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async function(readerEvent) {
                let user = getCurrentUserFull();
                user.photo = await compressImage(readerEvent.target.result);
                updateAnyUser(user);
                emmiUyarisi("Profil fotoğrafın yüklendi!");
                renderProfil(); 
                // Header resmini güncelle (HTML elementini bulup değiştiriyoruz)
                const headerImgContainer = document.querySelector('.user-info');
                // Header içindeki eski resmi silip yenisini koymak yerine, renderProfil zaten sayfayı yenileyecek ama header sabit.
                // Header'ı manuel güncelleyelim:
                const oldImg = document.getElementById('headerProfilePic');
                if(oldImg) oldImg.src = user.photo;
            }
            reader.readAsDataURL(file);
        }
    });
}
function triggerPhotoUpload() { document.getElementById('fileInput').click(); }

// === KAYIT & GİRİŞ ===
document.getElementById('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const rawUsername = document.getElementById('regUsername').value;
    const username = rawUsername.toLowerCase().replace(/\s/g, '');

    let users = getAllUsers();
    if(users.some(u => u.username === username)) {
        emmiUyarisi("Bu kullanıcı adı alınmış Emmi.");
        return;
    }

    const newUser = {
        name: document.getElementById('regName').value.trim(),
        surname: document.getElementById('regSurname').value.trim(),
        username: username,
        password: document.getElementById('regPassword').value,
        address: document.getElementById('regAddress').value,
        phone: document.getElementById('regPhone').value,
        dorse: document.getElementById('regDorse').value,
        photo: tempRegisterPhoto, // Boşsa boş string gider
        bio: 'Yolların ustasıyım.',
        isPrivate: false,
        followers: [], following: [], requests: [], posts: []
    };
    
    users.push(newUser);
    saveAllUsers(users);
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    document.getElementById('registerForm').reset();
    
    tempRegisterPhoto = '';
    document.getElementById('regPhotoPreviewImg').src = '';
    document.getElementById('regPhotoPreviewImg').classList.add('hidden-screen');
    document.getElementById('regPhotoPreviewBox').classList.remove('hidden-screen');
    
    emmiUyarisi("Kayıt tamam!");
    setTimeout(() => { closeCustomAlert(); initApp(); }, 1500);
});

document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const uName = document.getElementById('loginUsername').value.toLowerCase().replace(/\s/g, '');
    const uPass = document.getElementById('loginPassword').value;
    let users = getAllUsers();
    const foundUser = users.find(u => u.username === uName && u.password === uPass);
    if (foundUser) { localStorage.setItem('currentUser', JSON.stringify(foundUser)); initApp(); } 
    else { emmiUyarisi('Kullanıcı adı veya şifre yanlış!'); }
});

function logout() {
    emmiSoruyor('Çıkış yapmak istiyor musun?', () => {
        localStorage.removeItem('currentUser');
        location.reload();
    });
}

function checkLoginStatus() { if (localStorage.getItem('currentUser')) { initApp(); } else { showScreen('login-screen'); } }

// === ÖRNEK VERİLER (RESİMSİZ) ===
function loadExampleData() {
    if (!localStorage.getItem('ilanlar')) {
        const ilanlar = [{ id: 1, nereden: 'İstanbul', nereye: 'Ankara', tamAdres: 'Tuzla OSB', yukCinsi: 'Mobilya', agirlik: '5', dorse: 'Tenteli', tarih: '2025-01-05', sahipUsername: 'murat_lojistik', sahipIsim: 'Murat Lojistik', tel: '05551234567' }];
        localStorage.setItem('ilanlar', JSON.stringify(ilanlar));
    }
    if (!localStorage.getItem('users_db')) {
        const users = [
            // Resimler (photo) artık boş string
            { username: 'ali', name: 'Ali', surname: 'Kaptan', password:'123', photo: '', dorse: 'Tenteli', isPrivate: true, bio:'Yollar benim.', followers:[], following:[], requests:[], posts:[] },
            { username: 'murat', name: 'Murat', surname: 'Lojistik', password:'123', photo: '', dorse: 'Yok', isPrivate: false, bio:'Yük bulunur.', followers:[], following:[], requests:[], posts:[] }
        ];
        saveAllUsers(users);
    }
}

// === ANA UYGULAMA ===
function initApp() {
    const user = getCurrentUserFull();
    if(!user) { logout(); return; } 
    document.getElementById('displayUsername').innerText = user.name + ' ' + user.surname;
    
    // Header'daki resmi özel fonksiyonumuzla değiştiremeyiz çünkü orası statik img etiketi değil, dinamik yapıcaz
    // Ancak en kolayı: Header'daki img etiketini gizleyip div koymak yerine, 
    // Basitçe: Eğer foto yoksa, varsayılan bir base64 placeholder koyabiliriz YA DA
    // Header yapısını JS ile güncelleriz.
    
    const userInfoDiv = document.querySelector('.user-info');
    // Mevcut img etiketini kaldırıp bizim render fonksiyonunu koyalım
    const oldImg = document.getElementById('headerProfilePic');
    if(oldImg) oldImg.remove();
    
    // Eğer daha önce eklenmiş bir dinamik div varsa onu da temizle (tekrar tekrar eklenmesin)
    const existingProfileDiv = userInfoDiv.querySelector('.profile-pic-sm');
    if(existingProfileDiv) existingProfileDiv.remove();

    // Yeni yapıyı ekle
    userInfoDiv.innerHTML += renderProfileImage(user.photo, 'profile-pic-sm');
    
    showScreen('app-screen');
    renderYukBul();
}
const contentArea = document.getElementById('content-area');

// --- 1. YÜK BUL ---
function renderYukBul(filterText = '', filterDorse = 'Tümü') {
    updateNav('Yük Bul');
    const ilanlar = JSON.parse(localStorage.getItem('ilanlar')) || [];
    ilanlar.sort((a, b) => b.id - a.id);

    const filtered = ilanlar.filter(ilan => {
        const aranan = filterText.toLocaleLowerCase('tr');
        const textMatch = ilan.nereden.toLocaleLowerCase('tr').includes(aranan) || ilan.nereye.toLocaleLowerCase('tr').includes(aranan) || ilan.yukCinsi.toLocaleLowerCase('tr').includes(aranan);
        const dorseMatch = filterDorse === 'Tümü' || ilan.dorse === filterDorse;
        return textMatch && dorseMatch;
    });

    let html = `
        <div class="filter-box">
            <input type="text" id="searchInput" placeholder="Şehir veya yük ara..." oninput="applyFilters()" value="${filterText}">
            <select id="filterDorse" onchange="applyFilters()">
                <option value="Tümü" ${filterDorse === 'Tümü' ? 'selected' : ''}>Tüm Dorseler</option>
                <option value="Tenteli" ${filterDorse === 'Tenteli' ? 'selected' : ''}>Tenteli</option>
                <option value="Damperli" ${filterDorse === 'Damperli' ? 'selected' : ''}>Damperli</option>
                <option value="Sal" ${filterDorse === 'Sal' ? 'selected' : ''}>Sal Kasa</option>
                <option value="Frigo" ${filterDorse === 'Frigo' ? 'selected' : ''}>Frigo</option>
                <option value="Lowbed" ${filterDorse === 'Lowbed' ? 'selected' : ''}>Lowbed</option>
            </select>
        </div>
        <h2>🚚 Yük İlanları (${filtered.length})</h2>`;

    if(filtered.length === 0) {
        html += `<div style="text-align:center; padding:30px; opacity:0.6; margin-top:20px;"><i class="fa-solid fa-road" style="font-size:3rem; margin-bottom:15px; color:#ccc;"></i><p>Aradığın kriterde yük yok emmi.</p></div>`;
    }

    filtered.forEach(ilan => { 
        html += `
        <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <h3>${ilan.nereden} <i class="fa-solid fa-arrow-right" style="font-size:0.8rem"></i> ${ilan.nereye}</h3>
                <span class="badge" style="background:var(--primary-color); color:white;">${ilan.dorse}</span>
            </div>
            <p><strong>Yük:</strong> ${ilan.yukCinsi}</p>
            <p><strong>Tonaj:</strong> ${ilan.agirlik} Ton</p>
            <p style="font-size:0.85rem; color:gray; margin-top:5px;"><i class="fa-solid fa-location-dot"></i> ${ilan.tamAdres}</p>
            <div style="margin-top:15px; border-top:1px solid #eee; padding-top:10px; display:flex; justify-content:space-between; align-items:center;">
                <small style="color:gray;">${ilan.tarih}</small>
                <button class="btn-primary" style="width:auto; margin:0; padding:8px 20px;" onclick="emmiUyarisi('${ilan.tel} aranıyor...\\nİlan Sahibi: ${ilan.sahipIsim}')"><i class="fa-solid fa-phone"></i> Ara</button>
            </div>
        </div>`; 
    });
    contentArea.innerHTML = html;
    if(filterText) { let input = document.getElementById('searchInput'); input.focus(); let val = input.value; input.value = ''; input.value = val; }
}
function applyFilters() { renderYukBul(document.getElementById('searchInput').value, document.getElementById('filterDorse').value); }

// --- 2. İLAN VER ---
function renderIlanVer() {
    updateNav('İlan Ver');
    contentArea.innerHTML = `
        <h2>Yeni Yük İlanı</h2>
        <div class="card">
            <form onsubmit="ilanKaydet(event)">
                <label>Nereden (Şehir/İlçe):</label><input id="nereden" placeholder="Örn: İstanbul, Tuzla" required>
                <label>Nereye (Şehir/İlçe):</label><input id="nereye" placeholder="Örn: Ankara, Ostim" required>
                <label>Tam Yükleme Adresi:</label><textarea id="tamAdres" placeholder="Mahalle, sokak, kapı no..." style="height:60px;" required></textarea>
                <div style="display:flex; gap:10px;">
                    <div style="flex:1"><label>Tonaj:</label><input type="number" id="agirlik" placeholder="Ton" required></div>
                    <div style="flex:1">
                        <label>İstenen Dorse:</label>
                        <select id="dorseTipi" required style="width:100%; padding:14px; border:1px solid #e5e7eb; border-radius:12px;">
                            <option value="">Seç</option><option value="Tenteli">Tenteli</option><option value="Damperli">Damperli</option><option value="Sal">Sal</option><option value="Frigo">Frigo</option><option value="Lowbed">Lowbed</option>
                        </select>
                    </div>
                </div>
                <label>Yük Cinsi:</label><input id="yukCinsi" placeholder="Örn: Paletli seramik..." required>
                <button class="btn-primary"><i class="fa-solid fa-check"></i> İlanı Yayınla</button>
            </form>
        </div>`;
}

function ilanKaydet(e) { 
    e.preventDefault(); 
    let me = getCurrentUserFull();
    const yeniIlan = {
        id: Date.now(),
        nereden: document.getElementById('nereden').value,
        nereye: document.getElementById('nereye').value,
        tamAdres: document.getElementById('tamAdres').value,
        agirlik: document.getElementById('agirlik').value,
        dorse: document.getElementById('dorseTipi').value,
        yukCinsi: document.getElementById('yukCinsi').value,
        sahipIsim: me.name + ' ' + me.surname,
        sahipUsername: me.username,
        tel: me.phone || '0555...',
        tarih: new Date().toLocaleDateString('tr-TR')
    };
    let ilanlar = JSON.parse(localStorage.getItem('ilanlar')) || [];
    ilanlar.unshift(yeniIlan);
    localStorage.setItem('ilanlar', JSON.stringify(ilanlar));
    emmiUyarisi("İlanın yayınlandı!"); 
    renderYukBul(); 
}

// --- 3. İSTEKLER ---
function renderMesajlar() {
    updateNav('İstekler');
    let me = getCurrentUserFull();
    let html = `<h2>İstekler ve Bildirimler</h2>`;
    if(me.requests && me.requests.length > 0) {
        html += `<div class="card"><h3>Takip İstekleri (${me.requests.length})</h3>`;
        me.requests.forEach(reqUsername => {
            let requester = getAllUsers().find(u => u.username === reqUsername);
            if(requester) {
                html += `<div class="request-item">
                            <div onclick="openUserProfile('${requester.username}')" style="cursor:pointer; display:flex; align-items:center; gap:10px;">
                                ${renderProfileImage(requester.photo, 'profile-pic-sm')}
                                <div><strong>${requester.name} ${requester.surname}</strong><br><small>@${requester.username}</small></div>
                            </div>
                            <div class="req-actions"><button class="btn-accept" onclick="acceptRequest('${requester.username}')">Onayla</button><button class="btn-reject" onclick="rejectRequest('${requester.username}')">Sil</button></div>
                        </div>`;
            }
        });
        html += `</div>`;
    } else { html += `<div class="card" style="text-align:center; padding:30px; opacity:0.6;"><i class="fa-regular fa-bell-slash" style="font-size:2rem; margin-bottom:10px;"></i><p>Yeni bir isteğin yok emmi.</p></div>`; }
    contentArea.innerHTML = html;
}
function acceptRequest(targetUser) {
    let me = getCurrentUserFull();
    let other = getAllUsers().find(u => u.username === targetUser);
    me.requests = me.requests.filter(r => r !== targetUser);
    if(!me.followers) me.followers = []; me.followers.push(targetUser);
    if(!other.following) other.following = []; other.following.push(me.username);
    updateAnyUser(me); updateAnyUser(other);
    emmiSoruyor(`${other.name} seni takip etti. Sen de takip edecek misin?`, () => { logicFollowUser(me.username, targetUser); });
    renderMesajlar();
}
function rejectRequest(targetUser) {
    let me = getCurrentUserFull();
    me.requests = me.requests.filter(r => r !== targetUser);
    updateAnyUser(me);
    renderMesajlar();
}

// --- 4. SOSYAL ---
function renderSosyal() {
    updateNav('Emmi');
    let me = getCurrentUserFull();
    let users = getAllUsers().filter(u => u.username !== me.username);
    let html = `<h2>Diğer Nakliyeciler</h2><div class="card" style="padding:0;">`;
    users.forEach(u => {
        let isFollowing = u.followers && u.followers.includes(me.username);
        let isRequested = u.requests && u.requests.includes(me.username);
        let btnText = isFollowing ? "Takip Ediliyor" : (isRequested ? "İstek Gitti" : "Takip Et");
        let btnStyle = isFollowing ? "background:#333; color:white;" : (isRequested ? "background:#ccc; color:black;" : "");
        
        html += `<div class="user-list-item" style="padding:15px; cursor:pointer;" onclick="openUserProfile('${u.username}')">
                    <div class="user-list-info">
                        ${renderProfileImage(u.photo, 'profile-pic-sm')}
                        <div><strong>${u.name} ${u.surname}</strong>${u.isPrivate ? '<i class="fa-solid fa-lock" style="font-size:0.7rem; margin-left:5px; color:gray;"></i>' : ''}<br><small>@${u.username}</small></div>
                    </div>
                    <button class="user-list-btn" style="${btnStyle}" onclick="event.stopPropagation(); toggleFollow('${u.username}')">${btnText}</button>
                </div>`;
    });
    html += `</div>`;
    contentArea.innerHTML = html;
}

// --- 5. PROFİL AYARLARI ---
function renderProfil() {
    updateNav('');
    let me = getCurrentUserFull();
    const isDark = document.body.classList.contains('dark-mode');
    let tumIlanlar = JSON.parse(localStorage.getItem('ilanlar')) || [];
    let benimIlanlarim = tumIlanlar.filter(ilan => ilan.sahipUsername === me.username);

    let ilanlarHTML = '';
    if (benimIlanlarim.length > 0) {
        ilanlarHTML = `<h3>Yayınladığım İlanlar (${benimIlanlarim.length})</h3>`;
        benimIlanlarim.forEach(ilan => {
            ilanlarHTML += `<div class="card" style="border-left: 4px solid var(--primary-color);"><div style="display:flex; justify-content:space-between;"><strong>${ilan.nereden} -> ${ilan.nereye}</strong><button onclick="ilanSil(${ilan.id})" style="background:#ef4444; color:white; border:none; padding:4px 10px; border-radius:5px; cursor:pointer; font-size:0.8rem;">Sil</button></div><small style="color:gray;">${ilan.tarih} - ${ilan.yukCinsi}</small></div>`;
        });
    } else { ilanlarHTML = `<div class="card" style="text-align:center; opacity:0.7;"><p>Hiç aktif ilanın yok emmi.</p></div>`; }

    contentArea.innerHTML = `
        <h2>Profilim</h2>
        <div class="card" style="text-align:center;">
            <div style="display:flex; justify-content:center; margin-bottom:15px;">
                ${renderProfileImage(me.photo, 'profile-pic-lg')}
            </div>
            <button class="btn-sm" onclick="triggerPhotoUpload()"><i class="fa-solid fa-camera"></i> Fotoğraf Değiştir</button><br><br>
            <div class="stats-row"><div class="stat-item"><span class="stat-num">${me.requests ? me.requests.length : 0}</span><span class="stat-label">İstekler</span></div><div class="stat-item"><span class="stat-num">${me.followers ? me.followers.length : 0}</span><span class="stat-label">Takipçi</span></div><div class="stat-item"><span class="stat-num">${me.following ? me.following.length : 0}</span><span class="stat-label">Takip</span></div></div>
        </div>
        ${ilanlarHTML}
        <div class="card">
            <h3>Profili Düzenle</h3>
            <form onsubmit="updateProfile(event)">
                <label>Biyografi:</label><input id="editBio" value="${me.bio || ''}" placeholder="Hakkında...">
                <label>Dorse Tipin:</label><select id="editDorse" style="width:100%; padding:14px; border:1px solid #e5e7eb; border-radius:12px; margin-bottom:10px;"><option value="Tenteli" ${me.dorse === 'Tenteli' ? 'selected' : ''}>Tenteli</option><option value="Damperli" ${me.dorse === 'Damperli' ? 'selected' : ''}>Damperli</option><option value="Sal" ${me.dorse === 'Sal' ? 'selected' : ''}>Sal Kasa</option><option value="Frigo" ${me.dorse === 'Frigo' ? 'selected' : ''}>Frigo</option><option value="Lowbed" ${me.dorse === 'Lowbed' ? 'selected' : ''}>Lowbed</option><option value="Konteyner" ${me.dorse === 'Konteyner' ? 'selected' : ''}>Konteyner</option><option value="Yok" ${me.dorse === 'Yok' ? 'selected' : ''}>Aracım Yok</option></select>
                <div class="switch-container"><span><i class="fa-solid fa-lock"></i> Gizli Hesap</span><input type="checkbox" id="editIsPrivate" ${me.isPrivate ? 'checked' : ''}></div>
                <label>Ad & Soyad:</label><div style="display:flex; gap:10px;"><input id="editName" value="${me.name}"><input id="editSurname" value="${me.surname}"></div>
                <button class="btn-primary">Kaydet</button>
            </form>
        </div>
        <div class="card switch-container"><span><i class="fa-solid fa-moon"></i> Koyu Tema</span><input type="checkbox" id="themeSwitch" ${isDark ? 'checked' : ''} onchange="toggleTheme()"></div>
        <button onclick="logout()" class="btn-danger"><i class="fa-solid fa-right-from-bracket"></i> Çıkış Yap</button><br><br>`;
}

function ilanSil(id) {
    emmiSoruyor('Bu ilanı silmek istediğine emin misin?', () => {
        let ilanlar = JSON.parse(localStorage.getItem('ilanlar')) || [];
        ilanlar = ilanlar.filter(x => x.id !== id);
        localStorage.setItem('ilanlar', JSON.stringify(ilanlar));
        renderProfil();
        emmiUyarisi('İlan silindi.');
    });
}

function updateProfile(e) {
    e.preventDefault();
    let me = getCurrentUserFull();
    me.bio = document.getElementById('editBio').value;
    me.isPrivate = document.getElementById('editIsPrivate').checked;
    me.name = document.getElementById('editName').value;
    me.surname = document.getElementById('editSurname').value;
    me.dorse = document.getElementById('editDorse').value;
    updateAnyUser(me); emmiUyarisi("Profilin güncellendi!"); renderProfil();
}

// --- YARDIMCILAR ---
function openUserProfile(targetUsername) {
    let me = getCurrentUserFull();
    let target = getAllUsers().find(u => u.username === targetUsername);
    if(targetUsername === me.username) { renderProfil(); return; }
    document.getElementById('app-screen').classList.remove('active-screen'); document.getElementById('app-screen').classList.add('hidden-screen'); document.getElementById('other-profile-screen').classList.remove('hidden-screen'); document.getElementById('other-profile-screen').classList.add('active-screen');
    let isFollowing = target.followers && target.followers.includes(me.username);
    let isRequested = target.requests && target.requests.includes(me.username);
    let canSeeContent = !target.isPrivate || isFollowing;
    let btnText = isFollowing ? "Takibi Bırak" : (isRequested ? "İstek Gönderildi" : "Takip Et");
    
    let html = `<div class="card" style="text-align:center;">
                    <div style="display:flex; justify-content:center; margin-bottom:10px;">
                        ${renderProfileImage(target.photo, 'profile-pic-lg')}
                    </div>
                    <h3>${target.name} ${target.surname} ${target.isPrivate ? '<i class="fa-solid fa-lock" style="font-size:1rem; color:gray"></i>' : ''}</h3>
                    <p style="color:gray;">@${target.username}</p>
                    <span class="badge" style="background:gray; color:white; margin:10px 0;">${target.dorse || 'Dorse Yok'}</span>
                    <p style="margin:10px 0; font-style:italic;">"${target.bio || '...'}"</p>
                    <div class="stats-row"><div class="stat-item"><span class="stat-num">${target.posts ? target.posts.length : 0}</span><span class="stat-label">Gönderi</span></div><div class="stat-item"><span class="stat-num">${target.followers ? target.followers.length : 0}</span><span class="stat-label">Takipçi</span></div><div class="stat-item"><span class="stat-num">${target.following ? target.following.length : 0}</span><span class="stat-label">Takip</span></div></div>
                    <button class="btn-primary" onclick="toggleFollow('${target.username}', true)">${btnText}</button>
                </div>`;
    
    if(canSeeContent) {
        html += `<h3>Paylaşımlar</h3>`;
        if(target.posts && target.posts.length > 0) { target.posts.forEach(post => { html += `<div class="card"><p>${post.text}</p><small style="color:gray;">${post.date}</small></div>`; }); } 
        else { html += `<p style="text-align:center; opacity:0.6; padding:20px;">Henüz gönderisi yok.</p>`; }
    } else { html += `<div class="private-warning"><i class="fa-solid fa-lock"></i><h3>Bu Hesap Gizli</h3><p>Paylaşımları görmek için takip isteği gönder.</p></div>`; }
    document.getElementById('other-profile-content').innerHTML = html;
}

function toggleFollow(targetUsername, refreshProfile = false) {
    let me = getCurrentUserFull();
    let target = getAllUsers().find(u => u.username === targetUsername);
    if(!me.following) me.following = []; if(!target.followers) target.followers = []; if(!target.requests) target.requests = [];
    let isFollowing = target.followers.includes(me.username);
    let isRequested = target.requests.includes(me.username);
    if(isFollowing) {
        target.followers = target.followers.filter(x => x !== me.username); me.following = me.following.filter(x => x !== target.username); emmiUyarisi("Takipten çıkıldı.");
    } else if(isRequested) {
        target.requests = target.requests.filter(x => x !== me.username); emmiUyarisi("İstek geri çekildi.");
    } else {
        if(target.isPrivate) { target.requests.push(me.username); emmiUyarisi("Takip isteği gönderildi."); }
        else { target.followers.push(me.username); me.following.push(target.username); emmiUyarisi("Takip ediliyor!"); }
    }
    updateAnyUser(me); updateAnyUser(target);
    if(refreshProfile) openUserProfile(targetUsername); else renderSosyal();
}

function logicFollowUser(myUsername, targetUsername) {
    let users = getAllUsers();
    let me = users.find(u => u.username === myUsername);
    let target = users.find(u => u.username === targetUsername);
    if(!me.following) me.following = []; if(!target.followers) target.followers = [];
    if(!target.followers.includes(me.username)) {
        if(target.isPrivate) { if(!target.requests) target.requests=[]; target.requests.push(me.username); emmiUyarisi("İstek atıldı."); }
        else { target.followers.push(me.username); me.following.push(target.username); emmiUyarisi("Takip edildi."); }
    }
    saveAllUsers(users);
}

function updateNav(activeText) { document.querySelectorAll('.nav-item').forEach(btn => { if(activeText && btn.innerText.includes(activeText)) btn.classList.add('active'); else btn.classList.remove('active'); }); }
function toggleTheme() { document.body.classList.toggle('dark-mode'); localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light'); }
function loadTheme() { if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-mode'); }
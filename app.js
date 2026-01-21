let currentLat = null;
let currentLng = null;
let photoData = null;

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
}

function updateOnlineStatus() {
    const indicator = document.getElementById('offline-indicator');
    navigator.onLine ? indicator.classList.add('hidden') : indicator.classList.remove('hidden');
}
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

function switchView(viewId) {
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    if (viewId === 'view-add') { 
        startCamera(); 
        setTimeout(getLocation, 500); 
    } else { 
        stopCamera(); 
    }
}

async function startCamera() {
    const video = document.getElementById('video');
    document.getElementById('photo-preview').style.display = 'none';
    video.style.display = 'block';
    photoData = null;
    document.getElementById('btn-save').disabled = true;
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        video.srcObject = stream;
    } catch (err) { console.error(err); alert("Daj dostƒôp do kamery!"); }
}

function stopCamera() {
    const video = document.getElementById('video');
    if (video.srcObject) { video.srcObject.getTracks().forEach(track => track.stop()); video.srcObject = null; }
}

document.getElementById('btn-capture').addEventListener('click', () => {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    photoData = canvas.toDataURL('image/png');
    video.style.display = 'none';
    document.getElementById('photo-preview').src = photoData;
    document.getElementById('photo-preview').style.display = 'block';
    stopCamera();
    checkReadyToSave();
});

function getLocation() {
    const status = document.getElementById('location-status');
    status.innerText = "Ìª∞Ô∏è Szukam sygna≈Çu...";
    if (!navigator.geolocation) {
        status.innerText = "‚ùå Tw√≥j telefon nie wspiera GPS";
        return;
    }
    const options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            currentLat = pos.coords.latitude;
            currentLng = pos.coords.longitude;
            status.innerText = `‚úÖ ${currentLat.toFixed(5)}, ${currentLng.toFixed(5)}`;
            status.style.color = "green";
            checkReadyToSave();
        },
        (err) => { 
            console.warn(err);
            status.innerText = "‚ùå B≈ÇƒÖd GPS (Sprawd≈∫ uprawnienia!)";
            status.style.color = "red";
        },
        options
    );
}

function checkReadyToSave() {
    if (photoData) document.getElementById('btn-save').disabled = false;
}

function saveNote() {
    const note = { id: Date.now(), image: photoData, lat: currentLat, lng: currentLng, date: new Date().toLocaleString() };
    let notes = JSON.parse(localStorage.getItem('geo-notes') || '[]');
    notes.unshift(note);
    localStorage.setItem('geo-notes', JSON.stringify(notes));
    renderNotes();
    switchView('view-home');
}

function renderNotes() {
    const list = document.getElementById('notes-list');
    const notes = JSON.parse(localStorage.getItem('geo-notes') || '[]');
    list.innerHTML = '';
    if (notes.length === 0) { list.innerHTML = '<p style="text-align:center; color:#888; margin-top:50px;">Brak notatek. Kliknij + aby dodaƒá!</p>'; return; }
    notes.forEach(note => {
        const div = document.createElement('div');
        div.className = 'note-card';
        div.innerHTML = `
            <img src="${note.image}">
            <p><strong>Ì≥ç Lokalizacja:</strong> ${note.lat ? `<a href="https://maps.google.com/?q=${note.lat},${note.lng}" target="_blank">${note.lat.toFixed(4)}, ${note.lng.toFixed(4)}</a>` : 'Brak danych'}</p>
            <p class="note-date">Ì≥Ö ${note.date}</p>
        `;
        list.appendChild(div);
    });
}
renderNotes();
updateOnlineStatus();

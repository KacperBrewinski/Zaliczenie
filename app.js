let currentLat = null;
let currentLng = null;
let photoData = null;

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(() => console.log('SW Registered'))
            .catch(err => console.error('SW Error:', err));
    });
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
    if (viewId === 'view-add') { startCamera(); getLocation(); } else { stopCamera(); }
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
    } catch (err) { alert("Błąd kamery: " + err); }
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
    status.innerText = "Szukam...";
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            currentLat = pos.coords.latitude;
            currentLng = pos.coords.longitude;
            status.innerText = `${currentLat.toFixed(4)}, ${currentLng.toFixed(4)}`;
            checkReadyToSave();
        },
        () => { status.innerText = "Błąd GPS"; }
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
    if (notes.length === 0) { list.innerHTML = '<p class="empty-msg">Brak notatek.</p>'; return; }
    notes.forEach(note => {
        const div = document.createElement('div');
        div.className = 'note-card';
        div.innerHTML = `<img src="${note.image}" style="border-radius:4px; max-height:200px; object-fit:cover;"><p><strong>Lokalizacja:</strong> ${note.lat ? `${note.lat.toFixed(4)}, ${note.lng.toFixed(4)}` : 'Brak danych'}</p><p class="note-date">${note.date}</p>`;
        list.appendChild(div);
    });
}
renderNotes();
updateOnlineStatus();

// MirrorMe v2
// - 전면 카메라 좌우반전 없이 표시 ("상대방이 보는 나")
// - 핀치 줌 1.0×~5.0×, 더블탭 리셋
// - 전면/후면 카메라 토글
// - 무음 사진 촬영 (canvas 캡처 — 시스템 셔터음 없음)
// - IndexedDB에 사진 저장 (아이폰 사진 앨범이 아닌 웹앱 내부)
// - 앱 내 갤러리 (그리드 → 상세 → 삭제/다운로드)

// ==== DOM ====
const video       = document.getElementById('video');
const overlay     = document.getElementById('overlay');
const startBtn    = document.getElementById('startBtn');
const controls    = document.getElementById('controls');
const flipBtn     = document.getElementById('flipBtn');
const shutterBtn  = document.getElementById('shutterBtn');
const galleryBtn  = document.getElementById('galleryBtn');
const zoomBadge   = document.getElementById('zoomBadge');

const gallery       = document.getElementById('gallery');
const galleryClose  = document.getElementById('galleryClose');
const galleryGrid   = document.getElementById('galleryGrid');
const galleryEmpty  = document.getElementById('galleryEmpty');
const photoCount    = document.getElementById('photoCount');

const photoView     = document.getElementById('photoView');
const photoViewImg  = document.getElementById('photoViewImg');
const photoViewDate = document.getElementById('photoViewDate');
const photoBack     = document.getElementById('photoBack');
const photoDelete   = document.getElementById('photoDelete');
const photoDownload = document.getElementById('photoDownload');

// ==== 상태 ====
let currentStream = null;
let currentFacing = 'user';
const MIN_ZOOM = 1, MAX_ZOOM = 5;
let currentZoom = 1;
let pinchStartDist = 0, pinchStartZoom = 1;
let zoomFadeTimer = null;
let viewingPhotoId = null;
let currentTab = 'user'; // 'user' = MyFace, 'environment' = MyStyle

// ========================================================
//  카메라
// ========================================================
async function startCamera(facing) {
  if (currentStream) {
    currentStream.getTracks().forEach(t => t.stop());
    currentStream = null;
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: facing,
      width: { ideal: 1920 },
      height: { ideal: 1080 },
    },
  });
  currentStream = stream;
  currentFacing = facing;
  video.srcObject = stream;
  await video.play();
  resetZoom();
}

async function start() {
  try {
    await startCamera('user');
    overlay.classList.add('hidden');
    controls.classList.remove('hidden');
    updateGalleryBtnThumb();
  } catch (err) {
    showError('카메라를 사용할 수 없습니다: ' + (err && err.message ? err.message : err));
    console.error(err);
  }
}

function showError(msg) {
  overlay.classList.remove('hidden');
  overlay.querySelector('p').textContent = msg;
}

// 카메라 전환
flipBtn.addEventListener('click', async () => {
  const next = currentFacing === 'user' ? 'environment' : 'user';
  try {
    await startCamera(next);
  } catch (err) {
    console.error('카메라 전환 실패:', err);
    try { await startCamera(currentFacing); } catch (e) { showError('카메라 전환 불가'); }
  }
});

// ========================================================
//  줌
// ========================================================
function applyZoom() {
  video.style.transform = 'scale(' + currentZoom + ')';
  zoomBadge.textContent = currentZoom.toFixed(1) + '×';
  zoomBadge.classList.add('visible');
  clearTimeout(zoomFadeTimer);
  zoomFadeTimer = setTimeout(() => zoomBadge.classList.remove('visible'), 1200);
}

function resetZoom() {
  currentZoom = 1;
  applyZoom();
}

function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

function pinchDistance(t) { return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY); }

video.addEventListener('touchstart', e => {
  if (e.touches.length === 2) { e.preventDefault(); pinchStartDist = pinchDistance(e.touches); pinchStartZoom = currentZoom; }
}, { passive: false });

video.addEventListener('touchmove', e => {
  if (e.touches.length === 2 && pinchStartDist > 0) {
    e.preventDefault();
    currentZoom = clamp(pinchStartZoom * pinchDistance(e.touches) / pinchStartDist, MIN_ZOOM, MAX_ZOOM);
    applyZoom();
  }
}, { passive: false });

video.addEventListener('touchend', e => { if (e.touches.length < 2) pinchStartDist = 0; }, { passive: false });

// 더블탭 → 줌 리셋
let lastTapTime = 0;
video.addEventListener('touchend', e => {
  if (e.touches.length > 0 || e.changedTouches.length !== 1) return;
  const now = Date.now();
  if (now - lastTapTime < 300) { resetZoom(); lastTapTime = 0; }
  else lastTapTime = now;
});

// ========================================================
//  사진 촬영 (무음 — canvas 캡처)
// ========================================================
shutterBtn.addEventListener('click', capturePhoto);

async function capturePhoto() {
  if (!video.srcObject) return;

  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return;

  const screenW = window.innerWidth;
  const screenH = window.innerHeight;
  const screenAspect = screenW / screenH;
  const videoAspect = vw / vh;

  // object-fit: cover 영역 계산
  let sx, sy, sw, sh;
  if (videoAspect > screenAspect) {
    sh = vh; sw = vh * screenAspect;
    sx = (vw - sw) / 2; sy = 0;
  } else {
    sw = vw; sh = vw / screenAspect;
    sx = 0; sy = (vh - sh) / 2;
  }

  // 줌 적용 (중앙 크롭)
  const zw = sw / currentZoom;
  const zh = sh / currentZoom;
  sx += (sw - zw) / 2;
  sy += (sh - zh) / 2;
  sw = zw;
  sh = zh;

  // canvas에 그리기
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(sw);
  canvas.height = Math.round(sh);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  // 촬영 시점의 카메라 방향을 기록 (user = 셀카/MyFace, environment = 후면/MyStyle)
  const capturedFacing = currentFacing;

  // blob으로 변환 → IndexedDB 저장
  canvas.toBlob(async (blob) => {
    if (!blob) return;
    await savePhoto(blob, capturedFacing);
    updateGalleryBtnThumb();
  }, 'image/jpeg', 0.92);
}

// ========================================================
//  IndexedDB
// ========================================================
const DB_NAME = 'MirrorMePhotos';
const DB_VER = 1;
const STORE = 'photos';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('timestamp', 'timestamp');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function savePhoto(blob, facing) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).add({
      blob,
      timestamp: Date.now(),
      facing: facing || 'user', // 'user' = MyFace, 'environment' = MyStyle
    });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function getAllPhotos() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getPhoto(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function deletePhotoById(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function getLatestPhoto() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const req = store.openCursor(null, 'prev'); // 마지막 항목
    req.onsuccess = () => resolve(req.result ? req.result.value : null);
    req.onerror = () => reject(req.error);
  });
}

// ========================================================
//  갤러리 버튼 썸네일 업데이트
// ========================================================
async function updateGalleryBtnThumb() {
  try {
    const latest = await getLatestPhoto();
    if (latest && latest.blob) {
      const url = URL.createObjectURL(latest.blob);
      // 기존 아이콘을 썸네일 이미지로 교체
      galleryBtn.innerHTML = '<img src="' + url + '" alt="최근 사진" />';
    }
  } catch (e) {
    console.error('썸네일 업데이트 실패:', e);
  }
}

// ========================================================
//  갤러리 화면
// ========================================================
galleryBtn.addEventListener('click', openGallery);
galleryClose.addEventListener('click', closeGallery);

async function openGallery() {
  gallery.classList.remove('hidden');
  await renderGallery();
}

async function renderGallery() {
  // 기존 썸네일의 objectURL 정리
  galleryGrid.querySelectorAll('img').forEach(img => {
    if (img.src.startsWith('blob:')) URL.revokeObjectURL(img.src);
  });
  galleryGrid.innerHTML = '';

  const all = await getAllPhotos();
  // 탭 필터: 'user' (MyFace) / 'environment' (MyStyle)
  // facing 필드가 없는 옛 사진은 'user'로 간주 (v2 초기엔 전면이 기본)
  const photos = all.filter(p => (p.facing || 'user') === currentTab);

  photoCount.textContent = photos.length + '장';

  if (photos.length === 0) {
    galleryEmpty.classList.remove('hidden');
    galleryEmpty.textContent = currentTab === 'user'
      ? '아직 MyFace 사진이 없습니다.'
      : '아직 MyStyle 사진이 없습니다.';
    return;
  }
  galleryEmpty.classList.add('hidden');

  // 최신순
  photos.sort((a, b) => b.timestamp - a.timestamp);

  for (const photo of photos) {
    const div = document.createElement('div');
    div.className = 'thumb';
    const img = document.createElement('img');
    img.src = URL.createObjectURL(photo.blob);
    img.alt = formatDate(photo.timestamp);
    div.appendChild(img);
    div.addEventListener('click', () => openPhotoView(photo.id));
    galleryGrid.appendChild(div);
  }
}

// 탭 전환
document.addEventListener('click', (e) => {
  const tabBtn = e.target.closest('.tabBtn');
  if (!tabBtn) return;
  const tab = tabBtn.dataset.tab;
  if (tab === currentTab) return;
  currentTab = tab;
  document.querySelectorAll('.tabBtn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === currentTab);
  });
  renderGallery();
});

function closeGallery() {
  gallery.classList.add('hidden');
  // 메모리 해제: objectURL 정리
  galleryGrid.querySelectorAll('img').forEach(img => {
    if (img.src.startsWith('blob:')) URL.revokeObjectURL(img.src);
  });
  galleryGrid.innerHTML = '';
}

// ========================================================
//  사진 상세 화면
// ========================================================
async function openPhotoView(id) {
  const photo = await getPhoto(id);
  if (!photo) return;

  viewingPhotoId = id;
  photoViewImg.src = URL.createObjectURL(photo.blob);
  photoViewDate.textContent = formatDate(photo.timestamp);
  photoView.classList.remove('hidden');
}

function closePhotoView() {
  photoView.classList.add('hidden');
  if (photoViewImg.src.startsWith('blob:')) URL.revokeObjectURL(photoViewImg.src);
  photoViewImg.src = '';
  viewingPhotoId = null;
}

photoBack.addEventListener('click', () => {
  closePhotoView();
});

photoDelete.addEventListener('click', async () => {
  if (viewingPhotoId == null) return;
  if (!confirm('이 사진을 삭제할까요?')) return;
  await deletePhotoById(viewingPhotoId);
  closePhotoView();
  await renderGallery(); // 갤러리 새로고침
  updateGalleryBtnThumb();
});

photoDownload.addEventListener('click', async () => {
  if (viewingPhotoId == null) return;
  const photo = await getPhoto(viewingPhotoId);
  if (!photo) return;
  const url = URL.createObjectURL(photo.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'MirrorMe_' + formatDateFile(photo.timestamp) + '.jpg';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// ========================================================
//  유틸
// ========================================================
function formatDate(ts) {
  const d = new Date(ts);
  return d.getFullYear() + '.' +
    String(d.getMonth() + 1).padStart(2, '0') + '.' +
    String(d.getDate()).padStart(2, '0') + ' ' +
    String(d.getHours()).padStart(2, '0') + ':' +
    String(d.getMinutes()).padStart(2, '0');
}

function formatDateFile(ts) {
  const d = new Date(ts);
  return d.getFullYear() +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0') + '_' +
    String(d.getHours()).padStart(2, '0') +
    String(d.getMinutes()).padStart(2, '0') +
    String(d.getSeconds()).padStart(2, '0');
}

// ========================================================
//  시작 + 라이프사이클
// ========================================================
startBtn.addEventListener('click', start);

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && video.srcObject && video.paused) {
    video.play().catch(() => {});
  }
});

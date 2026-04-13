// MirrorMe v3.0
//
// 핵심 기능
// - 전면 카메라: 미러링 없는 "상대방이 보는 나" (MyFace 탭)
// - 후면 카메라: 거울 통한 OOTD 촬영 (OOTD 탭, 본인 사진만 — 사람 감지 검증)
// - 핀치 줌, 더블탭 리셋, 카메라 토글
// - 무음 사진 촬영 (canvas 캡처)
// - 앱 내 갤러리 (IndexedDB), 날짜·요일별 그룹
// - 사진 상세: 메모 / 카테고리 태그(상의·하의·신발·아우터·액세서리) / 하트 즐겨찾기
// - 후면 카메라 촬영 시 COCO-SSD로 사람 감지 → 본인이 없는 사진은 저장 거부
//
// 데이터 모델 (IndexedDB photos store)
//   { id, blob, timestamp, facing, memo, tags{top,bottom,shoes,outer,accessory}, favorite }

// ============================================================
//  DOM
// ============================================================
const video       = document.getElementById('video');
const overlay     = document.getElementById('overlay');
const startBtn    = document.getElementById('startBtn');
const controls    = document.getElementById('controls');
const flipBtn     = document.getElementById('flipBtn');
const shutterBtn  = document.getElementById('shutterBtn');
const galleryBtn  = document.getElementById('galleryBtn');
const zoomBadge   = document.getElementById('zoomBadge');
const captureHint = document.getElementById('captureHint');
const toastEl     = document.getElementById('toast');

const gallery       = document.getElementById('gallery');
const galleryClose  = document.getElementById('galleryClose');
const galleryBody   = document.getElementById('galleryBody');
const galleryEmpty  = document.getElementById('galleryEmpty');
const photoCount    = document.getElementById('photoCount');

const photoView      = document.getElementById('photoView');
const photoViewImg   = document.getElementById('photoViewImg');
const photoViewDate  = document.getElementById('photoViewDate');
const photoBack      = document.getElementById('photoBack');
const photoDelete    = document.getElementById('photoDelete');
const photoDownload  = document.getElementById('photoDownload');
const photoFav       = document.getElementById('photoFav');
const photoMemoInput = document.getElementById('photoMemoInput');
const photoTagsArea  = document.getElementById('photoTagsArea');
const addCategoryBtn = document.getElementById('addCategoryBtn');

const categoryMenu       = document.getElementById('categoryMenu');
const categoryMenuCancel = document.getElementById('categoryMenuCancel');

// ============================================================
//  상태
// ============================================================
let currentStream  = null;
let currentFacing  = 'user';
let currentTab     = 'environment';   // OOTD가 기본 탭
let currentViewingPhoto = null;       // 사진 상세에서 보고 있는 photo 객체
let photoViewList  = [];              // 사진 상세 스와이프용: 현재 탭의 정렬된 photo 배열
let photoViewIndex = 0;               // 위 배열에서 현재 위치

const MIN_ZOOM = 1, MAX_ZOOM = 5;
let currentZoom = 1;
let pinchStartDist = 0, pinchStartZoom = 1;
let zoomFadeTimer = null;

let toastTimer = null;

// 카테고리 정의
const CATEGORY_KEYS = ['top', 'bottom', 'shoes', 'outer', 'accessory'];
const CATEGORY_LABELS = {
  top: '상의',
  bottom: '하의',
  shoes: '신발',
  outer: '아우터',
  accessory: '액세서리',
};

// ============================================================
//  토스트
// ============================================================
function toast(msg, duration = 2400) {
  toastEl.textContent = msg;
  toastEl.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('visible'), duration);
}

// ============================================================
//  카메라
// ============================================================
async function startCamera(facing) {
  if (currentStream) {
    currentStream.getTracks().forEach(t => t.stop());
    currentStream = null;
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: facing,
      width:  { ideal: 1920 },
      height: { ideal: 1080 },
    },
  });
  currentStream = stream;
  currentFacing = facing;
  video.srcObject = stream;
  await video.play();
  resetZoom();
  updateCaptureHint();
}

function updateCaptureHint() {
  // 후면 카메라일 때만 안내 문구 표시 (사람 감지 적용 대상)
  captureHint.classList.toggle('hidden', currentFacing !== 'environment');
}

async function start() {
  try {
    await startCamera('user');
    overlay.classList.add('hidden');
    controls.classList.remove('hidden');
    updateGalleryBtnThumb();
    // 백그라운드로 사람 감지 모델 로드 시작
    loadCocoModel();
  } catch (err) {
    showStartError('카메라를 사용할 수 없습니다: ' + (err && err.message ? err.message : err));
    console.error(err);
  }
}

function showStartError(msg) {
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
    try { await startCamera(currentFacing); }
    catch (e) { showStartError('카메라 전환 불가'); }
  }
});

// ============================================================
//  사람 감지 (COCO-SSD)
// ============================================================
let cocoModel = null;
let modelLoading = false;
let modelLoadFailed = false;

async function loadCocoModel() {
  if (cocoModel || modelLoading || modelLoadFailed) return;
  if (typeof cocoSsd === 'undefined') {
    // 라이브러리가 아직 안 로드됨 → 잠시 후 재시도
    setTimeout(loadCocoModel, 600);
    return;
  }
  modelLoading = true;
  try {
    cocoModel = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
    console.log('[MirrorMe] 사람 감지 모델 로드 완료');
  } catch (e) {
    console.error('[MirrorMe] COCO-SSD 로드 실패:', e);
    modelLoadFailed = true;
  } finally {
    modelLoading = false;
  }
}

async function detectPerson(canvas) {
  // 모델 미준비 상태면 양심 모드로 폴백 (저장 허용)
  if (!cocoModel) return true;
  try {
    const predictions = await cocoModel.detect(canvas);
    return predictions.some(p => p.class === 'person' && p.score > 0.5);
  } catch (e) {
    console.error('[MirrorMe] 사람 감지 실패, 폴백:', e);
    return true;
  }
}

// ============================================================
//  줌
// ============================================================
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

function pinchDistance(t) {
  return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
}

video.addEventListener('touchstart', e => {
  if (e.touches.length === 2) {
    e.preventDefault();
    pinchStartDist = pinchDistance(e.touches);
    pinchStartZoom = currentZoom;
  }
}, { passive: false });

video.addEventListener('touchmove', e => {
  if (e.touches.length === 2 && pinchStartDist > 0) {
    e.preventDefault();
    currentZoom = clamp(pinchStartZoom * pinchDistance(e.touches) / pinchStartDist, MIN_ZOOM, MAX_ZOOM);
    applyZoom();
  }
}, { passive: false });

video.addEventListener('touchend', e => {
  if (e.touches.length < 2) pinchStartDist = 0;
}, { passive: false });

// 더블탭 → 줌 리셋
let lastTapTime = 0;
video.addEventListener('touchend', e => {
  if (e.touches.length > 0 || e.changedTouches.length !== 1) return;
  const now = Date.now();
  if (now - lastTapTime < 300) {
    resetZoom();
    lastTapTime = 0;
  } else {
    lastTapTime = now;
  }
});

// ============================================================
//  사진 촬영
// ============================================================
shutterBtn.addEventListener('click', capturePhoto);

let capturing = false;

async function capturePhoto() {
  if (capturing) return;
  if (!video.srcObject) return;

  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return;

  capturing = true;
  try {
    // video 요소의 실제 화면 크기를 기준으로 cover crop 계산.
    // window.innerWidth/innerHeight는 iOS Safari PWA 풀스크린에서 safe area
    // 때문에 실제 video 표시 영역과 어긋날 수 있어 crop이 틀어짐.
    const rect = video.getBoundingClientRect();
    const screenW = rect.width  || window.innerWidth;
    const screenH = rect.height || window.innerHeight;
    const screenAspect = screenW / screenH;
    const videoAspect = vw / vh;

    // object-fit: cover 영역
    let sx, sy, sw, sh;
    if (videoAspect > screenAspect) {
      sh = vh; sw = vh * screenAspect;
      sx = (vw - sw) / 2; sy = 0;
    } else {
      sw = vw; sh = vw / screenAspect;
      sx = 0; sy = (vh - sh) / 2;
    }

    // 줌 (중앙 크롭)
    const zw = sw / currentZoom;
    const zh = sh / currentZoom;
    sx += (sw - zw) / 2;
    sy += (sh - zh) / 2;
    sw = zw;
    sh = zh;

    // canvas
    const canvas = document.createElement('canvas');
    canvas.width  = Math.round(sw);
    canvas.height = Math.round(sh);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    const capturedFacing = currentFacing;

    // 후면 카메라(OOTD)는 사람 감지 검증
    if (capturedFacing === 'environment') {
      const hasPerson = await detectPerson(canvas);
      if (!hasPerson) {
        toast('사람이 감지되지 않아 저장하지 않았어요');
        return;
      }
    }

    // blob → 저장
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    if (!blob) return;
    await savePhoto(blob, capturedFacing);
    updateGalleryBtnThumb();
    toast(capturedFacing === 'environment' ? 'OOTD 저장됨' : 'MyFace 저장됨', 1200);
  } catch (err) {
    console.error('[MirrorMe] 촬영 실패:', err);
    toast('촬영 실패');
  } finally {
    capturing = false;
  }
}

// ============================================================
//  IndexedDB
// ============================================================
const DB_NAME = 'MirrorMePhotos';
const DB_VER  = 1;
const STORE   = 'photos';

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
    req.onerror   = () => reject(req.error);
  });
}

async function savePhoto(blob, facing) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).add({
      blob,
      timestamp: Date.now(),
      facing: facing || 'user',
      memo: '',
      tags: { top: '', bottom: '', shoes: '', outer: '', accessory: '' },
      favorite: false,
    });
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

async function updatePhoto(photo) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(photo);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

async function getAllPhotos() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

async function getPhoto(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

async function deletePhotoById(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

async function getLatestPhoto() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).openCursor(null, 'prev');
    req.onsuccess = () => resolve(req.result ? req.result.value : null);
    req.onerror   = () => reject(req.error);
  });
}

// ============================================================
//  Blob URL 캐시 (photo.id 기반 재사용)
// ============================================================
// 같은 사진에 대해 URL을 반복 생성하지 않고 캐시. iOS Safari가 blob URL 관리에
// 엄격해서 매번 새 URL을 생성하면 엑박(로딩 실패)이 발생. photo.id 단위로 URL을
// 한 번만 만들어 썸네일·상세뷰·갤러리버튼에서 모두 공유.
const photoUrlCache = new Map(); // id -> blob URL

function getPhotoUrl(photo) {
  if (!photo || !photo.blob) return '';
  const cached = photoUrlCache.get(photo.id);
  if (cached) return cached;
  const url = URL.createObjectURL(photo.blob);
  photoUrlCache.set(photo.id, url);
  return url;
}

function revokePhotoUrl(id) {
  const url = photoUrlCache.get(id);
  if (url) {
    URL.revokeObjectURL(url);
    photoUrlCache.delete(id);
  }
}

// 옛 사진 마이그레이션 헬퍼: 누락 필드 채우기 (메모리 객체에만 적용)
function normalizePhoto(p) {
  if (!p) return p;
  if (!p.facing) p.facing = 'user';
  if (typeof p.memo !== 'string') p.memo = '';
  if (!p.tags || typeof p.tags !== 'object') {
    p.tags = { top: '', bottom: '', shoes: '', outer: '', accessory: '' };
  } else {
    for (const k of CATEGORY_KEYS) {
      if (typeof p.tags[k] !== 'string') p.tags[k] = '';
    }
  }
  if (typeof p.favorite !== 'boolean') p.favorite = false;
  return p;
}

// ============================================================
//  갤러리 버튼 썸네일
// ============================================================
// 갤러리 버튼 기본 아이콘 (사진 0장일 때 복원용)
const GALLERY_BTN_DEFAULT_HTML =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
  '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>' +
  '<rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>' +
  '</svg>';

async function updateGalleryBtnThumb() {
  try {
    const latest = await getLatestPhoto();
    if (latest && latest.blob) {
      const url = getPhotoUrl(normalizePhoto(latest));
      galleryBtn.innerHTML = '<img src="' + url + '" alt="최근 사진" />';
    } else {
      // 사진이 한 장도 없으면 기본 아이콘으로 복원
      galleryBtn.innerHTML = GALLERY_BTN_DEFAULT_HTML;
    }
  } catch (e) {
    console.error('썸네일 업데이트 실패:', e);
  }
}

// ============================================================
//  갤러리
// ============================================================
galleryBtn.addEventListener('click', openGallery);
galleryClose.addEventListener('click', closeGallery);

async function openGallery() {
  // 갤러리가 떠 있는 동안 카메라 컨트롤·안내 문구는 가려둠
  // (stacking context 문제로 클릭이 가로채지는 것 방지 + UX 정리)
  controls.classList.add('hidden');
  captureHint.classList.add('hidden');
  gallery.classList.remove('hidden');
  await renderGallery();
}

function closeGallery() {
  gallery.classList.add('hidden');
  // 주의: 썸네일 img의 blob URL은 revoke하지 않는다. iOS Safari가 로딩 중인 URL을
  // revoke하면 해당 img를 엑박으로 처리하는 문제가 있음. 갤러리 썸네일 수는 유한하고
  // 페이지 리로드 시 해제되므로 여기선 DOM만 비움.
  galleryBody.innerHTML = '';
  // 카메라 컨트롤 복원
  controls.classList.remove('hidden');
  updateCaptureHint();
  // 갤러리에 가려져 있는 동안 iOS Safari가 video를 자동 일시정지했을 수 있음 → 재생 재개
  if (video.srcObject && video.paused) {
    video.play().catch(() => {});
  }
  // 썸네일도 한 번 더 동기화 (갤러리 안에서 삭제 등이 일어났을 수 있음)
  updateGalleryBtnThumb();
}

async function renderGallery() {
  // 주의: 이전 썸네일 img의 blob URL을 revoke하지 않는다. iOS Safari는 로딩 중인
  // blob URL을 revoke하면 엑박으로 처리하는데, closePhotoView → renderGallery
  // 재호출 흐름에서 이 타이밍이 겹쳐 엑박이 발생했음.
  galleryBody.innerHTML = '';

  const all = (await getAllPhotos()).map(normalizePhoto);
  const photos = all.filter(p => p.facing === currentTab);
  photoCount.textContent = photos.length + '장';

  if (photos.length === 0) {
    galleryBody.classList.add('hidden');
    galleryEmpty.classList.remove('hidden');
    galleryEmpty.textContent = currentTab === 'environment'
      ? '아직 OOTD 사진이 없습니다.'
      : '아직 MyFace 사진이 없습니다.';
    return;
  }
  galleryBody.classList.remove('hidden');
  galleryEmpty.classList.add('hidden');

  // 날짜별 그룹화
  const groups = groupByDate(photos);
  for (const group of groups) {
    const groupEl = document.createElement('div');
    groupEl.className = 'dateGroup';

    const header = document.createElement('div');
    header.className = 'dateHeader';
    header.textContent = formatDateHeader(group.date);
    groupEl.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'dateGrid';
    for (const photo of group.photos) {
      const div = document.createElement('div');
      div.className = 'thumb';
      const img = document.createElement('img');
      img.src = getPhotoUrl(photo);
      img.alt = formatDate(photo.timestamp);
      div.appendChild(img);
      if (photo.favorite) {
        const heart = document.createElement('div');
        heart.className = 'thumbHeart';
        heart.textContent = '♥';
        div.appendChild(heart);
      }
      div.addEventListener('click', () => openPhotoView(photo.id));
      grid.appendChild(div);
    }
    groupEl.appendChild(grid);
    galleryBody.appendChild(groupEl);
  }
}

function groupByDate(photos) {
  const map = new Map();
  for (const p of photos) {
    const d = new Date(p.timestamp);
    const key = d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
    if (!map.has(key)) {
      map.set(key, { date: new Date(d.getFullYear(), d.getMonth(), d.getDate()), photos: [] });
    }
    map.get(key).photos.push(p);
  }
  return Array.from(map.values())
    .sort((a, b) => b.date - a.date)
    .map(g => ({
      date: g.date,
      photos: g.photos.sort((a, b) => b.timestamp - a.timestamp),
    }));
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

// ============================================================
//  사진 상세 화면
// ============================================================
async function openPhotoView(id) {
  // 현재 탭의 사진 리스트를 미리 준비 → 스와이프로 이전/다음 이동 가능
  const all = (await getAllPhotos()).map(normalizePhoto);
  photoViewList = all
    .filter(p => p.facing === currentTab)
    .sort((a, b) => b.timestamp - a.timestamp);
  photoViewIndex = photoViewList.findIndex(p => p.id === id);
  if (photoViewIndex === -1) return;

  showPhotoAtIndex(photoViewIndex);
  photoView.classList.remove('hidden');
}

function showPhotoAtIndex(i) {
  const photo = photoViewList[i];
  if (!photo) return;
  currentViewingPhoto = photo;
  photoViewImg.src = getPhotoUrl(photo);
  photoViewDate.textContent = formatDate(photo.timestamp);
  photoMemoInput.value = photo.memo || '';
  photoFav.classList.toggle('active', !!photo.favorite);
  renderTags();

  // MyFace(셀카)는 메모/카테고리 영역 숨김 — 얼굴/머리 기록 전용
  const isFace = photo.facing === 'user';
  photoMemoInput.classList.toggle('hidden', isFace);
  photoTagsArea.classList.toggle('hidden', isFace);
  addCategoryBtn.classList.toggle('hidden', isFace);
}

function closePhotoView() {
  photoView.classList.add('hidden');
  photoViewImg.src = '';
  currentViewingPhoto = null;
  photoViewList = [];
  photoViewIndex = 0;
  // 갤러리가 떠 있으면 변경사항(하트, 메모 등)을 즉시 반영
  if (!gallery.classList.contains('hidden')) {
    renderGallery();
  }
}

photoBack.addEventListener('click', () => {
  closePhotoView();
});

photoDelete.addEventListener('click', async () => {
  if (!currentViewingPhoto) return;
  if (!confirm('이 사진을 삭제할까요?')) return;
  const id = currentViewingPhoto.id;
  await deletePhotoById(id);
  revokePhotoUrl(id);
  // photoViewList에서 제거 후 다음/이전 사진으로 이동
  photoViewList = photoViewList.filter(p => p.id !== id);
  if (photoViewList.length === 0) {
    closePhotoView();
    await renderGallery();
  } else {
    if (photoViewIndex >= photoViewList.length) {
      photoViewIndex = photoViewList.length - 1;
    }
    showPhotoAtIndex(photoViewIndex);
  }
  updateGalleryBtnThumb();
});

photoDownload.addEventListener('click', () => {
  if (!currentViewingPhoto) return;
  // 다운로드는 별도의 임시 URL 사용 (캐시 URL 수명과 분리)
  const url = URL.createObjectURL(currentViewingPhoto.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'MirrorMe_' + formatDateFile(currentViewingPhoto.timestamp) + '.jpg';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

// 사진 상세 좌우 스와이프 → 이전/다음 사진
(function setupSwipe() {
  let startX = 0, startY = 0, tracking = false;
  const SWIPE_THRESHOLD = 50; // px

  photoViewImg.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) { tracking = false; return; }
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    tracking = true;
  }, { passive: true });

  photoViewImg.addEventListener('touchend', (e) => {
    if (!tracking) return;
    tracking = false;
    if (!currentViewingPhoto) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    // 가로 움직임이 세로보다 크고, 임계값 넘은 경우에만 스와이프로 인정
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    if (Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) {
      // 왼쪽 스와이프 → 다음(더 옛날 사진)
      if (photoViewIndex < photoViewList.length - 1) {
        photoViewIndex++;
        showPhotoAtIndex(photoViewIndex);
      }
    } else {
      // 오른쪽 스와이프 → 이전(더 최근 사진)
      if (photoViewIndex > 0) {
        photoViewIndex--;
        showPhotoAtIndex(photoViewIndex);
      }
    }
  }, { passive: true });
})();

// 메모 자동 저장 (포커스 잃을 때)
photoMemoInput.addEventListener('blur', async () => {
  if (!currentViewingPhoto) return;
  const v = photoMemoInput.value.trim();
  if (currentViewingPhoto.memo === v) return;
  currentViewingPhoto.memo = v;
  try {
    await updatePhoto(currentViewingPhoto);
  } catch (e) { console.error('메모 저장 실패:', e); }
});

// 하트 즐겨찾기
photoFav.addEventListener('click', async () => {
  if (!currentViewingPhoto) return;
  currentViewingPhoto.favorite = !currentViewingPhoto.favorite;
  photoFav.classList.toggle('active', currentViewingPhoto.favorite);
  try {
    await updatePhoto(currentViewingPhoto);
  } catch (e) { console.error('즐겨찾기 저장 실패:', e); }
});

// ============================================================
//  카테고리 태그 (칩)
// ============================================================
function renderTags() {
  photoTagsArea.innerHTML = '';
  if (!currentViewingPhoto) return;
  const tags = currentViewingPhoto.tags;
  for (const key of CATEGORY_KEYS) {
    const value = tags[key];
    if (!value) continue;
    photoTagsArea.appendChild(buildTagChip(key, value));
  }
}

function buildTagChip(key, value) {
  const chip = document.createElement('div');
  chip.className = 'tagChip';
  chip._cat = key;
  chip.innerHTML =
    '<span class="tagLabel">' + CATEGORY_LABELS[key] + '</span>' +
    '<span class="tagValue"></span>' +
    '<button class="chipRemove" aria-label="삭제">×</button>';
  chip.querySelector('.tagValue').textContent = value;
  chip.querySelector('.chipRemove').addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!currentViewingPhoto) return;
    currentViewingPhoto.tags[key] = '';
    await updatePhoto(currentViewingPhoto);
    renderTags();
  });
  // 칩 자체를 탭하면 편집 모드 (값 수정)
  chip.addEventListener('click', () => startEditingCategory(key, value));
  return chip;
}

function startEditingCategory(key, initialValue) {
  if (initialValue === undefined) initialValue = '';

  // 기존에 같은 카테고리 칩이 있다면 제거
  const existing = Array.from(photoTagsArea.querySelectorAll('.tagChip')).find(c => c._cat === key);
  if (existing) existing.remove();

  const chip = document.createElement('div');
  chip.className = 'tagChip editing';
  chip._cat = key;
  chip.innerHTML =
    '<span class="tagLabel">' + CATEGORY_LABELS[key] + '</span>' +
    '<input type="text" class="chipInput" maxlength="30" />';
  const input = chip.querySelector('input');
  input.value = initialValue;
  photoTagsArea.appendChild(chip);

  // 살짝 지연 후 포커스 (iOS 키보드 안정성)
  setTimeout(() => input.focus(), 30);

  let committed = false;
  async function commit() {
    if (committed) return;
    committed = true;
    const v = input.value.trim();
    if (!currentViewingPhoto) { renderTags(); return; }
    currentViewingPhoto.tags[key] = v;
    try { await updatePhoto(currentViewingPhoto); }
    catch (e) { console.error('태그 저장 실패:', e); }
    renderTags();
  }

  input.addEventListener('blur', commit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      input.blur();
    }
  });
}

// 카테고리 추가 버튼 → 메뉴 열기
addCategoryBtn.addEventListener('click', () => {
  if (!currentViewingPhoto) return;
  const tags = currentViewingPhoto.tags;
  const available = CATEGORY_KEYS.filter(k => !tags[k]);
  if (available.length === 0) {
    toast('이미 모든 카테고리가 입력되어 있어요');
    return;
  }
  // 메뉴에서 사용 가능한 카테고리만 표시
  categoryMenu.querySelectorAll('button[data-cat]').forEach(b => {
    b.classList.toggle('hidden', !available.includes(b.dataset.cat));
  });
  categoryMenu.classList.remove('hidden');
});

categoryMenuCancel.addEventListener('click', () => {
  categoryMenu.classList.add('hidden');
});

categoryMenu.addEventListener('click', (e) => {
  // 배경 클릭으로 닫기
  if (e.target === categoryMenu) {
    categoryMenu.classList.add('hidden');
    return;
  }
  const btn = e.target.closest('button[data-cat]');
  if (!btn) return;
  const key = btn.dataset.cat;
  categoryMenu.classList.add('hidden');
  startEditingCategory(key, '');
});

// ============================================================
//  유틸
// ============================================================
const DAY_NAMES = ['일','월','화','수','목','금','토'];

function formatDate(ts) {
  const d = new Date(ts);
  return d.getFullYear() + '.' +
    String(d.getMonth() + 1).padStart(2, '0') + '.' +
    String(d.getDate()).padStart(2, '0') + ' ' +
    String(d.getHours()).padStart(2, '0') + ':' +
    String(d.getMinutes()).padStart(2, '0');
}

function formatDateHeader(d) {
  const today = new Date();
  today.setHours(0,0,0,0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const baseLabel =
    d.getFullYear() + '.' +
    String(d.getMonth() + 1).padStart(2, '0') + '.' +
    String(d.getDate()).padStart(2, '0') + ' ' +
    DAY_NAMES[d.getDay()] + '요일';

  if (d.getTime() === today.getTime())     return '오늘 · ' + baseLabel;
  if (d.getTime() === yesterday.getTime()) return '어제 · ' + baseLabel;
  return baseLabel;
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

// ============================================================
//  시작 + 라이프사이클
// ============================================================
startBtn.addEventListener('click', start);

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && video.srcObject && video.paused) {
    video.play().catch(() => {});
  }
});

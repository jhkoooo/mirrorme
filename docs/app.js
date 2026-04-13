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

const photoView       = document.getElementById('photoView');
const photoViewImgWrap= document.getElementById('photoViewImgWrap');
const photoViewTopBar = document.getElementById('photoViewTopBar');
const photoViewInfo   = document.getElementById('photoViewInfo');
const photoViewDate   = document.getElementById('photoViewDate');
const photoBack       = document.getElementById('photoBack');
const photoDelete     = document.getElementById('photoDelete');
const photoDownload   = document.getElementById('photoDownload');
const photoFav        = document.getElementById('photoFav');
const photoMemoInput  = document.getElementById('photoMemoInput');
const photoTagsArea   = document.getElementById('photoTagsArea');
const addCategoryBtn  = document.getElementById('addCategoryBtn');

// 3-슬라이드 img 요소 (이전/현재/다음)
const photoSlidePrev = document.querySelector('.photoSlide[data-role="prev"]');
const photoSlideCurr = document.querySelector('.photoSlide[data-role="curr"]');
const photoSlideNext = document.querySelector('.photoSlide[data-role="next"]');
const photoSlides    = [photoSlidePrev, photoSlideCurr, photoSlideNext];

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

// 사진 속성 업데이트(하트/메모/태그) 큐 — IndexedDB 쓰기 완료 전에 갤러리 렌더링
// 이 일어나는 race condition을 방지하기 위해 pending 쓰기를 직렬화
let pendingUpdate = Promise.resolve();
function queueUpdate(photo) {
  pendingUpdate = pendingUpdate
    .catch(() => {})
    .then(() => updatePhoto(photo))
    .catch(e => console.error('사진 업데이트 실패:', e));
  return pendingUpdate;
}

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

  // 첫 진입: 첫 프레임이 완전히 디코딩될 때까지 대기 후 ready 처리.
  // 이래야 start()가 overlay를 내린 시점에 video가 정상 크기로 렌더링되어
  // "작게→크게" 깜빡임이 생기지 않음. 안전장치로 2초 타임아웃.
  if (!video.classList.contains('ready')) {
    await Promise.race([
      new Promise((resolve) => {
        if (video.readyState >= 2) {
          resolve();
        } else {
          video.addEventListener('loadeddata', () => resolve(), { once: true });
        }
      }),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);
    // 첫 프레임이 화면에 페인트된 다음 프레임에 opacity를 올림
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    video.classList.add('ready');
  }

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
//  사진 상세 화면 (v3.2 풀화면 + 드래그 슬라이드)
// ============================================================
let barsVisible = true;           // 상단/하단 바 토글 상태

// 3-슬라이드 레이아웃 적용 (offset = 가로 드래그 픽셀 값)
function setSlideTransforms(offsetX, withTransition) {
  const w = window.innerWidth;
  const tr = withTransition
    ? 'transform 260ms cubic-bezier(0.22, 0.8, 0.3, 1)'
    : 'none';
  photoSlidePrev.style.transition = tr;
  photoSlideCurr.style.transition = tr;
  photoSlideNext.style.transition = tr;
  photoSlidePrev.style.transform = 'translateX(' + (-w + offsetX) + 'px)';
  photoSlideCurr.style.transform = 'translateX(' + offsetX + 'px)';
  photoSlideNext.style.transform = 'translateX(' + (w + offsetX) + 'px)';
}

// photoViewIndex 기준으로 3개 슬라이드의 이미지·상태를 갱신
function renderCurrentSlide() {
  const curr = photoViewList[photoViewIndex];
  const prev = photoViewList[photoViewIndex - 1];
  const next = photoViewList[photoViewIndex + 1];

  photoSlideCurr.src = curr ? getPhotoUrl(curr) : '';
  photoSlidePrev.src = prev ? getPhotoUrl(prev) : '';
  photoSlideNext.src = next ? getPhotoUrl(next) : '';

  // 레이아웃은 transition 없이 제자리로
  setSlideTransforms(0, false);

  currentViewingPhoto = curr || null;
  if (!curr) return;

  photoViewDate.textContent = formatDate(curr.timestamp);
  photoMemoInput.value = curr.memo || '';
  photoFav.classList.toggle('active', !!curr.favorite);
  renderTags();

  // MyFace(셀카)는 info 패널 자체를 숨김, OOTD는 내부 항목 모두 표시
  const isFace = curr.facing === 'user';
  photoViewInfo.classList.toggle('hidden', isFace);
  photoMemoInput.classList.toggle('hidden', isFace);
  photoTagsArea.classList.toggle('hidden', isFace);
  addCategoryBtn.classList.toggle('hidden', isFace);

  // 바 가시성 상태 재적용 (MyFace면 info는 hidden이라 hidden-soft 안 붙임)
  photoViewTopBar.classList.toggle('hidden-soft', !barsVisible);
  if (!isFace) {
    photoViewInfo.classList.toggle('hidden-soft', !barsVisible);
  }
}

async function openPhotoView(id) {
  const all = (await getAllPhotos()).map(normalizePhoto);
  photoViewList = all
    .filter(p => p.facing === currentTab)
    .sort((a, b) => b.timestamp - a.timestamp);
  photoViewIndex = photoViewList.findIndex(p => p.id === id);
  if (photoViewIndex === -1) return;

  // 바 초기 가시 상태
  barsVisible = true;
  photoViewTopBar.classList.remove('hidden-soft');
  photoViewInfo.classList.remove('hidden-soft');

  renderCurrentSlide();
  photoView.classList.remove('hidden');
}

async function closePhotoView() {
  photoView.classList.add('hidden');
  photoView.style.transform = '';
  photoView.style.opacity = '';
  photoView.style.transition = '';
  photoSlidePrev.src = '';
  photoSlideCurr.src = '';
  photoSlideNext.src = '';
  currentViewingPhoto = null;
  photoViewList = [];
  photoViewIndex = 0;
  if (!gallery.classList.contains('hidden')) {
    try { await pendingUpdate; } catch (e) {}
    await renderGallery();
  }
}

function toggleBars() {
  barsVisible = !barsVisible;
  photoViewTopBar.classList.toggle('hidden-soft', !barsVisible);
  // MyFace면 info 패널 자체가 hidden이라 hidden-soft 안 씀
  const isFace = currentViewingPhoto && currentViewingPhoto.facing === 'user';
  if (!isFace) {
    photoViewInfo.classList.toggle('hidden-soft', !barsVisible);
  }
}

photoBack.addEventListener('click', () => {
  closePhotoView();
});

photoDelete.addEventListener('click', async () => {
  if (!currentViewingPhoto) return;
  if (!confirm('이 사진을 삭제할까요?')) return;
  const id = currentViewingPhoto.id;
  try { await pendingUpdate; } catch (e) {}
  await deletePhotoById(id);
  revokePhotoUrl(id);
  photoViewList = photoViewList.filter(p => p.id !== id);
  if (photoViewList.length === 0) {
    closePhotoView();
    await renderGallery();
  } else {
    if (photoViewIndex >= photoViewList.length) {
      photoViewIndex = photoViewList.length - 1;
    }
    renderCurrentSlide();
  }
  updateGalleryBtnThumb();
});

photoDownload.addEventListener('click', () => {
  if (!currentViewingPhoto) return;
  const url = URL.createObjectURL(currentViewingPhoto.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'MirrorMe_' + formatDateFile(currentViewingPhoto.timestamp) + '.jpg';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

// 드래그 추적 슬라이드 + 세로 스와이프 닫기 + 탭 토글
(function setupPhotoGestures() {
  let startX = 0, startY = 0;
  let dragging = false;
  let dragDirection = null;   // 'h' | 'v' | null
  let movedEnough = false;
  let touchStartTime = 0;

  const DIRECTION_THRESHOLD = 8;     // 드래그 시작 판정 (px)
  const SLIDE_THRESHOLD_RATIO = 0.22; // 다음/이전 전환 임계
  const DISMISS_THRESHOLD = 100;      // 세로 닫기 임계 (px)
  const TAP_MAX_MS = 280;

  photoViewImgWrap.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) { dragging = false; return; }
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    dragging = true;
    dragDirection = null;
    movedEnough = false;
    touchStartTime = Date.now();
    // transition 제거 (손가락 따라가게)
    setSlideTransforms(0, false);
    photoView.style.transition = 'none';
  }, { passive: true });

  photoViewImgWrap.addEventListener('touchmove', (e) => {
    if (!dragging) return;
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;

    if (!dragDirection) {
      if (Math.abs(dx) < DIRECTION_THRESHOLD && Math.abs(dy) < DIRECTION_THRESHOLD) return;
      dragDirection = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
      movedEnough = true;
    }

    if (dragDirection === 'h') {
      // 경계에서 저항감: 이전이 없는데 오른쪽으로 당기거나 다음이 없는데 왼쪽으로 당기면 절반만 반영
      let effectiveDx = dx;
      if (dx > 0 && photoViewIndex === 0) effectiveDx = dx * 0.35;
      if (dx < 0 && photoViewIndex === photoViewList.length - 1) effectiveDx = dx * 0.35;
      setSlideTransforms(effectiveDx, false);
    } else if (dragDirection === 'v' && dy > 0) {
      const progress = Math.min(1, dy / window.innerHeight);
      photoView.style.transform = 'translateY(' + dy + 'px)';
      photoView.style.opacity = String(Math.max(0.3, 1 - progress * 0.8));
    }
  }, { passive: true });

  photoViewImgWrap.addEventListener('touchend', (e) => {
    if (!dragging) return;
    dragging = false;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    const dt = Date.now() - touchStartTime;

    // 탭 (움직임 없음 + 짧은 시간)
    if (!movedEnough) {
      if (dt < TAP_MAX_MS) toggleBars();
      return;
    }

    if (dragDirection === 'h') {
      const w = window.innerWidth;
      const threshold = w * SLIDE_THRESHOLD_RATIO;
      if (dx < -threshold && photoViewIndex < photoViewList.length - 1) {
        // 다음 사진으로 — 현재를 화면 왼쪽 밖으로, 다음을 중앙으로
        const prevT = 'translateX(' + (-2 * w) + 'px)';
        const currT = 'translateX(' + (-w) + 'px)';
        const nextT = 'translateX(0px)';
        const tr = 'transform 260ms cubic-bezier(0.22, 0.8, 0.3, 1)';
        photoSlidePrev.style.transition = tr;
        photoSlideCurr.style.transition = tr;
        photoSlideNext.style.transition = tr;
        photoSlidePrev.style.transform = prevT;
        photoSlideCurr.style.transform = currT;
        photoSlideNext.style.transform = nextT;
        setTimeout(() => {
          photoViewIndex++;
          renderCurrentSlide();
        }, 260);
      } else if (dx > threshold && photoViewIndex > 0) {
        const w2 = w;
        const tr = 'transform 260ms cubic-bezier(0.22, 0.8, 0.3, 1)';
        photoSlidePrev.style.transition = tr;
        photoSlideCurr.style.transition = tr;
        photoSlideNext.style.transition = tr;
        photoSlidePrev.style.transform = 'translateX(0px)';
        photoSlideCurr.style.transform = 'translateX(' + w2 + 'px)';
        photoSlideNext.style.transform = 'translateX(' + (2 * w2) + 'px)';
        setTimeout(() => {
          photoViewIndex--;
          renderCurrentSlide();
        }, 260);
      } else {
        // 원위치
        setSlideTransforms(0, true);
      }
    } else if (dragDirection === 'v') {
      photoView.style.transition = 'transform 220ms ease, opacity 220ms ease';
      if (dy > DISMISS_THRESHOLD) {
        // 닫기 애니메이션
        photoView.style.transform = 'translateY(' + window.innerHeight + 'px)';
        photoView.style.opacity = '0';
        setTimeout(() => {
          closePhotoView();
        }, 220);
      } else {
        photoView.style.transform = '';
        photoView.style.opacity = '';
      }
    }
  }, { passive: true });
})();

// 메모 자동 저장 (포커스 잃을 때)
photoMemoInput.addEventListener('blur', () => {
  if (!currentViewingPhoto) return;
  const v = photoMemoInput.value.trim();
  if (currentViewingPhoto.memo === v) return;
  currentViewingPhoto.memo = v;
  queueUpdate(currentViewingPhoto);
});

// 하트 즐겨찾기
photoFav.addEventListener('click', () => {
  if (!currentViewingPhoto) return;
  currentViewingPhoto.favorite = !currentViewingPhoto.favorite;
  photoFav.classList.toggle('active', currentViewingPhoto.favorite);
  queueUpdate(currentViewingPhoto);
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
  chip.querySelector('.chipRemove').addEventListener('click', (e) => {
    e.stopPropagation();
    if (!currentViewingPhoto) return;
    currentViewingPhoto.tags[key] = '';
    queueUpdate(currentViewingPhoto);
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
  function commit() {
    if (committed) return;
    committed = true;
    const v = input.value.trim();
    if (!currentViewingPhoto) { renderTags(); return; }
    currentViewingPhoto.tags[key] = v;
    queueUpdate(currentViewingPhoto);
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

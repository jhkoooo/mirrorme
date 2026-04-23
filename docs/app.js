// MirrorMe v3.0
//
// 핵심 기능
// - 전면 카메라: 미러링 없는 "상대방이 보는 나" (MyFace 탭)
// - 후면 카메라: 거울 통한 OOTD 촬영 (OOTD 탭, 본인 사진만 — 사람 감지 검증)
// - 핀치 줌, 더블탭 리셋, 카메라 토글
// - 무음 사진 촬영 (canvas 캡처)
// - 앱 내 갤러리 (IndexedDB), 날짜·요일별 그룹
// - 사진 상세: 메모 / 카테고리 태그(상의·하의·신발·아우터·액세서리) / 하트 즐겨찾기
// - 후면 카메라 촬영 시 MoveNet으로 전신 판정 → 팔만·상반신만은 저장 거부
//
// 데이터 모델 (IndexedDB photos store)
//   { id, blob, timestamp, facing, memo, tags{top,bottom,shoes,outer,accessory}, favorite }

// ============================================================
//  DOM
// ============================================================
const video         = document.getElementById('video');
const home          = document.getElementById('home');
const homeCards     = document.querySelectorAll('.homeCard');
const cameraTopBar  = document.getElementById('cameraTopBar');
const homeBtn       = document.getElementById('homeBtn');
const controls      = document.getElementById('controls');
const flipBtn       = document.getElementById('flipBtn');
const shutterBtn    = document.getElementById('shutterBtn');
const galleryBtn    = document.getElementById('galleryBtn');
const zoomBadge     = document.getElementById('zoomBadge');
const captureHint   = document.getElementById('captureHint');
const toastEl       = document.getElementById('toast');

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

// 스타일 검사 / 설정
const photoStyleCheckBtn = document.getElementById('photoStyleCheckBtn');
const styleCheckCard     = document.getElementById('styleCheckCard');
const homeSettingsBtn    = document.getElementById('homeSettingsBtn');
const settings           = document.getElementById('settings');
const settingsClose      = document.getElementById('settingsClose');
const geminiKeyInput     = document.getElementById('geminiKeyInput');
const geminiKeySave      = document.getElementById('geminiKeySave');
const geminiKeyClear     = document.getElementById('geminiKeyClear');
const keyStatus          = document.getElementById('keyStatus');
const toneChipsEl        = document.getElementById('toneChips');

// 맥락 입력 시트
const contextSheet       = document.getElementById('contextSheet');
const contextSheetCancel = document.getElementById('contextSheetCancel');
const contextChipsEl     = document.getElementById('contextChips');
const contextFreeInput   = document.getElementById('contextFreeInput');
const contextSkip        = document.getElementById('contextSkip');
const contextSubmit      = document.getElementById('contextSubmit');

// ============================================================
//  상태
// ============================================================
let currentStream       = null;
let currentFacing       = 'user';
let videoFirstFrameReady = false;   // 첫 프레임 디코딩 완료 플래그
let galleryEntryPoint   = 'home';   // 'home' | 'camera' — 앨범에서 돌아갈 곳
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

// 스타일 검사 관련
const GEMINI_KEY_STORAGE  = 'mystyle_gemini_api_key';
const TONE_STORAGE        = 'mystyle_ai_tone';                 // 'friendly' | 'balanced' | 'expert'
// gemini-2.5-flash: Google이 2.0-flash를 신규 사용자에게 제공 중단(2026-04).
// 결제 활성화 상태이므로 무료 티어 RPD 제약(250) 영향 거의 없음.
// Vision 지원, tags·brandGuess 풍부히 채움.
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/' + GEMINI_MODEL + ':generateContent';
let styleCheckInFlight = false;

// 맥락 입력 상태 (시트에서 임시 보관, 제출 시 분석 호출에 전달)
let selectedContextChip = '';   // '데일리' 등 (칩으로 선택)
let contextFreeText     = '';   // 자유 입력

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

  // 첫 진입: 첫 프레임이 완전히 디코딩되고 페인트될 때까지 대기.
  // overlay가 이 후에 페이드아웃되므로 사용자는 "검정→카메라" 전환만 봄 (깜빡임 없음).
  if (!videoFirstFrameReady) {
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
    // 첫 프레임이 화면에 페인트된 다음 프레임까지 대기
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    videoFirstFrameReady = true;
  }

  resetZoom();
  updateShutterIndicator();
  // OOTD 진입 시 실시간 감지 시작, MyFace면 중지
  if (currentFacing === 'environment') {
    startRealtimeDetection();
  } else {
    stopRealtimeDetection();
    updateShutterIndicator();
  }
}

// ============================================================
//  홈 화면 / 모드 진입
// ============================================================

// 카메라 스트림 완전 정지 (홈으로 돌아갈 때 호출)
function stopCamera() {
  if (currentStream) {
    currentStream.getTracks().forEach(t => t.stop());
    currentStream = null;
  }
  if (video.srcObject) video.srcObject = null;
  videoFirstFrameReady = false;
}

// 홈으로 돌아가기
function showHome() {
  // 카메라 UI 숨김
  controls.classList.add('hidden');
  captureHint.classList.add('hidden');
  cameraTopBar.classList.add('hidden');
  // 감지 루프 중지 + 스트림 정지
  stopRealtimeDetection();
  stopCamera();
  // 홈 화면 표시
  home.classList.remove('hidden');
  home.classList.remove('fading');
}

// 카메라 모드 진입 (face = 전면, ootd = 후면)
async function enterCameraMode(mode) {
  const facing = (mode === 'ootd') ? 'environment' : 'user';
  try {
    // 홈 페이드아웃 (검은 배경 유지 상태로 카메라 준비)
    home.classList.add('fading');
    await startCamera(facing);
    // 카메라 준비 완료 → 컨트롤·상단 바 노출
    controls.classList.remove('hidden');
    cameraTopBar.classList.remove('hidden');
    setTimeout(() => home.classList.add('hidden'), 300);
    updateGalleryBtnThumb();
    loadPoseModel();
  } catch (err) {
    home.classList.remove('fading');
    console.error(err);
    toast('카메라를 사용할 수 없습니다: ' + (err && err.message ? err.message : err));
  }
}

// 홈에서 앨범으로 직접 진입 (카메라 없이)
async function enterAlbumFromHome() {
  galleryEntryPoint = 'home';
  home.classList.add('fading');
  setTimeout(() => {
    home.classList.add('hidden');
    home.classList.remove('fading');
  }, 280);
  // 카메라 없이 갤러리 열기
  gallery.classList.remove('hidden');
  await renderGallery();
}

// 홈 카드 클릭 바인딩
homeCards.forEach(card => {
  card.addEventListener('click', () => {
    const mode = card.dataset.mode;
    if (mode === 'face' || mode === 'ootd') {
      enterCameraMode(mode);
    } else if (mode === 'album') {
      enterAlbumFromHome();
    }
  });
});

// 카메라 화면의 ← 홈 버튼
homeBtn.addEventListener('click', () => {
  showHome();
});

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
//  전신 판정 (MoveNet — 신체 키포인트)
// ============================================================
// MoveNet SinglePose Lightning 모델로 17개 신체 키포인트를 감지하여,
// 어깨·엉덩이·다리(무릎/발목)가 모두 보이는 경우만 'full'로 판정.
// 팔이나 손만 찍힌 케이스는 상반신 키포인트가 없어 'partial'로 걸러짐.
let poseModel = null;
let modelLoading = false;
let modelLoadFailed = false;

// 실시간 사람 감지 (OOTD 카메라 화면)
let detectionInterval = null;
let lastDetectionResult = null;        // 'none' | 'partial' | 'full' | null
let bypassDetectionForSession = false; // 모델 실패 시 사용자 승인하에 검증 건너뜀
const DETECTION_PERIOD_MS = 2000;

// 키포인트 신뢰도 임계치 (이 값 이상이면 "보임"으로 간주)
const KP_THRESHOLD = 0.3;

async function loadPoseModel() {
  if (poseModel || modelLoading || modelLoadFailed) return;
  if (typeof poseDetection === 'undefined') {
    // 라이브러리가 아직 안 로드됨 → 잠시 후 재시도
    setTimeout(loadPoseModel, 600);
    return;
  }
  modelLoading = true;
  try {
    poseModel = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet,
      { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
    );
    console.log('[MyStyle] MoveNet 로드 완료');
    updateShutterIndicator();
    // 로드되자마자 첫 감지 수행 (UI 즉시 업데이트)
    if (currentFacing === 'environment' && video.srcObject) {
      runDetection();
    }
  } catch (e) {
    console.error('[MyStyle] MoveNet 로드 실패:', e);
    modelLoadFailed = true;
    updateShutterIndicator();
  } finally {
    modelLoading = false;
  }
}

// 17개 키포인트로 전신 여부 분류
// - 'full'    = 어깨·엉덩이·다리 모두 감지 + 키포인트 bbox가 이미지의 충분한 영역 차지
// - 'partial' = 사람은 있지만 상·중·하 중 하나 이상 미충족, 또는 너무 작게 잡힘(피규어·포스터 등)
// - 'none'    = 어떤 키포인트도 임계치 이상으로 보이지 않음
const KP_BBOX_MIN_H_RATIO = 0.50;  // 키포인트 bbox 높이 / 이미지 높이 — 피규어 차단용
const KP_BBOX_MIN_W_RATIO = 0.12;
function classifyPose(keypoints, canvasW, canvasH) {
  if (!keypoints || keypoints.length === 0) return 'none';
  const visible = keypoints.filter(k => k.score >= KP_THRESHOLD);
  if (visible.length === 0) return 'none';

  const has = (name) => visible.some(k => k.name === name);
  const hasShoulder  = has('left_shoulder') || has('right_shoulder');
  const hasHip       = has('left_hip')      || has('right_hip');
  const hasLowerBody =
    has('left_knee')  || has('right_knee')  ||
    has('left_ankle') || has('right_ankle');

  if (!(hasShoulder && hasHip && hasLowerBody)) return 'partial';

  // 추가 검증: 키포인트 전체 bbox가 이미지에 비해 작으면 피규어·포스터 등 오감지
  if (canvasW && canvasH) {
    let minY = Infinity, maxY = -Infinity, minX = Infinity, maxX = -Infinity;
    for (const k of visible) {
      if (k.y < minY) minY = k.y;
      if (k.y > maxY) maxY = k.y;
      if (k.x < minX) minX = k.x;
      if (k.x > maxX) maxX = k.x;
    }
    const bboxH = maxY - minY;
    const bboxW = maxX - minX;
    const hRatio = bboxH / canvasH;
    const wRatio = bboxW / canvasW;
    if (hRatio < KP_BBOX_MIN_H_RATIO || wRatio < KP_BBOX_MIN_W_RATIO) {
      return 'partial';
    }
  }
  return 'full';
}

// 캔버스에서 포즈 추정 → 'none'/'partial'/'full'/null 반환
async function detectPersonOnCanvas(canvas) {
  if (!poseModel) return null;
  try {
    const poses = await poseModel.estimatePoses(canvas, { maxPoses: 1, flipHorizontal: false });
    if (!poses || poses.length === 0) return 'none';
    return classifyPose(poses[0].keypoints, canvas.width, canvas.height);
  } catch (e) {
    console.error('[MyStyle] 포즈 추정 실패:', e);
    return null;
  }
}

// 주기 감지: video의 현재 프레임을 작은 canvas로 추론 (성능 최적화)
async function runDetection() {
  if (!poseModel) return;
  if (!video.srcObject) return;
  const vw = video.videoWidth, vh = video.videoHeight;
  if (!vw || !vh) return;
  // 320px 너비로 축소 추론 (정확도 충분 + 속도 ↑)
  const scale = 320 / vw;
  const cv = document.createElement('canvas');
  cv.width = 320;
  cv.height = Math.round(vh * scale);
  cv.getContext('2d').drawImage(video, 0, 0, cv.width, cv.height);
  const res = await detectPersonOnCanvas(cv);
  if (res !== null) lastDetectionResult = res;  // 'none'|'partial'|'full'
  updateShutterIndicator();
}

function startRealtimeDetection() {
  stopRealtimeDetection();
  lastDetectionResult = null;
  updateShutterIndicator();
  detectionInterval = setInterval(() => {
    if (currentFacing !== 'environment') return;
    runDetection();
  }, DETECTION_PERIOD_MS);
}

function stopRealtimeDetection() {
  if (detectionInterval) {
    clearInterval(detectionInterval);
    detectionInterval = null;
  }
  lastDetectionResult = null;
}

// 셔터 링·힌트 라벨 상태 업데이트
function updateShutterIndicator() {
  // OOTD(후면)가 아니면 상태 표시 X
  if (currentFacing !== 'environment') {
    shutterBtn.removeAttribute('data-state');
    captureHint.removeAttribute('data-state');
    captureHint.classList.add('hidden');
    captureHint.textContent = '';
    return;
  }

  let state, text;
  if (bypassDetectionForSession) {
    state = 'bypass';
    text = 'AI 감지 비활성 (수동 저장)';
  } else if (modelLoadFailed) {
    state = 'failed';
    text = 'AI 준비 실패';
  } else if (!poseModel) {
    state = 'loading';
    text = 'AI 준비 중...';
  } else if (lastDetectionResult === 'full') {
    state = 'person';
    text = '사람 감지됨';
  } else if (lastDetectionResult === 'partial') {
    state = 'partial';
    text = '전신이 보이도록 맞춰주세요';
  } else if (lastDetectionResult === 'none') {
    state = 'noperson';
    text = '사람이 감지되지 않아요';
  } else {
    state = 'loading';
    text = 'AI 준비 중...';
  }

  shutterBtn.setAttribute('data-state', state);
  captureHint.setAttribute('data-state', state);
  captureHint.textContent = text;
  captureHint.classList.remove('hidden');
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

    // 후면 카메라(OOTD)는 사람 감지 검증 (이중 검증 — 연타 시 false positive 방지)
    if (capturedFacing === 'environment' && !bypassDetectionForSession) {
      // 1) 모델 로드 실패 → 1회 모달로 세션 허용 여부 확인
      if (modelLoadFailed) {
        const ok = confirm(
          'AI 감지를 사용할 수 없습니다.\n' +
          '검증 없이 저장하시겠어요?\n' +
          '(앱을 다시 켤 때까지 계속 허용됩니다)'
        );
        if (!ok) return;
        bypassDetectionForSession = true;
        updateShutterIndicator();
        // 승인 후 계속 진행
      }
      // 2) 모델 로딩 중 → 저장 거부
      else if (!poseModel) {
        toast('AI 준비 중이에요. 잠시 후 다시 시도해 주세요');
        return;
      }
      // 3) 모델 준비됨 → 이중 검증: 실시간 상태 + 현재 프레임 둘 다 'full'이어야 저장
      else {
        // 3-1) 실시간 감지 상태(셔터 링 색상과 일치) 우선 체크
        //      UI가 빨강/하늘색이면 사용자는 이미 "감지 안 됨" 상태를 본 것.
        //      그 상태에서 연타로 찍으려 해도 거부하는 게 일관된 UX.
        if (lastDetectionResult === 'none') {
          toast('사람이 감지되지 않아 저장하지 않았어요');
          return;
        }
        if (lastDetectionResult === 'partial') {
          toast('전신이 더 나오도록 맞춰주세요');
          return;
        }
        // 3-2) 촬영 프레임 재감지 (lastDetectionResult 'full' 또는 null인 경우)
        const status = await detectPersonOnCanvas(canvas);
        if (status === 'none') {
          toast('사람이 감지되지 않아 저장하지 않았어요');
          return;
        }
        if (status === 'partial') {
          toast('전신이 더 나오도록 맞춰주세요');
          return;
        }
        // 'full' → 통과
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
  if (p.styleCheck && typeof p.styleCheck !== 'object') p.styleCheck = null;
  if (typeof p.styleCheck === 'undefined') p.styleCheck = null;
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
galleryBtn.addEventListener('click', () => {
  // 카메라 화면에서 진입 → 돌아갈 때 카메라로
  galleryEntryPoint = 'camera';
  openGallery();
});
galleryClose.addEventListener('click', closeGallery);

async function openGallery() {
  // 갤러리가 떠 있는 동안 카메라 컨트롤·안내 문구는 가려둠 + 감지 루프 중지
  controls.classList.add('hidden');
  captureHint.classList.add('hidden');
  cameraTopBar.classList.add('hidden');
  stopRealtimeDetection();
  gallery.classList.remove('hidden');
  await renderGallery();
}

function closeGallery() {
  gallery.classList.add('hidden');
  galleryBody.innerHTML = '';

  if (galleryEntryPoint === 'home') {
    // 홈에서 진입한 경우: 홈으로 복귀 (카메라 안 켬)
    home.classList.remove('hidden');
    home.classList.remove('fading');
    updateGalleryBtnThumb();
    return;
  }

  // 카메라에서 진입한 경우: 카메라 UI 복원
  controls.classList.remove('hidden');
  cameraTopBar.classList.remove('hidden');
  updateShutterIndicator();
  // 후면이면 감지 루프 재개
  if (currentFacing === 'environment') startRealtimeDetection();
  // iOS Safari가 가려진 동안 video를 자동 일시정지했을 수 있음 → 재개
  if (video.srcObject && video.paused) {
    video.play().catch(() => {});
  }
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
//  사진 상세 화면 (v3.2 풀화면 + 드래그 슬라이드 + 핀치 줌)
// ============================================================
let barsVisible = true;           // 상단/하단 바 토글 상태

// 현재 슬라이드의 핀치 줌/팬 상태
let zoomScale = 1;
let zoomTX = 0;
let zoomTY = 0;
const PHOTO_MIN_ZOOM = 1;
const PHOTO_MAX_ZOOM = 5;

function applyCurrSlideTransform(withTransition) {
  photoSlideCurr.style.transition = withTransition
    ? 'transform 220ms cubic-bezier(0.22, 0.8, 0.3, 1)'
    : 'none';
  photoSlideCurr.style.transform =
    'translate(' + zoomTX + 'px,' + zoomTY + 'px) scale(' + zoomScale + ')';
}

function resetPhotoZoom(withTransition) {
  zoomScale = 1;
  zoomTX = 0;
  zoomTY = 0;
  applyCurrSlideTransform(!!withTransition);
}

// 확대 상태에서 사진이 화면 밖으로 완전히 벗어나지 않게 translate 제한.
// transform-origin이 center center이므로 scale > 1일 때 img는 중앙 기준으로 팽창하고,
// 가장자리가 화면을 넘는 거리만큼만 translate가 허용된다.
function clampPan() {
  if (zoomScale <= 1.001) {
    zoomTX = 0;
    zoomTY = 0;
    return;
  }
  const w = photoViewImgWrap.clientWidth  || window.innerWidth;
  const h = photoViewImgWrap.clientHeight || window.innerHeight;
  const maxX = (w * (zoomScale - 1)) / 2;
  const maxY = (h * (zoomScale - 1)) / 2;
  if (zoomTX >  maxX) zoomTX =  maxX;
  if (zoomTX < -maxX) zoomTX = -maxX;
  if (zoomTY >  maxY) zoomTY =  maxY;
  if (zoomTY < -maxY) zoomTY = -maxY;
}

// 3-슬라이드 레이아웃 적용 (offset = 가로 드래그 픽셀 값)
function setSlideTransforms(offsetX, withTransition) {
  const w = window.innerWidth;
  const tr = withTransition
    ? 'transform 260ms cubic-bezier(0.22, 0.8, 0.3, 1)'
    : 'none';
  photoSlidePrev.style.transition = tr;
  photoSlideNext.style.transition = tr;
  photoSlidePrev.style.transform = 'translateX(' + (-w + offsetX) + 'px)';
  photoSlideNext.style.transform = 'translateX(' + (w + offsetX) + 'px)';
  // 현재 슬라이드: 줌 상태면 zoom transform 유지, 아니면 가로 offset 적용
  photoSlideCurr.style.transition = tr;
  if (zoomScale > 1.001) {
    photoSlideCurr.style.transform =
      'translate(' + zoomTX + 'px,' + zoomTY + 'px) scale(' + zoomScale + ')';
  } else {
    photoSlideCurr.style.transform = 'translateX(' + offsetX + 'px)';
  }
}

// photoViewIndex 기준으로 3개 슬라이드의 이미지·상태를 갱신
function renderCurrentSlide() {
  // 슬라이드가 바뀌면 줌 초기화
  zoomScale = 1; zoomTX = 0; zoomTY = 0;

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
  // 스타일 검사 버튼은 OOTD에만 노출
  photoStyleCheckBtn.classList.toggle('hidden', isFace);
  renderStyleCheckCard();

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
  a.download = 'MyStyle_' + formatDateFile(currentViewingPhoto.timestamp) + '.jpg';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

// 드래그 슬라이드 + 세로 닫기 + 탭 토글 + 핀치 줌 & 팬
(function setupPhotoGestures() {
  let startX = 0, startY = 0;
  let dragging = false;
  let dragMode = null;        // 'swipe' | 'vertical' | 'pan' | 'pinch' | null
  let movedEnough = false;
  let touchStartTime = 0;

  // 핀치 (중심점 기반)
  let pinchStartDist  = 0;
  let pinchStartScale = 1;
  let pinchStartTX    = 0;
  let pinchStartTY    = 0;
  let pinchCenterX    = 0;  // 화면 좌표
  let pinchCenterY    = 0;

  // 팬 시작점
  let panStartTX = 0;
  let panStartTY = 0;

  const DIRECTION_THRESHOLD  = 8;     // 드래그 시작 판정 (px)
  const SLIDE_THRESHOLD_RATIO = 0.22; // 다음/이전 전환 임계
  const DISMISS_THRESHOLD    = 100;   // 세로 닫기 임계 (px)
  const TAP_MAX_MS           = 280;

  function dist(t1, t2) {
    return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
  }

  photoViewImgWrap.addEventListener('touchstart', (e) => {
    // 두 손가락 → 핀치 시작
    if (e.touches.length === 2) {
      dragging = true;
      dragMode = 'pinch';
      movedEnough = true;
      pinchStartDist  = dist(e.touches[0], e.touches[1]);
      pinchStartScale = zoomScale;
      pinchStartTX    = zoomTX;
      pinchStartTY    = zoomTY;
      // 핀치 중심점: 두 손가락 사이 중앙 (화면 좌표)
      pinchCenterX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      pinchCenterY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      photoSlideCurr.style.transition = 'none';
      return;
    }
    if (e.touches.length !== 1) return;

    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    dragging = true;
    dragMode = null;
    movedEnough = false;
    touchStartTime = Date.now();

    // 줌 상태면 팬 시작점 기록
    if (zoomScale > 1.001) {
      panStartTX = zoomTX;
      panStartTY = zoomTY;
    }

    // transition 제거 (손가락 실시간 추적)
    setSlideTransforms(0, false);
    photoView.style.transition = 'none';
    photoSlideCurr.style.transition = 'none';
  }, { passive: false });

  photoViewImgWrap.addEventListener('touchmove', (e) => {
    if (!dragging) return;
    // iOS Safari가 핀치를 기본 제스처로 가로채는 것 차단 (passive:false 전제)
    if (e.cancelable) e.preventDefault();

    // 핀치 줌 (손가락 중심점 기준 확대/축소)
    if (e.touches.length === 2 && dragMode === 'pinch') {
      const newDist = dist(e.touches[0], e.touches[1]);
      const ratio = newDist / (pinchStartDist || 1);
      // 1 이하로 내리는 건 약간 허용 (놓으면 1로 스냅)
      zoomScale = Math.max(PHOTO_MIN_ZOOM * 0.8, Math.min(PHOTO_MAX_ZOOM, pinchStartScale * ratio));
      // 핀치 중심이 화면 상에서 같은 위치에 유지되도록 translate 보정
      // (transform-origin: center center 기준 공식)
      const sCX = window.innerWidth / 2;
      const sCY = window.innerHeight / 2;
      const k = zoomScale / pinchStartScale;
      zoomTX = (pinchCenterX - sCX) - (pinchCenterX - sCX - pinchStartTX) * k;
      zoomTY = (pinchCenterY - sCY) - (pinchCenterY - sCY - pinchStartTY) * k;
      clampPan();
      applyCurrSlideTransform(false);
      return;
    }

    if (e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;

    if (!dragMode) {
      if (Math.abs(dx) < DIRECTION_THRESHOLD && Math.abs(dy) < DIRECTION_THRESHOLD) return;
      movedEnough = true;
      if (zoomScale > 1.001) {
        dragMode = 'pan';
      } else {
        dragMode = Math.abs(dx) > Math.abs(dy) ? 'swipe' : 'vertical';
      }
    }

    if (dragMode === 'pan') {
      zoomTX = panStartTX + dx;
      zoomTY = panStartTY + dy;
      clampPan();
      applyCurrSlideTransform(false);
    } else if (dragMode === 'swipe') {
      let eff = dx;
      if (dx > 0 && photoViewIndex === 0) eff = dx * 0.35;
      if (dx < 0 && photoViewIndex === photoViewList.length - 1) eff = dx * 0.35;
      setSlideTransforms(eff, false);
    } else if (dragMode === 'vertical' && dy > 0) {
      const progress = Math.min(1, dy / window.innerHeight);
      photoView.style.transform = 'translateY(' + dy + 'px)';
      photoView.style.opacity = String(Math.max(0.3, 1 - progress * 0.8));
    }
  }, { passive: false });

  photoViewImgWrap.addEventListener('touchend', (e) => {
    if (!dragging) return;

    // 손가락이 아직 남아 있음 (멀티터치의 일부)
    if (e.touches.length > 0) {
      // 핀치 중 한 손가락만 뗀 경우: 남은 손가락으로 팬 가능하게 전환
      if (dragMode === 'pinch' && e.touches.length === 1) {
        if (zoomScale > 1.001) {
          dragMode = 'pan';
          startX = e.touches[0].clientX;
          startY = e.touches[0].clientY;
          panStartTX = zoomTX;
          panStartTY = zoomTY;
        } else {
          // 줌이 거의 1이면 스냅 복귀 + 제스처 종료
          resetPhotoZoom(true);
          dragging = false;
        }
      }
      return;
    }

    // 모든 손가락 뗐음 → 제스처 마무리
    dragging = false;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    const dt = Date.now() - touchStartTime;

    // 핀치 종료: scale < 1이면 스냅 복귀, 아니면 현재 상태 유지 (경계 재정렬)
    if (dragMode === 'pinch') {
      if (zoomScale < 1) {
        resetPhotoZoom(true);
      } else {
        clampPan();
        applyCurrSlideTransform(true);
      }
      return;
    }

    // 팬 종료: 경계 재정렬 후 유지
    if (dragMode === 'pan') {
      clampPan();
      applyCurrSlideTransform(true);
      return;
    }

    // 탭 감지
    if (!movedEnough) {
      if (dt < TAP_MAX_MS) toggleBars();
      return;
    }

    // swipe 마무리
    if (dragMode === 'swipe') {
      const w = window.innerWidth;
      const threshold = w * SLIDE_THRESHOLD_RATIO;
      if (dx < -threshold && photoViewIndex < photoViewList.length - 1) {
        const tr = 'transform 260ms cubic-bezier(0.22, 0.8, 0.3, 1)';
        photoSlidePrev.style.transition = tr;
        photoSlideCurr.style.transition = tr;
        photoSlideNext.style.transition = tr;
        photoSlidePrev.style.transform = 'translateX(' + (-2 * w) + 'px)';
        photoSlideCurr.style.transform = 'translateX(' + (-w) + 'px)';
        photoSlideNext.style.transform = 'translateX(0px)';
        setTimeout(() => {
          photoViewIndex++;
          renderCurrentSlide();
        }, 260);
      } else if (dx > threshold && photoViewIndex > 0) {
        const tr = 'transform 260ms cubic-bezier(0.22, 0.8, 0.3, 1)';
        photoSlidePrev.style.transition = tr;
        photoSlideCurr.style.transition = tr;
        photoSlideNext.style.transition = tr;
        photoSlidePrev.style.transform = 'translateX(0px)';
        photoSlideCurr.style.transform = 'translateX(' + w + 'px)';
        photoSlideNext.style.transform = 'translateX(' + (2 * w) + 'px)';
        setTimeout(() => {
          photoViewIndex--;
          renderCurrentSlide();
        }, 260);
      } else {
        setSlideTransforms(0, true);
      }
    } else if (dragMode === 'vertical') {
      photoView.style.transition = 'transform 220ms ease, opacity 220ms ease';
      if (dy > DISMISS_THRESHOLD) {
        photoView.style.transform = 'translateY(' + window.innerHeight + 'px)';
        photoView.style.opacity = '0';
        setTimeout(() => closePhotoView(), 220);
      } else {
        photoView.style.transform = '';
        photoView.style.opacity = '';
      }
    }
  }, { passive: false });
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
//  설정 (API 키 관리)
// ============================================================
function getGeminiKey() {
  try { return localStorage.getItem(GEMINI_KEY_STORAGE) || ''; }
  catch (e) { return ''; }
}
function setGeminiKey(v) {
  try {
    if (v) localStorage.setItem(GEMINI_KEY_STORAGE, v);
    else localStorage.removeItem(GEMINI_KEY_STORAGE);
  } catch (e) {}
}

function refreshKeyStatus() {
  const k = getGeminiKey();
  if (k) {
    keyStatus.textContent = '✓ 키가 저장되어 있습니다 (...' + k.slice(-6) + ')';
    keyStatus.classList.add('ok');
    geminiKeyInput.value = '';
    geminiKeyInput.placeholder = '변경하려면 새 키 입력';
  } else {
    keyStatus.textContent = '키가 저장되어 있지 않습니다.';
    keyStatus.classList.remove('ok');
    geminiKeyInput.placeholder = 'AIza...';
  }
}

function openSettings() {
  refreshKeyStatus();
  refreshToneChips();
  settings.classList.remove('hidden');
}
function closeSettings() {
  settings.classList.add('hidden');
  geminiKeyInput.value = '';
}

homeSettingsBtn.addEventListener('click', openSettings);
settingsClose.addEventListener('click', closeSettings);
settings.addEventListener('click', (e) => {
  if (e.target === settings) closeSettings();
});

geminiKeySave.addEventListener('click', () => {
  const v = geminiKeyInput.value.trim();
  if (!v) { toast('키를 입력해 주세요'); return; }
  if (!/^AIza[A-Za-z0-9_\-]{20,}$/.test(v)) {
    toast('키 형식이 올바르지 않은 것 같습니다');
    return;
  }
  setGeminiKey(v);
  refreshKeyStatus();
  toast('저장되었습니다');
});

geminiKeyClear.addEventListener('click', () => {
  if (!getGeminiKey()) return;
  if (!confirm('저장된 API 키를 삭제할까요?')) return;
  setGeminiKey('');
  refreshKeyStatus();
  toast('삭제되었습니다');
});

// ============================================================
//  스타일 검사 (Gemini Vision)
// ============================================================
const TONE_DIRECTIVES = {
  friendly: '쉬운 말과 격려 위주의 친절한 톤으로 평가해. 패션 용어는 최소한으로 쓰고, 칭찬으로 시작해.',
  balanced: '객관적이고 분석적인 톤으로, 친절하되 직설적으로 평가해.',
  expert:   '패션 전문가·스타일리스트 톤으로 평가해. 전문 용어(실루엣/톤 온 톤/레이어링/드레이프 등) 적극 사용. 유행 흐름도 언급.',
};

function getTone() {
  const v = (function(){ try { return localStorage.getItem(TONE_STORAGE); } catch(e) { return null; } })();
  return (v === 'friendly' || v === 'expert') ? v : 'balanced';
}
function setTone(v) {
  try { localStorage.setItem(TONE_STORAGE, v); } catch(e) {}
}

function buildStyleCheckPrompt(tone, context) {
  const toneLine = TONE_DIRECTIVES[tone] || TONE_DIRECTIVES.balanced;
  const ctxLine = context && context.trim()
    ? '이 사진의 착장 상황·맥락: "' + context.trim() + '". 이 맥락에 맞춰 평가해.'
    : '상황 맥락은 주어지지 않음. 일반적 데일리 기준으로 평가.';

  return [
    '당신은 한국어로 답하는 패션 코디 어시스턴트입니다.',
    toneLine,
    ctxLine,
    '사진 속 사람의 스타일을 분석해 아래 JSON 스키마로만 응답하세요. 다른 텍스트·마크다운·코드펜스 금지.',
    '',
    '[필드 가이드]',
    '- score: 1~10. 10=훌륭, 7~8=좋음, 5~6=무난, 3~4=아쉬움, 1~2=재구성 필요.',
    '- colorBalance / silhouetteBalance: "상"=조화롭고 포인트 명확, "중"=무난, "하"=부조화·어색.',
    '- comment: 40자 이내 종합 한 줄 평. 구체적·관찰 기반.',
    '- suggestion: 40자 이내 개선 제안 1가지. "모든 게 완벽"이면 빈 문자열.',
    '- tags: 사진에 **보이는 아이템을 간단히 묘사**. brandGuess와 역할이 다름 — tags는 아이템 자체 외형 묘사(색·재질·핏), brandGuess는 브랜드 추정. 사진에 실제로 보이는 카테고리는 반드시 채울 것. 해당 항목이 사진에 없을 때만(예: 아우터 없이 반팔) 빈 문자열.',
    '',
    '[예시 응답 — 이 형식과 채워진 정도를 반드시 따를 것]',
    '{',
    '  "score": 7,',
    '  "colorBalance": "상",',
    '  "silhouetteBalance": "중",',
    '  "comment": "무채색 톤의 클래식한 캐주얼 조합",',
    '  "suggestion": "신발·액세서리에 포인트 컬러 추천",',
    '  "contextFit": "",',
    '  "tags": {',
    '    "top": "흰색 옥스퍼드 셔츠",',
    '    "bottom": "진청 데님 팬츠",',
    '    "shoes": "흰색 레더 스니커즈",',
    '    "outer": "",',
    '    "accessory": "블랙 가죽 시계"',
    '  },',
    '  "brandGuess": [',
    '    { "item": "상의", "brand": "COS", "tier": "컨템포러리", "confidence": "medium" },',
    '    { "item": "하의", "brand": "", "tier": "기타", "confidence": "low" },',
    '    { "item": "신발", "brand": "Nike", "tier": "스트리트", "confidence": "high" },',
    '    { "item": "액세서리", "brand": "", "tier": "기타", "confidence": "low" }',
    '  ]',
    '}',
    '',
    '위 예시처럼 tags는 보이는 아이템마다 반드시 묘사를 담고, brandGuess는 보이는 아이템마다 하나의 객체를 배열에 포함해야 한다.',
    '- brandGuess: 아이템별 추정 브랜드 배열. 로고 명확 → confidence="high", 디자인·디테일·소재로 추정 → "medium", 전혀 모르겠음 → brand="" (빈 문자열) 그리고 confidence="low". 억지 추정 금지.',
    '- brandGuess[].tier: 다음 중 정확히 하나 — "하이엔드" / "컨템포러리" / "도메스틱" / "SPA" / "스트리트" / "기타". 모르면 "기타".',
    '- brandGuess[].item: 다음 중 정확히 하나 — "상의" / "하의" / "신발" / "아우터" / "액세서리". 해당 없으면 아예 배열에서 빼세요.',
    '- brandGuess[].confidence: 다음 중 정확히 하나 — "high" / "medium" / "low" (영문 소문자).',
    '- contextFit: 맥락이 주어졌을 때 그 상황에 얼마나 어울리는지 한 줄 (30자 이내). 맥락 없으면 빈 문자열.',
    '',
    '브랜드 언급 시 완곡하게("~로 보입니다", "~스러운"). 확신 없으면 brand는 빈 문자열로 두세요.',
  ].join('\n');
}

function bufferToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

async function blobToBase64(blob) {
  // iOS Safari는 IndexedDB에서 가져온 Blob의 backing store가 분리되면
  // FileReader.readAsDataURL에서 "The object can not be found here"를 던짐.
  // 3단 fallback으로 안정성 확보.
  // 1) blob.arrayBuffer() — 가장 빠르지만 분리된 blob엔 실패
  try {
    const buf = await blob.arrayBuffer();
    return bufferToBase64(buf);
  } catch (e1) {
    console.warn('[MyStyle] arrayBuffer 실패, objectURL fetch로 폴백:', e1 && e1.message);
  }
  // 2) URL.createObjectURL + fetch — Safari에서 IndexedDB blob에 대해 더 안정적
  let url = null;
  try {
    url = URL.createObjectURL(blob);
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    return bufferToBase64(buf);
  } catch (e2) {
    console.warn('[MyStyle] objectURL fetch 실패, FileReader로 폴백:', e2 && e2.message);
  } finally {
    if (url) { try { URL.revokeObjectURL(url); } catch (_) {} }
  }
  // 3) FileReader — 최후 수단
  return await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => {
      const s = r.result;
      const comma = s.indexOf(',');
      resolve(comma >= 0 ? s.slice(comma + 1) : s);
    };
    r.onerror = () => reject(r.error || new Error('blob 접근 실패'));
    r.readAsDataURL(blob);
  });
}

// 503(overload)·일부 5xx는 자동 재시도. exponential backoff로 사용자가 수동으로
// 여러 번 누르던 동작을 앱이 대신 수행. 429(쿼터)는 여기서 재시도 안 함(기다려야 함).
async function callGeminiVisionWithRetry(apiKey, blob, context, tone, onRetry) {
  const DELAYS = [700, 1500, 2500]; // ms, 최대 3회 재시도
  let lastErr;
  for (let attempt = 0; attempt <= DELAYS.length; attempt++) {
    try {
      return await callGeminiVision(apiKey, blob, context, tone);
    } catch (err) {
      lastErr = err;
      const msg = (err && err.message) ? err.message : '';
      const isRetryable =
        msg.indexOf('503') >= 0 ||
        msg.indexOf('502') >= 0 ||
        msg.indexOf('overload') >= 0 ||
        msg.indexOf('UNAVAILABLE') >= 0;
      if (!isRetryable) throw err;
      if (attempt === DELAYS.length) throw err;
      if (typeof onRetry === 'function') onRetry(attempt + 1, DELAYS.length);
      await new Promise(r => setTimeout(r, DELAYS[attempt]));
    }
  }
  throw lastErr;
}

async function callGeminiVision(apiKey, blob, context, tone) {
  const b64 = await blobToBase64(blob);
  // Gemini는 구식 OpenAPI 서브셋만 안정적으로 지원. 한국어 enum과 부분 required 조합에서
  // "The object can not be found here" 에러가 나는 케이스가 있어 스키마를 단순화하고
  // 값 제약은 프롬프트 + 파싱 단계 정규화로 유도한다.
  const responseSchema = {
    type: 'object',
    properties: {
      score:             { type: 'integer' },
      colorBalance:      { type: 'string' },
      silhouetteBalance: { type: 'string' },
      comment:           { type: 'string' },
      suggestion:        { type: 'string' },
      contextFit:        { type: 'string' },
      tags: {
        type: 'object',
        properties: {
          top:       { type: 'string' },
          bottom:    { type: 'string' },
          shoes:     { type: 'string' },
          outer:     { type: 'string' },
          accessory: { type: 'string' },
        },
        required: ['top', 'bottom', 'shoes', 'outer', 'accessory'],
      },
      brandGuess: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            item:       { type: 'string' },
            brand:      { type: 'string' },
            tier:       { type: 'string' },
            confidence: { type: 'string' },
          },
          required: ['item', 'brand', 'tier', 'confidence'],
        },
      },
    },
    required: ['score', 'colorBalance', 'silhouetteBalance', 'comment', 'suggestion', 'contextFit', 'tags', 'brandGuess'],
  };
  const prompt = buildStyleCheckPrompt(tone || 'balanced', context || '');
  const body = {
    contents: [{
      parts: [
        { text: prompt },
        { inline_data: { mime_type: blob.type || 'image/jpeg', data: b64 } },
      ],
    }],
    generationConfig: {
      response_mime_type: 'application/json',
      response_schema: responseSchema,
      temperature: 0.5,
      maxOutputTokens: 1400,
    },
  };
  const res = await fetch(GEMINI_ENDPOINT + '?key=' + encodeURIComponent(apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    // 가능하면 JSON에서 message만 뽑아 간결하게
    let msg = errText;
    try {
      const j = JSON.parse(errText);
      if (j && j.error && j.error.message) msg = j.error.message;
    } catch (_) {}
    console.error('[MyStyle] Gemini API 에러 전문:', errText);
    throw new Error('API ' + res.status + ': ' + String(msg).slice(0, 240));
  }
  const data = await res.json();
  const text = data && data.candidates && data.candidates[0]
    && data.candidates[0].content && data.candidates[0].content.parts
    && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;
  if (!text) throw new Error('응답이 비어있습니다');
  return parseStyleCheckJson(text);
}

function parseStyleCheckJson(text) {
  let s = text.trim();
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start >= 0 && end > start) s = s.slice(start, end + 1);
  let obj;
  try {
    obj = JSON.parse(s);
  } catch (e) {
    console.error('[MyStyle] JSON 파싱 실패. 원문:', text.slice(0, 500));
    throw new Error('응답 파싱 실패 — ' + (e.message || ''));
  }
  const score = Math.max(1, Math.min(10, parseInt(obj.score, 10) || 0));
  const pickBal = (v) => (v === '상' || v === '중' || v === '하') ? v : '중';
  const VALID_TIER = ['하이엔드','컨템포러리','도메스틱','SPA','스트리트','기타'];
  const VALID_ITEM = ['상의','하의','신발','아우터','액세서리'];
  const VALID_CONF = ['high','medium','low'];
  const tags = (obj.tags && typeof obj.tags === 'object') ? obj.tags : {};
  const rawBrands = Array.isArray(obj.brandGuess) ? obj.brandGuess : [];
  const brandGuess = rawBrands
    .map(b => ({
      item:       VALID_ITEM.includes(b.item) ? b.item : null,
      brand:      (typeof b.brand === 'string' && b.brand.trim()) ? b.brand.trim().slice(0, 40) : null,
      tier:       VALID_TIER.includes(b.tier) ? b.tier : '기타',
      confidence: VALID_CONF.includes(b.confidence) ? b.confidence : 'low',
    }))
    .filter(b => b.item !== null);

  return {
    score,
    colorBalance:      pickBal(obj.colorBalance),
    silhouetteBalance: pickBal(obj.silhouetteBalance),
    comment:           String(obj.comment || '').slice(0, 120),
    suggestion:        String(obj.suggestion || '').slice(0, 120),
    contextFit:        String(obj.contextFit || '').slice(0, 80),
    tags: {
      top:       String(tags.top || ''),
      bottom:    String(tags.bottom || ''),
      shoes:     String(tags.shoes || ''),
      outer:     String(tags.outer || ''),
      accessory: String(tags.accessory || ''),
    },
    brandGuess,
    analyzedAt: Date.now(),
  };
}

// ✨ 버튼 → 맥락 입력 시트 먼저 오픈 (context는 시트에서 받음)
function beginStyleCheck() {
  if (styleCheckInFlight) return;
  if (!currentViewingPhoto) return;
  if (currentViewingPhoto.facing !== 'environment') {
    toast('OOTD 사진만 분석할 수 있어요');
    return;
  }
  const key = getGeminiKey();
  if (!key) {
    toast('먼저 설정에서 API 키를 등록해주세요');
    setTimeout(() => openSettings(), 600);
    return;
  }
  openContextSheet();
}

// 시트에서 "분석 시작" 누르면 실제 API 호출
async function runStyleCheck(contextStr) {
  if (styleCheckInFlight) return;
  if (!currentViewingPhoto) return;
  const key = getGeminiKey();
  if (!key) return;

  styleCheckInFlight = true;
  renderStyleCheckCard({ loading: true });

  try {
    // iOS Safari는 오래된 blob 참조가 분리(detach)되면 접근 불가. 매 분석마다
    // IndexedDB에서 최신 blob을 다시 읽어와 안전하게 사용.
    const fresh = await getPhoto(currentViewingPhoto.id);
    if (!fresh || !fresh.blob) throw new Error('사진을 다시 불러올 수 없습니다');
    const tone = getTone();
    const result = await callGeminiVisionWithRetry(
      key, fresh.blob, contextStr, tone,
      (n, total) => renderStyleCheckCard({ loading: true, retry: { n, total } })
    );

    // AI 태그: 비어 있는 필드에만 반영 (사용자 수동 입력 우선)
    const existing = currentViewingPhoto.tags || {};
    const merged = {};
    for (const k of CATEGORY_KEYS) {
      const userVal = (existing[k] || '').trim();
      merged[k] = userVal || (result.tags[k] || '').trim();
    }
    currentViewingPhoto.tags = merged;
    currentViewingPhoto.styleCheck = {
      score: result.score,
      colorBalance: result.colorBalance,
      silhouetteBalance: result.silhouetteBalance,
      comment: result.comment,
      suggestion: result.suggestion,
      contextFit: result.contextFit,
      context: contextStr || '',
      tone,
      brandGuess: result.brandGuess,
      analyzedAt: result.analyzedAt,
    };

    queueUpdate(currentViewingPhoto);
    renderStyleCheckCard();
    renderTags();
    toast('분석 완료');
  } catch (err) {
    console.error('[MyStyle] 스타일 검사 실패:', err);
    const msg = (err && err.message) ? err.message : '알 수 없는 오류';
    // 429(쿼터) / 503(혼잡) 안내 메시지 분기
    if (msg.indexOf('429') === 0 || msg.indexOf(' 429') >= 0) {
      // 서버 원문에서 유형 추정
      const isDaily    = /(day|daily|per day|RequestsPerDay|PerDay)/i.test(msg);
      const isMinute   = /(minute|per minute|RPM|PerMinute)/i.test(msg);
      const isBilling  = /(plan and billing|check your plan|billing details|exceeded your current quota)/i.test(msg);
      let hint;
      if (isBilling) {
        hint = '무료 한도 소진. 새 API 키 발급(AI Studio 새 프로젝트) 또는 결제 활성화 필요. 내일 리셋될 수도 있음';
      } else if (isDaily) {
        hint = '일일 한도 초과. 내일 리셋 되거나 새 API 키로 교체 필요';
      } else if (isMinute) {
        hint = '분당 한도 초과. 1분 후 다시 시도';
      } else {
        const detailMatch = msg.match(/429\s*[:：-]\s*(.+)/);
        const detail = detailMatch ? detailMatch[1].slice(0, 100) : '';
        hint = '쿼터 초과' + (detail ? ' — ' + detail : '. AI Studio에서 사용량 확인');
      }
      toast(hint, 7500);
    } else if (msg.indexOf('503') >= 0 || msg.indexOf('overload') >= 0) {
      toast('모델 혼잡. 잠시 후 다시 시도해 주세요', 4500);
    } else if (msg.indexOf('파싱') >= 0) {
      toast('응답이 깨져 재시도가 필요해요', 4500);
    } else {
      toast('분석 실패: ' + msg.slice(0, 140), 5000);
    }
    renderStyleCheckCard();
  } finally {
    styleCheckInFlight = false;
  }
}

function renderStyleCheckCard(opts) {
  const loading = !!(opts && opts.loading);
  if (!currentViewingPhoto || currentViewingPhoto.facing !== 'environment') {
    styleCheckCard.classList.add('hidden');
    styleCheckCard.innerHTML = '';
    return;
  }
  const sc = currentViewingPhoto.styleCheck;
  if (!sc && !loading) {
    styleCheckCard.classList.add('hidden');
    styleCheckCard.innerHTML = '';
    return;
  }

  styleCheckCard.classList.remove('hidden');
  styleCheckCard.classList.toggle('loading', loading);

  if (loading) {
    const retry = opts && opts.retry;
    const retryText = retry
      ? '모델 혼잡으로 재시도 중 (' + retry.n + '/' + retry.total + ')'
      : '스타일 분석 중...';
    styleCheckCard.innerHTML =
      '<div class="styleCheckLoading"><div class="spinner"></div><span></span></div>';
    styleCheckCard.querySelector('.styleCheckLoading span').textContent = retryText;
    return;
  }

  const dateStr = sc.analyzedAt ? formatDate(sc.analyzedAt) : '';
  const brands = Array.isArray(sc.brandGuess) ? sc.brandGuess : [];

  let brandSectionHtml = '';
  if (brands.length > 0) {
    const tierCount = {};
    const brandItems = brands.map(b => {
      const confClass = 'c-' + (b.confidence || 'low');
      const confLabel =
        b.confidence === 'high'   ? '확실' :
        b.confidence === 'medium' ? '추정' : '모름';
      tierCount[b.tier] = (tierCount[b.tier] || 0) + 1;
      const valueText = b.brand ? b.brand : '—';
      return (
        '<div class="styleCheckBrandItem">' +
          '<span class="bLabel">' + b.item + '</span>' +
          '<span class="bValue"></span>' +
          '<span class="bTier">' + b.tier + '</span>' +
          '<span class="bConfidence ' + confClass + '">' + confLabel + '</span>' +
        '</div>'
      );
    }).join('');
    const balanceText = Object.keys(tierCount).map(k => k + ' ' + tierCount[k]).join(' + ');
    brandSectionHtml =
      '<div class="styleCheckBrands">' +
        '<div class="styleCheckBrandsTitle">추정 브랜드</div>' +
        brandItems +
        (balanceText ? '<div class="styleCheckBalance2">밸런스: ' + balanceText + '</div>' : '') +
      '</div>';
  }

  styleCheckCard.innerHTML =
    '<div class="styleCheckHeader">' +
      '<div class="styleCheckScore">' + sc.score + '<span class="max">/10</span></div>' +
      '<div class="styleCheckBalance">' +
        '<span>색상 <b>' + sc.colorBalance + '</b></span>' +
        '<span>실루엣 <b>' + sc.silhouetteBalance + '</b></span>' +
      '</div>' +
    '</div>' +
    (sc.context ? '<div class="styleCheckContext"></div>' : '') +
    '<div class="styleCheckBody">' +
      '<div class="styleCheckComment"></div>' +
      (sc.suggestion ? '<div class="styleCheckSuggestion"></div>' : '') +
      (sc.contextFit ? '<div class="styleCheckSuggestion" data-role="fit"></div>' : '') +
    '</div>' +
    brandSectionHtml +
    '<div class="styleCheckFooter">' +
      '<span>' + dateStr + '</span>' +
      '<button class="styleCheckRerun">다시 검사</button>' +
    '</div>';

  // 텍스트는 innerHTML 대신 textContent로 주입 (XSS 안전)
  if (sc.context) {
    styleCheckCard.querySelector('.styleCheckContext').textContent = '맥락: ' + sc.context;
  }
  styleCheckCard.querySelector('.styleCheckComment').textContent = sc.comment;
  if (sc.suggestion) {
    styleCheckCard.querySelector('.styleCheckSuggestion').textContent = sc.suggestion;
  }
  if (sc.contextFit) {
    const fitEl = styleCheckCard.querySelector('[data-role="fit"]');
    if (fitEl) fitEl.textContent = sc.contextFit;
  }
  // brandGuess 값 주입
  if (brands.length > 0) {
    const valueNodes = styleCheckCard.querySelectorAll('.styleCheckBrandItem .bValue');
    brands.forEach((b, i) => {
      if (valueNodes[i]) valueNodes[i].textContent = b.brand ? b.brand : '—';
    });
  }
  styleCheckCard.querySelector('.styleCheckRerun').addEventListener('click', beginStyleCheck);
}

photoStyleCheckBtn.addEventListener('click', beginStyleCheck);

// ─── 맥락 입력 시트 ────────────────────────────
function openContextSheet() {
  // 이전 사진의 맥락 복구: 재검사일 때 편의
  const prev = currentViewingPhoto && currentViewingPhoto.styleCheck && currentViewingPhoto.styleCheck.context;
  selectedContextChip = '';
  contextFreeText = '';
  // 칩 active 초기화
  contextChipsEl.querySelectorAll('.contextChip').forEach(b => b.classList.remove('active'));
  contextFreeInput.value = prev || '';
  contextSheet.classList.remove('hidden');
}
function closeContextSheet() {
  contextSheet.classList.add('hidden');
}
contextSheetCancel.addEventListener('click', closeContextSheet);
contextSheet.addEventListener('click', (e) => {
  if (e.target === contextSheet) closeContextSheet();
});
contextChipsEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.contextChip');
  if (!btn) return;
  const val = btn.dataset.context;
  if (selectedContextChip === val) {
    selectedContextChip = '';
    btn.classList.remove('active');
  } else {
    selectedContextChip = val;
    contextChipsEl.querySelectorAll('.contextChip').forEach(b => b.classList.toggle('active', b === btn));
  }
});
contextSkip.addEventListener('click', () => {
  closeContextSheet();
  runStyleCheck('');
});
contextSubmit.addEventListener('click', () => {
  const free = contextFreeInput.value.trim();
  let ctx = selectedContextChip;
  if (free) ctx = ctx ? (ctx + ' — ' + free) : free;
  closeContextSheet();
  runStyleCheck(ctx);
});

// ─── 톤 선택 (설정) ────────────────────────────
function refreshToneChips() {
  const cur = getTone();
  toneChipsEl.querySelectorAll('.toneChip').forEach(b => {
    b.classList.toggle('active', b.dataset.tone === cur);
  });
}
toneChipsEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.toneChip');
  if (!btn) return;
  setTone(btn.dataset.tone);
  refreshToneChips();
});

// ============================================================
//  라이프사이클
// ============================================================
// 홈 진입은 카드 클릭으로만. PWA 첫 실행 시 홈이 바로 보임.

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && video.srcObject && video.paused) {
    video.play().catch(() => {});
  }
});

# 변경 이력 (Prompt-driven Changes)

사용자 프롬프트로 인해 소스코드/파일이 실제로 수정된 내역만 시간순으로 기록.
단순 질문(예: "Mac 없이 앱 만들 수 있어?", "줌 몇 배까지 돼?")은 기록하지 않음.

---

## 2026-04-08

### 1. 프로젝트 초기 구축 (SwiftUI)
**프롬프트**: "앞으로의 기록은 md파일을 만들어서 관리해줘 1. 앱을 만들거야 아이폰 앱 2. 우선은 배포안하고 나혼자 쓰는용으로 만들거야 3. 앱을 켰을때 셀카모드에서 좌우반전되는 앱을 만들거야 상대방이 보는 나의 모습처럼 보이게 ..."
**생성 파일**:
- `MirrorMe/MirrorMeApp.swift`, `ContentView.swift`, `CameraController.swift`, `CameraView.swift`, `Info.plist` 
- `PROJECT.md`
- 메모리: `project_mirrorme.md`, `user_dev_context.md`
**내용**: 네이티브 SwiftUI 앱 스캐폴딩. 전면 카메라 미러링 해제 로직.

### 2. PWA로 빌드 전략 전환
**프롬프트**: "A로 할게 방법 설명해줘"
**생성 파일**:
- `docs/index.html`, `docs/app.js`, `docs/manifest.json`
- `docs/icon.svg`, `docs/icon-192.png`, `docs/icon-512.png`
- `docs/make_icons.ps1`
- `PROJECT.md` (PWA 전환 내용 반영)
**내용**: Mac 없이 빌드 가능한 PWA로 v1 재구축. `getUserMedia` 전면 카메라, 풀스크린, 홈 화면 추가 메타태그.

---

## 2026-04-09

### 3. v1.5 — 돋보기 모드 + 후면 카메라 토글
**프롬프트**: "v1.5 돋보기 모드와 후면카메라토글 전환을 먼저 추가해보자 1.5에서 나머지 기능은 괜찮을거같아"
**수정 파일**: `docs/index.html`, `docs/app.js`, `PROJECT.md`
**내용**:
- 핀치 줌 1.0×~5.0× (CSS `transform: scale`)
- 더블탭으로 줌 리셋
- 전면/후면 카메라 토글 버튼 (하단)
- 줌 배율 표시 배지

### 4. GoatCounter 접속 통계 추가
**프롬프트**: "<script data-goatcounter=\"https://mirrorme.goatcounter.com/count\" async src=\"//gc.zgo.at/count.js\"></script>"
**수정 파일**: `docs/index.html`, `PROJECT.md`
**내용**: GoatCounter 스크립트 한 줄을 `</body>` 위에 삽입. 접속 통계 수집.

### 5. v2 — 무음 사진 촬영 + IndexedDB 저장 + 갤러리
**프롬프트**: "자 이제 v2를 할거야 사진촬영 및 저장을 할건데, 사진촬영시 카메라는 무음으로 해주고, 사진저장은 아이폰 앱내 앨범이 아닌 현재 웹앱에 저장되게 관리할거야 가능하니?"
**수정 파일**: `docs/index.html`, `docs/app.js`, `PROJECT.md`
**내용**:
- 셔터 버튼 (iOS 카메라 스타일)
- canvas 캡처 (시스템 셔터음 없음)
- 줌 상태 반영 캡처
- IndexedDB에 JPEG blob 저장 (`MirrorMePhotos` DB)
- 앱 내 갤러리 (3열 그리드, 최신순, 사진 개수)
- 사진 상세 뷰 (날짜/시간, 다운로드, 삭제)
- 갤러리 버튼에 최근 사진 썸네일

### 6. 촬영 플래시 효과 제거
**프롬프트**: "플래시 효과 빼줘"
**수정 파일**: `docs/index.html`, `docs/app.js`
**내용**: 촬영 시 흰색 번쩍 효과 관련 DOM/CSS/JS 제거.

### 7. 장기 비전 (MyStyle) 기록
**프롬프트**: "기록해줘, 참고로 사람들에게 배포할때는 내가 입었던 스타일에 대해 날짜별로 사진으로 저장 및 기록을 할 수 있고, 더 나아가 추후에는 ai가 분석해서 해당 스타일이 맞는 밸런스인지 판단해주는거까지 생각하고있어 ..."
**수정 파일**: `PROJECT.md`, 메모리 `project_mirrorme.md`
**내용**: 장기 비전(MyStyle 리네임, 탭 구조, AI 스타일 분석) 기록. 처음엔 "본인 전용"으로 정리.

### 8. 배포 정책 재정리 (멀티유저 + Admin)
**프롬프트**: "본인전용이란게 사용자가 다른사람꺼는 참조하지않고 내 스타일을 기록하고, ai가 스타일을보고 판단해주는걸 생각해서 말한건데 데이터 수집을해서 나중에 통계를 내려면 본인전용이라는 단어는 쓰지않을게"
**수정 파일**: `PROJECT.md`, 메모리 `project_mirrorme.md`
**내용**: "본인 전용" 표현 제거. 공개 배포 + 사용자 간 공유 X + 관리자만 admin 대시보드 열람 구조로 정리. Firebase 기반 백엔드 구상, 동의 고지 필수사항 명시.

### 9. v2.1 — 갤러리 탭 분류 (MyFace / MyStyle)
**프롬프트**: "다른 우선순위가 있어, 다시 mirrorme로 돌아가서 셀카모드로 찍으면 전신이 안나오니 스타일보다는 얼굴상태 확인용일거같아 ... 사진첩에서 셀카모드일때는 myface, 후면카메라일때는 mystyle 두개로 나눠서 관리하면 좋을거같아"
**수정 파일**: `docs/index.html`, `docs/app.js`, `PROJECT.md`
**내용**:
- 사진 저장 시 `facing` 메타데이터 추가 (`user`/`environment`)
- 갤러리 상단에 MyFace/MyStyle 탭 버튼
- 탭별 필터링 + 빈 상태 메시지
- facing 없는 옛 사진은 MyFace로 자동 분류

### 10. 변경 이력 파일 신설
**프롬프트**: "그리고 현재 클로드에 내가 명령해서 소스코드가 바뀌게 된 질문들을 따로 md파일을 만들어서 저장해줄수있니? 그냥 단순 질문말고 너가 수정파일 수정했을때만"
**생성 파일**: `CHANGES.md` (이 문서)
**내용**: 과거 모든 코드 수정 프롬프트 소급 정리 + 향후 자동 업데이트 규칙 메모리 등록.

### 25. v3.2.2 — 사진 핀치 줌 동작 안 하는 버그 수정
**프롬프트**: "사진 확대자체가 안되는데?"
**수정 파일**: `docs/app.js`
**내용**: `photoViewImgWrap`의 touchstart/touchmove/touchend를 `passive: true`로 등록하면 iOS Safari가 핀치 제스처를 기본(페이지 줌) 핸들러로 먼저 가로채서 우리 touchmove에 두 손가락 이벤트가 도달하지 못함. `user-scalable=no`로 페이지 줌이 막혀 있어도 제스처 자체가 소비되어 핀치가 동작하지 않던 상황. 세 핸들러 모두 `{ passive: false }`로 변경하고 touchmove에서 `e.preventDefault()` 호출하여 브라우저 기본 처리 차단. #video의 핀치 줌 처리와 동일한 패턴.

### 24. v3.2.1 — 카메라 깜빡임 재수정(overlay 페이드아웃 방식) + 사진 핀치 줌/팬
**프롬프트**: "다 잘되는데 홈 아이콘 삭제 후 등록시 카메라 화면 작아졌다 커지는 증상 다시 생겼어 / 그리고 사진 확대 축소기능도 넣어줘"
**수정 파일**: `docs/index.html`, `docs/app.js`
**내용**:
- **카메라 깜빡임 재수정**: 이전 v3.1의 video opacity fade-in 방식은 composite layer 이슈로 "작게→크게" 현상이 완전히 제거되지 않았음. 접근을 바꿔서 **video 자체는 항상 그대로 두고, 위에 덮인 `#overlay`(검정)를 페이드아웃**으로 벗기는 방식으로 전환:
  - `#video`에서 `opacity`, `.ready` 클래스 제거. transform scale만 유지(줌 용).
  - `#overlay`에 `transition: opacity 280ms ease` + `.fading` 클래스 추가.
  - `start()`에서 `overlay.classList.add('fading')` → 300ms 후 `hidden`. 결과적으로 사용자는 검정에서 카메라가 드러나는 전환만 봄 (video 자체는 위치·크기 변화 없음).
  - `startCamera()`의 ready 대기 로직은 `videoFirstFrameReady` 플래그 기반으로 유지하여 overlay 페이드아웃 시점에 첫 프레임이 이미 그려진 상태 보장.
- **사진 핀치 줌 + 팬 추가**:
  - 상태: `zoomScale (1~5)`, `zoomTX`, `zoomTY`. 현재 슬라이드(`photoSlideCurr`)에만 `translate + scale` transform 적용.
  - 제스처 모드: `'swipe' | 'vertical' | 'pan' | 'pinch' | null`. 두 손가락 닿으면 `pinch`, 한 손가락 + 줌 상태면 `pan`, 그 외는 기존 `swipe`/`vertical`.
  - 핀치 중심점 이동은 단순화(transform-origin center center). 확대 후 팬으로 이동하는 것으로 감상 가능.
  - 핀치 중 한 손가락만 떼면 자동으로 `pan` 모드로 전환. 두 손가락 다 떼면 `scale < 1`이면 1로 스냅 복귀.
  - 슬라이드 전환 시 줌 상태 자동 초기화(`renderCurrentSlide` 맨 앞).
  - `setSlideTransforms`는 줌 상태일 땐 현재 슬라이드 transform을 줌 transform으로 유지.

### 23. v3.2 — 사진 상세 풀화면 + 드래그 추적 슬라이드 + 세로 스와이프 닫기
**프롬프트**: "스와이프 중 애니메이션(슬라이드 전환)은 이번에 넣지 않았어요. iOS Photos처럼 사진이 슬쩍 밀리는 효과 넣어줘 >>이거 추가해주고, 그리고 앨범에서 사진크기 너무 작은데 아이폰 기본앨범처럼, 화면을 풀로 다 보여줄수있어? 아래 다운로드 및 삭제 나와있는건 하트 옆에 다운 아이콘과 휴지통 아이콘을 추가해서 나왔으면 좋겠네 / 이건 v3.2 기능 추가로 넣으면 될거같아 / Q1.B Q2.유지 Q3.A 추가고려사항:추가 / 진행해줘"
**수정 파일**: `docs/index.html`, `docs/app.js`
**내용**:
- **풀화면 레이아웃**: 사진 상세를 flex column → absolute layered로 재구성. `#photoViewImgWrap`가 화면 전체를 차지하고, `#photoViewTopBar`와 `#photoViewInfo`는 위/아래에 오버레이로 배치(그라디언트 배경). 사진이 풀화면으로 표시되어 아이폰 기본 앨범에 가까워짐.
- **상단 바 통합 + 아이콘화**: 하단 다운로드·삭제 바 제거. `[← 돌아가기] [날짜] [♥ 하트] [↓ 다운로드] [🗑 휴지통]` 을 모두 상단 바에 배치. 원형 `iconBtn`(backdrop-filter blur) + SVG 아이콘. 삭제 아이콘은 빨간색(`.danger`).
- **3-슬라이드 드래그 추적**: 이전/현재/다음 3개의 `.photoSlide` img를 absolute로 겹쳐 두고, 손가락 드래그에 따라 실시간으로 `transform: translateX` 적용. 드래그 종료 시 화면 너비의 22% 이상이면 해당 방향으로 260ms 슬라이드 전환 후 `renderCurrentSlide()`로 재배치. 경계(첫/마지막 사진)에선 35% 저항감. iOS Photos와 유사한 느낌.
- **세로 스와이프 닫기**: 사진을 아래로 쓸어내리면 photoView 전체가 손가락을 따라 translateY + opacity 감소. 100px 이상이면 닫기 애니메이션(220ms) 후 `closePhotoView`. 임계값 못 넘으면 원위치 복귀.
- **탭 토글**: 사진 영역을 가볍게 탭하면 상단 바와 하단 info 패널이 `hidden-soft`(opacity+slight translate)로 숨김/표시 토글. 사진 감상 시 풀 몰입, 편집 필요 시 한 탭으로 접근.
- **MyFace는 info 숨김**: `photoViewInfo`에 `hidden`(display:none) 부여. 셀카 모드는 메모/카테고리 불필요한 사양 반영.
- **드래그/탭 구분**: `touchstart`에서 시작 시각·좌표 기록, `touchmove`에서 방향 판정(`h`/`v`), `touchend`에서 움직임이 `DIRECTION_THRESHOLD(8px)` 미만이고 280ms 이내면 탭으로 간주해 `toggleBars()` 호출.

### 22. v3.1 — PWA 첫 실행 시 카메라 "작게→크게" 잔존 깜빡임 제거
**프롬프트**: "A는 해결 되었어 엑박 안뜨고, 하트 정상적으로 작동해 / 그런데 홈 화면 아이콘 삭제 후 재추가 하고 앱을 실행시, 카메라 화면이 잠깐 작게 나왔다가 크게 나타나는 현상은 그대로 있어, 앱을 한번 실행하고 껏다가 켰을떄는 크게 나오는데 아이콘 삭제 후 앱 첫 실행시에만 이 증상이 나타나는것으로 보여"
**수정 파일**: `docs/app.js`, `docs/index.html`
**내용**: 이전 fix(21번)에서 `loadeddata` → `ready` 클래스 부여가 fire-and-forget이라 `start()` 흐름이 overlay를 내린 시점에 video가 아직 ready가 아닐 수 있었음. 두 가지 추가 조치:
- **`startCamera()`가 첫 프레임 로드까지 `await`**: `readyState >= 2`이거나 `loadeddata` 이벤트가 올 때까지 기다림 (2초 타임아웃). 이후 `requestAnimationFrame` 두 번 돌려 실제 페인트 후에 `.ready` 클래스 부여. `start()` 흐름에서 `startCamera()`가 끝나야 `overlay.hidden`이 실행되므로, 비디오가 완전히 정상 크기로 렌더링된 후에야 사용자가 카메라를 보게 됨.
- **`#overlay` 배경 불투명**: 시작 화면 overlay의 배경을 `#000`으로 만들어 카메라 준비 중 video가 뒤에서 살짝 보이지 않게 함. PWA 첫 실행 시 PWA launch가 완료되고 시작 화면이 표시되는 짧은 구간 동안 video가 잠깐 보이던 문제 차단. `pointer-events: auto`로 변경(버튼 이외 영역의 터치도 통과하지 않음).

### 21. v3.1 — 하트 취소 race condition + 초기 비디오 fade-in
**프롬프트**: "엑박은 안뜨는데 하트 취소했을때 앨범리스트에서 하트에 불이 들어와있어, 그리고 처음 앱을 켰을떄 카메라 화면이 잠깐 작게 나왔다가 크게 나타나는 현상이 있어"
**수정 파일**: `docs/app.js`, `docs/index.html`
**내용**:
- **하트/메모/태그 race condition 수정**: 사진 상세에서 하트 토글 → ← 돌아가기 누를 때, `updatePhoto`(IndexedDB 쓰기)가 끝나기 전에 `closePhotoView → renderGallery`(DB 읽기)가 실행되어 옛 값을 가져오던 문제. `pendingUpdate` 프라미스 큐를 신설해 모든 쓰기를 직렬화하고, `closePhotoView`에서 `await pendingUpdate` 후 `renderGallery`를 호출하도록 수정. 하트·메모·태그 칩 추가/삭제 핸들러가 모두 `queueUpdate(photo)`를 거침.
- **초기 비디오 깜빡임 수정**: 첫 진입 시 `<video>` 요소가 프레임을 받기 전에 순간적으로 작게 렌더링됐다가 커지는 현상. 해결책:
  - CSS: `#video`에 `transform: scale(1)` 초기값을 명시(transition이 scale unset→1로 발동하는 것 방지), `opacity: 0` 초기값 + `.ready`일 때만 `opacity: 1`로 페이드인
  - JS: `startCamera()`에서 `video.readyState >= 2`이거나 `loadeddata` 이벤트가 발생한 후에만 `.ready` 클래스를 부여. 첫 프레임이 준비된 뒤에 부드럽게 표시.

### 20. v3.1 — 엑박 근본 수정(URL 캐시) + 사진 상세 좌우 스와이프
**프롬프트**: "A. 이젠 하트만 누르고 앨범으로 가면 엑박 떠, 전에는 하트를 취소하고 앨범리스트로 돌아가면 엑박떴는데 / B. 이제 정상작동해 / 그리고 하나추가적으로 앨범에서 왼쪽 오른쪽으로 슬라이드 넘길시, 앨범 넘어가게 해줘 뒤로가기했다가 사진선택하니까 불편하다"
**수정 파일**: `docs/app.js`
**내용**:
- **엑박 근본 수정 — blob URL 캐시**: 매번 `createObjectURL`로 새 URL을 생성하지 않고, `photoUrlCache`(Map, photo.id → URL)로 한 번만 만들어 썸네일·상세뷰·갤러리버튼에서 공유. iOS Safari가 같은 Blob에 대한 URL 중복 생성을 엄격히 관리하면서 일부가 무효화돼 엑박이 났던 문제 해결. 사진 삭제 시에만 `revokePhotoUrl(id)`로 해당 URL을 해제.
- **스와이프 네비게이션**: 사진 상세에서 좌우 스와이프로 이전/다음 사진 이동 (iOS Photos 스타일). `openPhotoView`가 현재 탭의 `photoViewList`(timestamp desc)를 준비하고 `photoViewIndex`로 위치 추적. `touchstart/touchend`로 가로 50px 이상의 제스처를 스와이프로 인정(세로 움직임보다 가로가 커야 함). 기존엔 ← 돌아가기 후 다른 사진을 다시 탭해야 해서 불편했음.
- **photoDelete 흐름 재조정**: 삭제 시 뷰를 닫지 않고 리스트에서 해당 사진만 제거한 뒤 인접 사진으로 자동 이동. 리스트가 비면 뷰 닫고 갤러리 재렌더링. 삭제된 사진의 URL은 `revokePhotoUrl()`로 해제.
- **지원 변경**: `updateGalleryBtnThumb`/`closePhotoView`도 캐시를 사용하도록 단순화. `revokeGalleryBtnThumbUrl` 제거.

### 19. v3.1 버그 수정 — 앨범 썸네일 엑박 + 촬영 프레임 crop 오차
**프롬프트**: "버그1. 하트를 취소하고 앨범으로 돌아갔을경우에 엑박이떠 / 버그2. 이건사진찍을때 프레임보다, 앨범에서 보는 프레임이 더 넓어서 느끼는거같은데 맞는지 확인해줘 ex) 나는 분명 눈까지 사진을 찍었는데, 앨범에서는 코까지 나와있어 >> 이런느낌이야 / 이대로 진행해줘"
**수정 파일**: `docs/app.js`
**내용**:
- **엑박 수정**: `renderGallery()`와 `closeGallery()`에서 썸네일 blob URL 일괄 `revokeObjectURL()` 제거. iOS Safari가 로딩 중인 blob URL을 revoke하면 해당 img를 엑박으로 처리하는 문제. `closePhotoView → renderGallery` 재호출 흐름에서 타이밍이 겹쳐 엑박이 발생했음. 메모리 누수는 썸네일 개수가 유한하고 페이지 리로드 시 해제되므로 실사용상 문제 없음. 사진 삭제 시의 개별 revoke는 유지.
- **촬영 crop 수정**: `capturePhoto()`에서 `window.innerWidth/innerHeight` 대신 `video.getBoundingClientRect()`를 사용해 실제 video 요소의 화면 크기를 기준으로 cover crop 계산. iOS Safari PWA 풀스크린에서 `window.innerHeight`가 safe area 때문에 실제 video 표시 영역과 어긋날 수 있어 crop 비율이 틀어지고, 저장된 사진이 화면에 보였던 영역보다 넓게 저장되던 문제 해결.

### 18. v3.1 — MyFace 단순화 + 사진 상세 변경의 갤러리 즉시 반영
**프롬프트**: "1. 빼기 / 2. 옵션D 지금말고 v3.5에서 (지금하지말것!) / 3 그대로 유지 / 4. 아냐 이건 하트가 보이는데 내가 하트가 안나왔다고 판단한건 세부항목에서 하트를 누르고 돌아가기를 눌러 리스트를 볼때 바로 반영이 안되더라고 카메라쪽 돌아가기를 한번 다녀왔다가 다시 앨범으로 가야 반영이 되는데 이 문제를 해결하는걸로 하자 / 이대로 go"
**수정 파일**: `docs/app.js`
**내용**:
- **MyFace 단순화**: `openPhotoView()`에서 사진의 `facing === 'user'`이면 메모 입력란·카테고리 칩 영역·"+ 카테고리 추가" 버튼을 hidden 처리. OOTD(후면)일 때만 표시. 셀카는 얼굴/머리 기록만의 단순한 화면이 됨.
- **하트(및 변경사항) 즉시 반영 버그 수정**: `closePhotoView()`에서 갤러리가 떠 있는 상태면 `renderGallery()`를 호출. 사진 상세에서 하트 토글 → 돌아가기 누르면 갤러리 썸네일이 즉시 갱신됨. 이전엔 갤러리 닫고 카메라 갔다가 다시 와야 반영됐던 동기화 누락 해결.
- OOTD 카테고리 자체의 폐지·AI 자동화는 v3.5에서 처리 예정 (이번 v3.1에선 카테고리 영역 그대로 유지).

### 17. 차별화 포인트·스타일 검사 비전 메모리 기록
**프롬프트**: "어차피 ootd앱은 많아서 나는 차별화를 두려고해 ... 무신사나 스타일쉐어, 에이클로젯 등 대형플랫폼이지만 난 1인업체여서 개인의 ootd를 어디 올리지 않고 본인만 날짜별로 사진찍어서 관리하는걸 목표로 하고있거든, 지금 궁금한게 혹시 스타일검사라는 항목을 만들어서 옷의 밸런싱이나 색상조합 이런걸 분석하여 추천 비추천 혹은 상의변경 하의변경을 알려줄만한 기능을 구현해낼수있으려나?"
**수정 파일**:
- `.claude-memory/project_mirrorme.md` (차별화 포인트 섹션 추가)
- 메모리 원본 `project_mirrorme.md`도 동일 갱신
**내용**: MirrorMe의 차별화 포인트를 메모리에 기록 — 대형 OOTD 플랫폼(무신사/스타일쉐어/에이클로젯)이 SNS형 공유 구조인 반면, MirrorMe는 비공개 개인 기록 도구. 향후 핵심 기능으로 AI 스타일 검사(밸런스·색상 조합 평가, 추천/비추천, 변경 제안) 추가 예정. 코드는 회의 모드라 미작성.

### 16. v3.0 버그 수정 #2 — 갤러리 닫고 카메라 복귀 시 멈춤 + 썸네일 한 번 더 동기화
**프롬프트**: "갤러리에서 사진을 지우고 다시 카메라로 돌아오면 카메라 화면이 멈춰있어 또한 좌측하단의 삭제한 파일도 그대로 보이고"
**수정 파일**: `docs/app.js`
**내용**:
- **카메라 멈춤 수정**: `closeGallery()`에서 `video.srcObject && video.paused`면 `video.play()` 호출. 갤러리가 떠 있는 동안 iOS Safari가 가려진 video를 자동 일시정지하는 동작을 우회.
- **썸네일 동기화 보강**: `closeGallery()`에서 `updateGalleryBtnThumb()`를 한 번 더 호출. 갤러리 안에서 사진 삭제가 일어났을 때 카메라 화면 복귀 시점에 무조건 최신 상태로 갱신되도록.

### 15. v3.0 버그 수정 — 갤러리 클릭 막힘 + 사진 0장일 때 옛 썸네일 잔존
**프롬프트**: "문제점 발견사항 / 1. 처음 사진을 아무것도 안찍고 OOTD탭에서 Myface 탭 클릭이 안먹음 돌아가기 버튼도 클릭안됨 사진을 찍고나면 정상작동 / 2. 셀카모드로 사진을 찍고 보관함에서 사진 삭제 후, 다시 카메라 화면으로 돌아가면 기존에 삭제했던 사진이 남아있음, 좌측하단의 미리보기에도 그대로 남아있음, 화면을 후면으로 전환해주면 사라짐"
**수정 파일**: `docs/app.js`
**내용**:
- **버그 1 수정**: 갤러리 열릴 때 하단 카메라 컨트롤(`#controls`)과 안내 문구(`#captureHint`)를 hidden 처리. 닫을 때 복원. 카메라 컨트롤의 `backdrop-filter`가 만든 stacking context가 갤러리 위로 떠서 처음 진입 시 탭/돌아가기 버튼 클릭을 가로채는 문제 해결. 어차피 갤러리 화면에선 카메라 컨트롤이 보일 필요도 없음.
- **버그 2 수정**: `updateGalleryBtnThumb()`가 마지막 사진이 없을 때 아무것도 안 하던 문제 해결. 사진이 0장이면 기본 격자 아이콘(`GALLERY_BTN_DEFAULT_HTML`)으로 복원. 이전 blob URL도 `revokeGalleryBtnThumbUrl()`로 메모리 해제.

### 14. 작업 폴더 위치 갱신 — `C:\GitHub\mirrorme\`
**프롬프트**: "길 2로 했고 clone경로는 C:\GitHub\mirrorme 여기야 인지하고있어"
**수정 파일**:
- `CLAUDE.md` (환경 섹션에 새 작업 폴더 명시)
- `.claude-memory/project_mirrorme.md` (백업 사본)
- `.claude-memory/feedback_mirrorme_changelog.md` (백업 사본)
- 메모리 원본: `project_mirrorme.md`, `feedback_mirrorme_changelog.md`
**내용**: GitHub Desktop으로 저장소를 `C:\GitHub\mirrorme\`에 클론. 앞으로 모든 작업·git push가 이곳에서 이뤄짐. 옛 폴더 `C:\Users\koo\Desktop\MirrorMe\`는 백업/참조용. 메모리·CLAUDE.md·백업 사본 모두 새 경로로 갱신.

### 13. v3.0 — OOTD 기능 본격 도입
**프롬프트**: "Q1.그대로진행 / Q2. A / Q3. 동의 / Q4. B / Q5. 만족도별 1~5는 빼자 별로 필요없을거같아, 아이폰처럼 사진목록에서 하트로 관리하는것처럼 눈에띄게만 해주면 될거같아 / Q6. 사진찍은게 없고 주변에 공유도 안했기 때문에 그대로 처리하면 될거같아 / 그리고 전체적인 디자인은 너가 판단해서 깔끔하고 UI편하게 해주고, 앱 IMG도 현재사용하는게 아닌 OOTD관련 앱IMG처럼 바꿔줘 / 진행해줘"
**수정/생성 파일**:
- `docs/index.html` (대규모 — 탭 순서, 사진 상세 UI 확장, 토스트, 카테고리 메뉴, 안내 문구, TensorFlow.js CDN, 디자인 전반 정리)
- `docs/app.js` (대규모 — COCO-SSD 사람 감지, 갤러리 날짜 그룹화, 메모/태그/하트 자동 저장 로직, normalizePhoto 마이그레이션 헬퍼)
- `docs/icon.svg`, `docs/icon-192.png`, `docs/icon-512.png`, `docs/make_icons.ps1` (옷걸이 아이콘으로 재디자인)
- `PROJECT.md` (v3.0 섹션 추가, 로드맵 갱신)
**내용**: 
- OOTD 기능 본격 도입. 후면 카메라 촬영 시 COCO-SSD로 사람 감지 → 본인이 없는 사진은 저장 거부.
- 갤러리 탭: `MyFace / MyStyle` → `OOTD / MyFace` (순서 변경 + OOTD가 기본).
- 갤러리를 평평한 그리드 → 날짜·요일별 그룹 (오늘/어제 라벨 포함).
- 사진 상세에 메모(80자, blur 시 자동 저장), 카테고리 칩(상의/하의/신발/아우터/액세서리, "+ 카테고리 추가" 메뉴 방식), 하트 즐겨찾기 추가. 갤러리 썸네일에 하트 오버레이.
- 만족도 별점은 사용자 의견에 따라 제외, 하트 즐겨찾기로 대체.
- 토스트 알림 시스템 신설.
- 앱 아이콘을 카메라 → 옷걸이로 재디자인.
- 데이터 모델 확장: photos 레코드에 memo, tags, favorite 필드 추가. 옛 사진은 normalizePhoto()로 즉석 보정.

### 12. `web/` → `docs/` 폴더 이름 변경 (GitHub Pages 호환)
**프롬프트**: "web은 폴더명이라서 수정이 안돼 파일명처럼 바꿀수가 없어, 그냥 처음부터 해야할거같은데 그럼"
**수정 파일**:
- `docs/` (← 기존 `web/` 폴더 이름 변경)
- `PROJECT.md`, `README.md`, `CLAUDE.md`, `CHANGES.md` 내 모든 `web/` 참조를 `docs/`로 일괄 치환
**내용**: GitHub Pages는 폴더 소스로 `/(root)`와 `/docs`만 지원한다는 사실을 뒤늦게 확인. 임의 폴더(`web`)는 못 쓰므로 공식 지원 폴더명인 `docs`로 변경. 로컬 폴더 이름과 모든 문서 내 참조를 함께 갱신.

### 11. 다른 PC 이전 대비 — 프로젝트 문서·메모리 백업 구조 구축
**프롬프트**: "전부 다 진행해줘 1번하는법은 알려주고"
**생성 파일**:
- `CLAUDE.md` (Claude Code 프로젝트 컨텍스트 파일)
- `README.md` (저장소 첫 페이지)
- `.claude-memory/project_mirrorme.md` (메모리 백업)
- `.claude-memory/user_dev_context.md` (메모리 백업)
- `.claude-memory/feedback_mirrorme_changelog.md` (메모리 백업)
- `.claude-memory/README.md` (메모리 복원 절차 안내)
**내용**: PC 교체 시 GitHub clone 한 번으로 프로젝트를 그대로 이어갈 수 있도록 모든 작업 자료를 저장소 포함 구조로 정리. CLAUDE.md는 Claude Code가 자동 로드하는 프로젝트 컨텍스트, README.md는 GitHub 저장소 첫 페이지, .claude-memory/는 사용자 메모리 파일들의 버전 관리 사본.

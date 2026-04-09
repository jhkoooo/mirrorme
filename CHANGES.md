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

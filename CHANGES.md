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

### 53. v3.10.1 — 분석 성공률 개선 + 설정 시트 스크롤 + 배지 임시 숨김
**프롬프트**: "스타일분석하면 모델 혼잡으로 재시도 중 돌고나서 멈추는 현상이 너무 잦아 ... 기록배지가 메인의 설정화면에 들어있는게 맞아? 심지어 설정에서 터치 해서 내리는것도 안돼서 완료버튼이 최상단에 있어서 잘 터치도 안됨 / 전부 진행해줘"
**수정 파일**: `docs/index.html`, `docs/app.js`
**내용**: 
- **이미지 다운스케일 추가**: `downscaleImageBlob()` 함수로 분석 전송 이미지를 **768px 최대 변**으로 축소(JPEG 0.85). 원본은 IndexedDB에 그대로 저장, **Gemini 전송용**만 축소. 토큰 수백 개 절감 + 서버 처리 속도↑ → 503 발생 빈도 자체가 감소. 품질 영향은 패션 판단에 무의미한 수준.
- **재시도 3회→5회, backoff 완만화**: `DELAYS = [700, 1500, 2500]` → `[700, 1500, 3000, 5000, 8000]`. 503은 Google 정책상 무과금이라 공격적 재시도가 비용 부담 없음. 체감 성공률 크게 향상 예상.
- **마일스톤 배지 UI 설정에서 제거**: 배지는 "성취 기록"이라 "기술적 환경 설정"과 섞이면 어색. **트렌드 분석(예정)** 화면에서 깔끔하게 통합 등장시키기 위해 임시 숨김. `computeMilestones()` / `MILESTONE_DEFS` / `renderMilestoneBadges()` **로직은 유지** (안전 가드 `if (!milestoneBadgesEl) return;` 추가) — 트렌드 분석에서 재사용.
- **설정 시트 스크롤 가능화**: `#settings .sheet`에 `max-height: 85vh` + `overflow-y: auto` + `-webkit-overflow-scrolling: touch`. 내용이 길어도 시트 안에서 터치 스크롤 가능. 완료 버튼은 상단 유지하되 스크롤로 접근 가능.

### 52. v3.10 — 클박 벤치마킹 반영: 바이브 태그 · 카드 시각 업그레이드 · 마일스톤 배지 · 카피 다듬기
**프롬프트**: "Q1.태그도입 / Q2.결과카드 시각업그레이드(절제) / Q3.배지 같이 / Q4.스킵 / Q5.문구 재검토 / 이대로 진행"
**수정 파일**: `docs/index.html`, `docs/app.js`
**내용**: 클박(Clbak) 벤치마킹 분석 후 MyStyle 정체성(비공개·기록 중심) 유지하며 일부 감각적 요소만 절제된 형태로 수용.
- **"오늘의 바이브" 한 단어 태그 (Q1)**: Gemini 응답 스키마에 `vibe` 필드 추가 (예: "미니멀 클래식", "페미닌 로맨틱"). 프롬프트·few-shot 예시·`parseStyleCheckJson`·`photo.styleCheck` 저장까지 연결. 트렌드 분석의 씨앗 데이터로 활용 예정.
- **결과 카드 시각 업그레이드 (Q2)**: 카드 상단에 바이브 배지 큰 글씨(`.styleCheckVibe`) + 색상/실루엣 등급을 **컬러 점** 시각화(`.balDot` — 상=초록, 중=노랑, 하=빨강). 기존 정보 구조는 유지, 임팩트만 절제된 수준으로 강화. 핑크·애니메이션·카드 플립 같은 화려 요소는 도입 X.
- **마일스톤 배지 (Q3)**: 설정 시트에 "기록 배지" 섹션 신설. 5종 — 🌱 첫 OOTD / 📅 7일 연속 / 🔥 30일 연속 / 💯 100장 돌파 / 🎨 바이브 5종. `computeMilestones()` 가 매번 설정 열 때 IndexedDB에서 계산. 알림·공유·수집 없이 조용히 해금/잠금 표시. 기록 라이프로그 컨셉과 맞음.
- **카피 다듬기 (Q5)**: 홈 태그라인 `오늘의 나를 기록하세요` → `거울보다 정확한, 매일의 기록`. 거울 앱 출발점과 "객관적 AI 피드백"을 한 줄에 담음. MyStyle 정체성 재확인.
- **가상 착장 / 콘텐츠 제작 (Q4)**: 도입 안 함. MyStyle의 "실제 기록" 철학·비공개 정책과 충돌이라 의도적 배제.

### 51. v3.9 — 캘린더뷰 + 셔터 중앙 정렬
**프롬프트**: "이전 패치에서 진행했던 카메라 전환을 뺐더니 사진 찍는버튼이 가운데에 없고 앨범썸네일과 균형을 이뤄서 보기가 별로야. 캘린더와 방금내가 말한 카메라버튼 중앙을 처리해줘"
**수정 파일**: `docs/index.html`, `docs/app.js`
**내용**:
- **셔터 중앙 정렬 fix** — `#controls`를 `flex + justify-content: center` → `grid-template-columns: 1fr auto 1fr` 3-column 구조로. 좌측 1fr 영역에 갤러리 버튼(`justify-self: center`), 중앙 auto 칸에 셔터(화면 중앙 고정), 우측 1fr은 균형용 빈 공간. 카메라 전환 버튼이 없어져 비대칭 보이던 문제 해결.
- **캘린더뷰 (v3.9)** — 앨범 탭 상단에 `리스트 | 달력` 뷰 모드 토글 추가. 달력 모드는 월간 그리드:
  - 월 헤더(이전·다음 버튼, 사진 있는 범위 밖은 비활성화)
  - 요일 헤더 (일요일 빨강/토요일 파랑)
  - 7×5~6 그리드 (aspect-ratio 1:1 셀)
  - 각 날짜 셀에 **대표 썸네일 1장** (규칙: 하트 즐겨찾기 > styleCheck.score 최고 > 첫 촬영)
  - 오른쪽 상단 하트(그날 즐겨찾기 있음), 오른쪽 하단 `+N` 배지(여러 장)
  - 오늘 날짜는 흰 테두리 강조
  - 셀 탭 → 하단 모달 시트 `#calDaySheet` 올라옴 → 그날 사진 3열 그리드 → 각 사진 탭 시 상세뷰로
- 데이터 집계: `pickRepresentativePhoto`, `photosByDateKey` 헬퍼 추가.
- 탭 전환(OOTD/MyFace) 시 달력도 자동 재렌더. 캘린더 모드 초진입 시 가장 최근 사진의 달로 자동 포커싱.
- 진입점: 앨범 탭 상단 토글 (홈 카드 추가 X — 경로 단순화 유지).

### 50. v3.8 — 카메라 회전 버튼 제거 + 프리미엄 톤 태그 + 수익화 후보 문서화
**프롬프트**: "카메라모드에서 카메라를 회전하는 버튼이 필요한가 싶네, ... AI 피드백 톤을 친절, 균형, 전문가로 나눠놨는데 전문가는 ... 유료결제를 한사람한테만 사용가능하게 하는건 어때? 회의모드야 / 동의"
**수정 파일**: `docs/index.html`, `docs/app.js`, `PROJECT.md`
**내용**:
- **카메라 회전 버튼(`#flipBtn`) 완전 제거**: DOM·JS 참조·이벤트 핸들러 모두 삭제. 홈에서 모드 선택(OOTD=후면 / MyFace=전면)으로 카메라 방향이 고정되는 구조와 중복이었고, 실수로 토글 시 MoveNet 감지·모드 정체성과 어긋나던 문제 해결. 복귀 동선은 좌측 상단 ← 홈 버튼이 담당.
- **프리미엄 톤 태그 코드 추가**: `PREMIUM_TONES = new Set(['expert'])` + `isPremiumTone()` 헬퍼. 지금은 실제 락 없음(본인 자유 사용), Phase C에서 로그인·결제 도입 시 이 태그 기반으로 바로 락 걸 수 있도록 선제 구조.
- **PROJECT.md에 "프리미엄 후보 기능" 섹션 추가**: 무료/프리미엄 경계, 구독 모델 개요, 플랫폼 후보 기록. 앞으로 새 기능 개발 시 "무료/유료" 태그 염두에 두고 설계하기 위한 참조용.

### 49. v3.7.11 — userId 필드 추가 (배포·백엔드 마이그레이션 대비)
**프롬프트**: "근데 내 기억중에 하나는 너가 수익화를 위해서 지금 당장 해야하는게 필요하다고 말했던게 기억나는데 ID관련인가 맞아? / 진행해줘"
**수정 파일**: `docs/app.js`
**내용**: Phase A(개인 사용) 중에 **미래 Phase C(백엔드 구축) 대비 선제 준비 작업**. IndexedDB의 photo 레코드에 `userId` 필드를 추가해 "이 사진이 누구 것인가" 개념을 지금부터 심어둠.
- `CURRENT_USER_ID = 'local'` 상수 신설 (지금은 본인 단독 사용이라 하드코딩, 배포 시 로그인 도입하면 이 값만 실제 사용자 UID로 교체하면 됨)
- `savePhoto()`가 사진 저장 시 `userId: 'local'` 함께 기록
- `normalizePhoto()`가 옛 사진에서 `userId` 필드 없으면 `'local'`로 자동 채움 → 기존 모든 사진도 별도 마이그레이션 없이 자동 보정
- 미래 Firebase 등으로 이주 시 각 photo에 소유자 매핑이 이미 있어 구조 변경 최소화
- 회의 결론: 지금 5분 수정으로 나중의 대대적 리팩토링 회피

### 48. v3.7.10 — JSON 파싱 실패도 자동 재시도 대상에 포함
**프롬프트**: "처음에 응답이깨져 재시도가 필요해요 라는 오류발생해. 두번째 돌리니까 되긴한다"
**수정 파일**: `docs/app.js`
**내용**: `gemini-2.5-flash`가 간헐적으로 응답 JSON을 살짝 깨뜨리는 현상이 있어서 첫 호출이 실패하고 두 번째에 성공하는 패턴 발생. `callGeminiVisionWithRetry`의 `isRetryable` 조건에 `'응답 파싱 실패'` 키워드 추가해 파싱 실패 시에도 자동 재시도(기존 503과 동일한 backoff). 사용자는 한 번만 눌러도 됨.

### 47. v3.7.9 — Gemini 2.0 Flash 신규 차단 → 2.5-flash 전환
**프롬프트**: "분석실패 : API 404 : This model models/gemini-2.0-flash is no longer available to new users."
**수정 파일**: `docs/app.js`
**내용**: Google이 2026년 4월경 `gemini-2.0-flash`를 신규 사용자 대상으로 제공 중단. 기존 사용자는 당분간 사용 가능하지만 **신규 결제 계정으로는 404 에러**. `gemini-2.5-flash`로 교체. 결제 활성화 완료된 상태라 무료 티어 RPD 낮음(250) 제약은 실질적 영향 없음. Vision·tags·brandGuess 모두 정상 지원.

### 46. v3.7.8 — 피규어 오감지 차단 + 쿼터 billing 케이스 구체 안내
**프롬프트**: "쿼터초과 - you exceeded your current quota, please check your plan and billing details. / 첨부한 이미지는 대체 어떻게 찍히는거지? 사람이 아닌데 왜 인식해?"
**수정 파일**: `docs/app.js`
**내용**:
- **키포인트 bbox 크기 검증 추가**: 피규어·포스터·벽에 걸린 옷 등이 MoveNet에 사람으로 감지되는 케이스 차단. 어깨·엉덩이·다리 키포인트가 모두 있어도 그 전체 bbox가 이미지 **세로 50% 미만** 또는 **가로 12% 미만**이면 `'partial'`로 판정(저장 거부). 실제 거울 전신 OOTD는 키포인트가 이미지 상당 영역에 분포하므로 영향 없음.
- `classifyPose(keypoints, canvasW, canvasH)` 시그니처 변경 — 캔버스 크기를 받아 비율 계산
- 상수: `KP_BBOX_MIN_H_RATIO = 0.50`, `KP_BBOX_MIN_W_RATIO = 0.12`
- **429 billing 케이스 구체 안내**: 서버 원문의 `plan and billing`, `check your plan`, `exceeded your current quota` 키워드 감지 → "무료 한도 소진. 새 API 키 발급(AI Studio 새 프로젝트) 또는 결제 활성화 필요. 내일 리셋될 수도 있음" 명확한 안내. 사용자가 즉시 해결 방법 파악 가능.
- 토스트 지속시간 7000ms → 7500ms.

### 45. v3.7.7 — 연타 false positive 이중 검증 + 쿼터 원문 노출
**프롬프트**: "AI분석시 쿼터 초과. 잠시 후 다시 시도해주세요 라고 뜨고 진행이 안됨. / 카메라 모드에서 사진 연타로 누를시에 사람이 감지되지 않아도 종종 찍히는 현상 발생"
**수정 파일**: `docs/app.js`
**내용**:
- **연타 false positive 방지 (이중 검증)**: `capturePhoto`에서 사람 감지를 **실시간 상태(`lastDetectionResult`) + 촬영 프레임 재감지** 둘 다 `full`이어야 저장 허용하도록 변경. 셔터 링이 빨강/하늘색(사람 없음·부분)인 상태에서는 촬영 시점 재감지와 무관하게 즉시 거부. 연타로 인한 MoveNet false positive 한 번 걸리는 케이스 차단.
- **쿼터 에러 메시지 개선**: 429 서버 원문의 `day`/`minute` 키워드 패턴 확장(`PerDay`, `PerMinute` 포함). 둘 다 감지 안 될 때는 서버 원문 일부(최대 100자)를 토스트에 포함해 사용자가 "무슨 쿼터가 초과됐는지" 정확히 볼 수 있도록 함. "AI Studio에서 사용량 확인" 안내 추가.
- 토스트 지속시간 5500ms → 7000ms (긴 메시지 읽기 시간 확보).

### 44. v3.7.6 — 모델 `gemini-2.0-flash` 복귀 + few-shot 예시 주입
**프롬프트**: "전문가 모드인데 여전히 안나와"
**수정 파일**: `docs/app.js`
**내용**: v3.7.5의 프롬프트 강화만으론 Flash Lite가 tags를 여전히 생략하는 것으로 확인. Flash Lite는 응답 축약 경향이 강해 MyStyle 용도와 맞지 않음.
- **모델 교체**: `gemini-2.5-flash-lite` → **`gemini-2.0-flash`**. 무료 일일 한도 약 1500 RPD(Lite의 1000, 2.5 Flash의 250보다 우위). 응답도 풍부해 tags·brandGuess 모두 잘 채움. 초반 429는 신규 API 키 쿼터 활성화 지연이었을 가능성이 커서 이제는 괜찮을 것으로 봄.
- **Few-shot 예시 주입**: 프롬프트에 완전한 예시 응답 JSON을 삽입. tags 5개 중 보이는 것 4개가 채워진 구체 예시 + brandGuess 4개 항목. 모델이 "이 정도 수준으로 채워야 한다"를 직관적으로 학습. 가벼운 모델일수록 few-shot이 효과적.

### 43. v3.7.5 — blob 3단 폴백 + tags 누락 수정
**프롬프트**: "처음에 검사하니까 잘 되었는데 다시검사시에 분석실패 : object can not be found here 발생 / 전문가모드로 바꿨는데 ... 상의, 하의 어떤건지 판단해주는 옵션이 안나오네?"
**수정 파일**: `docs/app.js`
**내용**:
- **`blobToBase64` 3단 폴백 체인**
  1. `blob.arrayBuffer()` (v3.7.2)
  2. `URL.createObjectURL + fetch` ← iOS Safari에서 IndexedDB 분리 blob에도 잘 동작
  3. `FileReader.readAsDataURL` (최후)
  각 단계 실패 시 콘솔에 경고만 출력하고 다음으로 진행. `bufferToBase64` 헬퍼 분리.
- **프롬프트 tags 강화** — Flash Lite가 가벼운 모델 특성상 brandGuess가 있으면 tags를 빈 문자열로 생략하는 경향이 있어서, `tags`와 `brandGuess`의 역할 차이를 명시하고 **"사진에 실제로 보이는 카테고리는 반드시 채울 것"** 강조. tags는 아이템 외형 묘사(예: "흰색 옥스퍼드 셔츠"), brandGuess는 브랜드 추정이라는 구분 추가.

### 42. v3.7.4 — Gemini 모델 Flash Lite 교체 + 429 세분화
**프롬프트**: "쿼터 초과 429 뜨네 1~2분 이따 다시 시도하라는데 1~2분 후에 해도 동일해"
**수정 파일**: `docs/app.js`
**내용**: 429가 분당 한도가 아닌 **일일 한도 초과**였을 가능성. `gemini-2.5-flash` 무료 티어는 일일 약 250 RPD로 빡빡해서 테스트 반복 시 빠르게 소진됨. 더 넉넉한 Lite 버전으로 교체.
- **모델 변경**: `gemini-2.5-flash` → **`gemini-2.5-flash-lite`** (무료 일일 한도 약 1000 RPD, Vision 지원, 단순 JSON 작업엔 품질 충분)
- **429 에러 메시지 세분화**: 서버 원문에서 `day`/`daily`/`minute`/`RPM` 키워드 감지해 토스트 분기
  - 일일 한도 → "내일 다시 시도하거나 다른 API 키 사용 필요"
  - 분당 한도 → "1분 후 다시 시도해 주세요"
  - 그 외 → "쿼터 초과. 잠시 후 다시"
- 응답 파싱 실패 별도 토스트 추가: "응답이 깨져 재시도가 필요해요"

### 41. v3.7.3 — Gemini 503 자동 재시도
**프롬프트**: "분석하니까 분석 실패 : API 503 : this model is currently experiencing high demage가 발생해. 근데 한 4번정도 오류 무시하고 누르니까 결과가 나오긴하거든?"
**수정 파일**: `docs/app.js`
**내용**: 사용자가 수동으로 여러 번 재시도하던 동작을 앱이 대신 수행.
- **`callGeminiVisionWithRetry` 래퍼 신설** — exponential backoff(700 / 1500 / 2500 ms, 최대 3회). 503/502/overload/UNAVAILABLE 문구 포함 시에만 재시도. 429(쿼터)는 재시도 안 함(기다려야 해결).
- **로딩 UI에 재시도 진행 표시** — "모델 혼잡으로 재시도 중 (1/3)" 형태로 갱신
- **503 전용 토스트 분기 추가** — 최종 실패 시 "모델 혼잡. 잠시 후 다시 시도해 주세요"로 원인 명확히 전달
- 재시도 중에도 분석 중 상태 유지되어 사용자 버튼 재클릭 불필요

### 40. v3.7.2 — iOS Safari blob 분리 오류 수정 (재분석 에러)
**프롬프트**: "분석을 하고 모드를 다른모드로 바꾸고 분석했던걸 재분석하려니까 분석 실패 : The object can not be found here. 에러발생"
**수정 파일**: `docs/app.js`
**내용**: 분석 후 카메라 모드 전환 등으로 시간이 지난 뒤 같은 사진을 재분석하면 에러. "The object can not be found here"는 **Gemini 에러가 아니라 iOS Safari의 DOMException** — IndexedDB에서 가져온 Blob의 backing store가 내부적으로 분리(detach)된 상태에서 `FileReader.readAsDataURL`을 호출해 발생한 것. (v3.7.1에서 동일 문구 에러를 Gemini 스키마 문제로 오판해 수정했는데, 이번엔 런타임 영역 문제로 별개 원인.)
- **`runStyleCheck()`에 fresh 재조회** — `currentViewingPhoto`의 stale blob 대신 매 분석마다 `getPhoto(id)`로 IndexedDB에서 최신 blob을 읽어 사용
- **`blobToBase64()` 강화** — `blob.arrayBuffer()` 우선 시도 (FileReader보다 안정적). 실패 시 기존 FileReader 방식으로 폴백. 대용량 blob 대비 청크 단위 처리로 스택 오버플로 방지.

### 39. v3.7.1 — Gemini 스키마 호환 오류 수정 ("The object can not be found here")
**프롬프트**: "분석실패 : The object can not be found here. 라고 뜬다 그 외에도 분석실패 다른문구도 떴었어"
**수정 파일**: `docs/app.js`
**내용**: v3.7 도입한 `response_schema`에 한국어 enum(`['상','중','하']`, `['하이엔드','컨템포러리',...]`)과 부분 `required` 조합이 있었는데, Gemini가 구식 OpenAPI 서브셋만 안정적으로 지원해 일부 케이스에서 `The object can not be found here` 에러 반환.
- **enum 전부 제거** — 값 제약은 프롬프트 가이드 + `parseStyleCheckJson` 정규화 단계(`VALID_ITEM`/`VALID_TIER`/`VALID_CONF`)로 이관
- **required 완전화** — `brandGuess.items`와 최상위 모두 모든 필드를 required로 설정 (부분 required 시 파싱 애매성 제거)
- **brand null 정책 변경** — null 대신 빈 문자열(`""`)로. 프롬프트에도 "확신 없으면 빈 문자열"로 명시. 파싱 단계에서 빈 문자열 → `null`로 변환(UI 표시 시 `—`).
- **필터링 조정** — 아이템이 잘못된 값이면 해당 브랜드 항목 제외. 기존 "기타" 폴백은 부정확하므로 제거.

### 38. v3.7 — AI 스타일 검사 확장 (맥락·톤·브랜드)
**프롬프트**: "내가 이 앱을 만드는 이유 중 하나가, 패션에 대해 아무것도 모르는사람들이 ... 소개팅룩으로 이런식으로 입었는데 어때? ... 브랜드명까지 나오면 더 좋아할거같아 ... / Phase 1~3까지 진행"
**수정 파일**: `docs/index.html`, `docs/app.js`
**내용**: 단순 점수 평가였던 AI 스타일 검사를 "맥락 있는 패션 컨설턴트"로 확장. 3개 축으로 동시 발전.

- **Phase 1 — 맥락 입력 시트**
  - ✨ 버튼 탭 시 바로 분석 X → 하단 시트 "어떤 상황인가요?" 오픈
  - 빠른 선택 칩 5개: `데일리 / 데이트 / 미팅 / 여행 / 파티`
  - 자유 입력 (60자, 예: "저녁 레스토랑")
  - 둘 다 있으면 `칩 — 자유텍스트` 형태로 결합, 건너뛰기 시 맥락 없이 분석
  - 재검사 시 이전 맥락 복구(UX 편의)

- **Phase 2 — 브랜드 인식**
  - 응답 스키마에 `brandGuess[]` 추가: `{item, brand, tier, confidence}`
  - `tier`: 하이엔드 / 컨템포러리 / 도메스틱 / SPA / 스트리트 / 기타
  - `confidence`: `high`(확실, 로고 명확) / `medium`(추정, 디테일 기반) / `low`(모름)
  - 모르면 `brand: null` 허용 (억지 추정 금지를 프롬프트에 명시)
  - 결과 카드에 **추정 브랜드** 섹션 — 아이템별 라벨·값·티어·신뢰도 뱃지(high=초록/medium=파랑/low=주황). 하단에 티어 밸런스 표시 ("컨템포러리 1 + SPA 2")

- **Phase 3 — AI 피드백 톤 선택**
  - 설정 시트에 톤 칩 3개: **친절 / 균형 / 전문가**
  - `localStorage: mystyle_ai_tone`에 저장 (`'friendly' | 'balanced' | 'expert'`)
  - 프롬프트에 톤별 지시문 동적 주입 (`TONE_DIRECTIVES`)
    - friendly: 쉬운 말·격려 위주, 용어 최소화
    - balanced: 객관적·분석적 (현재 톤 유지)
    - expert: 전문 용어 적극, 트렌드 언급

- **프롬프트 재작성** — `buildStyleCheckPrompt(tone, context)` 함수. 톤 지시 + 맥락 지시 + 필드 가이드(score/colorBalance/silhouetteBalance/brand 각각에 대한 명시적 기준).
- **응답 확장** — `contextFit`(맥락 적합성 한 줄), `context`(사용자 입력 보존), `tone`(사용 시점 톤) 필드 저장.
- **결과 카드 렌더 확장** — 맥락 뱃지, `contextFit` 라인, 브랜드 섹션 통째 추가. 텍스트 주입은 textContent로 XSS 안전.
- **"다시 검사" 동선 변경** — 이전엔 바로 분석. 이제 맥락 시트 다시 열림(재검사 시 맥락 바꿀 수 있게).
- **기본값**: 톤 = 균형, 맥락 = 없음. 기존 사용자 습관 유지.

### 37. v3.6.1 — 앨범 헤더 중앙 정렬
**프롬프트**: "앨범에서 돌아가기 앨범 0장 의 중심이 안맞는거같아 앨범 문구가 오른쪽으로 쏠려있어"
**수정 파일**: `docs/index.html`
**내용**: 갤러리 상단 헤더의 "앨범" 타이틀이 화면 중앙이 아닌 오른쪽으로 쏠려 보이던 문제. 원인은 `flex + justify-content: space-between` 구조에서 왼쪽 "← 돌아가기"(약 90px)와 오른쪽 "0장"(약 30px) 너비 차이가 커서 중앙 요소가 두 요소 사이 공간의 중앙(= 전체 화면의 중앙에서 오른쪽)으로 배치된 것. `display: grid; grid-template-columns: 1fr auto 1fr`로 변경해 좌·중·우 3영역을 동일한 레이아웃 공간에 배치. 각 자식에 `justify-self: start/center/end`로 정렬 방향 고정. `photoCount`의 불필요한 `min-width: 42px; text-align: right`도 제거.

### 36. v3.6 — 홈 카드 순서·서브 카피 조정
**프롬프트**: "메인 화면의 오늘의 스타일과 상대방이 보는 나 순서 바꾸는게 낫지않을까? ... 상대방이 보는 나의 설명을 얼굴 헤어 체크보단 기록이 낫지않을까? / 얼굴·헤어 기록 으로 해줘"
**수정 파일**: `docs/index.html`
**내용**:
- **홈 카드 순서 변경** — `상대방이 보는 나 → 오늘의 스타일 → 앨범` → `오늘의 스타일 → 상대방이 보는 나 → 앨범`. 앨범의 탭 순서(OOTD → MyFace)와 일치시켜 인지 부담 감소. 앱의 메인 목적인 OOTD를 최상단 자리로.
- **서브 카피 조정** — "얼굴·헤어 체크" → **"얼굴·헤어 기록"**. "OOTD 기록"과 대구를 맞춰 "기록"이라는 앱 메시지를 통일. "체크"(외래어 느낌) 대신 "기록"으로 저장 기능도 포괄.

### 35. v3.5.6 — MoveNet 포즈 감지로 근본 해결 (COCO-SSD 대체)
**프롬프트**: "바로 MoveNet으로(옵션 B) 진행해줘"
**수정 파일**: `docs/index.html`, `docs/app.js`
**내용**: COCO-SSD의 bbox 기반 판정은 구조적으로 한계. 팔을 화면 세로로 길게 찍으면 높이·너비·종횡비 조건을 모두 만족시켜 `full`로 통과되는 문제가 반복됨. 신체 키포인트를 직접 보는 MoveNet으로 완전 대체.
- **CDN 교체** — `@tensorflow-models/coco-ssd` → `@tensorflow-models/pose-detection@2.1.3`. TensorFlow.js는 그대로 재사용.
- **모델 교체** — `cocoSsd.load({ base: 'lite_mobilenet_v2' })` → `poseDetection.createDetector(SupportedModels.MoveNet, { modelType: movenet.modelType.SINGLEPOSE_LIGHTNING })`. Lightning 버전은 약 3MB, 빠르고 가벼움.
- **판정 방식 전환** — bbox 비율(높이/너비/종횡비) 조건 3개 전부 제거. 대신 `classifyPose(keypoints)`가 17개 키포인트를 보고 판단:
  - 어깨(좌/우 중 1개) + 엉덩이(좌/우 중 1개) + 하체(무릎 or 발목 중 1개) 모두 보이면 → `'full'`
  - 키포인트 일부만 보이면 → `'partial'` (예: 팔만 있으면 어깨·엉덩이 미충족)
  - 키포인트가 임계치(`KP_THRESHOLD = 0.3`) 이상 하나도 없으면 → `'none'`
- **근본 해결** — 팔만 화면에 꽉 찬 구도라도 어깨·엉덩이·다리 키포인트가 없으므로 명확하게 `partial`로 걸러짐. bbox 임계치 튜닝 불필요.
- **변수·함수 리네임** — `cocoModel` → `poseModel`, `loadCocoModel` → `loadPoseModel`. `detectPersonOnCanvas`는 이름 유지하되 내부 구현을 MoveNet으로 교체 (반환 타입 `'none'|'partial'|'full'|null` 동일).
- **UI 변경 없음** — 셔터 링 색상, 힌트 텍스트, 상태 머신 그대로. 판정만 정확해짐.

### 34. v3.5.5 — 전신 판정에 너비·종횡비 추가 (팔 단독 차단)
**프롬프트**: "사진을 찍기 전 사람감지할 때, 팔 부분만 찍어도 사람이 감지되어 찍히거든? 여기까지 풀어주는게 맞나? / 진행해줘"
**수정 파일**: `docs/app.js`
**내용**: 기존 "높이 비율 65%" 기준만으로는 팔 하나를 세로로 길게 찍어도 'full'로 통과되던 문제 해결. 3개 기준 AND로 판정 엄격화.
- **새 상수**: `FULL_WIDTH_RATIO = 0.18` (bbox 너비 ≥ 프레임 너비 18%), `ASPECT_MIN = 1.3`, `ASPECT_MAX = 4.2` (종횡비 height/width)
- **판정**: `(heightRatio ≥ 0.65) AND (widthRatio ≥ 0.18) AND (1.3 ≤ aspect ≤ 4.2)` → `'full'`, 아니면 `'partial'`
- 팔 단독처럼 "세로로 길지만 매우 얇은" 감지 영역이 너비 조건에서 탈락
- 누운 자세처럼 종횡비 범위 벗어난 감지도 `partial` 처리 (드물지만 안전)
- 인디케이터는 기존 `partial` 재활용 (하늘색 + "전신이 보이도록 맞춰주세요"), 별도 상태 추가 X — 사용자는 "뭔가 덜 나옴"으로 일관되게 안내받음
- AI 스타일 검사 API 호출 낭비 방지 효과 (잘못 저장 → "평가 어려움" 피드백 루프 제거)

### 33. v3.5.4 — 스타일 분석 JSON 파싱 오류 수정
**프롬프트**: "분석 실패 : JSON Parse error: Unterminated string 이라고 뜨거든?"
**수정 파일**: `docs/app.js`
**내용**: Gemini 응답이 `maxOutputTokens: 600` 한계로 잘리거나, 스키마 미지정으로 자유 형식 텍스트가 섞여 JSON이 깨지는 문제.
- **`response_schema` 추가** — `generationConfig`에 명시적 JSON 스키마(타입·enum·required) 지정. Gemini가 정확히 그 구조만 반환하도록 강제해 "Unterminated string" 류 파싱 에러 원천 차단.
- **`maxOutputTokens` 600 → 1024** — 한국어 응답 길이에 여유.
- **파싱 실패 디버깅** — 파싱 실패 시 원문 앞 500자를 콘솔에 기록. 재발 시 원인 파악 쉬워짐.

### 32. v3.5.3 — 전신 판정 (부분 감지 별도 처리)
**프롬프트**: "근데 궁금한게 사람감지 기준이 뭐야? 거울에서 찍는게 아니고 직접 내 다리랑 발쪽을 비추니까 사람이 감지됨이라고 뜨는데.. 보통 얼굴은 안나오더라도 상의, 하의까지는 나와야 스타일을 볼수있는거 아닐까..?"
**수정 파일**: `docs/index.html`, `docs/app.js`
**내용**: COCO-SSD `person` 클래스가 "사람이 있기만 하면" 감지로 판단 → 다리·발만 비춰도 통과하는 문제. bbox 높이 비율로 전신 여부까지 판정하도록 로직 확장.
- **`detectPersonOnCanvas` 반환 타입 변경** — boolean → `'none' | 'partial' | 'full' | null`. 감지된 person 중 가장 큰 bbox 높이를 이미지 높이로 나눠, `FULL_HEIGHT_RATIO = 0.65` (65%) 이상이면 `'full'`, 미만이면 `'partial'`.
- **중간 상태 `partial`** — 셔터 링·힌트 하늘색(#5ac8fa)으로 새 상태 추가. 힌트 텍스트: "전신이 보이도록 맞춰주세요".
- **capturePhoto 엄격화** — OOTD 촬영 시 `full`만 통과. `partial`은 토스트 "전신이 더 나오도록 맞춰주세요"로 저장 거부. `none`은 기존대로 "사람이 감지되지 않아요".
- **판정 기준**: 65%. 얼굴 잘려도 상·하의 대부분 보이는 구도에 맞춤. 사용자 의도 반영.

### 31. v3.5.2 — 엄격 모드 + 실시간 사람 감지 힌트
**프롬프트**: "제 추천: C + 셔터 링 색상 (아래 테두리) + 실패 시 1회 경고 후 허용 토글. 가장 간결하고 정보량 충분. 이렇게 해주고 그럼 카메라비출때 사람 실루엣이라도 잡는걸 넣는게 낫지않아? / 다 동의"
**수정 파일**: `docs/index.html`, `docs/app.js`
**내용**: OOTD 촬영 시 "모델 로딩 중 양심 폴백" 때문에 앱 켜자마자 사물 사진도 저장되던 문제를 해결하고, 동시에 카메라 보는 동안 사람이 감지되는지 실시간 힌트를 노출.
- **실시간 감지 루프** — 후면(OOTD) 카메라 진입 시 2초 주기로 video 프레임을 320px 축소 canvas에 그려 COCO-SSD 추론. `runDetection()` → `lastDetectionResult` 업데이트 → UI 반영. 홈/갤러리/MyFace 전환 시 `stopRealtimeDetection()`로 `clearInterval`.
- **셔터 링 하단 색상 인디케이터** — `#shutterBtn[data-state]` 속성에 따라 `border-bottom-color` 변경:
  - `loading` = 회색 / `person` = 초록(#32d74b) / `noperson` = 빨강(#ff453a) / `failed`·`bypass` = 주황(#ff9f0a)
  - `transition: border-color 220ms ease`로 부드럽게 전환
- **셔터 위 상태 라벨** — `#captureHint`에 상태 텍스트 + 색상 매칭. "AI 준비 중... / 사람 감지됨 / 사람이 감지되지 않아요 / AI 준비 실패 / AI 감지 비활성".
- **엄격 모드 (capturePhoto)** — OOTD 촬영 시:
  - 모델 로드 실패 → 1회 `confirm()` 모달로 "검증 없이 저장?" 물어보고 승인하면 `bypassDetectionForSession = true` (앱 재시작 전까지 계속 허용)
  - 모델 로딩 중 → 저장 거부 + 토스트 "AI 준비 중이에요. 잠시 후 다시"
  - 모델 준비됨 → 촬영 순간 다시 검증, 사람 없으면 저장 거부
- **MyFace는 영향 없음** — 전면 모드에선 `data-state` 제거 + 힌트 숨김.
- **updateCaptureHint → updateShutterIndicator로 통합**. 기존 "본인 스타일만 기록" 단순 안내를 상태 머신으로 확장.
- **성능** — 320×180 축소로 추론해 iPhone에서 프레임당 약 100~200ms. 2초 주기라 배터리·발열 부담 적음.

### 30. v3.5.1 — 429 에러 대응 (모델 변경 + 상세 에러)
**프롬프트**: "분석실패 : API 429 : { \"error\" : \"code\": \"429\", message: \"you\"} 이런식으로 뜨는데?"
**수정 파일**: `docs/app.js`
**내용**: 
- Gemini 모델을 `gemini-2.0-flash` → **`gemini-2.5-flash`** 로 변경. 신규 API 키에서 2.0 계열이 간헐적으로 429(쿼터 미활성/혼잡)를 반환하는 문제 회피. 2.5 Flash는 무료 티어 한도가 더 넉넉함.
- 에러 메시지를 더 상세하게 출력: JSON 응답의 `error.message`를 파싱해서 토스트에 포함(240자까지). 전체 응답은 콘솔에도 기록.
- 429 에러는 전용 안내 토스트 "쿼터 초과. 1~2분 후 다시 시도" (쿼터 활성화가 몇 분 걸리는 특성 반영).

### 29. v3.5 — AI 스타일 검사 (Gemini Vision)
**프롬프트**: "제 추천 다 동의 + 키 발급 완료, 진행해줘"
**수정 파일**: `docs/index.html`, `docs/app.js`
**내용**: OOTD 사진을 Google Gemini 2.0 Flash Vision API로 분석해 점수·색상밸런스·실루엣밸런스·코멘트·개선 제안을 받아 사진 상세 info 패널에 표시. 무료 티어라 본인 사용엔 비용 0원.
- **설정 화면** — 홈 상단 우측 ⚙️ 버튼 → 하단 시트. Gemini API 키 입력(localStorage `mystyle_gemini_api_key`). 저장/삭제/마스킹(...마지막 6자). `AIza[...]` 형식 기초 검증.
- **사진 상세 ✨ 버튼** — 상단 바 `photoTopActions`에 별 모양 아이콘 추가. OOTD일 때만 표시(`hidden` 토글은 `renderCurrentSlide`에서 처리). 탭 → `runStyleCheck()`.
- **Gemini API 호출** — `gemini-2.0-flash:generateContent` 엔드포인트. blob→base64 (`FileReader`) 후 `inline_data`로 전송. `response_mime_type: 'application/json'`로 구조화 JSON 응답 요구. temperature 0.4, maxOutputTokens 600. 에러 상태·비어있는 응답 모두 throw 처리.
- **프롬프트** — 한국어 객관적·분석적 톤. JSON 필드: `score`(1~10), `colorBalance/silhouetteBalance`(상/중/하), `comment`(40자), `suggestion`(40자), `tags`(상의/하의/신발/아우터/액세서리 각각 짧은 설명). 마크다운·코드펜스 금지 명시.
- **응답 파싱** — `parseStyleCheckJson()`이 중괄호 범위 추출 → `JSON.parse` → 필드 정규화(score clamp, 밸런스 값 검증). 
- **AI 태그 자동 채움** — 기존 `photo.tags`에 사용자 값이 있으면 유지, 비어있는 필드에만 AI 값 채움(덮어쓰기 X). 기존 카테고리 칩 UI가 자동 렌더링하여 사용자가 탭해 수정 가능.
- **styleCheck 필드** — `{score, colorBalance, silhouetteBalance, comment, suggestion, analyzedAt}` 형태로 `photo.styleCheck`에 저장. `normalizePhoto`에 필드 추가. `queueUpdate`로 IndexedDB 기록.
- **결과 카드 렌더** — `renderStyleCheckCard()`가 info 패널 상단에 카드 형태로 출력. 점수 큼직하게 + 색상/실루엣 뱃지 + 코멘트 + 💡제안 + 분석 시각 + "다시 검사" 버튼. 로딩 상태는 스피너. OOTD 외에는 숨김.
- **예외 처리** — 키 없을 때: 토스트 안내 + 자동 설정 열기. API 에러: 토스트 + 기존 결과 유지. 중복 호출 방지: `styleCheckInFlight` 플래그.

### 28. v3.3 — 홈 화면 고도화 + 앱 이름 MyStyle로 변경
**프롬프트**: "메인화면도 고도화가 필요해 보여 시작하기 누르자마자 카메라가 바로 팍 나오니까 당황스럽네 / 상대방이 보는 내 모습 기록하기, 오늘의 스타일 기록하기 등으로 나누는것이 좋아보여 진행하지말고 회의모드로 대답해줘 / 제 추천 다 동의, 앱 이름 MyStyle 로 변경, 추가 디테일은 너가 알아서 해줘"
**수정 파일**: `docs/index.html`, `docs/app.js`, `docs/manifest.json`
**내용**:
- **앱 이름 MyStyle로 리브랜딩**: `manifest.json`의 `name`/`short_name`/`description`, `<title>`, `apple-mobile-web-app-title`을 MyStyle로 변경. IndexedDB 이름(`MirrorMePhotos`)과 GitHub Pages URL은 연속성 유지 위해 그대로. 다운로드 파일명은 `MyStyle_YYYYMMDD_...jpg`로 변경.
- **홈 화면 3-카드 구조**: 기존 `#overlay`(시작하기 버튼만 있던 화면) 제거하고 새 `#home` 추가. 상단엔 옷걸이 로고 + "MyStyle" 타이틀 + "오늘의 나를 기록하세요" 태그라인. 하단에 카드 3개:
  1. **상대방이 보는 나** (얼굴·헤어 체크) → 전면 카메라
  2. **오늘의 스타일** (OOTD 기록) → 후면 카메라
  3. **앨범** (지난 기록 보기) → 갤러리 직접 진입 (카메라 없이)
  각 카드는 SVG 라인 아이콘 + 타이틀 + 서브 카피 + 오른쪽 화살표. `rgba(255,255,255,0.06)` 배경 + 라이트 보더 + active 시 scale·배경 강조.
- **카메라 상단 좌측 `← 홈` 버튼**: `#cameraTopBar` 신설. 원형 blur 버튼, 탭하면 카메라 스트림 정지 후 홈으로 복귀.
- **모드 진입 함수들** (app.js):
  - `enterCameraMode(mode)`: mode에 따라 `startCamera('user' | 'environment')` → 홈 페이드아웃 → controls·cameraTopBar 표시.
  - `enterAlbumFromHome()`: 카메라 안 켜고 갤러리 바로 오픈. `galleryEntryPoint = 'home'`로 기록.
  - `showHome()`: 카메라 스트림 정지(`stopCamera`) + 홈 화면 복귀. 카메라 권한·배터리 부담 감소.
- **갤러리 진입 경로 기억**: `galleryEntryPoint` 상태로 `'home' | 'camera'` 추적. `closeGallery()`가 이 값에 따라 홈 또는 카메라 UI로 복귀하도록 분기.
- **카메라 권한 지연**: 홈에서 앨범만 보고 싶은 사용자는 카메라 권한 없이도 앱 이용 가능. 권한 팝업은 카메라 모드 카드를 탭한 순간에만 뜸.
- **배경 그라디언트**: 홈 화면 배경을 `linear-gradient(180deg, #000 0%, #0d0d0f 45%, #16161a 100%)`로 살짝 깊이감 추가.
- **라이프사이클**: 기존 `startBtn.addEventListener('click', start)` 제거. 홈 진입은 카드 클릭으로만.

### 27. v3.2.4 — 사진 확대 레이아웃 재수정 + 핀치 중심점 기준 확대
**프롬프트**: "B를 너가 이해를 제대로 못한것 같아 확대를 했을 때 첨부한 사진과같이 아래 검은 영역까지 같이 움직여, 그리고 확대할때 가운데 기준으로 자꾸 확대가 되는데 이것도 불편해"
**수정 파일**: `docs/index.html`, `docs/app.js`
**내용**:
- **.photoSlide CSS 복원**: v3.2.3의 `margin:auto + max 100% + auto` 방식이 iOS Safari에서 img 요소 크기가 이상하게 계산되어 사진이 화면을 꽉 채우지 못하는 문제가 있었음(사용자 스크린샷 확인). 원래의 `inset:0 + width/height:100% + object-fit:contain`으로 복원.
- **팬 경계 clamp 추가**: `clampPan()` 함수 신설. `scale > 1` 상태에서 translate 범위를 `±(container*(scale-1)/2)`로 제한하여 사진 가장자리가 화면 안쪽에 머물도록. 이렇게 하면 object-fit의 투명 여백이 화면 안쪽으로 드러날 수 없어 "검은 영역이 같이 움직이는" 현상이 시각적으로 사라짐. touchmove(pan), touchmove(pinch), touchend(pinch/pan) 모두에서 호출.
- **핀치 중심점 기준 확대**: transform-origin은 center center 유지하되, 손가락 중심점이 확대/축소 전후에 화면 상 같은 위치에 머물도록 translate 보정.
  - touchstart에서 `pinchCenterX/Y`(두 손가락 중앙 화면 좌표), `pinchStartTX/TY`(시작 시점 translate), `pinchStartScale` 저장.
  - touchmove 공식: `zoomTX = (pinchCenterX - screenCX) - (pinchCenterX - screenCX - pinchStartTX) * k` (k = 새 scale / 시작 scale). Y도 동일. 사진 중앙이 아닌 **손가락이 닿은 지점 기준** 확대됨.
  - 핀치 종료 후 clampPan으로 정리.

### 26. v3.2.3 — 카메라 깜빡임 최종 제거 + 사진 팬 시 여백 같이 이동 버그
**프롬프트**: "확대는 되고, 홈 아이콘 삭제 후 등록시 카메라 화면 작아졌다 커지는 증상 또 생김 / 확대 시 하고 아래로 화면 이동 시, 아래 쪽 검은색 영역 까지 같이 움직여짐"
**수정 파일**: `docs/index.html`
**내용**:
- **카메라 깜빡임**: `#video`의 `transition: transform 60ms linear` 제거. 첫 진입 시 inline transform 적용 시점에 이 트랜지션이 순간적으로 발동되면서 "작게→크게" 현상이 만들어진 것으로 추정. 핀치 zoom은 매 프레임 값이 연속 변화해서 transition 없이도 부드럽게 동작.
- **팬 시 여백 같이 이동**: `.photoSlide`를 `width:100%; height:100%; object-fit:contain`에서 `margin:auto + max-width/height:100% + width/height:auto`로 변경. 이미지 자연 비율에 맞는 크기로만 렌더링되어 img 요소 안에 투명 여백이 없어짐. scale·translate 변환 시 여백이 따라 움직이는 시각적 버그 해결. 3-slide 좌우 오프셋(±w)은 img가 container보다 작아도 화면 밖에 충분히 위치해서 문제 없음.

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

---
name: MirrorMe iOS app
description: Personal iOS app project — selfie camera that shows the user as others see them (un-mirrored front camera)
type: project
---

사용자가 만들고 있는 개인용 iOS 앱 "MirrorMe".

**현재 단계 (v1):**
- 아이폰 앱, 개인 사용 전용 (배포 X)
- 앱 실행 시 전면(셀카) 카메라가 켜짐
- iOS 기본 셀카는 거울처럼 좌우반전되어 보이는데, 이 앱은 **반전을 해제**해서 "상대방이 보는 내 모습"으로 보여줌 (일반 거울이 아닌 "진짜 거울")
- 프로젝트 위치: `C:\Users\koo\Desktop\MirrorMe\`
- 진행 기록 파일: `C:\Users\koo\Desktop\MirrorMe\PROJECT.md`

**향후 계획 (로드맵):**
- v2 (완료): 무음 사진 촬영 + IndexedDB 저장 + 앱 내 갤러리
- v3: 날짜별 OOTD 기록 (사진 + 태그 + 메모)
- v4+: AI 스타일 밸런스 분석 (Claude/Google Vision API), 통계, 추이

**장기 비전 — MyStyle (2026-04-09):**
거울 앱 → 스타일 매니저로 진화. 이름도 결국 `MirrorMe`보다 `MyStyle`이 적합. 탭 구조 구상: 거울 / OOTD / 앨범 / 분석 등.

**배포 정책 (확정 2026-04-09 재논의):**
- **공개 배포 O** — 일반 사용자에게 배포 (App Store 또는 PWA URL).
- **사용자 간 공유 X** — 각 사용자는 본인 데이터만 봄. 다른 사용자의 사진/기록은 절대 노출 안 됨.
- **관리자(개발자)만 admin 대시보드에서 전체 데이터 열람** — 패션 트렌드 분석·서비스 개선 목적.
- **합법화 필수**: 가입 시 명시적 동의 체크 + 개인정보처리방침 게시. 절대 몰래 수집 금지.
- 백엔드: Mac 구매 시점에 Firebase(Auth + Storage + Firestore) 붙이기. Admin 권한은 Firebase custom claims로 분리.
- AI 분석: Claude Vision API로 스타일 밸런스 평가.

**용어 주의**: 사용자는 "본인 전용" 표현을 처음에 썼지만, 그 의미는 "사용자끼리 공유 안 됨"이었음. 개발자가 데이터를 안 본다는 뜻이 아니었음. → 혼동 방지를 위해 "본인 전용" 표현 대신 "사용자 간 공유 X / 관리자만 열람" 같은 표현 사용.

**Why:** 개인이 본인의 실제 모습(타인이 보는 모습)을 확인하고, 나아가 데일리 패션을 기록·관리하려는 목적.

**How to apply:**
- Windows 환경이라 빌드는 Mac/Xcode 필요 — 코드는 작성하되 실행 안내는 Mac 기준으로
- v1은 단순하게 유지, 오버엔지니어링 금지 (사용자가 점진적으로 확장 예정)
- 진행 상황은 PROJECT.md에 기록해나가기

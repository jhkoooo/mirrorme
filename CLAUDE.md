# MirrorMe — Claude 작업 지침

이 파일은 Claude Code가 이 폴더에서 작업할 때 자동으로 읽는 프로젝트 컨텍스트입니다. 메모리에 의존하지 않아도 다른 PC/대화에서 즉시 컨텍스트를 잡을 수 있도록 함.

## 프로젝트 한 줄 요약
거울/스타일 관리 PWA. 전면 카메라 미러링을 해제해 "상대방이 보는 나"를 보여주는 앱에서 출발해, 장기적으로 스타일 매니저(MyStyle)로 진화 중.

## 자세한 상태
**현재 상태와 로드맵은 [PROJECT.md](PROJECT.md) 참조.**
**프롬프트 단위 변경 이력은 [CHANGES.md](CHANGES.md) 참조.**

## 작업 규칙

### 응답 언어
- **한국어**로 응답한다.

### 코드 수정 시
1. 변경한 후에는 **반드시 [CHANGES.md](CHANGES.md)에 항목을 추가**한다 (사용자가 따로 요청하지 않아도 자동으로).
   - 형식: 날짜 섹션 → 번호 → 프롬프트(verbatim) → 수정/생성 파일 목록 → 내용 요약
   - 단순 질문(질문에 답만 하고 파일을 안 건드린 경우)은 기록 제외.
2. 의미 있는 마일스톤(버전 완성 등)은 **[PROJECT.md](PROJECT.md)** 의 해당 버전 섹션에도 반영한다.
3. 메모리 파일을 수정한 경우 [.claude-memory/](.claude-memory/) 폴더의 사본도 함께 갱신 (다른 PC 이전을 위해).

### 작업 스타일
- 사용자는 **점진적 확장**을 선호. 한 번에 너무 많은 기능을 추가하지 말 것.
- 오버엔지니어링 금지. 추상화·미래 대비 옵션·과도한 에러 처리 등 요청하지 않은 것은 추가하지 말 것.
- v1, v2처럼 작은 단계로 끊어가며 진행.

### 환경
- 사용자 PC: **Windows** (`C:\Users\koo\Desktop\MirrorMe\`)
- iOS 네이티브 빌드 불가 → 현재는 PWA로 운영
- GitHub Pages에 호스팅 중 (`https://jhkoooo.github.io/mirrorme/`)
- 접속 통계: GoatCounter (`https://mirrorme.goatcounter.com`)

### PWA 핵심
- `docs/` 폴더의 `index.html` + `app.js`가 실제 앱
- HTML `<video>`는 카메라 스트림을 그대로 표시 → 미러링 안 됨이 기본 (이게 "상대방이 보는 나"의 핵심)
- iOS Safari는 `getUserMedia`에 사용자 제스처(버튼 탭) 필요 → "시작하기" 버튼 유지
- HTTPS 필수 (`localhost` 외 HTTP에서는 카메라 차단)

### 배포 정책 (장기)
- **공개 배포 O**, 사용자 간 공유 X, 관리자만 admin 대시보드 열람
- 동의 고지 + 개인정보처리방침 필수 (몰래 수집 금지)
- 자세히는 [PROJECT.md](PROJECT.md)의 "장기 비전 — MyStyle" 섹션

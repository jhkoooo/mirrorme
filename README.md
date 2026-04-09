# MirrorMe

> "상대방이 보는 내 모습"을 그대로 보여주는 거울 PWA. 장기적으로는 본인 스타일 매니저(MyStyle)로 진화 중.

**라이브 데모**: https://jhkoooo.github.io/mirrorme/ (아이폰 Safari로 접속 권장)

## 컨셉

iOS 기본 셀카는 거울처럼 좌우반전되어 보입니다. 즉, 화면 속 내 모습은 **나만 보는 모습**이지 다른 사람이 보는 내 모습이 아닙니다. 이 앱은 그 반전을 해제해서 **다른 사람 눈에 비치는 내 모습** 그대로를 보여줍니다.

## 주요 기능 (현재 v2.1)

- 전면(셀카) 카메라 미러링 해제 → "상대방이 보는 나"
- 핀치 줌 1.0×~5.0× (디지털 돋보기 모드)
- 더블탭으로 줌 리셋
- 전면/후면 카메라 토글
- **무음 사진 촬영** (시스템 셔터음 없음)
- **앱 내 갤러리** (IndexedDB 저장 — 아이폰 사진 앨범에 안 들어감)
- 갤러리 탭 분류:
  - **MyFace** — 셀카로 찍은 얼굴 상태 확인용
  - **MyStyle** — 후면 카메라로 찍은 전신 스타일용
- 사진 상세 뷰 / 다운로드 / 삭제
- PWA 풀스크린 (홈 화면에 추가 시 앱처럼 동작)

## 폴더 구조

```
mirrorme/
├─ README.md            ← 이 파일 (저장소 첫 페이지)
├─ CLAUDE.md            ← Claude Code 작업 지침
├─ PROJECT.md           ← 프로젝트 현재 상태 + 로드맵 + 장기 비전
├─ CHANGES.md           ← 프롬프트 단위 변경 이력
├─ docs/                 ← 실제 PWA (GitHub Pages가 가리키는 폴더)
│  ├─ index.html
│  ├─ app.js
│  ├─ manifest.json
│  ├─ icon-192.png
│  ├─ icon-512.png
│  ├─ icon.svg
│  └─ make_icons.ps1    ← PNG 아이콘 재생성 스크립트
├─ MirrorMe/            ← (보관) 초기 SwiftUI 네이티브 코드. 향후 Mac에서 재활용 가능
│  ├─ MirrorMeApp.swift
│  ├─ ContentView.swift
│  ├─ CameraController.swift
│  ├─ CameraView.swift
│  └─ Info.plist
└─ .claude-memory/      ← Claude 메모리 파일 백업 (다른 PC 이전용)
```

## 기술 스택

- **PWA** (HTML + Vanilla JS, 빌드 도구 없음)
- 카메라: `MediaDevices.getUserMedia`
- 사진 저장: `IndexedDB`
- 호스팅: GitHub Pages
- 통계: [GoatCounter](https://mirrorme.goatcounter.com) (쿠키 없음, 익명)

## 다른 PC에서 이어서 작업하기

1. 새 PC에 [Git](https://git-scm.com/) 설치
2. 클론:
   ```bash
   git clone https://github.com/jhkoooo/mirrorme.git
   cd mirrorme
   ```
3. (선택) Claude Code로 작업할 거면 [.claude-memory/README.md](.claude-memory/README.md)의 절차에 따라 메모리 파일 복원
4. [CLAUDE.md](CLAUDE.md), [PROJECT.md](PROJECT.md), [CHANGES.md](CHANGES.md)를 읽으면 현재 상태와 다음 작업이 보임

## 코드 수정 → 배포 흐름

1. `docs/` 안의 파일 수정
2. GitHub에 commit & push
3. 1~2분 후 `https://jhkoooo.github.io/mirrorme/` 자동 갱신
4. 아이폰 Safari에서 새로고침 (또는 홈 화면 아이콘 다시 실행)

> PWA 캐시 때문에 변경이 안 보이면 홈 화면 아이콘 길게 눌러 삭제 → Safari로 사이트 다시 열기 → "홈 화면에 추가" 다시.

## 라이선스

개인 프로젝트, 별도 라이선스 없음.

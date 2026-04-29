# MirrorMe

> "상대방이 보는 내 모습"을 그대로 보여주는 거울 PWA.

**라이브 데모**: https://jhkoooo.github.io/mirrorme/ (아이폰 Safari로 접속 권장)

## 컨셉

iOS 기본 셀카는 거울처럼 좌우반전되어 보입니다. 즉, 화면 속 내 모습은 **나만 보는 모습**이지 다른 사람이 보는 내 모습이 아닙니다. 이 앱은 그 반전을 해제해서 **다른 사람 눈에 비치는 내 모습** 그대로를 보여줍니다.

## 주요 기능

- 전면(셀카) 카메라 미러링 해제 → "상대방이 보는 나"
- 핀치 줌 1.0×~5.0× (디지털 돋보기 모드)
- 더블탭으로 줌 리셋
- 전면/후면 카메라 토글
- 무음 사진 촬영 (시스템 셔터음 없음)
- 앱 내 갤러리 (IndexedDB 저장 — 아이폰 사진 앨범에 안 들어감)
- 사진 상세 뷰 / 다운로드 / 삭제
- PWA 풀스크린 (홈 화면에 추가 시 앱처럼 동작)

## 폴더 구조

```
mirrorme/
├─ README.md            ← 이 파일
├─ docs/                ← 실제 PWA (GitHub Pages가 가리키는 폴더)
│  ├─ index.html
│  ├─ app.js
│  ├─ manifest.json
│  ├─ icon-192.png
│  ├─ icon-512.png
│  └─ icon.svg
└─ MirrorMe/            ← (보관) 초기 SwiftUI 네이티브 코드
```

## 기술 스택

- **PWA** (HTML + Vanilla JS, 빌드 도구 없음)
- 카메라: `MediaDevices.getUserMedia`
- 사진 저장: `IndexedDB`
- 호스팅: GitHub Pages

## 라이선스

[LICENSE](LICENSE) 참조. 개인 프로젝트, 코드 재사용 허가 없음 (All Rights Reserved).

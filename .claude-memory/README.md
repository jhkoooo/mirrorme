# .claude-memory

이 폴더는 Claude Code의 사용자 메모리 파일을 **버전 관리**하기 위한 사본입니다.

원본 위치: `C:\Users\koo\.claude\projects\C--Users-koo\memory\` (Windows 기준)

## 다른 PC로 옮길 때 (복원 절차)

1. 새 PC에 Claude Code 설치
2. 이 저장소를 `git clone`
3. `.claude-memory/` 안의 파일들을 사용자 메모리 디렉토리로 복사:

### Windows
```cmd
mkdir "%USERPROFILE%\.claude\projects\C--Users-<새사용자명>\memory"
xcopy .claude-memory "%USERPROFILE%\.claude\projects\C--Users-<새사용자명>\memory" /E /I /Y
```
> 경로의 `C--Users-<새사용자명>` 부분은 새 PC의 사용자명으로 바뀌어야 합니다. 정확한 경로는 새 PC에서 Claude Code를 한 번 실행해 메모리 폴더가 자동 생성된 뒤 확인하세요.

### macOS / Linux
```bash
mkdir -p ~/.claude/projects/<프로젝트경로해시>/memory
cp -r .claude-memory/* ~/.claude/projects/<프로젝트경로해시>/memory/
```

4. `MEMORY.md` 인덱스 파일도 잊지 말고 같이 복사 (또는 새로 작성)

## 주의

- 메모리 파일은 작업 중에 계속 갱신될 수 있습니다. **본 폴더의 사본도 주기적으로 동기화**하거나, 작업 종료 시점에 복사하는 습관이 필요합니다.
- 향후 자동 동기화 스크립트를 만들 수도 있습니다 (Phase 2).

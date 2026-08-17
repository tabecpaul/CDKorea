# start 루트 자가진단 리디렉션 구현 계획

정본 설계: `docs/superpowers/specs/2026-08-17-start-root-career-check-redirect-design.md`

1. `apps/www/src/proxy.ts`에서 start 호스트의 `/`를 `/career-check`로 308 리디렉션하고 요청 쿼리를 보존한다.
2. 호스트와 경로 판정을 순수 함수로 분리해 루트, UTM 보존, 비대상 경로를 Node 단위 테스트로 검증한다.
3. 전체 테스트, lint, TypeScript 및 production build 컴파일을 확인한다.
4. 변경 파일만 커밋하고 CDKorea PR 검사 통과 후 main에 병합해 Vercel production 배포를 확인한다.

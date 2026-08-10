# 공식 사이트 Preview 라우팅 구현 계획

설계 기준: `docs/superpowers/specs/2026-08-10-official-site-preview-routing-design.md`

1. `apps/www/src/features/site-routing/hosts.ts`
   - Vercel Preview 환경과 `feature/official-site` 브랜치를 함께 판별하는 함수를 추가한다.
   - 검증: Production, 다른 Preview 브랜치에는 적용되지 않는 조건인지 코드 검토한다.
2. `apps/www/src/proxy.ts`
   - 기존 공식 호스트 조건에 승인된 Preview 판별 결과를 추가한다.
   - 검증: 공식·전환 경로의 기존 redirect/rewrite 순서를 유지한다.
3. 정적 검증 및 배포
   - ESLint와 TypeScript 검사를 실행한다.
   - 변경 파일만 커밋해 `feature/official-site`에 푸시하고 Vercel Preview가 새로 생성되는지 확인한다.

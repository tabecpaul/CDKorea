# 자가진단 랜딩 상단 CTA 제거 구현 계획

정본 설계: `docs/superpowers/specs/2026-08-17-career-check-header-cta-removal-design.md`

1. `CareerCheckLanding.tsx`의 상단 `PDF 무료 받기` 앵커만 제거한다.
2. 전체 테스트, lint, TypeScript와 production 컴파일을 확인한다.
3. CDKorea PR 검사 통과 후 main에 병합하고 Vercel production에서 버튼 제거와 이메일 폼 유지를 확인한다.

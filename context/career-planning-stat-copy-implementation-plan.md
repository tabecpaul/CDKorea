# 장기적 진로설계 5.4% 통계 문구 정정 구현 계획

정본 설계: `docs/superpowers/specs/2026-08-17-career-planning-stat-copy-design.md`

1. 운영 저장소 최신 `main`에서 `5.4%`와 장기적 진로설계 통계가 쓰인 웹과 일반 문서 위치를 전수 확인한다.
2. `/career-check` 통계 카드를 승인 문안으로 수정하고 기존 출처·표본·링크를 보존한다.
3. 통계 근거 문서의 정의 및 해석 주의를 승인 원칙에 맞춰 통일한다.
4. Canva에서 수정·업로드하는 PDF와 PDF 제작 명세는 변경하지 않고, PDF 3페이지의 진로불안 데이터를 보존한다.
5. 텍스트 검색과 웹 lint·타입 검사·빌드로 회귀를 검증한다.
6. 변경 파일만 커밋하고 CDKorea PR 검사 통과 후 `main` 병합 및 Vercel production의 웹·PDF 노출을 확인한다.

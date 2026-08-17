# Canva 진로 방향 자가진단 PDF 교체·최적화 구현 계획

정본 설계: `docs/superpowers/specs/2026-08-17-canva-career-check-pdf-optimization-design.md`

1. Canva 원본의 페이지, 크기, 텍스트, 링크, 이미지 및 메타데이터를 기준값으로 기록한다.
2. 원본을 변경하지 않고 별도 임시 파일에서 무손실 구조 최적화와 균형 이미지 최적화를 시험한다.
3. 1~2MB 목표와 시각 품질을 함께 만족하는 가장 보수적인 결과를 선택한다.
4. 최종 결과로 `apps/www/private-assets/career-direction-check-ko-v1.0.pdf`를 교체한다.
5. 전체 페이지 렌더링, 텍스트·링크·페이지 비교, 3페이지 통계 및 12페이지 QR 검수로 PDF를 확인한다.
6. 웹 lint와 production build를 실행하고 변경 파일만 커밋한다.

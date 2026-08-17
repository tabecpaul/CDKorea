# 운영 모니터 최신 성공 조회 오탐 수정 구현 계획

정본 설계: `docs/superpowers/specs/2026-08-17-operations-monitor-latest-success-query-fix-design.md`

## 1. 작업별 조회 경계 추가

- 파일: `apps/www/src/features/operations-monitor/server/jobRuns.ts`
- 작업 이름마다 `status = succeeded` 조건으로 최신 완료 기록 한 건을 조회한다.
- `Promise.all`로 작업별 조회를 병렬 실행하고 입력 순서대로 결과를 반환한다.
- 전체 통합 조회의 `limit: 100`과 `inArray` 사용을 제거한다.

## 2. 회귀 테스트 추가

- 파일: `tests/operations-monitor-job-runs.test.ts`
- 각 작업이 독립적으로 조회되는지 검증한다.
- 다른 작업 기록량과 무관하게 `operations-monitor` 결과가 유지되는지 검증한다.
- 실제 성공 기록이 없는 작업은 `completedAt: null`인지 검증한다.

## 3. 검증

- Node 테스트 전체 실행
- `apps/www` lint 실행
- TypeScript 타입 검사 또는 production build 실행
- 변경 파일과 Git diff 확인

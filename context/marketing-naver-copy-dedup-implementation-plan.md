# 네이버 채널 상세 원고 중복 제거 구현 계획

기준 설계:
`docs/superpowers/specs/2026-08-24-marketing-naver-copy-dedup-design.md`

## Task 1 — 중복 방지 회귀 테스트

**파일**

- 수정: `tests/marketing-channel-context.test.ts`

**작업**

1. `ChannelContentDetail`의 공통 문안 섹션이 `channel !== "naver"` 조건으로
   렌더링되는지 검사한다.
2. 네이버 `NaverPublishingPanel`은 계속 렌더링되는지 검사한다.
3. Facebook·Instagram·Threads 문안 분기는 유지되는지 검사한다.

**검증**

```bash
npx tsx --test tests/marketing-channel-context.test.ts
```

## Task 2 — 네이버 공통 문안 영역 제거

**파일**

- 수정: `apps/www/src/features/marketing/components/ChannelContentDetail.tsx`

**작업**

1. 공통 문안 섹션 전체를 네이버가 아닐 때만 렌더링한다.
2. 내부 문안 선택에서는 네이버 분기를 제거한다.
3. 네이버 수동 발행 패널과 그 안의 원고는 그대로 유지한다.

## Task 3 — 전체 검증과 배포

```bash
npx tsx --test tests/marketing-*.test.ts
npx tsc --noEmit -p apps/www/tsconfig.json
npm run lint -w www
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres npx next build --webpack
git diff --check
```

- 사용자 소유 미추적 카드뉴스 파일은 수정하거나 스테이징하지 않는다.
- DB, API, 콘텐츠 데이터와 외부 게시 동작은 변경하지 않는다.
- PR 병합 후 Production 네이버 상세에서 원고가 한 번만 표시되는지 확인한다.

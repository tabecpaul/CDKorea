# 네이버 채널 상세 텍스트 전용 표시 구현 계획

기준 설계:
`docs/superpowers/specs/2026-08-24-marketing-naver-text-only-design.md`

## Task 1 — 채널별 카드뉴스 정책 테스트 수정

**파일**

- 수정: `tests/marketing-channel-context.test.ts`
- 수정: `tests/marketing-naver-completion.test.ts`

**작업**

1. `ChannelContentDetail`의 카드뉴스 채널이 Facebook·Instagram으로 명시되는지
   검사한다.
2. 네이버와 Threads가 이미지 없는 안내 분기를 사용하는지 검사한다.
3. `NaverPublishingPanel`이 `assets` 입력과 `카드뉴스 순서`를 갖지 않는지 검사한다.
4. Facebook·Instagram 카드뉴스와 기존 네이버 완료 API 검사는 유지한다.

**검증**

```bash
npx tsx --test tests/marketing-channel-context.test.ts tests/marketing-naver-completion.test.ts
```

변경 전에는 새 정책 검사가 실패하고 변경 후 통과해야 한다.

## Task 2 — 네이버 채널 상세에서 카드뉴스 제거

**파일**

- 수정: `apps/www/src/features/marketing/components/ChannelContentDetail.tsx`

**작업**

1. `usesCards`를 `facebook` 또는 `instagram`일 때만 참으로 계산한다.
2. 네이버에는 장문 원고·하단 CTA 방식이며 카드뉴스를 사용하지 않는다는 안내를
   표시한다.
3. Threads의 기존 텍스트 전용 안내는 유지한다.
4. 네이버 `NaverPublishingPanel` 호출에서 `assets`를 제거한다.

**검증**

- 네이버 분기에는 `AssetPreviewGallery`가 렌더링되지 않는다.
- Facebook·Instagram 분기에는 갤러리가 유지된다.
- Threads 분기는 기존과 동일하다.

## Task 3 — 네이버 수동 발행 패널에서 이미지 목록 제거

**파일**

- 수정: `apps/www/src/features/marketing/components/NaverPublishingPanel.tsx`

**작업**

1. `Asset` 타입과 `assets` prop을 제거한다.
2. `카드뉴스 순서` 영역을 제거한다.
3. 원고, 카테고리, CTA·UTM, 두 확인 항목, 게시 URL과 완료 기록은 변경하지 않는다.

**검증**

- 타입 검사에서 사용하지 않는 입력이 없다.
- 네이버 완료 요청과 유효성 조건은 이전과 동일하다.

## Task 4 — 전체 회귀 검증

**명령**

```bash
npx tsx --test tests/marketing-*.test.ts
npx tsc --noEmit -p apps/www/tsconfig.json
npm run lint -w www
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres npx next build --webpack
git diff --check
```

**확인 사항**

- 사용자 소유의 미추적 카드뉴스 파일은 스테이징하거나 수정하지 않는다.
- DB migration, 외부 게시 요청, 자동 발행 기능을 추가하지 않는다.
- 변경 파일만 커밋하고 PR 검증 후 Production에서 네이버·Meta·Threads 및 전체
  검토 화면을 읽기 전용으로 확인한다.

# 마케팅 채널별 상세 문맥 구현 계획

기준 설계:
`docs/superpowers/specs/2026-08-24-marketing-channel-context-design.md`

## 범위 고정

- 캘린더에서 선택한 channel과 schedule을 상세 화면까지 유지한다.
- Threads는 문안과 일정만 표시하고 이미지 요청을 만들지 않는다.
- 네이버·Facebook·Instagram은 해당 채널 자료와 카드뉴스를 표시한다.
- 콘텐츠 목록의 직접 상세 링크는 기존 전체 검토 화면을 유지한다.
- DB, API, 승인·일정 상태와 외부 게시 동작은 변경하지 않는다.
- DB migration과 환경변수 추가는 없다.

## Task 1 — 채널 선택 파서와 관계 검증

**파일**

- 새 파일: `apps/www/src/features/marketing/channelContext.ts`
- 새 테스트: `tests/marketing-channel-context.test.ts`

**작업**

1. 상세 query의 최소 타입을 정의한다.

```ts
type ChannelContextQuery = {
  channel?: string | string[];
  schedule?: string | string[];
};
```

2. channel과 schedule이 모두 없으면 `{ kind: "overview" }`를 반환한다.
3. 둘 중 하나만 있거나 배열, 비허용 채널, 양의 safe integer가 아닌 schedule은
   `{ kind: "invalid" }`로 분류한다.
4. 검증 입력은 현재 version ID와 일정의 최소 필드만 받는다.
5. schedule ID, content ID, version ID와 channel이 모두 일치할 때만
   `{ kind: "channel", channel, schedule }`을 반환한다.
6. URL query를 근거로 채널이나 일정을 추정하지 않는다.

**검증**

```bash
npx tsx --test tests/marketing-channel-context.test.ts
```

- query 없음은 overview다.
- partial, 배열, 알 수 없는 채널과 잘못된 ID는 invalid다.
- 다른 콘텐츠·이전 버전·channel 불일치 일정은 invalid다.
- 정확한 현재 일정만 channel 결과를 만든다.

## Task 2 — 캘린더 링크에 채널 문맥 보존

**파일**

- 수정: `apps/www/src/features/marketing/components/MarketingCalendar.tsx`
- 수정: `tests/marketing-channel-context.test.ts`

**작업**

1. 각 캘린더 Link를 다음 구조로 바꾼다.

```tsx
href={{
  pathname: `/admin/marketing/${item.contentId}`,
  query: { channel: item.channel, schedule: String(item.id) },
}}
```

2. 콘텐츠 목록의 상세 Link는 수정하지 않는다.
3. 기존 Link 기반 prefetch와 채널 라벨·일정 표시를 유지한다.

**검증**

- 캘린더 링크에 channel과 schedule이 모두 존재한다.
- 콘텐츠 목록 링크에는 query가 붙지 않는다.

## Task 3 — 상세 페이지의 channel context 분기

**파일**

- 수정: `apps/www/src/app/admin/marketing/[id]/page.tsx`
- 새 파일: `apps/www/src/features/marketing/components/InvalidChannelContext.tsx`
- 수정: `tests/marketing-channel-context.test.ts`

**작업**

1. Next 16 방식으로 `searchParams` Promise를 받는다.
2. 관리자 인증과 기존 콘텐츠 조회 후 Task 1 파서를 호출한다.
3. overview면 기존 `ContentDetail`을 렌더링한다.
4. channel이면 새 `ChannelContentDetail`을 렌더링한다.
5. invalid면 콘텐츠 헤더 아래에 다음을 표시한다.

```text
선택한 채널 일정을 찾을 수 없습니다.
전체 콘텐츠 검토로 이동
```

6. invalid를 overview로 자동 대체하지 않는다.
7. channel 화면 헤더에 선택 채널 배지와 query 없는 전체 검토 링크를 표시한다.

**검증**

- overview, channel, invalid 세 분기가 명확하다.
- 인증과 not-found 동작이 유지된다.

## Task 4 — 공통 표시 구성 요소 분리

**파일**

- 새 파일: `apps/www/src/features/marketing/components/ChannelScheduleSummary.tsx`
- 새 파일: `apps/www/src/features/marketing/components/MarketingCopyBlock.tsx`
- 수정: `apps/www/src/features/marketing/components/ContentDetail.tsx`

**작업**

1. 기존 `CopyBlock`을 `MarketingCopyBlock`으로 옮기고 전체 상세에서 재사용한다.
2. `ChannelScheduleSummary`는 선택 채널, 예정 시각 KST, mode, status와 UTM을
   읽기 전용으로 표시한다.
3. 기존 전체 상세의 표시와 동작은 바꾸지 않는다.
4. 공통 구성 요소에 버튼이나 상태 변경 요청을 추가하지 않는다.

**검증**

- 전체 상세의 네이버·Meta·Threads 문안이 이전과 동일하게 표시된다.
- 일정 요약은 선택된 일정 하나만 받는다.

## Task 5 — 채널별 상세 화면

**파일**

- 새 파일: `apps/www/src/features/marketing/components/ChannelContentDetail.tsx`
- 수정: `tests/marketing-channel-context.test.ts`

**작업**

1. 현재 version, current assets와 검증된 schedule만 입력으로 받는다.
2. 네이버:
   - `AssetPreviewGallery`
   - `MarketingCopyBlock`의 네이버 원고
   - `NaverPublishingPanel`
   - `ChannelScheduleSummary`
3. Facebook·Instagram:
   - `AssetPreviewGallery`
   - `MarketingCopyBlock`의 공용 Meta 문안
   - `ChannelScheduleSummary`
4. Threads:
   - `MarketingCopyBlock`의 Threads 문안
   - `ChannelScheduleSummary`
   - `Threads는 현재 이미지 없이 문안으로 발행합니다` 안내
5. Threads branch는 `AssetPreviewGallery`, asset preview URL과 `NaverPublishingPanel`을
   렌더링하지 않는다.
6. 모든 channel branch에서 `ApprovalActions`와 `AssetUploader`를 렌더링하지 않는다.
7. 수정·승인 필요 시 전체 검토 화면으로 이동하도록 안내한다.

**검증**

- Threads source branch에 asset gallery가 없음.
- 네이버·Facebook·Instagram에 카드뉴스가 있음.
- 네이버에만 수동 발행 패널이 있음.
- 채널별 화면에는 최종 승인 및 수정본 업로드 action이 없음.

## Task 6 — 전체 회귀·타입·빌드 검증

**명령**

```bash
npx tsx --test tests/marketing-channel-context.test.ts
npx tsx --test tests/marketing-*.test.ts
npx tsc --noEmit -p apps/www/tsconfig.json
npm run lint -w www
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres npx next build --webpack
git diff --check
```

**확인 사항**

- 관리자 이미지 미리보기, 승인, 네이버 완료, Drive 가져오기 테스트가 계속 통과한다.
- 새 API·DB migration·환경변수가 없다.
- 외부 채널 POST와 DB write가 없다.
- Threads 화면 HTML에 asset preview route가 없다.
- 사용자 소유의 미추적 카드뉴스 파일을 stage하거나 수정하지 않는다.

## Task 7 — PR과 Production 배포 게이트

**작업**

1. diff를 채널 문맥 UI와 문서로 제한한다.
2. 기능 브랜치를 운영 저장소에 push하고 PR을 만든다.
3. Vercel Preview와 병합 가능 상태를 확인한다.
4. 사용자 승인 후에만 main에 병합한다.
5. Vercel Production 배포 성공을 확인한다.

## Task 8 — Production 읽기 전용 확인

**순서**

1. 캘린더 Threads 항목을 클릭한다.
2. URL에 `channel=threads`와 해당 schedule ID가 있는지 확인한다.
3. Threads 문안·일정·UTM은 보이고 카드뉴스와 이미지 요청은 없는지 확인한다.
4. 네이버 항목에서 카드뉴스 8장과 네이버 수동 발행 패널을 확인한다.
5. Facebook·Instagram 항목에서 카드뉴스와 선택 채널 일정만 확인한다.
6. 콘텐츠 목록에서 직접 열어 전체 검토 화면을 확인한다.
7. 잘못된 schedule URL에서 명시적 오류 안내를 확인한다.
8. 승인·일정·게시 상태가 이전과 같은지 확인한다.
9. 통합 운영 백로그에 채널별 상세 문맥 완료를 기록한다.

Production 확인 중 승인, 수정본 업로드와 수동 발행 완료 버튼은 누르지 않는다.

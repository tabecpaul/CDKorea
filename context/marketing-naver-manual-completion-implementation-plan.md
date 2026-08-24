# 네이버 수동 발행 완료 구현 계획

기준 설계:
`docs/superpowers/specs/2026-08-24-marketing-naver-manual-completion-design.md`

## 범위 고정

- 기존 콘텐츠 상세 화면에 네이버 전용 수동 발행 패널을 보완한다.
- 기존 `marketing_channel_schedules` 필드를 재사용하고 DB migration을 만들지 않는다.
- 네이버 게시를 자동화하거나 외부 네이버 URL에 서버 요청을 보내지 않는다.
- 콘텐츠 승인과 Facebook·Instagram·Threads 상태는 변경하지 않는다.
- Meta 게시, Drive Cron과 자동 발행 환경변수는 건드리지 않는다.

## Task 1 — 완료 요청 파서와 URL 검증

**파일**

- 새 파일: `apps/www/src/features/marketing/naverCompletionRequest.ts`
- 새 테스트: `tests/marketing-naver-completion.test.ts`

**작업**

1. 요청 타입을 다음 세 필드로 한정한다.

```ts
type NaverCompletionRequest = {
  publishedUrl: string;
  ctaLinked: true;
  mobileDestinationChecked: true;
};
```

2. 객체가 아니거나 알 수 없는 필드가 있는 요청을 거부한다.
3. 두 확인값은 boolean `true`만 허용한다.
4. `publishedUrl`을 trim한 뒤 URL parser로 검사한다.
5. protocol은 `https:`, hostname은 정확히 `blog.naver.com`이어야 한다.
6. username과 password가 있으면 거부한다.
7. 검증된 URL은 query와 fragment를 보존한 문자열로 반환한다.

**검증**

```bash
npx tsx --test tests/marketing-naver-completion.test.ts
```

- 정상 요청만 파싱된다.
- 체크 누락, HTTP, 유사 hostname, 사용자 정보 포함 URL과 추가 필드는 거부된다.

## Task 2 — 서버 완료 서비스와 transaction

**파일**

- 새 파일: `apps/www/src/features/marketing/server/naverCompletion.ts`
- 수정: `tests/marketing-naver-completion.test.ts`

**작업**

1. `completeNaverPublication(contentId, request, actor)` 서비스를 만든다.
2. transaction 시작 후 content ID 기반 advisory lock을 획득한다.
3. 콘텐츠와 `currentVersionId`를 다시 조회한다.
4. 현재 버전이 콘텐츠에 속하고 상태가 `approved`이며
   `approvedSnapshotHash`가 존재하는지 확인한다.
5. 현재 버전의 `channel=naver` 일정을 조회하고 `mode=manual`인지 확인한다.
6. 현재 버전의 `naverBody`와 일정의 `utmUrl`이 비어 있지 않은지 확인한다.
7. 미완료 일정만 아래 필드로 갱신한다.

```ts
{
  status: "manual_published",
  publishedUrl: request.publishedUrl,
  publishedAt: now,
  updatedAt: now,
  lastErrorCode: null,
}
```

8. `marketing_audit_logs`에 `naver_manual_published`를 한 번 기록한다.
   details에는 `{ ctaLinked: true, mobileDestinationChecked: true, publishedHost: "blog.naver.com" }`만 넣는다.
9. 같은 일정과 같은 URL의 재요청은 `duplicate: true`로 반환하고 write하지 않는다.
10. 완료된 일정의 URL과 다른 URL은 상태 충돌로 거부한다.
11. 콘텐츠 버전과 다른 채널 일정은 update하지 않는다.

**오류 코드**

- `CONTENT_NOT_FOUND`
- `CONTENT_VERSION_NOT_FOUND`
- `CONTENT_NOT_APPROVED`
- `NAVER_COPY_MISSING`
- `NAVER_SCHEDULE_NOT_FOUND`
- `NAVER_SCHEDULE_MODE_INVALID`
- `NAVER_SCHEDULE_CONFLICT`

**검증**

- source contract 테스트로 네이버 일정만 update하는지 확인한다.
- 외부 `fetch`, Drive client와 Meta client 참조가 없음을 확인한다.
- 감사 로그에 전체 URL이나 본문을 details로 넣지 않는지 확인한다.

## Task 3 — 관리자 API route

**파일**

- 새 파일: `apps/www/src/app/api/admin/marketing/[id]/naver-complete/route.ts`
- 수정: `tests/marketing-naver-completion.test.ts`

**작업**

1. 기존 `hasAdminSession()` 인증 패턴을 재사용한다.
2. route parameter를 양의 safe integer로 검증한다.
3. JSON parsing 실패와 요청 파서 실패는 400으로 응답한다.
4. 서비스 오류를 다음처럼 매핑한다.

```text
404: CONTENT_NOT_FOUND, CONTENT_VERSION_NOT_FOUND, NAVER_SCHEDULE_NOT_FOUND
409: CONTENT_NOT_APPROVED, NAVER_SCHEDULE_MODE_INVALID, NAVER_SCHEDULE_CONFLICT
400: NAVER_COPY_MISSING 또는 요청 검증 오류
500: 분류되지 않은 DB 오류
```

5. 성공 응답은 `ok`, `duplicate`, `scheduleId`, `status`, `publishedUrl`,
   `publishedAt`만 반환한다.

**검증**

- 관리자 인증이 없는 요청을 차단한다.
- 오류 상태 매핑과 성공 응답 필드가 설계와 일치한다.

## Task 4 — 네이버 수동 발행 패널

**파일**

- 새 파일: `apps/www/src/features/marketing/components/NaverPublishingPanel.tsx`
- 수정: `apps/www/src/features/marketing/components/ContentDetail.tsx`
- 수정: `tests/marketing-naver-completion.test.ts`

**작업**

1. `ContentDetail`에서 현재 버전의 `naver` 일정과 카드뉴스 자산을 패널에 전달한다.
2. 패널 상단에 현재 버전, 예약 시각, 카테고리와 상태를 표시한다.
3. 네이버 원고를 원문 그대로 스크롤 가능한 블록에 표시한다.
4. 승인된 카드 순서대로 position, filename과 크기를 표시한다.
5. CTA 종류와 네이버 일정의 UTM URL을 표시하고 복사 가능한 형태로 제공한다.
6. 다음 두 checkbox를 명시적으로 표시한다.

```text
CTA 문구에 링크를 직접 연결했습니다.
모바일에서 신청 화면이 정상적으로 열리는지 확인했습니다.
```

7. 게시 URL 입력란은 `https://blog.naver.com/...` 예시를 사용한다.
8. 승인된 현재 버전, 수동 네이버 일정, 두 체크와 URL이 모두 있어야 버튼을 활성화한다.
9. 제출 중 중복 클릭을 막고 성공 후 `router.refresh()`로 서버 상태를 다시 읽는다.
10. 완료된 일정은 체크와 입력을 숨기고 게시 링크와 KST 완료 시각을 읽기 전용으로 표시한다.
11. 승인 전 또는 자료 누락 시 구체적인 비활성 사유를 표시한다.

**검증**

- UI에 두 확인 문구, 게시 URL 입력과 완료 버튼이 존재한다.
- 승인되지 않은 콘텐츠에서는 완료 버튼이 비활성화된다.
- Meta나 Drive 작업 버튼을 추가하지 않는다.
- 모바일 너비에서 입력과 버튼이 화면을 벗어나지 않는다.

## Task 5 — 회귀 테스트와 정적 검증

**명령**

```bash
npx tsx --test tests/marketing-naver-completion.test.ts tests/marketing-approval.test.ts tests/marketing-state-machine.test.ts
npx tsx --test tests/marketing-*.test.ts
npx tsc --noEmit -p apps/www/tsconfig.json
npm run lint -w www
npm run build -w www
git diff --check
```

**확인 사항**

- 기존 승인 테스트가 계속 통과한다.
- 승인 동작이 여전히 일정을 자동 변경하지 않는다.
- 네이버 완료만 `manual_published`를 기록한다.
- 다른 채널의 상태, URL과 시각은 불변이다.
- 새로운 DB migration과 외부 게시 호출이 없다.
- 사용자 소유의 미추적 카드뉴스 파일을 stage하거나 수정하지 않는다.

## Task 6 — 변경 검토와 배포 게이트

**작업**

1. 변경 파일을 네이버 완료 범위로 제한해 diff를 검토한다.
2. secret, 전체 Drive ID 또는 Production DB URL이 diff에 포함되지 않았는지 확인한다.
3. PR을 만들고 CI 통과를 확인한다.
4. 사용자 승인 후에만 main에 병합한다.
5. Vercel Production 배포 성공을 확인한다.

## Task 7 — Production 수동 확인

**순서**

1. 관리자 콘텐츠 상세 화면에서 승인 콘텐츠를 연다.
2. 네이버 원고, 카테고리, 카드 순서, CTA와 UTM이 승인본과 일치하는지 확인한다.
3. 아직 게시하지 않은 콘텐츠로는 완료 조건과 오류 처리를 확인하되 임의 URL로 완료 처리하지 않는다.
4. 실제 네이버 발행이 완료된 콘텐츠가 있을 때 두 체크와 실제 게시 URL을 입력한다.
5. `manual_published`, 게시 링크와 KST 완료 시각을 확인한다.
6. Facebook, Instagram과 Threads 상태가 바뀌지 않았는지 확인한다.
7. 통합 운영 백로그에서 네이버 단계 상태를 `완료됨`으로 갱신한다.

Production에서 실제 게시 URL을 저장하는 작업은 사용자가 발행 완료를 확인하고
명시적으로 승인한 경우에만 수행한다.

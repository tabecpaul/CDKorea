# 마케팅 콘텐츠 승인 흐름 보완 구현 계획

기준 설계: `docs/superpowers/specs/2026-08-24-marketing-content-approval-design.md`

## 범위와 중단 조건

- 기존 승인 테이블, 상태 머신과 스냅샷 구조만 사용한다.
- 콘텐츠 승인 후에도 모든 채널 일정은 `approval_pending`, `manual`로 유지한다.
- 자동 게시, 외부 채널 POST, Drive Cron과 게시 완료 처리는 추가하지 않는다.
- 현재 버전이 아닌 요청이나 `review_pending` 이외 상태의 변경은 거부한다.
- 승인 스냅샷과 감사 로그를 남기지 못하면 상태를 바꾸지 않는다.

## 1. 테스트 가능한 승인 스냅샷 유틸리티

대상 파일:

- 수정: `apps/www/src/features/marketing/stateMachine.ts`
- 수정: `tests/marketing-state-machine.test.ts`

구현:

1. 기존 `ApprovalSnapshot`을 채널 고정 순서로 정규화하는 함수를 외부에서 재사용할 수 있게 한다.
2. 네이버·Meta·Threads 문안을 고정 순서로 직렬화해 SHA-256 `copyHash`를 만드는 서버 유틸리티를 추가한다.
3. 전체 스냅샷의 SHA-256 해시를 계산하는 함수를 추가한다.
4. 같은 입력의 결정성, 문안·이미지·CTA·UTM·일정 변경 감지를 테스트한다.

검증:

- 이미지 해시 순서는 `position` 순서다.
- 채널 값은 `marketingChannels` 순서다.
- 동일 입력은 동일한 64자리 소문자 16진 해시를 생성한다.

## 2. 승인·수정 요청 서버 서비스

신규 파일:

- `apps/www/src/features/marketing/server/approval.ts`

수정 파일:

- 필요 시 `apps/www/src/features/marketing/server/queries.ts`의 공통 조회만 작게 추출한다.

구현:

1. `approveMarketingContent(contentId, actor)`를 만든다.
2. 트랜잭션과 advisory lock으로 같은 콘텐츠의 경쟁 요청을 직렬화한다.
3. 콘텐츠, 현재 버전, 이미지, 일정과 기존 승인을 다시 읽는다.
4. `canTransitionContent(current.status, "approved")`를 통과하지 못하면 `CONTENT_STATE_CONFLICT`를 던진다.
5. 승인 스냅샷을 만들고 해시를 계산한다.
6. 같은 버전·같은 해시의 활성 승인이 이미 있으면 중복 삽입 없이 기존 결과를 반환한다.
7. 다른 활성 승인은 `superseded`로 변경하고 새 `approved` 행을 추가한다.
8. 현재 버전을 `approved`로, `approvedSnapshotHash`를 새 해시로 변경한다.
9. `content_approved` 감사 로그를 남긴다.
10. 채널 일정은 수정하지 않는다.
11. `requestMarketingRevision(contentId, note, actor)`를 만든다.
12. 1–1000자 메모와 `review_pending → revision_requested` 전환을 검증한다.
13. 상태와 `revisionNote`를 갱신하고 `content_revision_requested` 감사 로그를 남긴다.

검증:

- 승인과 감사 로그가 한 트랜잭션에서 함께 성공하거나 함께 실패한다.
- 승인 후 일정의 mode/status/시간/UTM이 바뀌지 않는다.
- 수정 요청은 승인 스냅샷을 생성하지 않는다.

## 3. 서비스 단위 테스트

신규 파일:

- `tests/marketing-approval.test.ts`

구현:

1. DB 의존 부분을 작은 저장소 인터페이스 또는 트랜잭션 함수 경계로 분리해 테스트한다.
2. 정상 승인, 정상 수정 요청, 중복 승인, 상태 충돌, 현재 버전 불일치를 검증한다.
3. 승인 전후 채널 일정 값이 동일한지 검증한다.
4. 승인 해시가 `marketing_approvals.snapshotHash`와 `marketing_content_versions.approvedSnapshotHash`에 동일하게 전달되는지 검증한다.

검증 명령:

```bash
npx tsx --test tests/marketing-state-machine.test.ts tests/marketing-approval.test.ts
```

## 4. 관리자 API

신규 파일:

- `apps/www/src/app/api/admin/marketing/[id]/approval/route.ts`

구현:

1. `hasAdminSession()`으로 인증한다.
2. 경로 ID를 양의 안전 정수로 검증한다.
3. JSON body를 정확히 두 형식으로 제한한다.
   - `{ "action": "approve" }`
   - `{ "action": "request_revision", "note": "..." }`
4. 성공 시 `{ ok: true, status, versionId }`를 반환한다.
5. 입력 오류 400, 미인증 401, 없음 404, 상태 충돌 409, 내부 오류 500을 구분한다.
6. 오류 응답에 Drive ID, 원고, SQL 또는 내부 예외 메시지를 노출하지 않는다.

검증:

- 기존 import/assets API의 인증 패턴과 일치한다.
- 승인 API에 외부 게시 함수나 Drive 클라이언트 import가 없다.

## 5. 관리자 상세 화면

신규 파일:

- `apps/www/src/features/marketing/components/ApprovalActions.tsx`

수정 파일:

- `apps/www/src/features/marketing/components/ContentDetail.tsx`

구현:

1. 현재 버전이 `review_pending`일 때만 액션을 활성화한다.
2. `최종 승인` 버튼과 `수정 요청` 메모·버튼을 표시한다.
3. 버튼 가까이에 “승인은 자동 게시하지 않으며 모든 채널은 수동 발행” 안내를 둔다.
4. 요청 중 중복 클릭을 막는다.
5. 성공 후 `router.refresh()`로 서버 상태를 다시 읽는다.
6. 성공·오류 메시지를 `role="status"`로 표시한다.
7. 승인 뒤에는 상태와 승인 기록을 읽기 전용으로 표시하고 액션을 비활성화한다.

검증:

- 모바일에서 버튼과 메모가 가로로 넘치지 않는다.
- 승인 버튼이 게시·예약 의미로 표현되지 않는다.
- 기존 Canva 수정본 업로드와 문안·일정 표시를 가리지 않는다.

## 6. 전체 검증

실행 순서:

1. 관련 Node 테스트
2. TypeScript 검사
3. ESLint
4. Next.js webpack production build
5. `git diff --check`
6. PR 생성과 Vercel Preview 확인

중단 조건:

- 승인 후 채널 일정이 `scheduled` 또는 게시 상태로 바뀜
- 승인 없이 `approved` 상태가 됨
- 동일 클릭으로 승인 행이 중복 생성됨
- 기존 Drive 가져오기나 Canva 수정본 업로드 회귀
- 관리자 인증 우회

## 7. Production 적용

1. 사용자 승인 후 PR을 병합한다.
2. Vercel Production Ready를 확인한다.
3. 관리자 상세 화면에서 현재 `은사·재능·강점` v1을 연다.
4. 사용자의 별도 최종 확인 후 `최종 승인`을 한 번 실행한다.
5. 콘텐츠 상태 `approved`, 승인 기록 `approved`, v1 해시 존재를 확인한다.
6. 네 채널 일정이 모두 `approval_pending`, `manual`인지 확인한다.
7. 외부 게시가 발생하지 않았음을 확인한다.

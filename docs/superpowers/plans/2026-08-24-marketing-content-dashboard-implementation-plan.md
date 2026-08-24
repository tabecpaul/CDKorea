# Career Direct Korea 마케팅 콘텐츠 대시보드 구현 계획

기준 설계: `docs/superpowers/specs/2026-08-24-marketing-content-dashboard-design.md`

## 구현 원칙

- 각 단계는 별도 PR로 구현하고 Production 반영 전에 사용자의 승인을 받는다.
- 자동 게시 기능은 Meta 연결 검증과 dry-run을 통과하기 전까지 항상 꺼진 상태로 배포한다.
- 관리자 최종 승인이 없는 콘텐츠는 어떤 채널에도 게시하지 않는다.
- 네이버 블로그는 수동 발행을 유지한다.
- 기존 사용자 콘텐츠 파일과 무관한 변경은 커밋하지 않는다.
- 새 DB 작업 전 Production Supabase ref `fytkptzbnhfsqsktmzpx`와 `PRODUCTION_DATABASE_URL` 대상을 다시 검증한다.

## 단계 0. 외부 제약과 Production 대상 사전 검증

**파일**

- `context/marketing-dashboard-production-readiness.md`
- `.env.example`

**작업**

1. Vercel Production이 `fytkptzbnhfsqsktmzpx`를 가리키는지 비밀값을 출력하지 않고 확인한다.
2. GitHub `PRODUCTION_DATABASE_URL`의 프로젝트 ref를 다시 확인한다.
3. 현재 Vercel 요금제에서 1분 간격 예약 실행이 가능한지 확인한다.
4. Meta 앱, Facebook 페이지, Instagram 프로페셔널 계정과 Threads 프로필의 연결 상태를 읽기 전용으로 확인한다.
5. 필요한 게시 권한과 토큰 수명, 앱 검수 필요 여부를 공식 문서와 실제 계정 상태로 기록한다.
6. 환경변수 이름만 `.env.example`에 추가한다. 실제 값은 저장소에 넣지 않는다.

**환경변수 후보**

```text
MARKETING_AUTOPUBLISH_CHANNELS=
META_APP_ID=
META_APP_SECRET=
META_PAGE_ID=
META_PAGE_ACCESS_TOKEN=
META_INSTAGRAM_ACCOUNT_ID=
META_THREADS_USER_ID=
META_THREADS_ACCESS_TOKEN=
GOOGLE_DRIVE_OPERATIONS_FOLDER_ID=
GOOGLE_DRIVE_CLIENT_EMAIL=
GOOGLE_DRIVE_PRIVATE_KEY=
```

**검증**

- Production DB ref, Vercel 프로젝트와 GitHub secret의 대상이 모두 일치한다.
- Meta 읽기 전용 API 호출은 계정 ID만 기록하고 토큰을 로그에 남기지 않는다.
- 하나라도 확인되지 않으면 자동 발행 단계는 차단 상태로 남긴다.

## 단계 1. 공통 관리자 셸과 화면 전환 성능 개선

**파일**

- `apps/www/src/app/admin/layout.tsx`
- `apps/www/src/app/admin/loading.tsx`
- `apps/www/src/features/admin/components/AdminShell.tsx`
- `apps/www/src/features/admin/components/AdminNavigation.tsx`
- `apps/www/src/features/admin/components/AdminSectionSkeleton.tsx`
- `apps/www/src/app/admin/analytics/page.tsx`
- `apps/www/src/app/admin/callbacks/page.tsx`
- `apps/www/src/app/admin/callbacks/loading.tsx`
- `apps/www/src/features/analytics/server/dashboard.ts`
- `apps/www/src/features/assessment-callback/server/admin.ts`

**작업**

1. 관리자 세션 검사를 공통 `admin/layout.tsx`로 옮기고 로그인 화면은 중복 검사 없이 유지한다.
2. 콜백, 전환 분석, 마케팅 메뉴가 유지되는 공통 셸을 만든다.
3. 각 메뉴 링크를 Next.js `Link`로 구성하고 사전 로딩을 허용한다.
4. 전환 직후 공통 골격이 표시되도록 관리자 기본 및 경로별 `loading.tsx`를 추가한다.
5. 전환 분석의 일곱 집계 쿼리를 독립적인 `Suspense` 영역 또는 서버 데이터 단위로 분리한다.
6. 분석 집계에 짧은 서버 캐시를 적용하고 기간 변경 시에만 캐시 키를 분리한다.
7. 콜백 목록을 100건 일괄 조회에서 cursor 기반 페이지 조회로 변경한다.
8. 기존 URL과 필터 동작을 보존한다.

**핵심 인터페이스**

```ts
type AdminSection = "callbacks" | "analytics" | "marketing";

type CallbackPageCursor = {
  createdAt: string;
  id: number;
};
```

**검증**

- 로그인하지 않은 사용자는 기존과 같이 `/admin/login`으로 이동한다.
- 메뉴 클릭 즉시 선택 상태와 골격이 나타난다.
- 콜백·분석 데이터가 서로의 조회를 유발하지 않는다.
- 7·30·90일 필터와 기존 콜백 필터가 유지된다.
- 개발 및 Production에서 클릭 피드백, 골격, 일반 데이터 표시 시간을 측정한다.

## 단계 2. 마케팅 도메인과 상태 전이

**파일**

- `apps/www/src/features/marketing/domain.ts`
- `apps/www/src/features/marketing/stateMachine.ts`
- `tests/marketing-state-machine.test.ts`

**작업**

1. 콘텐츠, 버전, 채널, 승인과 발행 상태를 문자열 리터럴 allowlist로 정의한다.
2. 허용된 상태 전이만 수행하는 순수 함수를 만든다.
3. 문안, 이미지, CTA, UTM 또는 발행 시각 변경 시 `재승인 필요`를 반환한다.
4. 이미 발행된 채널은 승인 취소 대상에서 제외한다.
5. 콘텐츠 전체 상태는 채널별 상태를 요약해 계산하고 저장값을 맹신하지 않는다.

**핵심 인터페이스**

```ts
export type MarketingContentStatus =
  | "proposal"
  | "producing"
  | "review_pending"
  | "revision_requested"
  | "approved"
  | "scheduled"
  | "published";

export type MarketingChannel = "naver" | "facebook" | "instagram" | "threads";

export function requiresReapproval(previous: ApprovalSnapshot, next: ApprovalSnapshot): boolean;
export function canTransitionContent(from: MarketingContentStatus, to: MarketingContentStatus): boolean;
```

**검증**

- 승인 없는 `scheduled` 전이를 거부한다.
- 승인 후 이미지 한 장, CTA, UTM 또는 시각 변경도 재승인을 요구한다.
- 부분 발행과 네이버 수동 완료가 전체 상태를 올바르게 계산한다.

## 단계 3. 마케팅 데이터베이스와 RLS

**파일**

- `packages/db/src/schema.ts`
- `packages/db/src/index.ts`
- `packages/db/drizzle/<generated>_marketing_content_dashboard.sql`
- `tests/marketing-schema-contract.test.ts`

**작업**

1. 다음 테이블을 추가한다.
   - `marketing_contents`
   - `marketing_content_versions`
   - `marketing_content_assets`
   - `marketing_channel_schedules`
   - `marketing_approvals`
   - `marketing_publish_attempts`
   - `marketing_connections`
   - `marketing_audit_logs`
2. 버전 번호는 콘텐츠별 unique index로 보호한다.
3. 일정은 콘텐츠 버전과 채널의 조합을 unique index로 보호한다.
4. 발행 시도는 고유 발행 키로 중복을 차단한다.
5. 예정 발행 조회용 `(status, scheduled_at)` index를 추가한다.
6. 모든 테이블의 RLS를 활성화하고 `anon`, `authenticated` 권한을 제거한다.
7. 관리자 서버 연결만 접근하도록 하고 공개 정책은 만들지 않는다.

**주요 컬럼**

```text
marketing_contents:
  id, slug, title, campaign_key, cta_kind, naver_category,
  current_version_id, created_at, updated_at

marketing_content_versions:
  id, content_id, version, status, naver_body, meta_caption,
  threads_posts(jsonb), drive_folder_id, canva_design_url,
  approved_snapshot_hash, created_by, revision_note, created_at

marketing_content_assets:
  id, version_id, position, drive_file_id, filename, mime_type,
  byte_size, sha256, width, height, created_at

marketing_channel_schedules:
  id, content_id, version_id, channel, scheduled_at, mode,
  utm_url, status, published_post_id, published_url, published_at,
  last_error_code, created_at, updated_at
```

**검증**

- 생성 SQL의 foreign key, unique/index, NOT NULL과 RLS를 검사한다.
- 공개 역할의 select/insert/update/delete가 모두 차단된다.
- 잘못된 Production ref에서는 마이그레이션 실행을 중지한다.
- 적용 후 Supabase Security Advisor 오류 0건을 확인한다.

## 단계 4. 관리자 마케팅 조회 화면

**파일**

- `apps/www/src/app/admin/marketing/page.tsx`
- `apps/www/src/app/admin/marketing/loading.tsx`
- `apps/www/src/app/admin/marketing/error.tsx`
- `apps/www/src/app/admin/marketing/[id]/page.tsx`
- `apps/www/src/features/marketing/server/queries.ts`
- `apps/www/src/features/marketing/components/MarketingSummary.tsx`
- `apps/www/src/features/marketing/components/MarketingCalendar.tsx`
- `apps/www/src/features/marketing/components/ContentList.tsx`
- `apps/www/src/features/marketing/components/ContentDetail.tsx`
- `apps/www/src/features/marketing/components/ChannelStatus.tsx`

**작업**

1. 이번 주 요약, 캘린더, 콘텐츠 목록과 연결 상태를 독립 조회한다.
2. 달력은 KST 기준 주간 및 월간 범위를 지원하되 초기 화면은 주간으로 제한한다.
3. 콘텐츠 목록은 cursor 페이지 분할과 상태 필터를 사용한다.
4. 상세 화면은 현재 버전, 이전 버전, 이미지 미리보기, CTA, UTM과 채널 상태를 표시한다.
5. 이미지 원본을 불러오지 않고 별도 미리보기 URL을 사용한다.
6. 영역별 오류를 해당 카드 안에 표시하고 전체 화면을 막지 않는다.

**검증**

- 빈 데이터, 한 채널만 있는 콘텐츠와 부분 실패를 올바르게 표시한다.
- 모바일에서 캘린더와 콘텐츠 목록이 가로 넘침 없이 사용 가능하다.
- 기존 콜백·분석 메뉴 이동 속도가 느려지지 않는다.
- 공개 접근과 잘못된 ID 접근을 차단한다.

## 단계 5. Drive 패키지 가져오기와 Canva 수정본 업로드

**파일**

- `apps/www/src/features/marketing/server/drive.ts`
- `apps/www/src/features/marketing/server/packageManifest.ts`
- `apps/www/src/features/marketing/server/assets.ts`
- `apps/www/src/app/api/admin/marketing/import/route.ts`
- `apps/www/src/app/api/cron/marketing-import/route.ts`
- `apps/www/src/features/marketing/server/importJob.ts`
- `apps/www/src/app/api/admin/marketing/[id]/assets/route.ts`
- `packages/db/operations/schedule-marketing-import-cron.sql`
- `apps/www/src/features/marketing/components/AssetUploader.tsx`
- `tests/marketing-package-manifest.test.ts`
- `tests/marketing-assets.test.ts`
- `docs/marketing-content-package-manifest.md`

**작업**

1. ChatGPT Work가 Drive 주차별 폴더에 저장할 `content-package.json` 형식을 정의한다.
2. manifest에는 주제, 캠페인, CTA, 카테고리, 채널별 시각·UTM, 원고 파일과 이미지 파일 ID만 허용한다.
3. 관리자 import API가 Drive에서 manifest와 파일 메타데이터를 읽고 엄격히 검증한다.
4. 이미 가져온 패키지 ID는 중복 등록하지 않는다.
5. 별도 import Cron이 운영 폴더의 새 manifest를 주기적으로 찾아 같은 검증 경로로 가져오고 `system_job_runs`에 결과를 기록한다.
6. 사용자 PNG 업로드는 4~8장, PNG MIME, 크기 제한, 1080×1350 규격과 순서를 검증한다.
7. 업로드된 수정본은 새 버전과 Drive 하위 폴더로 저장하며 기존 버전을 보존한다.
8. 모든 승인 대상 이미지에 SHA-256을 저장한다.

**manifest 예시**

```json
{
  "schemaVersion": 1,
  "packageId": "2026-08-31-career-topic",
  "content": {
    "slug": "career-topic",
    "title": "콘텐츠 제목",
    "campaignKey": "campaign_key",
    "ctaKind": "callback",
    "naverCategory": "이직·커리어 전환"
  },
  "files": {
    "naver": "drive-file-id",
    "meta": "drive-file-id",
    "threads": "drive-file-id",
    "images": ["drive-image-id-1"]
  },
  "schedules": []
}
```

**검증**

- 누락 파일, 잘못된 CTA·UTM·채널과 중복 package ID를 거부한다.
- 3장 또는 9장, 잘못된 MIME과 규격을 거부한다.
- 사용자 수정본이 새 버전이 되고 이전 버전은 변하지 않는다.
- Drive 폴더를 공개 공유로 변경하지 않는다.
- 동일 manifest를 Cron과 관리자 수동 가져오기가 동시에 처리해도 한 버전만 생성된다.

## 단계 6. 수정 요청·승인·승인 취소

**파일**

- `apps/www/src/features/marketing/server/commands.ts`
- `apps/www/src/features/marketing/server/approvalSnapshot.ts`
- `apps/www/src/app/api/admin/marketing/[id]/revision/route.ts`
- `apps/www/src/app/api/admin/marketing/[id]/approve/route.ts`
- `apps/www/src/app/api/admin/marketing/[id]/cancel-approval/route.ts`
- `apps/www/src/features/marketing/components/ApprovalActions.tsx`
- `tests/marketing-approval.test.ts`

**작업**

1. 수정 요청에 500자 이하의 구체적 사유를 필수로 받는다.
2. 승인 전에 원고, 4~8장 이미지, CTA, UTM, 시각과 연결 상태를 검사한다.
3. 승인 스냅샷 해시에 문안, 파일 해시, CTA, UTM과 발행 시각을 포함한다.
4. 승인과 채널 예약 생성을 한 DB transaction으로 처리한다.
5. 승인 취소는 아직 발행되지 않은 채널만 취소한다.
6. 승인 후 변경은 새 버전과 `review_pending` 상태를 만들고 기존 미발행 예약을 취소한다.
7. 모든 명령을 `marketing_audit_logs`에 기록한다.

**검증**

- 승인 조건 누락 시 구체적 오류를 반환한다.
- 이중 클릭과 동시 승인 요청이 한 번만 성공한다.
- 이미 발행된 채널은 취소되지 않는다.
- 승인 스냅샷과 실제 파일 해시 불일치 시 발행을 막는다.

## 단계 7. Meta 게시 어댑터와 dry-run

**파일**

- `apps/www/src/features/marketing/server/meta/client.ts`
- `apps/www/src/features/marketing/server/meta/facebook.ts`
- `apps/www/src/features/marketing/server/meta/instagram.ts`
- `apps/www/src/features/marketing/server/meta/threads.ts`
- `apps/www/src/features/marketing/server/meta/types.ts`
- `apps/www/src/features/marketing/server/publisher.ts`
- `apps/www/src/app/api/admin/marketing/connections/verify/route.ts`
- `tests/marketing-meta-payloads.test.ts`
- `tests/marketing-publisher.test.ts`

**작업**

1. 공통 HTTP client에 timeout, 오류 정규화와 비밀값 마스킹을 구현한다.
2. Facebook, Instagram, Threads를 독립 어댑터로 분리한다.
3. `MARKETING_AUTOPUBLISH_CHANNELS`에 채널이 없으면 외부 게시 없이 요청 payload와 검증 결과만 기록한다.
4. 플랫폼 게시 ID를 받은 뒤에만 채널을 성공으로 표시한다.
5. 이미지가 필요한 API에는 승인 해시를 확인한 임시 전달 URL만 제공한다.
6. 비밀 토큰, 전체 응답 또는 개인 계정 정보는 로그에 남기지 않는다.

**핵심 인터페이스**

```ts
type PublishResult =
  | { ok: true; providerPostId: string; publishedUrl: string | null }
  | { ok: false; retryable: boolean; errorCode: string };

interface ChannelPublisher {
  verifyConnection(): Promise<ConnectionResult>;
  publish(input: ApprovedPublishPayload): Promise<PublishResult>;
}
```

**검증**

- dry-run은 외부 POST를 호출하지 않는다.
- 플랫폼별 payload snapshot이 승인된 문안·이미지 순서와 일치한다.
- 401/403은 즉시 조치 필요, 429/5xx는 재시도 가능으로 분류한다.
- 오류 로그에 토큰이 포함되지 않는다.

## 단계 8. 승인 이미지 임시 전달

**파일**

- `apps/www/src/features/marketing/server/assetDelivery.ts`
- `apps/www/src/app/api/marketing/assets/[token]/route.ts`
- `tests/marketing-asset-delivery.test.ts`

**작업**

1. 승인된 파일 ID, 해시, 만료 시각을 서명한 임시 토큰을 만든다.
2. 공개 라우트는 토큰 유효성, 만료와 승인 해시 일치를 검사한 뒤 Drive 파일을 스트리밍한다.
3. MIME, Content-Length와 캐시 헤더를 제한적으로 설정한다.
4. 디렉터리 탐색, 임의 Drive 파일 접근과 토큰 재사용 남용을 차단한다.
5. Meta가 미디어를 가져갈 충분한 시간만 허용하고 만료 후 접근을 거부한다.

**검증**

- 변조·만료·다른 파일 토큰을 거부한다.
- 승인 해시가 바뀌면 기존 URL이 동작하지 않는다.
- Drive 폴더나 서비스 인증정보가 응답에 노출되지 않는다.

## 단계 9. 발행 예약·재시도·알림

**파일**

- `apps/www/src/app/api/cron/marketing-publish/route.ts`
- `apps/www/src/features/marketing/server/jobs.ts`
- `apps/www/src/features/marketing/server/notifications.ts`
- `packages/db/operations/schedule-marketing-publish-cron.sql`
- `apps/www/src/features/operations-monitor/domain.ts`
- `apps/www/src/features/operations-monitor/server/latestSuccessfulRuns.ts`
- `tests/marketing-publish-job.test.ts`
- `tests/operations-monitor-job-runs.test.ts`

**작업**

1. 기존 Cron 인증 방식을 재사용한다.
2. due schedule을 transaction에서 선점하여 동시 실행을 막는다.
3. 성공 채널은 완료하고 실패 채널만 최대 2회 backoff 재시도한다.
4. 재시도 불가 또는 횟수 소진 시 `action_required`로 전환한다.
5. 최종 실패, 연결 만료와 승인 무결성 불일치만 관리자 이메일로 알린다.
6. `system_job_runs`에 시작, 완료, 요약과 오류 코드를 기록한다.
7. operations monitor에 `marketing-publish`를 추가한다.

**검증**

- 같은 작업을 동시에 두 번 호출해도 게시 어댑터가 한 번만 호출된다.
- Facebook 성공·Instagram 실패 시 Facebook을 재호출하지 않는다.
- 당일 일정 없음은 성공적인 no-op으로 기록한다.
- 자동 발행 비활성 상태에서는 게시하지 않고 dry-run만 기록한다.
- 정상 no-op 또는 성공을 운영 장애로 오판하지 않는다.

## 단계 10. 네이버 수동 완료와 게시 이력

**파일**

- `apps/www/src/app/api/admin/marketing/[id]/naver-complete/route.ts`
- `apps/www/src/features/marketing/components/NaverPublishingPanel.tsx`
- `tests/marketing-naver-completion.test.ts`

**작업**

1. 네이버 원고, 이미지, CTA URL과 체크리스트를 한 영역에 표시한다.
2. `CTA 문구에 직접 링크 연결`과 `모바일 목적지 확인` 체크를 필수로 받는다.
3. `blog.naver.com` 게시 URL을 검증한다.
4. 사용자가 확인한 경우에만 `manual_published`로 전환하고 URL·시각을 저장한다.

**검증**

- 두 확인 항목 또는 게시 URL이 없으면 완료 처리하지 않는다.
- Facebook·Instagram·Threads 상태에는 영향을 주지 않는다.

## 단계 11. ChatGPT Work 주간 패키지 연동

**파일**

- `docs/marketing-content-package-manifest.md`
- `context/chatgpt-work-marketing-dashboard-operations.md`
- ChatGPT Work 예약 작업 `CD Korea 주간 콘텐츠`

**작업**

1. Work가 생성할 Drive 폴더와 manifest 규칙을 운영 문서에 고정한다.
2. 기존 승인 일정이 있으면 해당 콘텐츠를 우선 준비한다.
3. 일정이 없으면 신규 주제·CTA·일정안만 제안하고 대시보드에는 `proposal`로 등록한다.
4. 승인 후에만 발행용 원고와 이미지를 `review_pending` 패키지로 만든다.
5. 대시보드 가져오기 성공 여부와 Drive 폴더 링크를 검토 이메일에 포함한다.
6. 콘텐츠 자동 게시 권한은 Work에 부여하지 않는다.

**검증**

- 기존 발행 완료 콘텐츠를 다시 제안하지 않는다.
- CTA와 실제 네이버 카테고리를 임의 변경하지 않는다.
- 잘못된 manifest는 대시보드에서 거부되고 사용자에게 조치 항목으로 표시된다.
- Work 실패가 기존 승인 예약을 변경하지 않는다.

## 단계 12. 통합 검증과 단계별 Production 활성화

**명령**

```bash
npx tsx --test tests/marketing-*.test.ts tests/operations-monitor-job-runs.test.ts
npx tsc --noEmit -p apps/www/tsconfig.json
npm run lint -w www
npm run build -w www
```

**성능 검증**

- 관리자 메뉴 클릭 후 선택 상태와 골격 표시 시간을 측정한다.
- 콜백, 전환 분석과 마케팅 일반 데이터 표시 시간을 각각 측정한다.
- 마케팅 화면 추가 전후 기존 쿼리 수와 응답 시간을 비교한다.
- 모바일과 데스크톱에서 메뉴, 캘린더, 업로드와 승인 동작을 확인한다.

**보안 검증**

- 비로그인 관리자 API 접근 차단
- 공개 역할 DB 접근 차단
- Meta·Drive 비밀값 로그 및 응답 노출 검사
- 임시 이미지 URL 변조·만료 검사
- Production Supabase Security Advisor 오류 0건 확인

**출시 게이트**

1. 공통 관리자 셸과 읽기 전용 마케팅 화면 배포
2. Drive 가져오기와 승인 흐름 배포
3. Meta 연결 상태 읽기 전용 확인
4. dry-run 결과를 사용자가 검토
5. Facebook 최소 테스트 게시와 사용자 확인
6. Instagram 최소 테스트 게시와 사용자 확인
7. Threads 최소 테스트 게시와 사용자 확인
8. 검증을 통과한 채널만 `MARKETING_AUTOPUBLISH_CHANNELS`에 추가

한 채널의 검증 실패가 다른 채널의 활성화를 자동 승인하지 않는다. 실제 게시 테스트와 Production 자동 발행 활성화는 각각 실행 직전 사용자의 승인을 다시 받는다.

## 완료 기준

- 기존 콜백·전환 분석·마케팅 메뉴가 즉시 전환 피드백을 제공한다.
- 콘텐츠와 채널 상태를 관리자 화면 한 곳에서 확인할 수 있다.
- Canva 수정본이 새 버전으로 보존되고 승인된 정확한 버전만 예약된다.
- Facebook, Instagram, Threads의 성공·실패·재시도가 독립적으로 기록된다.
- 네이버 수동 발행 링크와 모바일 확인이 기록된다.
- 승인 없는 콘텐츠, 변경된 승인본과 중복 작업은 게시되지 않는다.
- 자동 발행을 끈 상태에서도 전체 흐름을 dry-run으로 검증할 수 있다.

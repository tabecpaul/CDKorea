# Career Direct Korea 주간 콘텐츠 일정 정합성 검증 구현 계획

기준 설계: `docs/superpowers/specs/2026-08-25-marketing-schedule-reconciliation-design.md`

## 고정 범위

- 승인된 일정과 Drive 완성 패키지, import 결과를 발행 전에 대조한다.
- 대시보드 캘린더와 기존 DB 상태 모델은 변경하지 않는다.
- 신규 콘텐츠 생성, 일정 자동 승인, 네이버 자동 발행과 Meta 게시 활성화는 포함하지 않는다.
- 기존 `content-package.json`과 import 서비스를 재사용한다.
- 사용자 카드뉴스 파일은 수정·이동·삭제·커밋하지 않는다.
- Production DB 마이그레이션은 없다.

## 1. 승인 일정 계약

**파일**

- `docs/marketing-weekly-content-plan.md`
- `apps/www/src/features/marketing/server/weeklyPlan.ts`
- `tests/marketing-weekly-plan.test.ts`

**작업**

1. Drive 운영 폴더의 주차별 `weekly-content-plan.json` 스키마를 정의한다.
2. `schemaVersion`, `weekStart`, 항목별 `slug`, `title`, `campaignKey`, 채널과 KST 일정, `status`, 선택적 근거 메모만 허용한다.
3. 상태는 `approved`, `published`, `on_hold`로 제한한다.
4. slug, 캠페인 키, 채널 중복, 날짜 범위와 KST 시각을 검증한다.
5. 알 수 없는 필드와 같은 주차의 중복 승인 일정 파일을 거부한다.

**검증**

- 정상 승인·발행 완료·보류 항목을 읽는다.
- 잘못된 주차, 중복 slug·채널, 알 수 없는 상태와 KST가 아닌 시각을 거부한다.
- 이메일이나 Markdown에서 일정을 추론하지 않는다.

## 2. Drive 조회 경계 확장

**파일**

- `apps/www/src/features/marketing/server/drive.ts`
- `tests/marketing-drive.test.ts`

**작업**

1. 기존 비공개 운영 폴더 범위 안에서 `weekly-content-plan.json`을 조회한다.
2. 대상 주차 파일이 정확히 하나인지 확인한다.
3. 파일 크기, MIME과 운영 폴더 후손 여부를 기존 Drive 보안 규칙으로 검증한다.
4. 조회 실패와 파일 없음·중복을 서로 다른 안전한 오류 코드로 반환한다.

**검증**

- 운영 폴더 밖 파일과 과도한 크기의 파일을 거부한다.
- 대상 주차의 파일 없음과 중복을 조용한 no-op으로 처리하지 않는다.
- 기존 manifest 검색과 import 동작은 변하지 않는다.

## 3. 순수 정합성 비교기

**파일**

- `apps/www/src/features/marketing/server/reconciliation.ts`
- `tests/marketing-schedule-reconciliation.test.ts`

**작업**

1. 승인 일정, 발견된 manifest 요약과 DB 일정 조회 결과를 입력으로 받는 순수 비교기를 만든다.
2. `campaignKey`, `slug`, 채널과 발행 시각을 정확히 대조한다.
3. 결과를 `imported`, `missing`, `completed_or_held` 세 그룹으로 분류한다.
4. 누락 원인은 `PACKAGE_MISSING`, `IMPORT_FAILED`, `IDENTIFIER_MISMATCH`, `SOURCE_UNCONFIRMED`으로 제한한다.
5. `published`와 `on_hold` 항목은 현재 제작 누락으로 계산하지 않는다.
6. 항목별 오류가 다른 항목의 결과 생성을 막지 않게 한다.

**검증**

- 승인 항목의 패키지 없음, manifest만 존재, DB 일정 일부 누락과 식별자 불일치를 구분한다.
- 과거 발행 완료 및 보류 항목은 누락 건수에서 제외한다.
- 승인 일정이 1건 이상인데 대조 대상이 0건이면 성공 판정을 하지 않는다.

## 4. DB 일정과 import 결과 조회

**파일**

- `apps/www/src/features/marketing/server/queries.ts`
- `apps/www/src/features/marketing/server/importJob.ts`
- `tests/marketing-import-job.test.ts`

**작업**

1. 대상 주차와 slug·campaign key에 필요한 최소 일정만 조회한다.
2. 기존 `package_imported`, `package_import_failed` 감사 기록에서 안전한 결과 코드만 사용한다.
3. 원고 본문, Drive 인증정보와 고객 데이터는 정합성 결과에 포함하지 않는다.
4. import 서비스의 기존 성공·중복 처리와 transaction은 변경하지 않는다.

**검증**

- 다른 캠페인이나 다른 주차 일정이 대조 결과에 섞이지 않는다.
- 같은 패키지의 중복 import는 누락이나 실패로 보고되지 않는다.
- 조회 실패는 빈 결과로 위장되지 않는다.

## 5. 주간 정합성 이메일

**파일**

- `apps/www/src/features/marketing/server/reconciliationEmail.ts`
- `tests/marketing-schedule-reconciliation-email.test.ts`

**작업**

1. 기존 Resend 서버 설정과 관리자 수신 주소를 재사용한다.
2. 이메일을 `임포트 완료`, `준비·임포트 누락`, `발행 완료·보류` 세 영역으로 고정한다.
3. 누락에는 원인 코드와 관리자 조치만 간결하게 표시한다.
4. 네이버 항목에는 편집기에서 CTA 링크 직접 연결과 모바일 클릭 확인을 표시한다.
5. 원고 전문, 비밀값과 고객 개인정보는 이메일에 넣지 않는다.
6. 이메일 발송 실패를 정합성 판정 실패와 분리해 반환한다.

**검증**

- 세 그룹이 비어 있거나 혼합된 경우에도 제목과 건수가 정확하다.
- HTML escape와 URL allowlist가 적용된다.
- 이메일 실패가 import 또는 DB 상태를 변경하지 않는다.

## 6. 인증된 주간 Cron 경로

**파일**

- `apps/www/src/app/api/cron/marketing-reconciliation/route.ts`
- `apps/www/src/features/operations-monitor/domain.ts`
- `apps/www/src/features/operations-monitor/server/jobRuns.ts`
- `packages/db/operations/schedule-marketing-reconciliation-cron.sql`
- `tests/marketing-schedule-reconciliation-route.test.ts`

**작업**

1. 기존 `CRON_SECRET` Bearer 인증과 `system_job_runs` 기록을 재사용한다.
2. 매주 금요일 오전 10시 KST에 해당하는 UTC Cron `0 1 * * 5`로 별도 작업을 등록한다.
3. 대상은 다음 운영 주간으로 고정하고 승인 일정 파일을 읽어 정합성을 검사한다.
4. 승인 일정이 있는데 누락된 경우 HTTP 작업 자체는 완료하되 job summary에 누락 건수와 이메일 결과를 남긴다.
5. Drive·DB 등 기술 실패는 job을 실패로 기록한다.
6. 이 경로에서 콘텐츠 생성, import 재시도 또는 외부 게시를 수행하지 않는다.

**검증**

- 잘못된 secret을 거부한다.
- 같은 주차 재실행은 검증 이메일을 중복 발송하지 않도록 idempotency 기준을 둔다.
- 승인 일정 파일 없음·중복과 기술 오류를 정상 no-op으로 기록하지 않는다.
- 기존 15분 `marketing-import` Cron은 그대로 유지한다.

## 7. ChatGPT Work 인계 규칙과 운영 문서

**파일**

- `docs/marketing-weekly-content-plan.md`
- `context/marketing-operations-backlog.md`
- 관련 ChatGPT Work 운영 지침

**작업**

1. ChatGPT Work가 관리자 승인 후 `weekly-content-plan.json`을 먼저 저장하고 콘텐츠 패키지를 준비하도록 순서를 고정한다.
2. 일정 변경 시 같은 주차 파일을 새 승인 내용으로 갱신하고 근거 메모를 남긴다.
3. 패키지 생성 완료를 이메일 발송 완료와 동일시하지 않도록 체크리스트를 고친다.
4. 2026-08-24·26·28 항목은 출처가 확인되기 전까지 임의 패키지를 만들지 않는다.

**검증**

- 책임 분장이 ChatGPT Work 제작, Codex 기술 정합성, 관리자 승인·게시로 유지된다.
- 일정 파일, 패키지, import와 이메일의 완료 조건이 각각 구분된다.

## 8. 회귀 검증과 배포

**명령**

```bash
npx tsx --test tests/marketing-weekly-plan.test.ts
npx tsx --test tests/marketing-schedule-reconciliation.test.ts
npx tsx --test tests/marketing-schedule-reconciliation-email.test.ts
npx tsx --test tests/marketing-schedule-reconciliation-route.test.ts
npx tsx --test tests/marketing-*.test.ts
npx tsc --noEmit -p apps/www/tsconfig.json
npm run lint -w www
npm run build -w www
```

**Production 확인**

1. Preview에서 샘플 승인 일정으로 세 그룹과 누락 원인을 확인한다.
2. Production 환경변수의 Drive, Resend, Cron 설정은 값 자체를 출력하지 않고 존재 여부만 확인한다.
3. Production Supabase 대상 ref가 `fytkptzbnhfsqsktmzpx`인지 재확인한다.
4. 별도 PR 검사와 사용자 배포 승인을 받는다.
5. Cron 등록 후 테스트 실행 이메일이 기존 관리자 수신 환경변수의 주소로 도착하는지 확인한다. 주소 원문은 저장소와 로그에 기록하지 않는다.
6. 외부 채널 게시가 발생하지 않았음을 확인한다.

## 완료 조건

- 승인된 일정이 있는데 패키지 또는 DB 일정이 빠지면 금요일 검토 이메일 전에 발견된다.
- 일정 파일이 없거나 중복되어도 정상 완료로 숨겨지지 않는다.
- 기존 캘린더, import, 승인과 게시 상태는 변경되지 않는다.
- 사용자 승인 없는 콘텐츠 생성·상태 변경·외부 게시가 발생하지 않는다.

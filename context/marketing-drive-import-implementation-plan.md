# Career Direct Korea 마케팅 Drive 가져오기 구현 계획

기준 설계: `docs/superpowers/specs/2026-08-24-marketing-drive-import-design.md`

## 고정 범위

- Drive 완성 패키지 가져오기와 Canva PNG 수정본 업로드만 구현한다.
- 기본 5장, 승인된 유연형 기준에 따라 4~8장을 허용한다.
- 승인·승인 취소, Meta 게시, 네이버 자동 발행과 공개 미디어 전달은 구현하지 않는다.
- 자동 발행 환경변수는 비워 둔다.
- 사용자 콘텐츠 파일은 읽거나 커밋하지 않는다.

## 1. 작업 브랜치와 Production DB 대상 확인

**작업**

1. 원격 `main`의 최신 병합 커밋에서 별도 5단계 브랜치를 만든다.
2. 작업 전 기존 미추적 사용자 콘텐츠 파일이 보존됐는지 기록한다.
3. 비밀값을 출력하지 않고 Vercel Production `DATABASE_URL`의 프로젝트 ref가 `fytkptzbnhfsqsktmzpx`인지 확인한다.
4. GitHub `PRODUCTION_DATABASE_URL`도 같은 ref인지 확인한다.
5. 하나라도 불일치하거나 확인할 수 없으면 DB 변경과 Production 적용을 중지한다.

**검증**

- 브랜치 기준 커밋이 원격 `main`과 일치한다.
- 사용자 파일은 staged 목록에 없다.
- 두 Production 연결 대상 확인 결과만 기록하고 URL·비밀번호는 출력하지 않는다.

## 2. 패키지 manifest 계약과 검증기

**파일**

- `docs/marketing-content-package-manifest.md`
- `apps/www/src/features/marketing/server/packageManifest.ts`
- `tests/marketing-package-manifest.test.ts`

**작업**

1. `schemaVersion: 1`의 정확한 JSON Schema에 해당하는 TypeScript 타입을 정의한다.
2. 알 수 없는 필드, 빈 `packageId`, 잘못된 slug·CTA·카테고리·채널·모드·UTM·KST 일정을 거부한다.
3. 네이버, Meta, Threads 원고 파일 ID와 4~8개 PNG 파일 ID를 순서대로 검증한다.
4. URL은 `https`만 허용하고 UTM 필수 키는 기존 캠페인 규칙을 재사용한다.
5. 검증 실패를 필드 경로가 포함된 안전한 오류 코드로 정규화한다.

**검증**

```bash
npx tsx --test tests/marketing-package-manifest.test.ts
```

- 정상 4·5·8장 패키지를 허용한다.
- 3·9장, 중복 이미지 ID, 알 수 없는 필드와 잘못된 시각을 거부한다.

## 3. 중복 방지 스키마와 마이그레이션

**파일**

- `packages/db/src/schema.ts`
- `packages/db/drizzle/<generated>_marketing_drive_import.sql`
- `tests/marketing-schema-contract.test.ts`

**작업**

1. `marketing_content_versions.source_package_id varchar(180)` nullable 컬럼을 추가한다.
2. 값이 있는 행에 적용되는 전역 unique index를 생성한다.
3. 기존 RLS와 공개 역할 권한 차단을 그대로 유지한다.
4. Drizzle로 마이그레이션을 생성하고 SQL을 수동 검토한다.

**검증**

- 기존 행은 마이그레이션 후에도 유효하다.
- 동일 `source_package_id`의 동시 insert 중 하나만 성공한다.
- SQL에 RLS 해제, grant 또는 destructive DDL이 없다.

Production 마이그레이션은 PR 검사와 사용자 승인 전에는 실행하지 않는다.

## 4. 비공개 Drive 클라이언트

**파일**

- `apps/www/src/features/marketing/server/drive.ts`
- `apps/www/src/features/marketing/server/assets.ts`
- `tests/marketing-drive.test.ts`
- `tests/marketing-assets.test.ts`

**작업**

1. 기존 환경변수 `GOOGLE_DRIVE_OPERATIONS_FOLDER_ID`, `GOOGLE_DRIVE_CLIENT_EMAIL`, `GOOGLE_DRIVE_PRIVATE_KEY`를 서버에서만 읽는다.
2. 파일 메타데이터 조회, 제한된 byte 다운로드, 텍스트 읽기와 비공개 업로드 인터페이스를 분리한다.
3. 파일이 승인된 운영 폴더의 후손인지 확인한다.
4. timeout, 최대 크기, MIME과 API 오류를 안전한 코드로 정규화한다.
5. PNG 시그니처, 1080×1350 크기, SHA-256과 byte 크기를 계산한다.
6. 테스트에서는 실제 Drive를 호출하지 않고 클라이언트 경계만 대체한다.

**검증**

- 운영 폴더 밖 파일, PNG 위장 파일, 초과 크기와 잘못된 규격을 거부한다.
- 오류와 로그에 인증정보·원고 본문·파일 bytes가 없다.

## 5. 원자적 import 서비스

**파일**

- `apps/www/src/features/marketing/server/importJob.ts`
- `tests/marketing-import-job.test.ts`

**작업**

1. Drive 네트워크 검증과 파일 해시는 DB transaction 밖에서 완료한다.
2. transaction에서 slug 기준 콘텐츠를 생성 또는 조회한다.
3. 콘텐츠별 다음 버전 번호를 충돌 없이 결정한다.
4. `source_package_id` unique index로 패키지를 선점한다.
5. 버전, 자산, `approval_pending` 일정과 현재 버전을 한 번에 기록한다.
6. 성공·실패 감사 로그에 최소 메타데이터만 기록한다.
7. 중복 요청은 기존 버전 ID를 반환하고 새 데이터를 만들지 않는다.

**검증**

- 수동·Cron 동시 요청에서 버전 하나만 생성된다.
- 자산 또는 일정 저장 실패 시 현재 버전이 바뀌지 않는다.
- 외부 Drive 호출을 transaction 안에서 수행하지 않는다.

## 6. 관리자 수동 import와 예약 import

**파일**

- `apps/www/src/app/api/admin/marketing/import/route.ts`
- `apps/www/src/app/api/cron/marketing-import/route.ts`
- `packages/db/operations/schedule-marketing-import-cron.sql`
- `tests/marketing-import-routes.test.ts`

**작업**

1. 관리자 API는 기존 관리자 세션을 검사하고 manifest 파일 ID 하나만 받는다.
2. Cron API는 기존 `CRON_SECRET` 인증과 `system_job_runs` 기록 방식을 재사용한다.
3. Cron은 운영 폴더에서 새 manifest 후보만 찾아 동일 import 서비스를 호출한다.
4. 항목별 성공·중복·거부 수를 요약하고 정상 no-op을 성공으로 기록한다.
5. SQL은 기존 Supabase `pg_cron` 호출 구조와 중복 실행 방지 규칙을 따른다.

**검증**

- 비로그인 관리자 요청과 잘못된 Cron secret을 거부한다.
- 빈 폴더는 성공 no-op이며 운영 장애 알림을 만들지 않는다.
- 수동 API와 Cron의 검증 결과가 동일하다.

## 7. Canva 수정본 업로드와 새 버전

**파일**

- `apps/www/src/app/api/admin/marketing/[id]/assets/route.ts`
- `apps/www/src/features/marketing/server/assets.ts`
- `apps/www/src/features/marketing/components/AssetUploader.tsx`
- `apps/www/src/features/marketing/components/ContentDetail.tsx`
- `tests/marketing-assets.test.ts`

**작업**

1. 관리자 세션과 콘텐츠 ID를 확인한다.
2. multipart 업로드 전체 크기와 파일별 크기를 제한한다.
3. 4~8개 PNG의 실제 시그니처, 규격, 순서와 해시를 검증한다.
4. Drive의 비공개 새 버전 폴더에 업로드한다.
5. 직전 버전의 원고·CTA·UTM·일정 초안을 복사해 새 `review_pending` 버전을 transaction으로 생성한다.
6. 새 버전 성공 후에만 `current_version_id`를 갱신한다.
7. 버전 이력에 생성 주체, 카드 수, 시각과 수정 메모를 표시한다.
8. 불완전 Drive 업로드는 자동 삭제하지 않고 감사 로그에 조치 대상으로 기록한다.

**검증**

- 이전 버전, 승인 기록과 일정은 변경되지 않는다.
- 이중 클릭에서 버전이 중복 생성되지 않는다.
- 모바일에서도 파일 순서와 오류 항목을 확인할 수 있다.

## 8. 회귀·보안 검증과 PR

**명령**

```bash
npx tsx --test tests/marketing-*.test.ts
npx tsc --noEmit -p apps/www/tsconfig.json
npm run lint -w www
npm run build -w www
```

**수동 검증**

1. 관리자 로그인, 콜백·전환 분석·콘텐츠 운영 화면 전환을 확인한다.
2. 정상 패키지 가져오기, 중복 가져오기와 잘못된 패키지 거부를 확인한다.
3. 5장 수정본 업로드 후 새 버전과 이전 버전 보존을 확인한다.
4. 자동 발행 환경변수가 비어 있고 외부 채널 POST가 없음을 확인한다.
5. 사용자 콘텐츠 파일이 PR에 포함되지 않았음을 확인한다.

검사 통과 후 별도 PR을 만들고 Preview에서 검증한다. Production 배포와 DB 마이그레이션 실행 전 사용자 승인을 다시 받는다. 적용 후 8개 기존 테이블과 새 컬럼·index, RLS, 공개 권한 차단, Supabase Security Advisor 오류 0건을 확인한다.

# 마케팅 콘텐츠 대시보드 Production 준비 상태

확인일: 2026-08-24 (KST)

## 결론

마케팅 대시보드의 UI와 내부 상태 관리는 다음 단계부터 구현할 수 있다. 다만 Meta 자동 발행은 아직 **차단 상태**다. Meta Business Suite의 실제 연결 계정과 앱 권한을 로그인된 관리 화면 및 읽기 전용 API로 확인하기 전에는 어떤 채널도 `MARKETING_AUTOPUBLISH_CHANNELS`에 추가하지 않는다.

예약 발행 큐는 Vercel Cron이 아니라 기존 Supabase `pg_cron` + `pg_net` 호출 구조를 재사용한다. 현재 Vercel 팀은 Hobby 플랜이며, Vercel 공식 문서상 Hobby Cron은 하루 한 번만 실행할 수 있고 지정한 시간의 해당 시각(hour) 안에서 호출될 수 있어 분 단위 발행 큐에 부적합하다.

## 확인 결과

| 항목 | 상태 | 확인 근거 | 후속 조치 |
|---|---|---|---|
| 운영 저장소 | 확인 | GitHub `tabecpaul/CDKorea` 설정과 Vercel Preview 연결 확인 | 유지 |
| Supabase Production | 확인 | `CDKorea Org`의 활성 프로젝트 `pro`, ref `fytkptzbnhfsqsktmzpx`, Singapore(`ap-southeast-1`)를 대시보드에서 확인 | DB 변경 전 동일 ref 재검증 |
| Vercel 프로젝트 | 확인 | `cd-korea-www` 프로젝트 확인 | 유지 |
| Vercel `DATABASE_URL` | 부분 확인 | 변수가 Production·Preview에 존재하며 2026-08-22 갱신됨. 비밀값은 열거나 출력하지 않음 | DB migration workflow의 ref guard와 Production 기능 검증으로 대상 교차확인 |
| GitHub `PRODUCTION_DATABASE_URL` | 부분 확인 | Repository secret 존재 및 2026-08-22 갱신 확인. GitHub는 secret 값을 다시 표시하지 않음 | 다음 DB 변경 직전 ref guard가 통과해야 적용 허용 |
| migration target guard | 확인 | workflow가 `EXPECTED_SUPABASE_PROJECT_REF=fytkptzbnhfsqsktmzpx`를 검사한 뒤에만 Drizzle migration 실행 | 우회 금지 |
| Vercel 예약 실행 | 부적합 | 팀 플랜 `Hobby`; 공식 문서상 Cron은 하루 1회 제한 및 지정 hour 내 실행 | Supabase `pg_cron` 사용 |
| Meta Business Suite | 미확인 | 현재 브라우저 세션은 Business Suite 로그인 화면에서 차단됨 | 관리자 로그인 후 읽기 전용 preflight 실행 |
| Facebook 페이지 | 미확인 | Meta preflight 미완료 | Page ID, 게시 권한, 장기 토큰 확인 |
| Instagram | 미확인 | Meta preflight 미완료 | Professional 계정과 Facebook Page 연결, 계정 ID·게시 권한 확인 |
| Threads | 미확인 | Meta preflight 미완료 | Threads 사용자 ID·게시 권한·토큰 확인 |
| Google Drive 운영 폴더 | 미확인 | 아직 폴더 ID와 서비스 계정 접근을 검증하지 않음 | 업로드 구현 전 읽기/쓰기 최소 권한 확인 |

## 예약 발행 구조 결정

- 기존 `CRON_SECRET` Bearer 인증 방식을 그대로 사용한다.
- Supabase `pg_cron`이 `pg_net`으로 Production의 발행 큐 엔드포인트를 주기적으로 호출한다.
- 같은 콘텐츠 버전·채널에는 고유 idempotency 키를 저장한다.
- 동시 호출은 DB 잠금으로 막고, 이미 게시된 건은 재호출해도 다시 게시하지 않는다.
- 두 번 재시도 후 실패 상태와 관리자 알림을 남긴다.
- 네이버 블로그는 자동 발행 대상에 포함하지 않는다.

## Meta 자동 발행 해제 조건

다음 조건을 실제 계정과 읽기 전용 API에서 모두 확인하기 전에는 자동 발행을 켜지 않는다.

1. Career Direct Korea Facebook 페이지와 Instagram 프로페셔널 계정의 연결
2. 운영 Meta 앱과 필요한 게시 권한의 승인 상태
3. Page·Instagram·Threads 계정 ID가 의도한 운영 계정과 일치
4. 서버용 토큰의 수명과 갱신 절차
5. 채널별 dry-run 및 비공개 테스트 결과
6. 사용자의 Production 활성화 승인

채널은 개별적으로 해제한다. 예를 들어 Facebook만 검증되면 `MARKETING_AUTOPUBLISH_CHANNELS=facebook`만 허용하며, Instagram과 Threads는 계속 차단한다.

## 환경변수 관리

환경변수 이름은 `apps/www/.env.example`에만 기록한다. 실제 secret, access token, 서비스 계정 private key, 데이터베이스 비밀번호는 GitHub·Vercel 또는 승인된 secret 저장소에만 두며 문서와 로그에 기록하지 않는다.

## 차단 규칙

- `MARKETING_AUTOPUBLISH_CHANNELS`의 기본값은 빈 문자열이다.
- Meta preflight가 미완료인 채널은 승인된 콘텐츠가 있어도 외부 게시하지 않는다.
- 다음 DB 변경은 Production ref guard가 통과하기 전까지 실행하지 않는다.
- 이 사전점검 단계에서는 DB migration, 외부 게시, Meta 앱 생성, 토큰 발급을 수행하지 않는다.

## 공식 참고

- Vercel Cron 관리: https://vercel.com/docs/cron-jobs/manage-cron-jobs
- Vercel Hobby 플랜: https://vercel.com/docs/plans/hobby
- Facebook Pages API 게시: https://developers.facebook.com/docs/pages-api/posts/
- Instagram 콘텐츠 게시: https://developers.facebook.com/docs/instagram-platform/content-publishing/
- Threads 게시 API: https://developers.facebook.com/docs/threads/posts/

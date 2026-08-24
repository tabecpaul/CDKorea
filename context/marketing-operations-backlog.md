# Career Direct Korea 마케팅 운영 백로그

기준일: 2026-08-24 (KST)

## 목적과 사용 원칙

이 문서는 마케팅 콘텐츠 대시보드와 발행 운영에서 현재 진행할 일, 다음 일,
외부 조건 때문에 차단된 일과 지속적으로 제외할 일을 한곳에서 관리하는 기준표다.
새 기능을 제안하는 문서가 아니며, 이미 승인된 설계와 구현 계획의 상태만 통합한다.

- 상태 변경은 실제 Production 확인 또는 사용자의 명시적 결정에 근거한다.
- `차단됨` 항목은 재개 조건을 모두 충족하기 전에는 구현하거나 활성화하지 않는다.
- `계속 제외` 항목은 별도의 신규 설계와 사용자 승인 없이는 백로그로 되돌리지 않는다.
- 외부 게시, 테스트 게시와 Production 자동 발행은 실행 직전에 각각 다시 승인받는다.
- 실제 secret, access token, Drive 폴더 ID와 데이터베이스 비밀번호는 이 문서에 기록하지 않는다.

## 현재 진행

| 작업 | 범위 | 완료 조건 | 다음 행동 |
|---|---|---|---|
| 네이버 수동 발행 패널과 완료 기록 | 원고·이미지·카테고리·CTA·UTM 표시, 링크 직접 연결 확인, 모바일 목적지 확인, `blog.naver.com` 게시 URL과 완료 시각 저장 | 두 확인 항목과 게시 URL 없이는 완료 불가, 다른 채널 상태 불변, Production 검증 | 별도 설계 확정 후 구현 |

## 완료됨

| 작업 | 확인된 결과 |
|---|---|
| 관리자 마케팅 화면과 상태 기반 구조 | 콘텐츠, 버전, 채널 일정과 상태를 관리자 화면에서 조회 가능 |
| 관리자 카드뉴스 미리보기 | 현재 승인 대상 버전의 카드 8장을 관리자 인증 안에서 순서대로 표시하고, Drive 식별자 비노출과 비로그인 401 차단을 Production에서 확인 |
| Google Drive 패키지 수동 가져오기 | 2026-08-27 `은사·재능·강점` 패키지를 Drive에서 Production 대시보드로 가져오고 중복 가져오기 차단 확인 |
| 콘텐츠 최종 승인 흐름 | 승인 스냅샷과 감사 기록을 남기고 콘텐츠 v1을 `approved`로 전환 |
| 승인과 게시 상태 분리 | 승인 후에도 네이버·Facebook·Instagram·Threads 일정은 수동 `approval_pending` 상태 유지, 외부 게시 없음 |
| 첫 운영 콘텐츠 준비 | 공식 원문, 네이버·Meta·Threads 문안, 8장 카드뉴스, CTA·UTM과 채널별 일정 준비 |
| Production DB 안전장치 | Supabase Production ref `fytkptzbnhfsqsktmzpx` 검증 가드 유지, Security Advisor 공개 테이블 오류 0건 확인 |

## 다음 순서

| 순서 | 작업 | 전제와 제한 |
|---:|---|---|
| 1 | 네이버 수동 발행 패널과 완료 기록 | 네이버는 계속 사용자가 직접 발행한다. 자동 발행을 추가하지 않는다. |
| 2 | ChatGPT Work 주간 패키지 연동 운영 검증 | 매주 금요일 오전 10시 KST 준비, 승인 일정 우선, Drive 저장과 검토 이메일을 확인한다. 게시 권한은 부여하지 않는다. |
| 3 | 자동 발행을 끈 상태의 통합 검증 | 관리자 인증, RLS, 승인 무결성, 중복 방지, 성능, 알림과 no-op 판정을 검증한다. |
| 4 | Meta 연결 복구 후 채널별 사전 검증 | Facebook, Instagram, Threads를 독립적으로 확인한다. 한 채널의 성공이 다른 채널 승인을 대신하지 않는다. |
| 5 | 채널별 최소 테스트 게시 | 실행 직전 사용자 승인이 필요하다. 성공한 채널만 다음 단계 후보가 된다. |
| 6 | 채널별 Production 자동 발행 활성화 | dry-run과 최소 테스트를 통과한 채널만 별도 승인 후 허용한다. |

## 차단됨

### Meta와 Threads 게시 API 및 자동 발행

현재 Facebook·광고관리자 계정 문제와 브랜드 Threads 연결 오류 때문에 보류한다.

재개 조건:

1. 브랜드 Threads `@careerdirect_korea`의 계정 접근 복구
2. Career Direct Korea 비즈니스 포트폴리오 연결 확인
3. 운영 Meta 앱의 별도 설계·생성·비즈니스 연결 승인
4. 필요한 게시 권한과 앱 검수 상태 확인
5. Facebook Page, Instagram Professional, Threads 운영 계정 ID 대조
6. 서버용 토큰 수명·갱신·보관 방식 확인
7. 채널별 읽기 전용 검사와 dry-run 통과
8. 채널별 최소 테스트 게시에 대한 사용자 승인 및 결과 확인
9. 채널별 Production 활성화에 대한 별도 사용자 승인

차단 중 유지 규칙:

- `MARKETING_AUTOPUBLISH_CHANNELS`는 비워 둔다.
- 승인된 콘텐츠가 있어도 외부 채널로 POST하지 않는다.
- Meta 계정 문제는 공식 Business Suite·광고관리자 상태만 기준으로 판단한다.
- 스팸 또는 피싱 의심 이메일은 운영 판단 근거로 사용하지 않는다.

### Drive 예약 가져오기

수동 Drive 패키지 가져오기는 확인됐지만 Drive Cron은 활성화하지 않는다.
예약 가져오기를 다시 검토할 때는 서비스 계정 최소 권한, 중복 방지, 실패 알림과
기존 승인 일정 불변을 먼저 검증하고 별도 승인을 받는다.

### 컨설턴트 성장 파일럿과 고객 기록 자동화

실제 첫 고객 상담 완료 시점 전에는 시작하지 않는다. 첫 상담 완료가 확인되면
그 시점부터 8주 파일럿의 범위와 기록 방식을 별도 검토한다.

## 계속 제외

다음 항목은 현재 운영 범위에서 제외한다.

- 네이버 블로그 자동 발행
- 관리자 승인 없는 콘텐츠 확정 또는 게시
- 콘텐츠 자동 승인
- Meta 광고 생성, 재개, 예산 변경과 성과 자동 판단
- Canva 최신본 자동 동기화
- 실제 첫 고객 상담 전 고객 기록 및 컨설턴트 파일럿 자동화
- 검증 전 Facebook·Instagram·Threads 자동 발행
- 외부 범용 자동화 플랫폼을 운영 상태의 기준 저장소로 추가하는 일

## 고정 운영 기준

- 콘텐츠 제작과 주간 알림은 ChatGPT Work가 담당한다.
- 저장소, 대시보드, Supabase, Vercel, 연결, 보안과 장애 대응은 Codex가 담당한다.
- 관리자가 모든 콘텐츠와 게시 여부를 최종 결정한다.
- 카드뉴스는 최신 브랜드 템플릿과 해당 콘텐츠의 승인된 장수를 사용한다.
- 네이버 카테고리와 CTA는 승인된 콘텐츠 계획을 따르며 임의 변경하지 않는다.
- 네이버 CTA 링크는 편집기에서 문구에 직접 연결하고 모바일에서 목적지를 확인한다.
- 사용자가 Canva에서 수정한 PNG는 기존 승인본을 덮어쓰지 않고 새 버전으로 보존한다.
- 광고 성과는 B 타이포형의 유효 데이터만 기준으로 하며 A 사전 테스트 데이터는 제외한다.
- B 광고는 표본 100회 전에 성급히 결론 내리지 않는다.

## 근거 문서

- `docs/superpowers/specs/2026-08-24-marketing-content-dashboard-design.md`
- `docs/superpowers/plans/2026-08-24-marketing-content-dashboard-implementation-plan.md`
- `context/marketing-dashboard-production-readiness.md`
- `docs/superpowers/specs/2026-08-24-marketing-content-approval-design.md`
- `docs/superpowers/specs/2026-08-24-marketing-drive-import-design.md`
- `docs/superpowers/specs/2026-08-24-gifts-talents-strengths-content-package-design.md`

문서 간 상태가 다르면 이 백로그의 최신 확인 상태를 우선하되, 기능 범위와 안전
제약은 원래 승인된 설계 문서보다 확대하지 않는다.

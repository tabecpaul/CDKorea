# Career Direct Korea 공식 사이트 구현 계획

> 설계 기준: `docs/superpowers/specs/2026-08-10-career-direct-korea-official-site-design.md`

## 1. 구현 목표

최신 `main`의 `apps/www`에 `www.careerdirect.kr` 공식 사이트를 추가한다. 현재 `start.careerdirect.kr`에서 운영되는 랜딩, 자가진단, 콜백, 결제, 평가 링크, 이메일, 관리자 기능은 그대로 보존한다.

첫 출시는 다음을 포함한다.

- 홈, 평가, 비용·절차, 커리어 컨설팅, 기관 프로그램, 컨설턴트 소개
- 공통 헤더·푸터·CTA
- 호스트 기반 `www`/`start` 분리
- 페이지별 메타데이터, canonical, sitemap, robots, JSON-LD
- `www`에서 `start`로 이어지는 익명 방문·UTM·CTA 추적
- 기관 문의 저장과 관리자 알림 이메일
- 법적 문서의 용어와 수집 항목 정합성

CMS, 블로그 자동화, 공개 결제, 본부 직접 평가 링크는 구현하지 않는다.

## 2. 구현 전제와 안전 규칙

- 실제 구현은 최신 `main` 커밋에서 새 작업 브랜치를 만든 뒤 시작한다. 현재 계획용 작업공간은 이전 커밋에서 분기되었으므로 그대로 구현 기반으로 사용하지 않는다.
- `apps/www/AGENTS.md`에 따라 코드를 작성하기 전에 설치된 Next.js 16.3 문서를 다시 확인한다.
- 호스트 분리는 Next.js 16의 `src/proxy.ts`를 사용한다. `middleware.ts`는 사용하지 않는다.
- `NEXT_PUBLIC_SITE_URL`은 기존처럼 `https://start.careerdirect.kr`을 유지한다.
- 새 환경변수 `NEXT_PUBLIC_OFFICIAL_SITE_URL=https://www.careerdirect.kr`을 추가한다.
- 기존 운영 API와 관리자 경로는 호스트 프록시 대상에서 제외한다.
- 사용자 소유의 `.superpowers/`, EPS, `output/`, `tmp/` 파일은 수정하거나 커밋하지 않는다.

## 3. 채택할 라우팅 구조

공식 사이트 페이지는 내부적으로 `/official` 아래에 둔다. 브라우저에는 공개 URL만 보이도록 Proxy가 `www` 요청을 내부 경로로 rewrite한다.

| 공개 URL | 내부 페이지 | 처리 |
| --- | --- | --- |
| `www.careerdirect.kr/` | `/official` | rewrite |
| `www.careerdirect.kr/assessment` | `/official/assessment` | rewrite |
| `www.careerdirect.kr/pricing` | `/official/pricing` | rewrite |
| `www.careerdirect.kr/consulting` | `/official/consulting` | rewrite |
| `www.careerdirect.kr/organizations` | `/official/organizations` | rewrite |
| `www.careerdirect.kr/consultant` | `/official/consultant` | rewrite |
| `start.careerdirect.kr/` | 기존 `/` | 변경 없음 |

추가 규칙:

- `start`에서 공식 상세 경로를 요청하면 동일 경로의 `www` URL로 308 redirect한다.
- `www`에서 `/career-check`, `/assessment-consultation`, 콜백 일정과 같은 전환 경로를 요청하면 동일 경로의 `start` URL로 308 redirect한다.
- `/api`, `/admin`, `/_next`, 정적 파일, 웹훅 및 cron은 rewrite하지 않는다.
- `/official` 내부 경로를 직접 방문하면 canonical 공개 경로로 redirect해 중복 색인을 방지한다.
- 개발·Preview 호스트에서는 기존 루트를 유지한다. 공식 사이트는 `x-cdk-site: official` 요청 헤더로 검증하며, 이 헤더는 production에서는 무시한다. 로컬 curl과 브라우저 프록시 설정 방법을 README에 기록한다.

## 4. 작업 단위

### Task 1 — 최신 브랜치와 회귀 기준 고정

**읽을 파일**

- `apps/www/AGENTS.md`
- `apps/www/package.json`
- `apps/www/node_modules` 또는 루트 `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/14-metadata-and-og-images.md`

**절차**

1. 최신 `main`에서 `feature/official-site` 브랜치를 만든다.
2. 현재 `start` 루트, 자가진단, 콜백, 관리자 주요 URL의 HTTP 상태를 기록한다.
3. `npm run lint --workspace=www`와 `npm run build --workspace=www`의 시작 상태를 기록한다.

**검증**

```bash
npm run lint --workspace=www
npm run build --workspace=www
```

완료 기준: 구현 전 실패가 있으면 계획에 별도 기록하고 이번 변경과 분리한다.

---

### Task 2 — 호스트와 공개 URL 유틸리티 추가

**생성**

- `apps/www/src/features/site-routing/hosts.ts`
- `apps/www/src/features/site-routing/paths.ts`

**수정**

- `apps/www/.env.example`

**핵심 인터페이스**

```ts
export const START_SITE_URL: string;
export const OFFICIAL_SITE_URL: string;
export function normalizeHost(value: string | null): string;
export function isOfficialHost(host: string): boolean;
export function isStartHost(host: string): boolean;
export function officialUrl(path?: string): URL;
export function startUrl(path?: string): URL;
```

URL은 환경변수를 읽되 production 기본값을 명시한다. 호스트 문자열 비교 시 포트를 제거하고 소문자로 정규화한다.

**검증**

- localhost 포트가 있어도 정상 비교
- `www.careerdirect.kr`, `start.careerdirect.kr`만 production 호스트로 인식
- URL 조합 시 이중 슬래시 없음

---

### Task 3 — Next.js 16 Proxy로 도메인 역할 분리

**생성**

- `apps/www/src/proxy.ts`

**핵심 구조**

```ts
export function proxy(request: NextRequest) {
  // 1. 제외 경로는 next()
  // 2. 직접 /official 접근은 canonical redirect
  // 3. www 공개 경로는 /official 내부 경로로 rewrite
  // 4. start의 공식 경로는 www로 redirect
  // 5. www의 전환 경로는 start로 redirect
  // 6. 나머지는 next()
}

export const config = {
  matcher: ["/((?!api|admin|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
```

실제 matcher는 Next.js 문서의 정적 분석 조건을 지키며 API, 관리자, 이미지 및 다운로드 자산을 방해하지 않아야 한다.

**검증**

개발 서버에서 Host 헤더를 지정해 확인한다.

```bash
curl -I -H 'Host: www.careerdirect.kr' http://localhost:3000/
curl -I -H 'Host: start.careerdirect.kr' http://localhost:3000/
curl -I -H 'Host: start.careerdirect.kr' http://localhost:3000/assessment
curl -I -H 'Host: www.careerdirect.kr' http://localhost:3000/career-check
curl -I -H 'Host: www.careerdirect.kr' http://localhost:3000/api/analytics/events
```

완료 기준: 공개 URL은 유지되며 내부 페이지가 렌더링되고, 기존 API는 rewrite되지 않는다.

---

### Task 4 — 공식 사이트 콘텐츠 모델 작성

**생성**

- `apps/www/src/features/official-site/content/navigation.ts`
- `apps/www/src/features/official-site/content/home.ts`
- `apps/www/src/features/official-site/content/pages.ts`
- `apps/www/src/features/official-site/content/legal.ts`
- `apps/www/src/features/official-site/types.ts`

**핵심 타입**

```ts
type Cta = {
  label: string;
  href: string;
  eventName: AnalyticsEventName;
  location: string;
};

type SeoContent = {
  title: string;
  description: string;
  canonicalPath: string;
};

type DetailPageContent = {
  eyebrow: string;
  title: string;
  lead: string;
  seo: SeoContent;
  sections: readonly ContentSection[];
  primaryCta: Cta;
  secondaryCta?: Cta;
};
```

**콘텐츠 규칙**

- 핵심 서비스는 `커리어 컨설팅`으로 표기한다.
- `후속 코칭`은 지속 지원에만 사용한다.
- 청년 만 15~28세 385,000원, 성인 만 29세 이상 495,000원, 부가세 포함을 한 상수에서 관리한다.
- 검사만 단독 가격은 넣지 않는다.
- 근거가 확인되지 않은 국가, 언어, 이용자 수를 넣지 않는다.
- 컨설턴트 자격과 경력은 제공된 사실만 사용하며 값이 없으면 해당 블록을 숨긴다.

**검증**

```bash
rg -n '/coaching|검사만.*원|450,000|600,000' apps/www/src/features/official-site
```

검색 결과가 없어야 한다.

---

### Task 5 — 공통 레이아웃과 CTA 추적 구현

**생성**

- `apps/www/src/features/official-site/components/OfficialHeader.tsx`
- `apps/www/src/features/official-site/components/OfficialFooter.tsx`
- `apps/www/src/features/official-site/components/OfficialPageShell.tsx`
- `apps/www/src/features/official-site/components/SectionHeading.tsx`
- `apps/www/src/features/official-site/components/OfficialCtaLink.tsx`
- `apps/www/src/features/official-site/components/MobileStickyCta.tsx`
- `apps/www/src/features/official-site/components/StructuredData.tsx`
- `apps/www/src/app/official/layout.tsx`

**수정**

- `apps/www/src/app/globals.css`

**동작**

- 데스크톱 내비게이션과 키보드 접근 가능한 모바일 메뉴 제공
- 로고, 페이지 링크, 자가진단 및 콜백 CTA 제공
- CTA는 현재 UTM을 `start` 목적지에 전달하고 클릭 이벤트를 기록
- 모바일 고정 CTA는 최대 두 개
- 푸터에 사업자 정보, 주소, 연락처, 약관 링크 유지
- `prefers-reduced-motion` 존중

**검증**

- 키보드만으로 메뉴 열기, 이동, 닫기 가능
- 포커스 표시가 배경과 대비됨
- CTA 링크가 `start.careerdirect.kr`을 사용하고 UTM을 보존

---

### Task 6 — 홈페이지 구현

**생성**

- `apps/www/src/app/official/page.tsx`
- `apps/www/src/features/official-site/components/home/HomeHero.tsx`
- `apps/www/src/features/official-site/components/home/ProblemRecognition.tsx`
- `apps/www/src/features/official-site/components/home/FourCompasses.tsx`
- `apps/www/src/features/official-site/components/home/ConnectedJourney.tsx`
- `apps/www/src/features/official-site/components/home/AudiencePaths.tsx`
- `apps/www/src/features/official-site/components/home/FaithAndVocation.tsx`
- `apps/www/src/features/official-site/components/home/ServiceChoices.tsx`
- `apps/www/src/features/official-site/components/home/ConsultantTrust.tsx`
- `apps/www/src/features/official-site/components/home/HomeFinalCta.tsx`

**구성 순서**

1. 공감 히어로
2. 현실 문제 인식
3. 4가지 나침반
4. 연결된 여정
5. 대상별 진입
6. 신앙·소명 브리지
7. 평가·컨설팅 선택
8. 컨설턴트 신뢰
9. 최종 CTA

**검증**

- `<h1>`은 하나
- 콘텐츠 순서가 설계서와 일치
- 작은 화면에서 4열 카드가 1~2열로 변환
- 핵심 이미지에 대체텍스트 제공
- 기존 `start` 루트의 Hero 및 섹션은 변경되지 않음

---

### Task 7 — 평가·컨설팅·비용 페이지 구현

**생성**

- `apps/www/src/app/official/assessment/page.tsx`
- `apps/www/src/app/official/consulting/page.tsx`
- `apps/www/src/app/official/pricing/page.tsx`
- `apps/www/src/features/official-site/components/DetailHero.tsx`
- `apps/www/src/features/official-site/components/CompassDetailGrid.tsx`
- `apps/www/src/features/official-site/components/ProcessTimeline.tsx`
- `apps/www/src/features/official-site/components/PricingTable.tsx`
- `apps/www/src/features/official-site/components/FaqList.tsx`

**핵심 검증 사항**

- 평가 페이지에 공개 본부 평가 실행 링크 없음
- 고객 등록이 크레딧 활성화라는 의미를 명확히 안내
- 비용 표에 부가세 포함 총액과 연령 기준 표시
- 환불 문구는 기존 `/refund-policy`와 모순되지 않음
- 컨설팅 페이지는 3시간 컨설팅과 필요시 후속 코칭을 구분

**검증**

```bash
rg -n 'careerdirect\.org/\?language_code|href=.*careerdirect\.org' apps/www/src/app/official apps/www/src/features/official-site
```

평가 실행용 직접 링크가 없어야 한다.

---

### Task 8 — 기관 프로그램과 컨설턴트 페이지 구현

**생성**

- `apps/www/src/app/official/organizations/page.tsx`
- `apps/www/src/app/official/consultant/page.tsx`
- `apps/www/src/features/official-site/components/OrganizationPrograms.tsx`
- `apps/www/src/features/official-site/components/ConsultantProfile.tsx`
- `apps/www/src/features/organization-inquiry/components/OrganizationInquiryForm.tsx`

**동작**

- 교회 청년부, 기독교 대학, 일반 대학·기관, 부모 프로그램을 구분
- 특강, 워크숍, 단체 평가, 개인·소그룹 컨설팅을 소개
- 컨설턴트 페이지는 빈 자격·경력 값을 렌더링하지 않음
- 기관 폼은 제출 실패 시 입력 내용을 유지하고 접근 가능한 오류 요약을 표시

**검증**

- 모바일 폼 입력과 오류 복구 확인
- 신앙 문구가 일반 고객에게 평가 결과를 종교적으로 단정하지 않음
- 실제 제공되지 않은 자격·후기·성과 수치 없음

---

### Task 9 — 기관 문의 저장과 알림

**수정**

- `packages/db/src/schema.ts`
- `packages/db/src/index.ts`
- `packages/db/drizzle/meta/_journal.json`
- `apps/www/.env.example`

**생성**

- `packages/db/drizzle/0011_*.sql` — Drizzle이 생성한 실제 이름을 그대로 사용
- `packages/db/drizzle/meta/0011_snapshot.json`
- `apps/www/src/app/api/organization-inquiries/route.ts`
- `apps/www/src/features/organization-inquiry/server/validation.ts`
- `apps/www/src/features/organization-inquiry/server/email.ts`

**테이블 필드**

- organizationName
- organizationType
- contactName
- email
- phone
- programInterests
- estimatedParticipants (선택)
- message (선택, 길이 제한)
- privacyAgreed 및 consentVersion
- utmSource, utmMedium, utmCampaign, utmContent
- anonymousId
- status (`new` 기본)
- notificationEmailStatus, notificationEmailError, notificationEmailId
- createdAt, updatedAt

**보안과 실패 처리**

- 요청 본문 크기 제한
- 문자열 길이, 이메일, 전화번호, 허용 enum 검증
- SQL에는 검증된 값만 전달
- DB 저장 성공 후 관리자 이메일 실패는 제출 자체를 실패로 되돌리지 않음
- 이메일 오류 코드는 저장하고 원문 개인정보를 로그에 남기지 않음
- 중복 클릭은 클라이언트 버튼 비활성화와 요청 식별자로 방지

**검증**

```bash
npm run db:generate --workspace=@newland/db
npm run build --workspace=www
```

마이그레이션 생성물은 수동 변경하지 않고 Drizzle 결과를 검토한다. Production 적용은 별도 승인된 CI/운영 절차를 사용한다.

---

### Task 10 — 공식 사이트 분석과 교차 서브도메인 연결

**수정**

- `apps/www/src/features/analytics/server/events.ts`
- `apps/www/src/app/api/analytics/events/route.ts`
- `apps/www/src/features/analytics/components/PageViewTracker.tsx`

**생성**

- `apps/www/src/features/analytics/components/TrackedCtaLink.tsx`
- `apps/www/src/features/analytics/components/SectionViewTracker.tsx`
- `apps/www/src/features/analytics/server/origins.ts`

**추가 이벤트**

- `official_page_viewed`
- `official_section_viewed`
- `pricing_viewed`
- `organization_inquiry_started`
- `organization_inquiry_submitted`

`organization_inquiry_submitted`는 기관 문의 API가 저장 성공 후 기록하는 server-only 이벤트다. 나머지 네 이벤트만 공개 분석 API 허용 목록에 추가한다.

**교차 도메인 규칙**

- 분석 API origin 허용 목록에 `www`와 `start`를 명시적으로 포함
- 공유 익명 ID는 기존 host-only `cdk_vid`와 충돌하지 않도록 새 이름 `cdk_vid_shared`를 사용하고 production에서 `Domain=.careerdirect.kr`을 적용
- localhost·Vercel Preview에서는 host-only 쿠키 사용
- 쿠키는 HttpOnly, Secure(production), SameSite=Lax 유지
- `visitorIdFromRequest`는 `cdk_vid_shared`를 우선하고 기존 `cdk_vid`를 fallback으로 읽음
- start에서 공유 쿠키가 아직 없으면 기존 `cdk_vid` 값을 공유 쿠키로 승격해 과거 귀속을 보존
- 동일한 이름의 host-only/domain 쿠키가 중복되는 상황을 만들지 않음
- UTM은 CTA 목적지 URL에도 전달해 쿠키 차단 환경의 귀속을 보완

**검증**

1. `www` 방문 시 공유 익명 ID 생성
2. 자가진단 CTA 후 `start` 요청에 동일 ID 전달
3. UTM source/medium/campaign/content 유지
4. 허용되지 않은 Origin은 403
5. 이메일·전화번호가 분석 필드로 거부됨

---

### Task 11 — 메타데이터, JSON-LD, sitemap, robots

**수정**

- `apps/www/src/app/layout.tsx`
- `apps/www/src/app/robots.ts`
- `apps/www/src/app/sitemap.ts`
- `apps/www/public/og.png` 또는 새 `apps/www/public/og-official.png`

**페이지별 수정**

- `apps/www/src/app/official/layout.tsx`
- 공식 페이지 6개의 `metadata`

**동작**

- 공식 페이지 canonical은 공개 `www` URL
- start 랜딩과 운영 페이지 canonical은 `start` URL
- sitemap은 `www` 공식 페이지와 색인 가능한 `start` 공개 전환 페이지를 명확히 구분
- `/admin`, `/api`, 완료 페이지, 토큰 페이지, `/official` 내부 경로는 색인 제외
- Organization, Service, FAQ JSON-LD는 화면에 실제 표시되는 정보만 포함
- OG 이미지는 1200×630, 로고 안전 여백, 한국어 제목을 확인

**검증**

```bash
curl -s -H 'Host: www.careerdirect.kr' http://localhost:3000/ | rg 'canonical|og:'
curl -s http://localhost:3000/sitemap.xml
curl -s http://localhost:3000/robots.txt
```

---

### Task 12 — 법적 문서와 용어 정합성

**수정**

- `apps/www/src/app/privacy/page.tsx`
- `apps/www/src/app/refund-policy/page.tsx`
- `apps/www/src/app/terms/page.tsx`

**반영**

- 기관 문의 수집 항목, 목적, 보유기간
- 공식 사이트 익명 분석과 공유 서브도메인 쿠키 설명
- `커리어 컨설팅` 대표 명칭
- 평가 링크 발송 후 14일과 본부 등록·크레딧 활성화 후 환불 제한
- 실제 Resend/Supabase 처리 범위와 국외이전 설명 정합성

법률 자문으로 단정하지 않고, 게시 전 사업자의 최종 법률 검토가 필요함을 릴리스 체크리스트에 남긴다.

**검증**

- 가격 페이지와 환불정책의 조건 비교
- 개인정보처리방침과 실제 폼 필드 비교
- 예전 `무료 진로 상담` 표현을 의도한 `20분 무료 콜백` 또는 기관 문의로 정리

---

### Task 13 — 접근성·반응형·오류 회귀 검증

**검증 화면**

- 390×844 모바일
- 768×1024 태블릿
- 1440×900 데스크톱

**검증 항목**

- 메뉴, 모바일 메뉴, 고정 CTA
- 모든 내부·외부 링크
- 키보드 탭 순서와 포커스
- 제목 계층, landmark, alt text
- 색상 대비와 200% 확대
- reduced motion
- 기관 폼 성공·검증 오류·서버 오류
- 이미지 레이아웃 이동과 모바일 로딩

**기존 기능 회귀**

- `/career-check`
- `/career-check/thank-you`
- `/assessment-consultation`
- 콜백 일정 확정·변경 링크
- `/admin/login`, 분석 및 콜백 관리자 화면
- cron과 Resend webhook 경로가 Proxy 영향 없이 유지

**명령**

```bash
npm run lint --workspace=www
npm run build --workspace=www
```

브라우저 콘솔 오류와 Vercel Preview Function 오류도 확인한다.

---

### Task 14 — Preview 배포와 Production 전환

**Preview 체크리스트**

1. Vercel Preview에 `NEXT_PUBLIC_OFFICIAL_SITE_URL` 설정
2. Preview URL에서 기존 start 기능 회귀 확인
3. 로컬 Host 테스트와 실제 Custom Domain Preview 결과 비교
4. sitemap, robots, canonical, OG 미리보기 확인
5. 기관 문의 테스트 데이터는 관리자에서 TEST로 구분하거나 즉시 삭제 가능한 절차로 처리
6. 분석 대시보드에서 official page/CTA/inquiry 이벤트 확인

**Production 순서**

1. DB 마이그레이션 CI 성공 확인
2. 환경변수 확인
3. Build Cache 없이 1회 배포
4. `www`와 `start` 스모크 테스트
5. 실제 이메일 1건과 기관 문의 1건 확인
6. 문제 시 이전 Deployment로 즉시 롤백

## 5. 커밋 권장 단위

1. `Add host-aware official site routing`
2. `Add official site content and shared layout`
3. `Build official home and service pages`
4. `Add organization inquiry workflow`
5. `Track official site attribution across subdomains`
6. `Add official site SEO and legal updates`
7. `Verify official site production readiness`

각 커밋마다 최소 `lint` 또는 관련 빌드를 실행하고, 운영 기능과 무관한 파일을 포함하지 않는다.

## 6. 완료 정의

- 6개 공식 페이지가 `www` 공개 URL에서 렌더링된다.
- `start`의 기존 전환 루트와 모든 운영 API가 회귀 없이 동작한다.
- 평가 CTA는 본부로 직접 가지 않고 콜백으로 연결된다.
- 자가진단 CTA와 콜백 CTA의 유입·소재·위치가 대시보드 데이터에 남는다.
- 기관 문의가 DB에 저장되고 관리자 이메일로 통지된다.
- 가격, 연령, 부가세, 등록 후 환불 제한이 모든 페이지와 약관에서 일치한다.
- 공식 사이트가 접근성·모바일·SEO·빌드 검증을 통과한다.
- Production 배포 후 `www`와 `start`에서 실제 스모크 테스트를 완료한다.

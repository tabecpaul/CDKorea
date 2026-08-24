# 은사·재능·강점 콘텐츠 패키지 구현 계획

기준 설계: `docs/superpowers/specs/2026-08-24-gifts-talents-strengths-content-package-design.md`

## 범위와 금지사항

- 기존 `faith_calling_series_2026q3`의 2026-08-27 주제와 일정만 사용한다.
- CTA는 무료 진로 방향 자가진단 하나만 사용한다.
- 카드뉴스는 승인된 8장 문안과 유연형 브랜드 기준으로 제작한다.
- 네이버 자동 발행, Meta·Threads 게시 API, Drive Cron과 자동 승인은 켜지 않는다.
- 기존 미추적 `소명은 직업보다 큽니다` 사용자 파일은 읽기 비교 외에 수정·이동·커밋하지 않는다.

## 1. 작업 기준선과 출처 고정

### 1.1 작업 브랜치 정리

1. 운영 remote `cdkorea`의 최신 `main`을 가져온다.
2. `main`에서 전용 브랜치를 만든다.
3. 승인된 설계 커밋 `070086b`만 새 브랜치에 반영한다.
4. `git status --short`로 기존 미추적 사용자 파일이 그대로인지 확인한다.

검증:

- 작업 브랜치의 부모가 최신 `cdkorea/main`이다.
- PR diff에 기존 사용자 카드뉴스 파일이 포함되지 않는다.

### 1.2 콘텐츠 근거 확인

대상 파일:

- `campaigns/faith-calling-series-2026q3/launch-plan.md`
- `campaigns/faith-calling-series-2026q3/copy/instagram-facebook.md`
- Drive `01-운영-기준`
- Drive `04-브랜드-템플릿/flexible-card-news-design-spec.md`

실행:

1. 날짜, 채널별 시각, CTA와 기존 8장 문안을 대조한다.
2. 성경 구절의 범위와 번역 표기를 기존 승인 초안 안에서 유지한다.
3. 공식 출처가 필요한 새로운 통계나 비교 우위 주장을 추가하지 않는다.

검증:

- 주제·CTA·일정의 충돌이 없다.
- 영적 은사와 Career Direct의 재능을 동일 개념으로 표현한 문장이 없다.

## 2. 공식 사이트 기준 원문

### 2.1 콘텐츠 모델 작성

신규 파일:

- `apps/www/src/features/official-site/blog/giftsTalentsStrengths.ts`

구조:

- slug, 제목, 설명, 게시일
- 도입
- 네 개 개념 정의
- 공동의 유익과 청지기 관점
- Career Direct 역할과 한계
- 자기점검 질문
- 무료 진로 방향 자가진단 CTA

검증:

- CTA가 `ctas.careerCheck`만 참조한다.
- `하나님의 뜻을 판정`, `영적 은사를 측정`한다는 의미의 문구가 없다.
- 캠페인 초안의 핵심 정의와 모순되지 않는다.

### 2.2 공식 글 페이지 추가

신규 파일:

- `apps/www/src/app/official/blog/gifts-talents-strengths/page.tsx`

수정 파일:

- `apps/www/src/features/site-routing/paths.ts`
- `apps/www/src/app/sitemap.ts`

실행:

1. 서버 컴포넌트로 글을 렌더링한다.
2. 공식 사이트 레이아웃과 타이포그래피를 재사용한다.
3. metadata title, description과 canonical URL을 설정한다.
4. `/blog/gifts-talents-strengths`를 공식 host rewrite 허용 목록에 추가한다.
5. sitemap에 게시일과 URL을 추가한다.
6. 마지막 CTA는 `OfficialCtaLink`와 `ctas.careerCheck`를 사용한다.

검증:

- `www.careerdirect.kr/blog/gifts-talents-strengths`가 200을 반환한다.
- `start.careerdirect.kr/blog/gifts-talents-strengths`는 공식 host로 308 이동한다.
- JavaScript 없이도 본문과 CTA 문구가 HTML에 존재한다.
- 모바일 폭에서 가로 넘침이 없다.

### 2.3 라우팅 테스트 추가

수정 또는 신규 파일:

- 기존 site-routing 테스트 파일을 먼저 찾고 그 패턴을 따른다.
- 기존 파일이 없으면 `tests/official-blog-routing.test.ts`를 만든다.

검증 항목:

- 새 공개 경로가 official path로 판정된다.
- start-owned 경로로 판정되지 않는다.
- sitemap에 canonical URL이 한 번만 포함된다.

## 3. 채널별 원고

### 3.1 네이버 장문 작성

신규 파일:

- `campaigns/faith-calling-series-2026q3/copy/naver-blog-03.md`

구조:

1. 실제 진로 고민으로 시작하는 도입
2. 은사·재능·기술·강점 구분
3. 잘하는 일이 곧 소명이라는 오해
4. 공동의 유익과 청지기 관점
5. Career Direct가 돕는 범위와 돕지 않는 범위
6. 독자가 답할 자기점검 질문
7. 무료 진로 방향 자가진단 CTA
8. 편집기 직접 링크 및 모바일 확인 체크리스트

검증:

- 공식 원문을 그대로 복제하지 않는다.
- 카테고리는 `이직·커리어 전환`이다.
- 20분 콜백 CTA가 섞이지 않는다.
- URL에 `utm_source=naver`, `utm_medium=organic_social`, `utm_campaign=faith_calling_series_2026q3`가 있다.

### 3.2 Facebook·Instagram 문안 점검

수정 파일:

- `campaigns/faith-calling-series-2026q3/copy/instagram-facebook.md`

실행:

1. 03번 초안의 정의와 8장 구성을 보존한다.
2. 공식 원문 주소가 실제 새 페이지와 일치하는지 확인한다.
3. 무료 자가진단 CTA와 채널별 UTM을 확인한다.
4. 이미지 대체 텍스트가 최종 카드와 일치하도록 교정한다.

검증:

- Facebook과 Instagram CTA가 각각 해당 source 값을 가진다.
- 기존 01·02번 콘텐츠는 변경하지 않는다.

### 3.3 Threads 문안 작성

신규 파일:

- `campaigns/faith-calling-series-2026q3/copy/threads-03.md`

실행:

1. 개념 구분과 공동의 유익을 짧은 연속 게시물로 구성한다.
2. 마지막 게시물에만 무료 자가진단 CTA를 둔다.
3. Threads 전용 UTM을 사용한다.

검증:

- JSON 변환 시 문자열 배열로 파싱할 수 있는 구조가 준비된다.
- `utm_source=threads`, `utm_medium=organic_social`, 캠페인 값이 정확하다.
- 20분 콜백 링크가 없다.

## 4. 8장 카드뉴스 제작

### 4.1 원본 제작

사용 기준:

- 개인 템플릿 `artifact-template-career-direct-korea-5`
- Drive `flexible-card-news-design-spec.md`
- 기존 `소명은 직업보다 큽니다` 승인본은 브랜드 방향 참고 사례

신규 폴더와 파일:

- `campaigns/faith-calling-series-2026q3/creative/gifts-talents-strengths/gifts-talents-strengths-8cards.pptx`
- `campaigns/faith-calling-series-2026q3/creative/gifts-talents-strengths/slide-01.png`부터 `slide-08.png`
- `campaigns/faith-calling-series-2026q3/creative/gifts-talents-strengths/montage.png`
- `campaigns/faith-calling-series-2026q3/creative/gifts-talents-strengths/FINAL.md`

실행:

1. 기존 8장 문안의 역할을 보존한다.
2. 딥 틸·화이트·샌드 골드, 로고, 안전 여백과 페이지 번호 체계를 적용한다.
3. 각 슬라이드를 1080×1350 PNG로 렌더링한다.
4. 원본과 전체 몽타주를 함께 검토한다.

검증:

- PNG가 정확히 8장이다.
- 모든 PNG가 1080×1350이다.
- 텍스트 잘림, 겹침, 저대비, 잘못된 페이지 번호가 없다.
- 8장 CTA가 무료 진로 방향 자가진단이다.
- 사용자가 실제 디자인 원본을 보고 승인하기 전 Drive 완성 패키지로 확정하지 않는다.

## 5. 로컬 패키지 사전검증

신규 파일:

- `campaigns/faith-calling-series-2026q3/packages/2026-08-27-gifts-talents-strengths/README.md`
- `campaigns/faith-calling-series-2026q3/packages/2026-08-27-gifts-talents-strengths/threads.json`

실행:

1. 공식 원문, 네이버, Meta, Threads와 이미지 8장을 한 목록으로 정리한다.
2. 채널별 일정과 UTM을 표로 고정한다.
3. 8장 선택 이유를 README에 기록한다.
4. Drive 파일 ID가 생기기 전에는 가짜 ID를 넣은 최종 manifest를 만들지 않는다.

검증:

- 빠진 채널 원고가 없다.
- CTA, 카테고리와 일정이 설계와 일치한다.
- Threads JSON이 유효한 문자열 배열이다.

## 6. 코드와 콘텐츠 검증·배포

실행 순서:

1. 관련 단위 테스트
2. TypeScript 검사
3. ESLint
4. Next.js production build
5. 공식 글 데스크톱·모바일 렌더 확인
6. `git diff --check`
7. PR 생성
8. CI 통과 후 사용자 승인으로 병합
9. Vercel Production Ready 확인
10. 공식 URL, start host 308, CTA 목적지를 Production에서 확인

중단 조건:

- 새 글 URL이 404 또는 잘못된 host에서 제공됨
- CTA가 `/career-check` 이외의 경로로 연결됨
- 기존 공식 사이트 페이지 또는 관리자 화면 회귀
- 사용자 미추적 파일이 PR에 포함됨

## 7. Drive 완성 패키지 구성

사용자 디자인 승인과 Production 공식 글 확인 후 실행한다.

1. `05-주간-검토-패키지` 아래에 `2026-08-27-gifts-talents-strengths` 폴더를 만든다.
2. 확정된 원고와 PNG 8장을 업로드한다.
3. 업로드 결과의 실제 Drive 파일 ID를 수집한다.
4. `content-package.json`을 실제 ID로 생성해 같은 폴더에 업로드한다.
5. manifest의 `driveFolderId`가 전용 폴더 ID와 일치하는지 확인한다.
6. 대시보드에서 manifest 파일 ID로 수동 가져오기를 실행한다.

manifest 핵심값:

- `schemaVersion`: `1`
- `packageId`: `2026-08-27-gifts-talents-strengths`
- `slug`: `gifts-talents-strengths`
- `campaignKey`: `faith_calling_series_2026q3`
- `ctaKind`: `career-check`
- `naverCategory`: `이직·커리어 전환`
- 네이버: `2026-08-27T08:00:00+09:00`, `manual`
- Facebook·Instagram: `2026-08-27T19:00:00+09:00`, `manual`
- Threads: `2026-08-27T21:00:00+09:00`, `manual`

## 8. Production 수동 가져오기 검증

검증:

- 한 콘텐츠와 한 버전만 생성된다.
- 상태는 `review_pending`이다.
- 이미지가 01–08 순서로 표시된다.
- 원고, CTA, UTM, 카테고리와 일정이 정확하다.
- 동일 manifest 재가져오기는 중복으로 거부된다.
- 외부 채널 POST가 발생하지 않는다.
- 자동 발행과 Drive Cron이 비활성 상태다.

검증 완료 후에도 사용자의 별도 승인 전에는 콘텐츠를 승인 완료 또는 게시 상태로 바꾸지 않는다.

## 구현 순서

1. 기준선과 근거 확인
2. 공식 사이트 기준 원문과 라우팅
3. 네이버·Meta·Threads 문안
4. 8장 카드뉴스 원본과 PNG
5. 사용자 디자인 검토
6. 테스트·PR·Production 확인
7. Drive 패키지 업로드
8. 대시보드 수동 가져오기와 중복 검증

# 공식 사이트 Preview 라우팅 설계

## 목적

`feature/official-site` 브랜치의 Vercel Preview 주소에서 공식 Career Direct Korea 사이트를 검수할 수 있게 한다. 현재 Preview 호스트는 공식 운영 호스트가 아니므로 기존 전환 랜딩페이지를 표시한다.

## 동작

- Vercel 환경이 `preview`이고 Git 브랜치가 `feature/official-site`일 때 해당 요청을 공식 사이트 요청으로 취급한다.
- `www.careerdirect.kr`은 기존처럼 공식 사이트를 표시한다.
- `start.careerdirect.kr`은 기존처럼 전환 랜딩페이지를 표시한다.
- 다른 기능 브랜치의 Preview는 기존 동작을 유지한다.
- API, 관리자 경로, 정적 파일과 기존 공식·전환 경로 리디렉션 규칙은 변경하지 않는다.

## 구현 경계

호스트 판별 책임은 `apps/www/src/features/site-routing/hosts.ts`에 둔다. `proxy.ts`는 판별 결과만 사용해 공식 페이지 rewrite 또는 기존 경로 처리를 수행한다. Vercel이 제공하는 `VERCEL_ENV`와 `VERCEL_GIT_COMMIT_REF`를 사용하며 새 비밀값이나 수동 환경변수를 추가하지 않는다.

## 오류와 안전성

- Vercel 변수가 없거나 브랜치명이 다르면 Preview 공식 모드를 활성화하지 않는다.
- Production에서는 브랜치명과 관계없이 Preview 전용 조건을 적용하지 않는다.
- 호스트 문자열만으로 모든 `vercel.app` 배포를 공식 사이트로 처리하지 않는다.

## 검증

- `feature/official-site` + `preview`: 루트와 공식 공개 경로가 공식 사이트로 rewrite된다.
- 다른 브랜치 + `preview`: 루트는 기존 전환 랜딩페이지로 유지된다.
- `start.careerdirect.kr`: 기존 전환 경로가 유지된다.
- `www.careerdirect.kr`: 공식 공개 경로가 유지된다.
- lint, TypeScript 검사와 Vercel Preview 배포를 통과해야 한다.

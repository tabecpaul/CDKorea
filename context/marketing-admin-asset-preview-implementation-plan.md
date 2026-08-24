# 관리자 카드뉴스 미리보기 구현 계획

기준 설계:
`docs/superpowers/specs/2026-08-24-marketing-admin-asset-preview-design.md`

## 범위 고정

- 현재 콘텐츠의 현재 버전에 속한 PNG만 관리자 세션 안에서 표시한다.
- 별도 다운로드 버튼, 공개 Drive URL과 영구 서명 URL을 만들지 않는다.
- 미리보기는 읽기 전용이며 DB, Drive, 승인과 채널 상태를 변경하지 않는다.
- Meta 게시용 공개 이미지 전달 단계와 분리한다.
- DB migration과 환경변수 추가는 하지 않는다.

## Task 1 — 이미지 bytes 무결성 검증 유틸리티

**파일**

- 새 파일: `apps/www/src/features/marketing/server/assetPreview.ts`
- 새 테스트: `tests/marketing-admin-asset-preview.test.ts`

**작업**

1. 미리보기 대상 DB 자산의 최소 타입을 정의한다.

```ts
type PreviewAssetRecord = {
  id: number;
  driveFileId: string;
  mimeType: string;
  byteSize: number;
  sha256: string;
};
```

2. Drive에서 받은 bytes의 길이가 DB `byteSize`와 같은지 검사한다.
3. PNG 8-byte signature를 검사한다.
4. SHA-256을 계산해 DB 해시와 timing-safe 방식으로 비교한다.
5. MIME은 DB와 Drive 모두 정확히 `image/png`만 허용한다.
6. 크기는 기존 `MAX_MARKETING_IMAGE_BYTES`를 넘지 않게 한다.
7. 검증 실패는 제한된 오류 코드로 구분한다.

**검증**

```bash
npx tsx --test tests/marketing-admin-asset-preview.test.ts
```

- 정상 PNG bytes만 통과한다.
- MIME, 길이, signature와 hash 불일치를 각각 거부한다.

## Task 2 — 현재 버전 자산 조회와 Drive 다운로드

**파일**

- 수정: `apps/www/src/features/marketing/server/assetPreview.ts`
- 수정: `tests/marketing-admin-asset-preview.test.ts`

**작업**

1. `loadCurrentMarketingAssetPreview(contentId, assetId, drive?)`를 만든다.
2. `marketing_contents.current_version_id`와
   `marketing_content_assets.version_id`를 join 조건으로 한 번에 대조한다.
3. 다른 콘텐츠 또는 이전 버전 자산은 동일한 not-found 오류로 처리한다.
4. Drive metadata를 조회해 file ID, MIME과 size가 DB와 같은지 확인한다.
5. `isWithinOperationsFolder(asset.driveFileId)`가 true인지 확인한다.
6. 기존 최대 이미지 크기를 인자로 Drive bytes를 다운로드한다.
7. Task 1의 무결성 검증 후 `{ bytes, mimeType: "image/png" }`만 반환한다.
8. Drive ID와 원본 Drive 오류는 반환값과 사용자 응답에 포함하지 않는다.

**검증**

- query가 현재 버전과 asset ID를 동시에 제한한다.
- Drive 운영 폴더 확인이 누락되지 않는다.
- update, insert, delete와 upload 호출이 없다.

## Task 3 — 관리자 전용 preview route

**파일**

- 새 파일: `apps/www/src/app/api/admin/marketing/[id]/assets/[assetId]/preview/route.ts`
- 수정: `tests/marketing-admin-asset-preview.test.ts`

**작업**

1. GET route에서 기존 `hasAdminSession()`을 재사용한다.
2. content ID와 asset ID를 양의 safe integer로 검증한다.
3. Task 2 서비스를 호출하고 성공 시 bytes를 inline 응답한다.
4. 헤더는 다음 값으로 고정한다.

```text
Content-Type: image/png
Content-Length: 검증된 bytes 길이
Content-Disposition: inline
Cache-Control: private, no-store
X-Content-Type-Options: nosniff
```

5. 오류 상태는 설계대로 400, 404, 409, 502로 매핑한다.
6. 오류 body에는 일반화된 코드만 반환한다.
7. POST나 파일 변경 동작은 추가하지 않는다.

**검증**

- 인증 검사와 보안 헤더가 존재한다.
- route가 공개 URL 또는 Drive redirect를 반환하지 않는다.
- route가 `Content-Disposition: attachment`를 사용하지 않는다.

## Task 4 — 관리자 미리보기 갤러리

**파일**

- 새 파일: `apps/www/src/features/marketing/components/AssetPreviewGallery.tsx`
- 수정: `apps/www/src/features/marketing/components/ContentDetail.tsx`
- 수정: `tests/marketing-admin-asset-preview.test.ts`

**작업**

1. 기존 `카드뉴스 이미지` 메타데이터 영역을 `AssetPreviewGallery`로 교체한다.
2. 현재 version 번호와 카드 수를 상단에 표시한다.
3. 서버가 정렬한 current assets를 position 순서로 전달한다.
4. 각 카드의 `img src`와 새 탭 링크는 같은 관리자 preview route를 사용한다.
5. 이미지에는 position 기반 대체 텍스트를 사용한다.
6. CSS `aspect-[4/5]`와 `object-contain`으로 전체 카드를 자르지 않고 표시한다.
7. 모바일 한 열, 넓은 화면 두 열로 표시한다.
8. client-side `onError`로 카드별 실패 상태를 보여준다.
9. 실패 문구는 `미리보기를 불러오지 못했습니다`로 고정한다.
10. `현재 승인 대상 vN · 카드 N장` 안내를 표시한다.
11. Canva 링크, `검토 결정`과 `Canva 수정본 업로드`의 기존 위치·동작은 유지한다.
12. 오래된 “Drive 가져오기 단계에서 추가됩니다” 문구를 삭제한다.

**검증**

- 모든 image와 link URL이 내부 관리자 route만 사용한다.
- Drive ID가 markup URL에 들어가지 않는다.
- 카드 순서, 파일 정보, 실패 문구와 현재 버전 안내가 존재한다.
- 다운로드 버튼과 public link가 없다.

## Task 5 — 회귀와 Production 빌드 검증

**명령**

```bash
npx tsx --test tests/marketing-admin-asset-preview.test.ts
npx tsx --test tests/marketing-*.test.ts
npx tsc --noEmit -p apps/www/tsconfig.json
npm run lint -w www
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres npx next build --webpack
git diff --check
```

**확인 사항**

- 기존 Drive 가져오기, 수정본 업로드, 승인과 네이버 완료 테스트가 통과한다.
- 미리보기 요청이 DB와 Drive를 변경하지 않는다.
- 새 DB migration과 새 환경변수가 없다.
- 외부 Meta·네이버 POST가 없다.
- 사용자 소유의 미추적 카드뉴스 파일을 stage하거나 수정하지 않는다.

기본 Turbopack 빌드가 로컬 포트 바인딩 제한으로 실패하면 코드 실패와 구분해
기록하고 Webpack Production 빌드로 전체 번들을 검증한다.

## Task 6 — PR과 배포 게이트

**작업**

1. diff를 관리자 미리보기 범위로 제한한다.
2. Drive ID, secret, Production DB URL과 이미지 원본이 diff에 포함되지 않았는지 확인한다.
3. 기능 브랜치를 운영 저장소에 push하고 PR을 만든다.
4. Vercel Preview와 CI 상태를 확인한다.
5. 사용자 승인 후에만 main에 병합한다.
6. Vercel Production 배포 성공을 확인한다.

## Task 7 — Production 확인

**순서**

1. 관리자 로그인 상태에서 승인 대상 콘텐츠 상세 화면을 연다.
2. 현재 버전과 카드 수가 맞는지 확인한다.
3. 8장 카드가 position 순서대로 모두 표시되는지 확인한다.
4. 첫 장과 마지막 장을 새 탭에서 크게 확인한다.
5. Canva 링크와 수정본 업로드 영역이 유지됐는지 확인한다.
6. 새 private/incognito 세션에서 preview URL이 이미지를 반환하지 않는지 확인한다.
7. 콘텐츠 승인과 네이버·Meta·Threads 일정 상태가 변하지 않았는지 확인한다.
8. 통합 운영 백로그에 관리자 미리보기 완료를 기록한다.

Production 확인은 읽기 전용으로 수행한다. 사용자가 별도로 수정본 업로드나 최종 승인을
요청하지 않는 한 어떤 콘텐츠 상태도 변경하지 않는다.

# 콘텐츠 패키지 manifest

ChatGPT Work는 각 완성 콘텐츠 폴더에 `content-package.json` 하나를 저장합니다. 대시보드는 이 파일을 가져오지만 자동 승인하거나 게시하지 않습니다.

## Proposal review package

제안이 먼저 등록된 뒤 콘텐츠가 완성되면 기존 제안 manifest를 덮어쓰지 않고 같은 폴더에 `review-package.json`을 추가합니다. 이 패키지는 기존 `proposalPackageId`를 정확히 가리키며, 같은 콘텐츠 ID에 새 `review_pending` 버전을 추가합니다.

```json
{
  "schemaVersion": 1,
  "kind": "proposal_review",
  "packageId": "2026-09-21-review-594c9f7f7c00d832",
  "proposalPackageId": "2026-09-21-proposal-594c9f7f7c00d832",
  "driveFolderId": "DRIVE_FOLDER_ID",
  "content": {
    "title": "제안과 완전히 같은 제목",
    "ctaKind": "career-check"
  },
  "files": {
    "site": "SITE_BLOG_FILE_ID",
    "naver": "NAVER_FILE_ID",
    "meta": "META_FILE_ID",
    "threads": "THREADS_FILE_ID",
    "images": ["CARD_01_FILE_ID", "CARD_02_FILE_ID", "CARD_03_FILE_ID", "CARD_04_FILE_ID"]
  }
}
```

- `packageId`는 `proposalPackageId`의 `-proposal-`을 `-review-`로 바꾼 값이어야 합니다.
- 사이트 원문, 파생 문안, 카드 파일은 모두 `driveFolderId`의 직접 자식이어야 합니다.
- `schedules`, campaign key, UTM, 승인, 게시 증거는 이 manifest에 넣지 않습니다.
- importer는 사이트 원문까지 승인 스냅샷에 포함하지만 채널 일정·승인·발행 레코드를 만들지 않습니다.

```json
{
  "schemaVersion": 1,
  "packageId": "2026-08-31-career-topic",
  "driveFolderId": "DRIVE_FOLDER_ID",
  "canvaDesignUrl": "https://www.canva.com/design/example/view",
  "content": {
    "slug": "career-topic",
    "title": "콘텐츠 제목",
    "campaignKey": "campaign_key",
    "ctaKind": "callback-20m",
    "naverCategory": "이직·커리어 전환"
  },
  "files": {
    "naver": "DRIVE_NAVER_FILE_ID",
    "meta": "DRIVE_META_FILE_ID",
    "threads": "DRIVE_THREADS_FILE_ID",
    "images": ["DRIVE_IMAGE_01_ID", "DRIVE_IMAGE_02_ID", "DRIVE_IMAGE_03_ID", "DRIVE_IMAGE_04_ID", "DRIVE_IMAGE_05_ID"]
  },
  "schedules": [
    {
      "channel": "naver",
      "scheduledAt": "2026-08-31T07:40:00+09:00",
      "mode": "manual",
      "utmUrl": "https://start.careerdirect.kr/career-check?utm_source=naver&utm_medium=organic_social&utm_campaign=campaign_key"
    }
  ]
}
```

## 고정 규칙

- `packageId`는 전체 운영 기간에 한 번만 사용합니다.
- 이미지는 PNG 1080×1350, 기본 5장이고 콘텐츠 구조에 따라 4~8장까지 허용합니다.
- 배열 순서가 실제 카드 순서입니다.
- 모든 파일은 설정된 비공개 Drive 운영 폴더 안에 있어야 합니다.
- 시간은 초와 `+09:00`을 포함한 한국시간 형식만 허용합니다.
- 네이버는 항상 `manual`이며, CTA는 편집기에서 직접 연결하고 모바일 클릭을 확인합니다.
- UTM에는 `utm_source`, `utm_medium`, `utm_campaign`이 모두 필요합니다.
- 알 수 없는 필드는 가져오기 오류로 처리합니다.

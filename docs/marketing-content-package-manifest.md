# 콘텐츠 패키지 manifest

ChatGPT Work는 각 완성 콘텐츠 폴더에 `content-package.json` 하나를 저장합니다. 대시보드는 이 파일을 가져오지만 자동 승인하거나 게시하지 않습니다.

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

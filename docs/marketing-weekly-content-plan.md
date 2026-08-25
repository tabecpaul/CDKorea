# 주간 콘텐츠 승인 일정 파일

Drive 콘텐츠 운영 폴더의 주차별 하위 폴더에 `weekly-content-plan.json` 하나를 둡니다. 이 파일은 관리자가 승인한 다음 주 일정의 기계 판독 기준이며, 원고나 이미지를 포함하지 않습니다.

```json
{
  "schemaVersion": 1,
  "weekStart": "2026-08-31",
  "items": [
    {
      "slug": "example-career-topic",
      "title": "승인된 콘텐츠 제목",
      "campaignKey": "example_campaign_2026q3",
      "status": "approved",
      "schedules": [
        {
          "channel": "naver",
          "scheduledAt": "2026-08-31T07:40:00+09:00"
        }
      ],
      "note": "선택적인 승인·보류 근거"
    }
  ]
}
```

## 규칙

- `weekStart`는 해당 주 월요일이며 `YYYY-MM-DD` 형식입니다.
- 일정은 해당 월요일부터 일요일 사이여야 하며 `+09:00`을 명시합니다.
- 채널은 `naver`, `facebook`, `instagram`, `threads`만 허용합니다.
- 상태는 `approved`, `published`, `on_hold`만 허용합니다.
- `approved` 항목만 완성 패키지와 대시보드 import 결과를 필수 대조합니다.
- 같은 주차 파일은 하나만 허용하며, 같은 파일 안에서 slug와 채널을 중복하지 않습니다.
- `campaignKey`, `slug`, 채널과 시각은 해당 콘텐츠의 `content-package.json`과 일치해야 합니다.
- 이메일이나 Markdown 일정만으로 승인 상태를 추론하지 않습니다.
- 새 주제를 자동 승인하거나 외부 채널에 게시하지 않습니다.

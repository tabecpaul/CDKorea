# Career Direct Korea 마케팅 채널별 상세 문맥 설계

## 1. 목적

콘텐츠 캘린더에서 선택한 채널과 일정의 문맥을 상세 화면까지 유지한다. Threads
일정을 클릭했는데 공통 카드뉴스가 표시되는 혼동을 없애고, 각 채널에서 실제로
사용하는 문안·이미지·완료 도구만 보여준다.

이 변경은 화면 표시 범위만 조정한다. 콘텐츠 패키지, 승인본, 일정, 발행 방식과
외부 채널 데이터는 변경하지 않는다.

## 2. 채널별 표시 기준

| 진입 경로 | 표시 자료 | 숨기는 자료 |
|---|---|---|
| 네이버 일정 | 네이버 원고, 카드뉴스, 네이버 일정, 수동 발행 패널 | Meta·Threads 문안, 다른 채널 일정 |
| Facebook 일정 | Facebook·Instagram 공용 Meta 문안, 카드뉴스, Facebook 일정 | 네이버·Threads 문안, 다른 채널 일정, 네이버 완료 패널 |
| Instagram 일정 | Facebook·Instagram 공용 Meta 문안, 카드뉴스, Instagram 일정 | 네이버·Threads 문안, 다른 채널 일정, 네이버 완료 패널 |
| Threads 일정 | Threads 문안과 Threads 일정 | 카드뉴스, 네이버·Meta 문안, Canva 이미지 수정, 다른 채널 일정 |
| 콘텐츠 목록 직접 진입 | 기존 전체 콘텐츠 검토 화면 | 없음 |

Threads는 현재 확정된 운영 기준대로 이미지 없이 문안형 콘텐츠로 취급한다.
Facebook과 Instagram은 같은 Meta 문안과 카드뉴스를 사용하되, 선택된 채널의 일정과
UTM만 표시한다.

## 3. URL과 선택 검증

캘린더 링크는 콘텐츠 ID와 함께 channel과 schedule ID를 전달한다.

```text
/admin/marketing/{contentId}?channel=threads&schedule={scheduleId}
```

상세 페이지는 다음을 모두 만족할 때만 채널별 화면을 표시한다.

1. `channel`이 `naver`, `facebook`, `instagram`, `threads` 중 하나임
2. `schedule`이 양의 safe integer임
3. 해당 일정이 현재 URL의 콘텐츠에 속함
4. 일정의 channel이 query의 channel과 일치함
5. 일정의 version ID가 콘텐츠의 현재 version ID와 일치함

`channel`과 `schedule`이 모두 없으면 콘텐츠 목록에서 직접 진입한 전체 검토 화면으로
처리한다. 둘 중 하나만 있거나 위 관계 검증에 실패하면 채널을 추정하거나 전체 화면으로
조용히 대체하지 않는다. `선택한 채널 일정을 찾을 수 없습니다` 안내와 `전체 콘텐츠
검토로 이동` 링크를 표시한다.

## 4. 화면 구조

### 공통 헤더

- 콘텐츠 제목, 캠페인과 자동 발행 비활성 안내 유지
- 채널별 진입 시 `Threads 일정`, `네이버 일정` 같은 선택 배지 표시
- `전체 콘텐츠 검토` 링크 제공

### 전체 콘텐츠 검토

현재 상세 화면을 유지한다.

- 현재 승인 대상
- 카드뉴스 실제 미리보기
- 검토 결정
- 네이버 수동 발행
- Canva 수정본 업로드
- 전체 채널 문안
- 전체 채널 일정
- 버전 이력

최종 승인은 모든 채널 자료를 함께 확인해야 하므로 전체 검토 화면에서만 제공한다.

### 네이버 일정 화면

- 현재 버전과 네이버 일정 요약
- 카드뉴스 실제 미리보기
- 네이버 원고
- 네이버 수동 발행 패널
- 전체 검토로 이동 링크

### Facebook·Instagram 일정 화면

- 선택 채널과 현재 일정 요약
- 카드뉴스 실제 미리보기
- Facebook·Instagram 공용 문안
- 선택 채널 UTM·예정 시각·상태
- 전체 검토로 이동 링크

### Threads 일정 화면

- Threads 현재 일정 요약
- Threads 문안을 게시 순서대로 표시
- Threads UTM·예정 시각·상태
- `Threads는 현재 이미지 없이 문안으로 발행합니다` 안내
- 전체 검토로 이동 링크

카드뉴스, Canva 수정본 업로드와 네이버 수동 발행 패널은 표시하지 않는다.

## 5. 구성 요소 경계

기존 `ContentDetail`에 조건문을 계속 누적하지 않고 다음 책임으로 나눈다.

- `ContentDetail`: 전체 콘텐츠 검토 화면
- `ChannelContentDetail`: 검증된 단일 채널 일정 화면
- `ChannelScheduleSummary`: 채널, 예정 시각, mode, 상태와 UTM 표시
- 기존 `AssetPreviewGallery`: 네이버·Facebook·Instagram에서 재사용
- 기존 `NaverPublishingPanel`: 네이버에서만 재사용

문안 표시용 `CopyBlock`은 별도 재사용 구성 요소로 분리하거나 두 상세 구성 요소가
같은 작은 컴포넌트를 사용한다. DB 조회 구조와 관리자 인증은 유지한다.

## 6. 데이터 흐름

1. `MarketingCalendar`가 item의 content ID, channel과 schedule ID로 링크를 만든다.
2. 상세 page가 search params를 읽는다.
3. 기존 `getMarketingContent` 결과 안에서 현재 버전과 선택 일정을 검증한다.
4. 선택이 없으면 `ContentDetail`, 유효하면 `ChannelContentDetail`, 잘못됐으면 오류
   안내를 렌더링한다.

새 DB query, table, migration과 API endpoint는 필요하지 않다. URL query는 화면 선택
정보일 뿐 DB 상태로 저장하지 않는다.

## 7. 상태와 보안 불변

채널별 화면 이동은 다음을 변경하지 않는다.

- 콘텐츠와 버전 상태
- 승인, 승인 스냅샷과 감사 로그
- 채널 일정과 발행 결과
- Drive 파일과 Canva 링크
- Meta·네이버·Threads 외부 상태

잘못된 URL은 다른 콘텐츠나 이전 버전의 일정 정보를 표시하지 않는다. 모든 화면은
기존 관리자 세션 검사를 통과한 뒤에만 열린다.

## 8. 성능과 접근성

- 캘린더 링크는 일반 Next `Link`를 유지해 기존 prefetch와 즉시 전환 피드백을 보존한다.
- Threads 화면에서는 이미지 요청 자체가 생성되지 않는다.
- 채널 배지와 제목을 텍스트로 표시해 색상에만 의존하지 않는다.
- 잘못된 선택 안내에는 전체 검토 화면으로 돌아갈 수 있는 명시적 링크를 둔다.
- 모바일에서 문안과 일정 카드가 가로로 넘치지 않게 한다.

## 9. 검증 기준

자동 테스트:

1. 캘린더의 네 채널 링크에 올바른 channel과 schedule이 포함됨
2. 직접 콘텐츠 링크에는 query가 붙지 않음
3. 채널·일정·콘텐츠·현재 버전 관계 검증
4. Threads 화면에 Threads 문안과 일정만 있고 이미지 URL이 없음
5. 네이버 화면에 카드뉴스와 수동 발행 패널이 있음
6. Facebook·Instagram 화면에 공용 Meta 문안과 카드뉴스가 있음
7. 채널별 화면에 최종 승인 action이 없음
8. 잘못된 선택이 전체 화면으로 조용히 대체되지 않음
9. 기존 미리보기·승인·네이버 완료와 Drive 가져오기 테스트 회귀 없음

Production 확인:

1. 캘린더의 Threads 일정 클릭 시 카드뉴스가 표시되지 않음
2. Threads 문안, UTM, 시간과 상태가 표시됨
3. 네이버 일정 클릭 시 카드뉴스 8장과 네이버 패널이 표시됨
4. Facebook·Instagram 일정 클릭 시 카드뉴스와 각 일정이 표시됨
5. 콘텐츠 목록에서 직접 열면 전체 검토 화면이 유지됨
6. 모든 전환에서 승인·일정 상태가 변하지 않음

## 10. 완료 후 운영

통합 운영 백로그에 채널별 상세 문맥을 완료로 기록한다. 이후 캘린더는 발행 채널별
운영 화면, 콘텐츠 목록은 전체 승인 검토 화면이라는 역할을 유지한다. Threads 이미지
사용 정책이 나중에 변경되면 콘텐츠 패키지와 채널 자산 모델을 별도 설계하고 승인받기
전에는 이번 표시 규칙을 임의로 바꾸지 않는다.

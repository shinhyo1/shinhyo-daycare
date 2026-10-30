# 신효데이케어 적용 지침

## 현재 완료 범위와 점검 근거

추가 연결 확인: GitHub 쓰기 권한과 기존 Cloudflare Git 자동 배포, 실제 빌드 설정(루트=저장소 루트, 명령=exit 0, 출력=site)을 확인했습니다. Notion 공개용 DB 2개와 프로그램 3개, 미게시 소식 예시를 생성했습니다. Notion 자동 반영은 별도 읽기 토큰과 아래 빌드·예약 설정을 모두 완료해야 활성화됩니다. 토큰이 없는 동안 기존 정적 배포를 유지합니다.

- 기준 소스: `shinhyo1/shinhyo-daycare`, HEAD `2f10c297f7c143c6016c9330755fad40a03c867f` (2026-10-30 조회).
- 기존 `site/index.html`의 로고, 사진, 본문, 연락처, 지도, 검색 소유 확인 태그와 기존 CSS를 유지했습니다. 메인에는 상세 링크 묶음과 소식 영역만 추가했습니다.
- `/programs/cognition/`, `/programs/movement/`, `/programs/care/`, `/news/`를 추가했습니다. 기본 상세 내용은 기존 소스에 있는 소개와 사진에 근거하며, 운영 빈도·운동 종류·개별 지원은 상담 확인으로 표기했습니다.
- 개별 제목·설명·canonical·OG·WebPage 구조화 데이터와 사이트맵을 생성합니다. 검색 색인이나 AI 추천 노출은 확인하지 않았으며 보장되지 않습니다.
- 저장소에는 원래 배포 워크플로·wrangler 설정이 없었습니다. README의 기존 안내는 루트=저장소 루트, 빌드=`exit 0`, 출력=`site`입니다. 실제 대시보드 설정과 같다는 뜻은 아닙니다.
- 초기 로컬 작업 시에는 GitHub·Notion 도구가 연결되지 않았습니다. Cloudflare 창은 열려 있었지만 창 제어 도구가 동일 창 소유권 오류를 반환해 실제 프로젝트 설정을 확인하지 못했습니다. 이는 초기 작업의 제한이었으며, 현재 실제 반영 결과는 GitHub 커밋과 Cloudflare 배포 상태를 기준으로 확인하세요.

## 1. 기존 화면부터 적용

먼저 저장소 최신 변경과 이 납품본을 비교하세요. ZIP을 저장소 위에 덮어쓰기 전에 별도 브랜치에서 검토하세요. 원격에 이후 변경이 있다면 전체 교체하지 말고 변경 파일만 병합합니다.

전체 소스 ZIP에는 기존 이미지와 파일도 포함됩니다. 압축 내부 파일을 저장소 루트에 놓으세요. `.github`, `scripts`, `tests`, `site`, `package.json`, `.gitignore`가 같은 단계입니다. ZIP 자체를 업로드하지 마세요.

기존 빌드 설정을 그대로 사용해도 `site`에 포함된 정적 상세 페이지와 링크는 동작합니다. **이 단계만으로 Notion 자동 연동이 되지는 않습니다.**

## 2. Notion 데이터베이스 2개 준비

프로그램과 센터 소식을 별도 데이터베이스로 만드세요. DB를 웹에 공개할 필요는 없습니다. 읽기 전용 내부 통합을 만들고 이 두 DB에만 연결하세요. 토큰을 채팅·저장소·브라우저 코드에 붙여 넣지 마세요.

두 DB의 속성 이름은 아래 영문과 정확히 같아야 합니다.

| 속성 | Notion 형식 | 용도 |
| --- | --- | --- |
| Name | 제목 | 공개 제목, 필수 |
| Summary | 텍스트 | 검색 설명과 목록 요약, 필수 |
| Body | 텍스트 | 공개 본문, 필수. 줄바꿈으로 문단 구분 |
| Published | 체크박스 | 체크한 항목만 공개 |
| Slug | 텍스트 | 프로그램 DB에만 필요 |
| Date | 날짜 | 소식 DB에만 필요, 시간 없이 YYYY-MM-DD |

프로그램 Slug는 `cognition`, `movement`, `care` 세 값만 허용하며 각각 최대 한 행입니다. `content-templates/programs.csv`를 가져온 뒤 Published는 체크박스, 나머지는 위 형식으로 설정하세요. 초안은 Published를 체크하지 않은 상태로 검토합니다.

소식은 `content-templates/news.csv`의 머리글을 참고해 직접 행을 만드세요. 소식 주소는 Notion 페이지 UUID로 생성되므로 제목을 바꿔도 유지됩니다. Notion 페이지 본문 블록·파일·이미지는 읽지 않습니다. **공개할 내용은 Body 속성에 작성**하세요. HTML·Markdown은 해석하지 않고 텍스트로 표시됩니다. 활동 날짜·내용·참여 방식을 구체적으로 적되 이용자 이름·건강정보 등 내부 기록은 적지 마세요.

DB ID가 아니라 각 DB 안의 **data source ID**를 사용합니다. Notion API의 데이터베이스 조회 응답 `data_sources`에서 확인할 수 있습니다. 통합이 해당 소스에 접근할 수 있는지 확인하세요.

프로그램 행이 미게시·삭제되면 그 페이지는 기본 소개로 돌아갑니다. 소식 행은 미게시·삭제되면 다음 성공 배포에서 목록·페이지·사이트맵에서 제외됩니다. 이미 수집된 검색 캐시까지 즉시 삭제되는 것은 아닙니다.

## 3. Cloudflare Pages 빌드 연결

기존 `shinhyo-daycare` Pages 프로젝트를 사용하고 새 프로젝트나 도메인을 만들지 마세요. 현재 Production branch·Root·Build·Output 값을 먼저 기록하고 이전 성공 배포를 보관합니다.

프로젝트의 Settings → Variables and Secrets (화면 명칭은 다를 수 있음)에 다음 값을 추가합니다. **NOTION_TOKEN은 Secret 형식으로 저장**합니다. 실제 값을 파일에 기록하지 마세요.

| 이름 | 값 |
| --- | --- |
| NOTION_TOKEN | 읽기 전용 Notion 통합 토큰 (Secret) |
| NOTION_PROGRAMS_DATA_SOURCE_ID | 프로그램 data source UUID |
| NOTION_NEWS_DATA_SOURCE_ID | 소식 data source UUID |
| NODE_VERSION | 22 |

미리보기 환경에도 연동이 필요할 때만 별도로 설정하세요. 프리뷰에 비밀 변수를 제공하면 해당 브랜치의 빌드 코드가 이를 읽을 수 있으므로, 신뢰하는 브랜치로 제한합니다. 운영 비밀을 외부 기여자의 프리뷰에 제공하지 마세요.

빌드 설정을 저장소 루트, Build command=`npm run build`, Output directory=`dist`로 변경합니다. 패키지 의존성 설치는 필요 없습니다. `site`는 소스·기본 정적 배포용이고, `dist`는 Notion 반영 결과입니다.

첫 배포 전 Notion에 공개 가능한 테스트 소식 1건을 작성하고 검토합니다. API 실패·잘못된 스키마·중복 프로그램 Slug는 빌드를 실패시키므로, Cloudflare에서 성공한 이전 배포를 계속 제공합니다. 세 변수를 전부 비워 두면 기본 정적 콘텐츠만 빌드합니다. 세 변수 중 일부만 설정하면 실패합니다.

## 4. 자동 갱신 켜기

구조: GitHub 예약 실행 → 비밀 Deploy Hook 호출 → 기존 Cloudflare Pages 빌드 → Notion 공개 속성 조회 → 정적 HTML 배포. Notion 토큰은 Cloudflare 빌드에서만 사용하고 클라이언트에 내려가지 않습니다. 별도 공개 API나 쓰기 권한이 필요하지 않습니다.

1. Cloudflare 기존 프로젝트에서 운영 브랜치용 Deploy Hook을 만듭니다. Hook URL은 배포를 유발하는 비밀입니다.
2. GitHub 저장소 Settings → Secrets and variables → Actions → Secrets에 `CLOUDFLARE_DEPLOY_HOOK`을 저장합니다.
3. 같은 화면 Variables에 `NOTION_SYNC_ENABLED`=`true`를 추가합니다. 기본은 비활성화입니다.
4. `.github/workflows/refresh-content.yml`을 기본 브랜치에 포함하고 Actions를 허용합니다.
5. Actions → Refresh Notion content → Run workflow를 실행합니다. 이 작업의 성공은 배포 요청 수락까지만 의미합니다. 실제 배포 성공은 Cloudflare Deployments에서 확인합니다.

매시 17분(UTC 기준 분)에 재배포를 요청하므로 변경 반영은 실시간이 아닙니다. 보통 다음 예약과 빌드 후 반영되지만 GitHub 예약 지연·비활성화·계정의 빌드 한도 등에 따라 늦어질 수 있습니다. 기본 브랜치에서 실행되며, 공개 저장소는 장기간 활동이 없으면 예약이 중지될 수 있습니다. 약 24회/일의 빌드를 사용하므로 계정 한도를 확인하세요. 실행 주기는 워크플로의 cron으로 줄일 수 있습니다.

## 5. 검증과 복구

로컬 Node.js 22 이상에서 `npm test`, `npm run build`, `node scripts/preview.mjs` 순서로 실행하고 `http://127.0.0.1:4173`을 엽니다. 실제 Notion 연결 검증에는 환경 변수를 별도로 주입해야 합니다. 저장소에는 .env 파일을 추가하지 않습니다. 빌드 도구가 .env를 자동으로 읽지는 않습니다.

운영 배포 후에는 다음을 확인합니다.

- 메인 로고·사진·지도·기존 상담 기능과 상세 링크 3개, 소식 목록·상세 주소
- 모바일 메뉴·가로 넘침·전화 링크, JavaScript를 끈 상태의 본문
- Notion Published 체크/해제 후 다음 배포에서 공개/제외되는지
- `sitemap.xml`, 각 canonical, 페이지 소스에 NOTION_TOKEN 실제 값이 없는지
- 실패한 Notion 조회 시 새 배포가 실패하고 이전 성공 사이트가 유지되는지

문제가 생기면 먼저 GitHub `NOTION_SYNC_ENABLED`를 `false`로 바꿔 예약 갱신을 중지하고 Cloudflare에서 이전 성공 배포로 롤백하세요. 설정을 복구할 때 이전 Build/Output 값도 함께 복구합니다. 빌드 로그에는 API 응답·토큰을 출력하지 않습니다.

## 공식 참고 자료

- Notion 데이터 소스 조회: https://developers.notion.com/reference/query-a-data-source
- Cloudflare 빌드 설정: https://developers.cloudflare.com/pages/configuration/build-configuration/
- Cloudflare Deploy Hooks: https://developers.cloudflare.com/pages/configuration/deploy-hooks/
- GitHub 예약 실행: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule

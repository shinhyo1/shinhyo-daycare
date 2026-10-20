# 신효데이케어센터 정적 홈페이지

별도 빌드·패키지 설치 없이 HTML/CSS/JS만으로 동작합니다.
GitHub는 소스 관리, Cloudflare Pages는 웹 공개 용도로 사용합니다.
이 패키지는 로컬 파일 납품본입니다. GitHub 저장소 생성·Cloudflare 계정 연결·실제 배포는 수행하지 않았습니다.

## 파일 구성

- site/index.html: 모든 본문, SEO 메타 태그, 최소 LocalBusiness JSON-LD
- site/styles.css: 데스크톱·모바일 반응형 디자인
- site/script.js: 모바일 메뉴와 실제 연락처·외부 채널 연결
- site/favicon.svg: 자체 제작 심볼
- site/robots.txt: 크롤링 안내
- site/sitemap.xml: 실제 도메인으로 교체할 사이트맵 템플릿
- site/404.html: 없는 페이지 안내
- site/_headers: Cloudflare Pages 응답 헤더
- localbusiness.template.json: 확인 후 반영할 확장 구조화 데이터 예시 (자동 게시되지 않음)

## 1. 공개 전 편집

1. site/index.html을 텍스트 편집기로 엽니다. 모든 대괄호 자리표시자를 찾아 실제 확인된 정보로 교체합니다.
2. 시설 소개·인력·시설·프로그램·송영·이용 대상·비용은 센터 운영자가 사실 확인 후 작성합니다. 미확인 항목은 준비 중으로 표시하거나 삭제하세요.
3. 비용에는 적용 기준·별도 부담 항목·기준일을 함께 적습니다. 등급·급여 적용 조건을 추정해서 작성하지 마세요.
4. 실사진 사용 시 게시 권한과 인물 동의를 확인합니다. 사진을 site/images/에 넣고 사진 등록 공간을 img로 교체합니다. alt에 실제 사진 내용을 적고 width·height를 지정하세요. 현재 일러스트는 실제 시설 사진이 아닙니다.
5. 대표 전화번호를 본문·상단·하단에 동일하게 입력합니다. site/script.js의 CONTACT.phone에도 입력하면 전화 버튼이 작동합니다.
6. CONTACT.map, blog, place, kakao에 실제 센터의 https 주소를 입력합니다. 홈페이지·플레이스·블로그에서 상호·주소·전화번호를 통일하세요. 미설정 링크는 클릭되지 않습니다.
7. 네이버 소유 확인 등을 위한 메타 태그나 HTML 파일은 해당 서비스가 발급한 실제 값만 추가합니다.
8. 본문을 직접 HTML로 제공하므로 JavaScript가 꺼져도 소개·FAQ를 읽을 수 있습니다. 외부 연결은 JS를 사용합니다. JS 없이도 연결하려면 해당 a 요소에 href를 직접 적고 aria-disabled를 제거하세요.

## 2. GitHub 저장소에 올리기 (웹 화면)

1. GitHub에 로그인 → 새 저장소(New repository)를 만듭니다. 예: shinhyo-daycare. 공개/비공개 여부는 관리 정책에 맞게 정합니다.
2. 압축을 푼 폴더에서 README.md, localbusiness.template.json, site 폴더를 선택합니다. ZIP 파일 자체를 올리지 마세요.
3. 저장소의 Add file → Upload files에서 위 파일과 폴더를 올리고 Commit changes를 누릅니다.
4. 저장소 첫 화면에서 README.md와 site/index.html이 보이는지 확인합니다. 폴더가 한 단계 더 들어갔다면 아래 출력 경로도 맞춰야 합니다.
5. GitHub Settings → Pages를 켤 필요는 없습니다. 실제 호스팅은 Cloudflare Pages에서 합니다.
6. 개인정보·내부 문서·비밀번호·API 키를 저장소에 넣지 마세요.

Git을 사용하는 경우, 압축을 푼 폴더에서 본인 저장소 URL로 다음을 실행할 수 있습니다.
기존 저장소가 있으면 새로 초기화하지 말고 기존 작업 흐름을 사용하세요.

    git init
    git add .
    git commit -m "Add Shinhyo daycare static website"
    git branch -M main
    git remote add origin https://github.com/YOUR-ACCOUNT/YOUR-REPOSITORY.git
    git push -u origin main

## 3. Cloudflare Pages 무료 플랜으로 연결

Cloudflare 공식 정적 HTML 배포 문서를 기준으로 정리했습니다 (확인일: 2026-10-20).
대시보드 명칭은 변경될 수 있습니다.

1. Cloudflare에 로그인합니다.
2. Workers & Pages → Create application → Pages → Import an existing Git repository로 이동합니다.
3. GitHub 계정을 연결하고 배포할 저장소에 접근을 허용합니다. 가능하면 필요한 저장소만 선택합니다.
4. 해당 저장소를 선택하고 다음 설정을 입력합니다.

| 설정 | 값 |
| --- | --- |
| Production branch | main |
| Framework preset | None (선택 항목이 있는 경우) |
| Build command | exit 0 |
| Build output directory | site |
| Root directory | 저장소 루트, 별도 지정하지 않음 |
| Environment variables | 필요 없음 |

5. Save and Deploy를 실행합니다. 성공 시 제공되는 https://프로젝트명.pages.dev 주소로 접속합니다.
6. 첫 배포는 검토용입니다. 현재 noindex가 있어 검색 색인을 요청하지 않습니다. noindex는 비공개 설정이 아니므로 URL을 아는 사람은 볼 수 있습니다.
7. 정식 주소와 본문을 확정한 뒤 아래 검색 설정을 수정하여 다시 커밋합니다.
8. GitHub의 main 브랜치에 수정 내용을 커밋하면 Cloudflare Pages가 자동으로 다시 배포합니다. 실패 시 Deployments의 로그와 출력 폴더 site를 확인합니다.
9. 자체 도메인은 선택 사항입니다. Pages 프로젝트의 Custom domains에서 추가하고 안내에 따라 DNS를 연결합니다. 도메인 등록 비용은 별도일 수 있습니다.
10. 이전 버전 복구는 Cloudflare Deployments의 해당 배포 메뉴 또는 GitHub의 이전 내용 복원 커밋으로 진행합니다.

무료 플랜에도 사용 한도가 있습니다. 변경 가능한 정확한 요금·한도는 공식 문서를 확인하세요.
https://developers.cloudflare.com/pages/platform/limits/

## 4. 검색 허용·도메인 설정

1. site/index.html의 YOUR-DOMAIN.example 두 곳(canonical, og:url)을 실제 대표 HTTPS 주소로 바꿉니다. 끝의 /를 포함해 일관되게 사용합니다.
2. site/sitemap.xml의 loc도 같은 주소로 교체합니다. 단일 페이지이므로 #about 같은 앵커는 별도 페이지로 넣지 않습니다.
3. site/robots.txt의 Sitemap 주석(#)을 제거하고 실제 사이트맵 주소를 입력합니다.
4. 본문과 FAQ, 프로그램 분류 예시를 실제 내용으로 완성하고 상단의 '정보 확인 중' 배너를 제거합니다.
5. 준비가 끝났을 때만 meta name="robots"의 noindex,follow를 index,follow로 바꿉니다.
6. LocalBusiness 데이터를 아래 절차대로 보완합니다.
7. 실제 HTTPS 주소의 /robots.txt와 /sitemap.xml을 열어 오류가 없는지 확인합니다.
8. Google Search Console·네이버 서치어드바이저에서 사이트 소유 확인 후 사이트맵을 제출합니다. 등록·크롤링·색인·검색 노출은 각각 다르며, 특정 순위나 AI 답변 인용을 보장하지 않습니다.
9. 미리보기 배포와 운영 주소가 중복 색인되지 않도록 Cloudflare의 미리보기 noindex 응답 헤더도 확인합니다. 대표 도메인은 하나로 정하세요.

## 5. LocalBusiness 구조화 데이터

index.html에는 상호만 확인된 최소 LocalBusiness가 들어 있습니다.
주소 등 필수 정보가 부족하므로 Google의 리치 결과 적합성이 확보된 상태는 아닙니다.
localbusiness.template.json은 편집용이며 웹 페이지에 자동으로 삽입되지 않습니다.

- 템플릿의 대괄호 값을 확인된 값으로 바꾼 후 index.html의 application/ld+json 내용을 교체합니다.
- 확인되지 않은 속성은 빈 문자열이나 가짜 값을 넣지 말고 속성 자체를 삭제합니다.
- sameAs에는 실제 센터의 공식 블로그·플레이스·카카오채널 URL만 배열로 추가합니다.
- openingHoursSpecification, priceRange, geo, 리뷰·평점은 현재 넣지 않았습니다. 확인된 값이 있을 때만 추가하세요.
- JSON의 마지막 항목 뒤 쉼표는 제거해야 합니다. JSON에는 주석을 넣을 수 없습니다.
- 본문에 표시한 주소·전화·운영시간과 구조화 데이터를 일치시킵니다.
- Google Rich Results Test와 Schema Markup Validator에서 실제 URL을 검증합니다.
- FAQ는 본문으로 제공합니다. FAQ 리치 결과 노출을 약속하거나 가짜 후기·평점을 사용하지 않습니다.

## 6. 점검 체크리스트

- [ ] 대괄호 자리표시자와 '예시' 콘텐츠를 정리했다.
- [ ] 이용 대상·송영·시설·프로그램·금액은 센터가 확인했다.
- [ ] 주소·전화·시간이 본문과 외부 채널에서 일치한다.
- [ ] 전화·지도·블로그·플레이스·카카오 버튼이 올바른 곳을 연다.
- [ ] 휴대폰에서 가로 넘침 없이 본문·메뉴·FAQ를 사용할 수 있다.
- [ ] 키보드 Tab으로 링크·메뉴·FAQ를 이용할 수 있다.
- [ ] canonical·og:url·sitemap에 실제 대표 도메인을 입력했다.
- [ ] 공개 준비 후 noindex를 제거했다.
- [ ] 실사진의 게시 권한과 개인정보를 확인했다.
- [ ] 존재하지 않는 주소에서 404 페이지가 나온다.
- [ ] 구조화 데이터·사이트맵·실제 배포 URL을 검증했다.

## 7. 미리보기와 데이터 처리

site/index.html을 더블클릭하면 로컬에서 볼 수 있습니다.
정확한 HTTP 동작은 로컬 정적 서버 또는 Cloudflare의 배포 주소에서 확인하세요.
이 사이트에는 상담 입력폼·분석 도구·쿠키 스크립트·외부 폰트가 없습니다.
운영 중 분석 도구나 폼을 추가하면 실제 수집 항목·보관·동의·개인정보 안내를 별도로 검토하세요.
Cloudflare 등 호스팅 서비스의 접속 로그 처리는 해당 서비스 정책을 확인하세요.

## 공식 참고 자료

- Cloudflare 정적 HTML: https://developers.cloudflare.com/pages/framework-guides/deploy-anything/
- Git 연결: https://developers.cloudflare.com/pages/get-started/git-integration/
- GitHub 업로드: https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository
- Google LocalBusiness: https://developers.google.com/search/docs/appearance/structured-data/local-business
- 사이트맵: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- AI 검색 관련 안내: https://developers.google.com/search/docs/appearance/ai-features
- Google Search Console: https://search.google.com/search-console/
- 네이버 서치어드바이저: https://searchadvisor.naver.com/
- 구조화 데이터 검사: https://search.google.com/test/rich-results
- Schema 검사: https://validator.schema.org/

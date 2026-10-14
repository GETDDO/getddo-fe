# Design System — Color / Radius & Shadow / Typography

> 출처: Figma `최종 융합 프로젝트` 파일 › **01 Design System** 페이지 (`01 COLOR`, `02 Type`, `03 Radius & Shadow` 섹션)
> 용도: AI 에이전트가 프론트엔드 개발 시 참고하는 디자인 토큰 명세서. 값의 실제 원천은 별도 `tokens.css`이며, 이 문서는 그 값의 의미와 용도를 설명한다.
> 기준일: 2026-09-27 (Figma 최신 상태) · 색 역할 규칙 추가 2026-10-13

---

## 0. 사용 원칙 (에이전트가 지킬 것)

1. **하드코딩 금지**: 컴포넌트 코드에 `#E6007E` 같은 hex 값을 직접 쓰지 말고, 반드시 아래 토큰명(`brand/primary` 등)에 매핑된 CSS 변수·디자인 토큰을 통해 참조한다.
2. **의미(semantic) 우선**: 같은 색이어도 "무엇에 쓰는가"에 따라 다른 토큰명을 쓴다.
3. **관리자 전용 vs 사용자 전용 구분**: `status/*`, `chart/*`는 관리자(운영자) 화면 전용, `play/*`는 사용자(응모자) 사이트 전용.
4. **값의 원천**: 이 문서의 모든 값은 Figma 도형에 실제로 바인딩된 Variable/Effect 값을 기준으로 작성했다 (캔버스에 사람이 손으로 적어둔 hex 텍스트 라벨이 아님). 2026-09-27 기준으로 캔버스 라벨과 실제 값은 모두 일치한다.
5. **`cn()` 병합 주의**: `cn`(`@shared/lib/utils`)의 충돌 병합은 Tailwind 기본 그룹 기준이라 커스텀 토큰을 모른다. `cn('text-caption', 'text-fg-brand')`처럼 타이포 토큰과 색상 토큰을 함께 넣으면 같은 `text-*` 그룹으로 보고 앞 클래스를 지운다 — 그 조합은 `cn` 대신 문자열 결합을 쓴다 (사례: `features/checkAttendance/ui/AttendanceCheckCard.tsx`).

---

## 1. Color Tokens

### 1) Brand — default (기능 화면 기본값)

| Token                   | Hex       | 용도                                                                                        |
| ----------------------- | --------- | ------------------------------------------------------------------------------------------- |
| `brand/primary`         | `#E6007E` | "지금" 신호 — 로고, 메뉴 밑줄, 알림 점, 진행 중·실시간·오픈 임박 표시 (아래 "색 역할 규칙") |
| `brand/primary-hover`   | `#D10072` | Hover 상태                                                                                  |
| `brand/primary-pressed` | `#BC0066` | Pressed 상태                                                                                |
| `brand/light`           | `#F5A3CB` | 강조 테두리, 구분 라인                                                                      |
| `brand/soft`            | `#FDEBF4` | 섹션 배경, 선택된 행                                                                        |

### 2) Action — Neutral (무채색 버튼/모달 확인)

_(Figma 원본 섹션 라벨은 "2. Button — 버튼"이며, 토큰 이름은 `action/*`이다.)_

| Token                    | Hex       | 용도                        |
| ------------------------ | --------- | --------------------------- |
| `action/neutral`         | `#1F242B` | 무채색 버튼 채움, 모달 확인 |
| `action/neutral-hover`   | `#343A42` | Hover 상태                  |
| `action/neutral-pressed` | `#111417` | Pressed 상태                |

### 3) Ticket — 응모권

| Token                   | Hex       | 용도                                                               |
| ----------------------- | --------- | ------------------------------------------------------------------ |
| `ticket/primary`        | `#FFC83D` | 티켓 카드 면, 응모권 획득 모먼트, 세컨더리 버튼 hover·pressed 채움 |
| `ticket/accent`         | `#FFF4D1` | 티켓 카드 라벨, 장식, 보상 화면 바탕(지갑·보상 모달·당첨 배너)     |
| `ticket/accent-pressed` | `#FFE9A6` | 세컨더리 버튼 hover·pressed 테두리                                 |
| `ticket/on`             | `#1F242B` | 응모권 칩 위 텍스트                                                |

### 4) Play — 놀이 파스텔 (사용자 사이트 전용)

| Token                | Hex       | 용도                                                   |
| -------------------- | --------- | ------------------------------------------------------ |
| `play/yellow-soft`   | `#FFF4D1` | 히어로·배너 배경                                       |
| `play/yellow`        | `#FFC83D` | 응모권·코인·별 장식                                    |
| `play/pink-soft`     | `#FDEBF4` | 보상 가능 카드, 일러스트 뒤 블롭                       |
| `play/pink`          | `#F5A3CB` | 장식                                                   |
| `play/lavender-soft` | `#F0EBFF` | 게임·랭킹 영역 배경, 게임 미션 아이콘 원               |
| `play/lavender`      | `#A78BFA` | 게임 일러스트, 캐릭터 소품 (텍스트·버튼에는 사용 금지) |

#### Game — 글자색깔 맞추기 문제 색 (게임 화면 전용)

밝기·채도를 고르게 맞춘 깔끔한 원색 — 네 색 중 하나만 튀지 않게 했다. 게임 판(밝은 그림) 위에서만 쓰므로 다크 모드 값이 따로 없다.

| Token         | Hex       | 용도                                          |
| ------------- | --------- | --------------------------------------------- |
| `game/red`    | `#F03E3E` | 문제 글자 빨강                                |
| `game/blue`   | `#1C7ED6` | 문제 글자 파랑                                |
| `game/yellow` | `#F59F00` | 문제 글자 노랑 (판 위에서 보이게 살짝 주황빛) |
| `game/green`  | `#37B24D` | 문제 글자 초록                                |

#### Grade — 응모권 등급

게임·미션 보상의 등급 응모권(브론즈 80%·실버 18%·골드 2%, 출석은 브론즈 고정)을 구분하는 색. 밝기·채도를 고르게 맞춰 너무 따뜻하지도 차갑지도 않게 했다. 진한 색은 점·막대·테두리, soft는 알약·카드 바탕(글자는 잉크색). 다크 모드에도 같은 값을 쓴다.

| Token               | Hex       | 용도                  |
| ------------------- | --------- | --------------------- |
| `grade/bronze`      | `#C27C55` | 브론즈 점·막대·테두리 |
| `grade/bronze-soft` | `#F6E9E1` | 브론즈 알약·카드 바탕 |
| `grade/silver`      | `#8E9BAD` | 실버 점·막대·테두리   |
| `grade/silver-soft` | `#ECEFF4` | 실버 알약·카드 바탕   |
| `grade/gold`        | `#D9A92E` | 골드 점·막대·테두리   |
| `grade/gold-soft`   | `#FAF0D2` | 골드 알약·카드 바탕   |

### 5) Surface — 배경 레이어

| Token              | Hex                          | 용도                       |
| ------------------ | ---------------------------- | -------------------------- |
| `surface/page`     | `#FFFFFF`                    | 전체 페이지 배경           |
| `surface/canvas`   | `#F4F5F7`                    | 이벤트 카드, 리스트 아이템 |
| `surface/elevated` | `#FFFFFF`                    | 모달, 드롭다운, 토스트     |
| `surface/sunken`   | `#F1F3F5`                    | 인풋 배경, 테이블 헤더     |
| `surface/pressed`  | `#E4E7EA`                    | 탭·아이템 눌림 상태        |
| `surface/disabled` | `#E9EBEE`                    | 비활성 버튼 채움           |
| `surface/overlay`  | `#12161B` (50%, `#12161B80`) | 모달 딤(dim) 처리          |

### 6) Border

| Token                 | Hex          | 용도                                          |
| --------------------- | ------------ | --------------------------------------------- |
| `border/default`      | `#E4E7EA`    | 카드·인풋 기본 테두리                         |
| `border/strong`       | `#CDD2D8`    | 구분선, 테이블 경계                           |
| `border/brand`        | `#E6007E`    | 선택된 카드 (세컨더리 버튼은 `border/strong`) |
| `border/brand-subtle` | `#F5A3CB`    | 요약 카드 테두리                              |
| `border/focus`        | `fg/primary` | 키보드 포커스 링 (2px, 요소와 2px 띄움)       |

### 7) Foreground — 텍스트·아이콘

| Token          | Hex       | 용도                           |
| -------------- | --------- | ------------------------------ |
| `fg/primary`   | `#1F242B` | 본문 텍스트, 제목              |
| `fg/secondary` | `#4B525C` | 부제목, 설명                   |
| `fg/tertiary`  | `#6B727C` | 캡션, 타임스탬프, placeholder  |
| `fg/disabled`  | `#9AA1AB` | 비활성 텍스트                  |
| `fg/brand`     | `#E6007E` | 브랜드 텍스트, 링크, 핵심 숫자 |
| `fg/on-brand`  | `#FFFFFF` | 마젠타 버튼·선택 탭 위 텍스트  |

### 8) Semantic

| Token                   | Hex       | 용도                                   |
| ----------------------- | --------- | -------------------------------------- |
| `semantic/success`      | `#14A378` | 성공 아이콘, 완료 표시                 |
| `semantic/success-soft` | `#E8FAF3` | 성공 뱃지·배너 배경                    |
| `semantic/error`        | `#F04438` | 에러 아이콘, 삭제 버튼                 |
| `semantic/error-strong` | `#D92D20` | `error-soft` 배경 위에 올라가는 텍스트 |

### 9) Status — 관리자 전용

| Token                  | Hex       | 용도                                              |
| ---------------------- | --------- | ------------------------------------------------- |
| `status/pending`       | `#F1F3F5` | 검토 대기 뱃지 배경                               |
| `status/active`        | `#E7F0FE` | 진행 중 뱃지 배경                                 |
| `status/revision`      | `#FBF0D9` | 보완 요청 뱃지 배경                               |
| `status/approved`      | `#E6F5EE` | 승인 뱃지 배경                                    |
| `status/rejected`      | `#FBEBEE` | 반려 뱃지 배경                                    |
| `status/pending-text`  | `#4B525C` | 검토 대기 뱃지 텍스트                             |
| `status/active-text`   | `#1D4ED8` | 진행 중 뱃지 텍스트                               |
| `status/revision-text` | `#B45309` | 보완 요청 뱃지 텍스트                             |
| `status/approved-text` | `#0B6549` | 승인 뱃지 텍스트                                  |
| `status/rejected-text` | `#D92D20` | 반려 뱃지 텍스트 (`semantic/error-strong` 재사용) |

### 10) Chart — 관리자 전용

| Token             | Hex       | 용도                                         |
| ----------------- | --------- | -------------------------------------------- |
| `chart/line`      | `#E6007E` | 현재 기간 선 (2px, `brand/primary` 재사용)   |
| `chart/point`     | `#BC0066` | 강조 포인트 (`brand/primary-pressed` 재사용) |
| `chart/compare`   | `#CDD2D8` | 지난 기간 선 (1.5px 점선)                    |
| `chart/grid`      | `#F1F3F5` | 가로 격자선                                  |
| `chart/axis`      | `#9AA1AB` | 축 라벨                                      |
| `chart/highlight` | `#F59E0B` | 이상치, 어뷰징 탐지                          |

### 11) Gradient

| Token                 | 값                                                                         | 용도                                                                                                |
| --------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `gradient/chart-area` | `linear-gradient(180deg, rgba(230,0,126,0) 0%, rgba(230,0,126,0.22) 100%)` | 차트 영역 채움 전용 — `brand/primary`가 위에서 투명(0%)으로 시작해 아래로 22% 불투명도까지 진해진다 |

### 12) Inverse — 테마 무관 고정 크롬

| Token                   | 값        | 용도                                                 |
| ----------------------- | --------- | ---------------------------------------------------- |
| `surface/inverse`       | `#1f242b` | 라이트·다크 공통 어두운 배경 — 푸터, 관리자 사이드바 |
| `surface/inverse-muted` | `#343a42` | inverse 배경 위의 활성·선택 상태                     |
| `fg/inverse`            | `#f4f5f7` | inverse 배경 위의 텍스트                             |

### 13) 색 역할 규칙 — 버튼 · 마젠타 · 노랑

토큰 값과 별개로 "어떤 색을 어디에 쓰는가"를 정한 규칙이다. 노랑(응모권, 웜톤)과 마젠타(U+ 브랜드, 쿨톤)는 온도가 달라 섞이면 이질감이 생기므로 **영역과 크기로 떼어 놓는다**.

**버튼**

| 종류        | 평소                      | hover / pressed                                                                   | 쓰는 곳                                                                    |
| ----------- | ------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `primary`   | `action/neutral`          | 한 단계씩 진하게                                                                  | 화면의 주 행동 — **응모하기**, 제출, 조회, 출석하기                        |
| `secondary` | 흰 바탕 + `border/strong` | `ticket/primary` 채움 + `ticket/accent-pressed` 테두리 (pressed는 한 단계 어둡게) | 보조 행동, 카드마다 반복되는 이동(게임하러 가기, 미션하러 가기, 다시 조회) |

- **마젠타 버튼(`emphasis`)은 쓰지 않는다.** 응모처럼 중요한 행동은 색이 아니라 크기(Large)·자리·확인 모달로 드러낸다.
- 상세로 **이동**하는 버튼은 "응모하러 가기", 실제로 응모권을 **쓰는** 버튼은 "응모하기"로 이름을 구분한다.
- hover를 회색으로 하지 않는다 — 비활성(`surface/disabled` + `fg/disabled`)과 비슷해 보인다. 연노랑 바탕 + 진한 노랑 테두리 조합도 쓰지 않는다 — 바탕과 테두리의 무게가 맞지 않는다.

**마젠타 (`brand/*`) — "지금"을 알리는 작은 신호**

- 쓰는 곳: 로고(U+의 +), 현재 메뉴 밑줄, 새 알림 점, 진행 중·실시간 참여 수·오픈 임박 표시.
- 크기: 점, 2px 선, 글자, 작은 칩까지만. **넓은 면이나 버튼 채움에 쓰지 않는다.** 진행 중 표시는 꽉 찬 칩보다 "● 진행중"(마젠타 점 + `fg/primary` 글자)을 권장한다.
- 쓰지 않는 곳: 일반 안내 문구의 목록 점(회색), 선택된 거르기 칩(검정 테두리), 오류(`semantic/error`).

**노랑 (`ticket/*`) — 응모권과 보상**

- 쓰는 곳: 응모권 수(🎟 +N), 등급 응모권, 지갑, 보상 모달, 당첨 연출, 게임·마스코트, 세컨더리 버튼 hover.
- 넓은 면(`ticket/accent` 바탕)은 보상 화면에만, **한 화면에 하나**만 둔다.
- 고름·진행 같은 상태 표시에 노랑만 쓰지 않는다 — 고름은 진한 테두리(+체크), 진행은 `border/strong` 바탕 위 `action/neutral` 채움이고, 다 채워 보상을 받았을 때만 노랑으로 바꾼다.

**두 색을 맞붙이지 않는다** — 노란 면 위에 마젠타 칩, 마젠타 옆 노랑 버튼처럼 붙이지 말고 사이에 흰색·회색을 둔다.

### 다크 모드

- `<html class="dark">` 기준으로 `tokens.css`의 `.dark` 블록이 `--color-*` 값을 재정의한다.
- 시맨틱 변수(`--background` 등)는 `:root`에서 `var(--color-*)`를 참조하므로 별도 매핑 없이 자동으로 따라간다 — `globals.css`에 shadcn 기본 `.dark` 블록을 두지 않는다.
- 브랜드·응모권·차트 강조색 등 본체 색상은 라이트와 동일하게 유지하고, 배경·전경·보더·soft 배경 계열만 다크 값으로 바꾼다.
- 다크에서도 어두운 크롬(푸터·관리자 사이드바)은 `surface/inverse` 고정값을 쓴다 — `fg/primary`를 배경색으로 쓰는 반전 사용은 다크에서 깨지므로 금지.
- 브랜드 배경 위 텍스트에는 `fg/on-brand`를 쓴다 — `surface/page`를 텍스트색으로 쓰면 다크에서 어두운 글자가 되어 깨진다.

### 화면 설정 (마이페이지)

- 테마: `getddo-ui-settings` persist 스토어(`shared/lib/ui-settings.ts`)의 `theme` — 시스템/라이트/다크 중 선택, 기본은 라이트다(OS 다크가 자동 적용되지 않는다). `ThemeSync`(app/providers)가 `html.dark` 클래스를 토글하고, `index.html`의 인라인 스크립트가 React 마운트 전에 저장값을 적용해 라이트 플래시를 막는다. next-themes 시절의 원시 `theme` 키는 1회 마이그레이션된다.
- 큰글씨 모드: `html[data-text-scale='large']`로 루트 `font-size`를 120%로 올린다 — rem 기반 유틸리티에 자동 적용되고, 상태는 같은 `getddo-ui-settings` persist 스토어에 유지된다.

### 미정 사항

> Illustration & Motion 색상(당첨 연출, 응모권 획득 애니메이션, 마스코트 표정 등)은 UI 토큰과 별도로 관리 예정이며 아직 값이 정해지지 않았다. `brand/primary`, `ticket/primary`, `ticket/accent`를 기준색으로 삼고 보조색은 그 주변에서 고르기로 한 상태.

---

## 2. Radius & Shadow Tokens

### Radius

| Token         | 값       | 용도                             |
| ------------- | -------- | -------------------------------- |
| `radius/sm`   | `4px`    | 체크박스, 상태 칩, 작은 태그     |
| `radius/md`   | `6px`    | 인풋, 셀렉트                     |
| `radius/lg`   | `8px`    | 버튼, 리스트 아이템, 일반 카드   |
| `radius/xl`   | `12px`   | 이벤트 카드, 티켓 카드           |
| `radius/2xl`  | `16px`   | 모달, 랜딩 대형 블록             |
| `radius/full` | `9999px` | pill 버튼, 아바타, 프로그레스 바 |

### Shadow

| Token       | CSS `box-shadow`                                                 |
| ----------- | ---------------------------------------------------------------- |
| `shadow/md` | `0 4px 6px rgba(18,22,27,0.08), 0 2px 4px rgba(18,22,27,0.06)`   |
| `shadow/lg` | `0 10px 15px rgba(18,22,27,0.08), 0 4px 6px rgba(18,22,27,0.06)` |
| `shadow/xl` | `0 4px 25px rgba(18,22,27,0.10), 0 8px 10px rgba(18,22,27,0.06)` |

### 미정 사항

> `01 COLOR`의 `brand/primary-pressed` 용도 설명에 `+shadow/inner`라는 언급이 있지만, `shadow/inner` 토큰은 아직 정의되어 있지 않다 (현재 `md`/`lg`/`xl` 3단계만 존재).

---

## 3. Typography Tokens

- **Font family**: `Pretendard`
- 표기 형식: `font-size / line-height`, weight, letter-spacing (px 기준, 브라우저 기본 16px 환경)

| Style          | Size/Line-height | Weight | Style name | Letter-spacing | 용도                         |
| -------------- | ---------------- | ------ | ---------- | -------------- | ---------------------------- |
| `Display`      | 40 / 48          | 700    | Bold       | -0.02em        | 랜딩 히어로                  |
| `Title 1`      | 32 / 40          | 700    | Bold       | -0.02em        | 페이지 타이틀                |
| `Title 2`      | 24 / 32          | 700    | Bold       | -0.01em        | 섹션·모달 타이틀             |
| `Title 3`      | 20 / 28          | 600    | SemiBold   | -0.01em        | 카드·패널 헤더               |
| `Subhead`      | 18 / 26          | 600    | SemiBold   | 0              | 서브 타이틀, 강조 텍스트     |
| `Body`         | 16 / 26          | 400    | Regular    | 0              | 기본 본문                    |
| `Body Bold`    | 16 / 26          | 600    | SemiBold   | 0              | 본문 내 강조, 큰 버튼 라벨   |
| `Body SM`      | 14 / 22          | 400    | Regular    | 0              | 보조 본문, 관리자 본문       |
| `Body SM Bold` | 14 / 22          | 600    | SemiBold   | 0              | 버튼 라벨, 테이블 헤더       |
| `Caption`      | 12 / 18          | 500    | Medium     | 0              | 캡션, 타임스탬프, 뱃지, 태그 |

---

## 4. 이 문서에 포함되지 않은 것

`04 Button`, `05 Card`는 토큰이 아니라 토큰을 조합한 컴포넌트 스펙이라 제외했다. `04 Button`은 Primary 버튼의 Small/Medium/Large × Default/Hover/Pressed/Disabled 컴포넌트가 이미 만들어져 있고, `05 Card`는 아직 제목만 있고 내용은 비어 있다.

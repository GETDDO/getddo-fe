# Design System — Color / Radius & Shadow / Typography

> 출처: Figma `최종 융합 프로젝트` 파일 › **01 Design System** 페이지 (`01 COLOR`, `02 Type`, `03 Radius & Shadow` 섹션)
> 용도: AI 에이전트가 프론트엔드 개발 시 참고하는 디자인 토큰 명세서. 값의 실제 원천은 별도 `tokens.css`이며, 이 문서는 그 값의 의미와 용도를 설명한다.
> 기준일: 2026-09-19 (Figma 최신 상태)

---

## 0. 사용 원칙 (에이전트가 지킬 것)

1. **하드코딩 금지**: 컴포넌트 코드에 `#E6007E` 같은 hex 값을 직접 쓰지 말고, 반드시 아래 토큰명(`brand/primary` 등)에 매핑된 CSS 변수·디자인 토큰을 통해 참조한다.
2. **의미(semantic) 우선**: 같은 색이어도 "무엇에 쓰는가"에 따라 다른 토큰명을 쓴다.
3. **관리자 전용 vs 사용자 전용 구분**: `status/*`, `chart/*`는 관리자(운영자) 화면 전용, `play/*`는 사용자(응모자) 사이트 전용.
4. **값의 원천**: 이 문서의 모든 값은 Figma 도형에 실제로 바인딩된 Variable/Effect 값을 기준으로 작성했다 (캔버스에 사람이 손으로 적어둔 hex 텍스트 라벨이 아님). 라벨과 실제 값이 다른 항목은 맨 아래 부록에 모아뒀다.

---

## 1. Color Tokens

### 1) Brand — default (기능 화면 기본값)

| Token                   | Hex       | 용도                          |
| ----------------------- | --------- | ----------------------------- |
| `brand/primary`         | `#E6007E` | 버튼 채움, CTA, 프로그레스 바 |
| `brand/primary-hover`   | `#D10072` | Hover 상태                    |
| `brand/primary-pressed` | `#BC0066` | Pressed 상태                  |
| `brand/light`           | `#F5A3CB` | 강조 테두리, 구분 라인        |
| `brand/soft`            | `#FDEBF4` | 섹션 배경, 선택된 행          |

### 2) Action — Neutral (무채색 버튼/모달 확인)

_(Figma 원본 섹션 라벨은 "Foreground"인데 실제 토큰은 `action/*`이며 7번 Foreground 섹션과 이름이 중복되어 있다.)_

| Token                    | Hex       | 용도                        |
| ------------------------ | --------- | --------------------------- |
| `action/neutral`         | `#1F242B` | 무채색 버튼 채움, 모달 확인 |
| `action/neutral-hover`   | `#343A42` | Hover 상태                  |
| `action/neutral-pressed` | `#111417` | Pressed 상태                |

### 3) Ticket — 응모권

| Token            | Hex       | 용도                             |
| ---------------- | --------- | -------------------------------- |
| `ticket/primary` | `#FFC83D` | 티켓 카드 면, 응모권 획득 모먼트 |
| `ticket/accent`  | `#FFF4D1` | 티켓 카드 라벨, 장식             |
| `ticket/on`      | `#1F242B` | 응모권 칩 위 텍스트              |

### 4) Play — 놀이 파스텔 (사용자 사이트 전용)

| Token                | Hex       | 용도                                                   |
| -------------------- | --------- | ------------------------------------------------------ |
| `play/yellow-soft`   | `#FFF4D1` | 히어로·배너 배경                                       |
| `play/yellow`        | `#FFC83D` | 응모권·코인·별 장식                                    |
| `play/pink-soft`     | `#FDEBF4` | 보상 가능 카드, 일러스트 뒤 블롭                       |
| `play/pink`          | `#F5A3CB` | 장식                                                   |
| `play/lavender-soft` | `#F0EBFF` | 게임·랭킹 영역 배경, 게임 미션 아이콘 원               |
| `play/lavender`      | `#A78BFA` | 게임 일러스트, 캐릭터 소품 (텍스트·버튼에는 사용 금지) |

### 5) Surface — 배경 레이어

| Token              | Hex                          | 용도                       |
| ------------------ | ---------------------------- | -------------------------- |
| `surface/page`     | `#FFFFFF`                    | 전체 페이지 배경           |
| `surface/canvas`   | `#F4F5F7`                    | 이벤트 카드, 리스트 아이템 |
| `surface/elevated` | `#FFFFFF`                    | 모달, 드롭다운, 토스트     |
| `surface/sunken`   | `#F1F3F5`                    | 인풋 배경, 테이블 헤더     |
| `surface/pressed`  | `#E4E7EA`                    | 탭·아이템 눌림 상태        |
| `surface/overlay`  | `#12161B` (50%, `#12161B80`) | 모달 딤(dim) 처리          |

### 6) Border

| Token                 | Hex       | 용도                       |
| --------------------- | --------- | -------------------------- |
| `border/default`      | `#E4E7EA` | 카드·인풋 기본 테두리      |
| `border/strong`       | `#CDD2D8` | 구분선, 테이블 경계        |
| `border/brand`        | `#E6007E` | 세컨더리 버튼, 선택된 카드 |
| `border/brand-subtle` | `#F5A3CB` | 요약 카드 테두리           |
| `border/focus`        | `#A8005C` | 키보드 포커스 링           |

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

| Token                  | Hex       | 용도                  |
| ---------------------- | --------- | --------------------- |
| `status/pending`       | `#F1F3F5` | 검토 대기 뱃지 배경   |
| `status/active`        | `#E7F0FE` | 진행 중 뱃지 배경     |
| `status/revision`      | `#FBF0D9` | 보완 요청 뱃지 배경   |
| `status/approved`      | `#E6F5EE` | 승인 뱃지 배경        |
| `status/rejected`      | `#FBEBEE` | 반려 뱃지 배경        |
| `status/pending-text`  | `#4B525C` | 검토 대기 뱃지 텍스트 |
| `status/active-text`   | `#1D4ED8` | 진행 중 뱃지 텍스트   |
| `status/revision-text` | `#B45309` | 보완 요청 뱃지 텍스트 |
| `status/approved-text` | `#0B6549` | 승인 뱃지 텍스트      |
| `status/rejected-text` | `#A8354A` | 반려 뱃지 텍스트      |

### 10) Chart — 관리자 전용

| Token             | Hex       | 용도                      |
| ----------------- | --------- | ------------------------- |
| `chart/line`      | `#14A378` | 현재 기간 선 (2px)        |
| `chart/point`     | `#0F8560` | 강조 포인트               |
| `chart/compare`   | `#CDD2D8` | 지난 기간 선 (1.5px 점선) |
| `chart/grid`      | `#F1F3F5` | 가로 격자선               |
| `chart/axis`      | `#9AA1AB` | 축 라벨                   |
| `chart/highlight` | `#E04F5F` | 이상치, 어뷰징 탐지       |

### 11) Gradient

| Token                 | 값                                                            | 용도                                                                |
| --------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------- |
| `gradient/chart-area` | `linear-gradient(180deg, #E6007E 22%, rgba(31,190,142,0) 0%)` | 차트 전용 (두 번째 stop은 투명도 0%라 색상 자체는 화면에 영향 없음) |

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

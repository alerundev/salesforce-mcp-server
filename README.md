# Salesforce MCP Server

Salesforce 데이터를 자연어로 조회할 수 있는 MCP(Model Context Protocol) 서버입니다.

## 구조

```
사용자 (자연어 질문)
    ↓
챗봇 UI (MCP 지원 플랫폼)
    ↓
Salesforce MCP Server (이 서버)
    ↓
Salesforce REST API
    ↓
Salesforce 데이터
```

## 시작하기

### 1. 설치

```bash
npm install
```

### 2. 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열고 아래 항목을 채워주세요:

```env
SF_LOGIN_URL=https://login.salesforce.com
SF_USERNAME=your_salesforce_email@example.com
SF_PASSWORD=your_password
SF_SECURITY_TOKEN=your_security_token
SF_CONSUMER_KEY=your_consumer_key
SF_CONSUMER_SECRET=your_consumer_secret
```

### 3. 샘플 데이터 넣기 (선택)

```bash
npm run seed
```

거래처, 담당자, 영업 기회, 잠재 고객, 활동 데이터를 자동으로 생성합니다.

### 4. 빌드 & 실행

```bash
npm run build
npm start
```

---

## 지원하는 도구 (Tools)

| Tool | 설명 |
|------|------|
| `get_accounts` | 거래처 목록 조회 |
| `search_accounts` | 키워드로 거래처 검색 |
| `get_opportunities` | 영업 기회 목록 조회 |
| `get_opportunities_by_stage` | 단계별 영업 기회 조회 |
| `get_opportunities_summary` | 단계별 영업 기회 집계 |
| `get_contacts` | 담당자 목록 조회 |
| `search_contacts` | 이름으로 담당자 검색 |
| `get_leads` | 잠재 고객 목록 조회 |
| `get_leads_by_status` | 상태별 잠재 고객 조회 |
| `get_recent_activities` | 최근 활동 조회 |
| `run_soql` | 직접 SOQL 쿼리 실행 |

## 자연어 질문 예시

- "이번 달 마감 예정인 딜 목록 보여줘"
- "Closed Won 상태인 영업 기회는?"
- "삼성전자 관련 담당자 찾아줘"
- "단계별로 영업 기회 얼마나 있어?"
- "Hot 등급 리드 보여줘"

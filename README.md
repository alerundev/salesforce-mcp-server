# Salesforce MCP Server

Node.js / Express / TypeScript 기반 Salesforce MCP (Model Context Protocol) 서버

자연어로 Salesforce 데이터를 조회할 수 있습니다.

---

## 실행 방법

### 로컬 실행

```bash
# 환경변수 설정
cp .env.example .env
# .env 파일에 Salesforce 인증 정보 입력 후

npm install
npm run build
npm start

# 인증 토큰과 함께 실행
TOKEN=your_token npm start
```

### 샘플 데이터 생성

```bash
npm run seed
```

거래처 7개, 담당자, 영업 기회, 리드, 활동 데이터를 자동으로 생성합니다.

---

## 배포하기 (클라우드타입)

1. **새 서비스 생성** → GitHub 연동 → `alerundev/salesforce-mcp-server` 선택
2. **설정**
   - Node v22
   - 빌드 명령어: `npm run build`
   - 시작 명령어: `npm start`
3. **환경변수 설정**

| 키 | 값 |
|----|-----|
| `SF_LOGIN_URL` | `https://login.salesforce.com` |
| `SF_USERNAME` | Salesforce 로그인 이메일 |
| `SF_PASSWORD` | Salesforce 비밀번호 |
| `SF_SECURITY_TOKEN` | Salesforce 보안 토큰 |
| `SF_CONSUMER_KEY` | Connected App 소비자 키 |
| `SF_CONSUMER_SECRET` | Connected App 소비자 시크릿 |
| `TOKEN` | (선택) Bearer 토큰 인증 사용 시 |

4. **MCP 접속 주소**
   ```
   https://<배포된 도메인>/mcp
   ```

---

## 인증

Bearer 토큰 인증을 사용합니다 (환경변수 `TOKEN` 설정 시 활성화):

```
Authorization: Bearer your-token
```

---

## 지원 도구 (Tools)

| Tool | 설명 |
|------|------|
| `get_accounts` | 거래처 목록 조회 |
| `search_accounts` | 키워드로 거래처 검색 |
| `get_opportunities` | 영업 기회 목록 조회 |
| `get_opportunities_by_stage` | 단계별 영업 기회 조회 (Closed Won, Prospecting 등) |
| `get_opportunities_summary` | 단계별 영업 기회 집계 (건수 + 금액) |
| `get_contacts` | 담당자 목록 조회 |
| `search_contacts` | 이름으로 담당자 검색 |
| `get_leads` | 잠재 고객 목록 조회 |
| `get_leads_by_status` | 상태별 잠재 고객 조회 |
| `get_recent_activities` | 최근 활동(Task) 조회 |
| `run_soql` | 직접 SOQL 쿼리 실행 |

---

## 자연어 질문 예시

- "이번 달 마감 예정인 딜 목록 보여줘"
- "Closed Won 상태인 영업 기회는 얼마야?"
- "삼성전자 담당자 찾아줘"
- "단계별로 영업 기회 요약해줘"
- "Hot 등급 리드 보여줘"

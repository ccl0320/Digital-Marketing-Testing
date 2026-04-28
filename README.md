# Notion AI 會議紀錄 → Google Drive + Gmail 自動化工作流程

當 Notion 資料庫出現新的 AI 會議紀錄時，自動：
1. 擷取 Notion 頁面內容
2. 使用 Claude AI 進行結構化總結
3. 在 Google Drive 建立 Google Doc 儲存完整紀錄與摘要
4. 透過 Gmail 將文件連結寄送至 ccl0320@gmail.com

---

## 工作流程架構

```
Notion 資料庫（新AI會議紀錄）
        ↓
   擷取頁面內容
        ↓
   Claude AI 總結
        ↓
 建立 Google Doc（Google Drive）
        ↓
  Gmail 寄送通知信
```

---

## 方案一：Make.com（建議，無需寫程式）

### 前置需求

| 服務 | 所需帳號/金鑰 |
|------|--------------|
| Notion | Integration Token + Database ID |
| Anthropic | API Key（Claude） |
| Google Drive | OAuth 連線 |
| Gmail | OAuth 連線（同 Google 帳號） |

### 設定步驟

1. **登入 Make.com**，進入「Scenarios」→「Create a new scenario」

2. **匯入 Blueprint**
   - 點選左下角「...」→「Import Blueprint」
   - 上傳 `make_blueprint/notion_to_drive_workflow.json`

3. **設定 Notion 連線**（模組 1、2、3）
   - 前往 [notion.so/my-integrations](https://www.notion.so/my-integrations) 建立 Integration
   - 將 Integration 加入目標資料庫（資料庫設定 → Connections）
   - 在 Make.com 填入 Integration Token
   - 填入 `NOTION_DATABASE_ID`（從資料庫 URL 取得）

4. **設定 Anthropic API**（模組 5）
   - 前往 [console.anthropic.com/keys](https://console.anthropic.com/keys) 取得 API Key
   - 在 HTTP 模組的 Headers 中替換 `{{YOUR_ANTHROPIC_API_KEY}}`

5. **設定 Google 連線**（模組 6、7）
   - 使用 Google OAuth 連結 ccl0320@gmail.com 帳號
   - 在 Google Docs 模組填入 `GOOGLE_DRIVE_FOLDER_ID`（目標資料夾 URL 的最後一段）

6. **設定排程**
   - 點選左下角時鐘圖示
   - 建議設定：每 15 分鐘執行一次

7. **啟用 Scenario**
   - 點選右下角開關啟用

---

## 方案二：Python 腳本（進階，本機或伺服器執行）

### 安裝

```bash
cd scripts
pip install -r requirements.txt
```

### 設定

```bash
cp .env.example .env
# 用編輯器填入所有設定值
```

### Google OAuth 憑證設定

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立專案 → 啟用 Google Docs API、Google Drive API、Gmail API
3. 建立 OAuth 2.0 用戶端憑證（類型：**桌面應用程式**）
4. 下載 JSON 檔案，儲存為 `scripts/credentials.json`

> ⚠️  `credentials.json` 和 `token.json` 已加入 `.gitignore`，不會被推上 GitHub

### 首次授權（只需執行一次）

```bash
cd scripts
python setup_google_auth.py
# 瀏覽器自動開啟 → 以 ccl0320@gmail.com 登入並授權 → 產生 token.json
```

### 執行

```bash
# 處理所有未處理的新紀錄（執行一次）
python notion_to_drive.py

# 只處理最新一筆
python notion_to_drive.py --once

# 持續監聽（每5分鐘自動檢查）
python notion_to_drive.py --watch
```

### 排程設定（Linux cron）

```bash
# 每15分鐘檢查一次
*/15 * * * * cd /path/to/scripts && python notion_to_drive.py >> workflow.log 2>&1
```

---

## 輸出格式

### Google Doc 結構

```
AI會議紀錄
==================================================
會議標題：[標題]
建立時間：[時間]
Notion 來源：[連結]
==================================================

📋 原始會議紀錄
------------------------------
[Notion 頁面完整內容]

==================================================

🤖 AI 自動總結
------------------------------
1. 會議主題
2. 主要討論重點
3. 重要決策
4. 待辦事項
5. 下次會議重點
```

### Gmail 通知信內容

- 會議標題與時間
- Notion 原始頁面連結
- Google Doc 連結（一鍵開啟）
- AI 總結預覽

---

## 檔案說明

```
├── .gitignore                          # 防止敏感檔案被推上 GitHub
├── make_blueprint/
│   └── notion_to_drive_workflow.json   # Make.com 可匯入的 Blueprint
├── scripts/
│   ├── notion_to_drive.py              # Python 自動化主腳本
│   ├── setup_google_auth.py            # Google OAuth 首次授權輔助腳本
│   ├── requirements.txt                # Python 套件依賴
│   └── .env.example                    # 環境變數範本（複製為 .env 後填入）
└── README.md
```

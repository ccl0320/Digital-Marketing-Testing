"""
Notion AI Meeting Notes → Google Drive + Gmail Notification
自動化工作流程：將 Notion AI 會議紀錄同步至 Google Drive 並寄送通知信

Usage:
    python notion_to_drive.py              # 處理所有新紀錄
    python notion_to_drive.py --once       # 只處理最新一筆
    python notion_to_drive.py --watch      # 持續監聽新紀錄（每5分鐘檢查一次）
"""

import os
import time
import json
import base64
import logging
import argparse
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

import anthropic
from notion_client import Client as NotionClient
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

NOTION_TOKEN = os.getenv("NOTION_TOKEN")
NOTION_DATABASE_ID = os.getenv("NOTION_DATABASE_ID")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
GOOGLE_DRIVE_FOLDER_ID = os.getenv("GOOGLE_DRIVE_FOLDER_ID", "root")
RECIPIENT_EMAIL = os.getenv("RECIPIENT_EMAIL", "ccl0320@gmail.com")
GOOGLE_CREDENTIALS_FILE = os.getenv("GOOGLE_CREDENTIALS_FILE", "credentials.json")
GOOGLE_TOKEN_FILE = os.getenv("GOOGLE_TOKEN_FILE", "token.json")
PROCESSED_IDS_FILE = os.getenv("PROCESSED_IDS_FILE", ".processed_ids.json")
WATCH_INTERVAL_SECONDS = int(os.getenv("WATCH_INTERVAL_SECONDS", "300"))

GOOGLE_SCOPES = [
    "https://www.googleapis.com/auth/documents",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/gmail.send",
]


def get_google_credentials() -> Credentials:
    creds = None
    if os.path.exists(GOOGLE_TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(GOOGLE_TOKEN_FILE, GOOGLE_SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                GOOGLE_CREDENTIALS_FILE, GOOGLE_SCOPES
            )
            creds = flow.run_local_server(port=0)
        with open(GOOGLE_TOKEN_FILE, "w") as f:
            f.write(creds.to_json())
    return creds


def load_processed_ids() -> set:
    if os.path.exists(PROCESSED_IDS_FILE):
        with open(PROCESSED_IDS_FILE, "r") as f:
            return set(json.load(f))
    return set()


def save_processed_id(page_id: str):
    ids = load_processed_ids()
    ids.add(page_id)
    with open(PROCESSED_IDS_FILE, "w") as f:
        json.dump(list(ids), f)


def fetch_new_notion_pages(notion: NotionClient, processed_ids: set) -> list:
    """從 Notion 資料庫取得新的 AI 會議紀錄"""
    logger.info("正在查詢 Notion 資料庫...")
    response = notion.databases.query(
        database_id=NOTION_DATABASE_ID,
        sorts=[{"timestamp": "created_time", "direction": "descending"}],
        page_size=10,
    )
    new_pages = [
        page for page in response["results"] if page["id"] not in processed_ids
    ]
    logger.info(f"找到 {len(new_pages)} 筆新紀錄")
    return new_pages


def extract_page_content(notion: NotionClient, page_id: str) -> tuple[str, str]:
    """提取 Notion 頁面標題與內文（支援分頁，處理超過 100 個 block）"""
    page = notion.pages.retrieve(page_id=page_id)

    title = ""
    for prop_value in page["properties"].values():
        if prop_value["type"] == "title":
            title = "".join(t["plain_text"] for t in prop_value["title"])
            break

    content_parts = []
    cursor = None

    while True:
        kwargs = {"block_id": page_id, "page_size": 100}
        if cursor:
            kwargs["start_cursor"] = cursor

        blocks = notion.blocks.children.list(**kwargs)

        for block in blocks["results"]:
            block_type = block["type"]
            block_data = block.get(block_type, {})
            rich_text = block_data.get("rich_text", [])
            text = "".join(t["plain_text"] for t in rich_text)

            if not text:
                continue

            if block_type == "heading_1":
                content_parts.append(f"# {text}")
            elif block_type == "heading_2":
                content_parts.append(f"## {text}")
            elif block_type == "heading_3":
                content_parts.append(f"### {text}")
            elif block_type == "bulleted_list_item":
                content_parts.append(f"• {text}")
            elif block_type == "numbered_list_item":
                content_parts.append(f"- {text}")
            elif block_type == "to_do":
                checked = block_data.get("checked", False)
                checkbox = "☑" if checked else "☐"
                content_parts.append(f"{checkbox} {text}")
            elif block_type == "quote":
                content_parts.append(f"> {text}")
            elif block_type == "callout":
                emoji = block_data.get("icon", {}).get("emoji", "📌")
                content_parts.append(f"{emoji} {text}")
            else:
                content_parts.append(text)

        if not blocks.get("has_more"):
            break
        cursor = blocks["next_cursor"]

    return title, "\n".join(content_parts)


def summarize_with_claude(content: str, title: str) -> str:
    """使用 Claude API 進行會議紀錄總結"""
    logger.info("正在使用 Claude 進行 AI 總結...")
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    prompt = f"""請將以下 AI 會議紀錄進行結構化總結，使用繁體中文，格式清晰易讀。

請包含以下章節：
1. **會議主題** - 一句話說明本次會議核心目的
2. **主要討論重點** - 條列式列出 3-5 個重點
3. **重要決策** - 本次會議達成的決定
4. **待辦事項** - 具體行動項目（包含負責人若有提及）
5. **下次會議重點** - 後續需要跟進的事項

會議標題：{title}

會議紀錄內容：
{content}"""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}],
    )
    summary = message.content[0].text
    logger.info("AI 總結完成")
    return summary


def create_google_doc(
    creds: Credentials, title: str, original_content: str, summary: str, notion_url: str, created_time: str
) -> tuple[str, str]:
    """在 Google Drive 建立文件並填入內容，回傳 (documentId, webViewLink)"""
    logger.info(f"正在建立 Google Doc：{title}")
    docs_service = build("docs", "v1", credentials=creds)
    drive_service = build("drive", "v3", credentials=creds)

    doc_title = f"AI會議紀錄 - {created_time[:10]} - {title}"
    doc = docs_service.documents().create(body={"title": doc_title}).execute()
    doc_id = doc["documentId"]

    if GOOGLE_DRIVE_FOLDER_ID and GOOGLE_DRIVE_FOLDER_ID != "root":
        drive_service.files().update(
            fileId=doc_id,
            addParents=GOOGLE_DRIVE_FOLDER_ID,
            removeParents="root",
            fields="id, parents",
        ).execute()

    doc_content = f"""AI會議紀錄
{'=' * 50}

會議標題：{title}
建立時間：{created_time}
Notion 來源：{notion_url}

{'=' * 50}

📋 原始會議紀錄
{'-' * 30}

{original_content}

{'=' * 50}

🤖 AI 自動總結
{'-' * 30}

{summary}

{'=' * 50}
此文件由自動化工作流程建立
"""

    requests = [
        {
            "insertText": {
                "location": {"index": 1},
                "text": doc_content,
            }
        }
    ]
    docs_service.documents().batchUpdate(
        documentId=doc_id, body={"requests": requests}
    ).execute()

    file_meta = (
        drive_service.files()
        .get(fileId=doc_id, fields="webViewLink")
        .execute()
    )
    web_link = file_meta.get("webViewLink", f"https://docs.google.com/document/d/{doc_id}/edit")

    logger.info(f"Google Doc 建立成功：{web_link}")
    return doc_id, web_link


def send_gmail_notification(
    creds: Credentials,
    meeting_title: str,
    doc_link: str,
    notion_url: str,
    created_time: str,
    summary: str,
):
    """透過 Gmail 寄送通知信"""
    logger.info(f"正在寄送通知信至 {RECIPIENT_EMAIL}...")
    gmail_service = build("gmail", "v1", credentials=creds)

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"📋 新AI會議紀錄 - {meeting_title} ({created_time[:10]})"
    msg["From"] = "me"
    msg["To"] = RECIPIENT_EMAIL

    html_body = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }}
    h2 {{ color: #1a73e8; border-bottom: 2px solid #e8f0fe; padding-bottom: 10px; }}
    .info-table {{ width: 100%; border-collapse: collapse; background: #f8f9fa; border-radius: 8px; overflow: hidden; margin: 16px 0; }}
    .info-table td {{ padding: 10px 14px; border-bottom: 1px solid #e0e0e0; }}
    .info-table td:first-child {{ font-weight: bold; color: #555; width: 120px; }}
    .info-table tr:last-child td {{ border-bottom: none; }}
    .btn {{ display: inline-block; padding: 10px 20px; background: #1a73e8; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 6px 4px; }}
    .btn.secondary {{ background: #34a853; }}
    .summary-box {{ background: #e8f4fd; border-left: 4px solid #1a73e8; padding: 16px; border-radius: 0 8px 8px 0; margin: 16px 0; white-space: pre-wrap; font-size: 14px; line-height: 1.6; }}
    .footer {{ font-size: 11px; color: #aaa; margin-top: 24px; border-top: 1px solid #eee; padding-top: 12px; }}
  </style>
</head>
<body>
  <h2>📋 新的 AI 會議紀錄已自動儲存</h2>
  <p>您好，一份新的 AI 會議紀錄已成功從 Notion 同步並儲存至 Google Drive。</p>

  <table class="info-table">
    <tr><td>📌 會議標題</td><td>{meeting_title}</td></tr>
    <tr><td>📅 建立時間</td><td>{created_time}</td></tr>
    <tr><td>🔗 Notion 來源</td><td><a href="{notion_url}">查看原始紀錄</a></td></tr>
    <tr><td>📄 Google Doc</td><td><a href="{doc_link}">開啟文件</a></td></tr>
  </table>

  <a href="{doc_link}" class="btn">📄 開啟 Google Doc</a>
  <a href="{notion_url}" class="btn secondary">🔗 查看 Notion 原始紀錄</a>

  <h3>🤖 AI 總結預覽</h3>
  <div class="summary-box">{summary}</div>

  <div class="footer">此郵件由自動化工作流程發送，請勿直接回覆。</div>
</body>
</html>
"""

    text_body = f"""新的 AI 會議紀錄已自動儲存

會議標題：{meeting_title}
建立時間：{created_time}
Notion 來源：{notion_url}
Google Doc：{doc_link}

AI 總結：
{summary}
"""

    msg.attach(MIMEText(text_body, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    raw = base64.urlsafe_b64encode(msg.as_bytes()).decode("utf-8")
    gmail_service.users().messages().send(userId="me", body={"raw": raw}).execute()
    logger.info("通知信寄送成功")


def process_page(notion: NotionClient, creds: Credentials, page: dict):
    """處理單一 Notion 頁面的完整工作流程"""
    page_id = page["id"]
    created_time = page.get("created_time", "")
    notion_url = page.get("url", "")

    logger.info(f"處理頁面 ID：{page_id}")

    title, content = extract_page_content(notion, page_id)
    if not content.strip():
        logger.warning(f"頁面 {page_id} 內容為空，跳過")
        save_processed_id(page_id)
        return

    summary = summarize_with_claude(content, title)
    _, doc_link = create_google_doc(
        creds, title, content, summary, notion_url, created_time
    )
    send_gmail_notification(creds, title, doc_link, notion_url, created_time, summary)

    # 只有全部步驟成功才標記為已處理
    save_processed_id(page_id)

    logger.info(f"✅ 完成處理：{title}")
    logger.info(f"   Google Doc：{doc_link}")


def run_workflow(watch_mode: bool = False, once: bool = False):
    """主要工作流程執行器"""
    logger.info("初始化連線...")
    notion = NotionClient(auth=NOTION_TOKEN)
    creds = get_google_credentials()

    if once:
        processed_ids = load_processed_ids()
        pages = fetch_new_notion_pages(notion, processed_ids)
        if pages:
            process_page(notion, creds, pages[0])
        else:
            logger.info("沒有新的紀錄需要處理")
        return

    while True:
        processed_ids = load_processed_ids()
        pages = fetch_new_notion_pages(notion, processed_ids)

        for page in pages:
            try:
                process_page(notion, creds, page)
            except Exception as e:
                logger.error(f"處理頁面時發生錯誤：{e}")

        if not watch_mode:
            break

        logger.info(f"等待 {WATCH_INTERVAL_SECONDS} 秒後再次檢查...")
        time.sleep(WATCH_INTERVAL_SECONDS)


def main():
    parser = argparse.ArgumentParser(description="Notion AI 會議紀錄 → Google Drive + Gmail")
    parser.add_argument("--watch", action="store_true", help="持續監聽模式")
    parser.add_argument("--once", action="store_true", help="只處理最新一筆")
    args = parser.parse_args()

    required_vars = ["NOTION_TOKEN", "NOTION_DATABASE_ID", "ANTHROPIC_API_KEY"]
    missing = [v for v in required_vars if not os.getenv(v)]
    if missing:
        logger.error(f"缺少必要環境變數：{', '.join(missing)}")
        logger.error("請複製 .env.example 為 .env 並填入設定值")
        raise SystemExit(1)

    run_workflow(watch_mode=args.watch, once=args.once)


if __name__ == "__main__":
    main()

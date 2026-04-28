"""
Google OAuth 首次授權設定腳本

執行一次即可，授權完成後會產生 token.json，
之後執行 notion_to_drive.py 時會自動使用此 token。

使用方式：
    python setup_google_auth.py
"""

import os
import sys
from google_auth_oauthlib.flow import InstalledAppFlow
from dotenv import load_dotenv

load_dotenv()

SCOPES = [
    "https://www.googleapis.com/auth/documents",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/gmail.send",
]

CREDENTIALS_FILE = os.getenv("GOOGLE_CREDENTIALS_FILE", "credentials.json")
TOKEN_FILE = os.getenv("GOOGLE_TOKEN_FILE", "token.json")


def main():
    if not os.path.exists(CREDENTIALS_FILE):
        print(f"❌ 找不到 {CREDENTIALS_FILE}")
        print()
        print("請依照以下步驟取得 Google OAuth 憑證：")
        print("  1. 前往 https://console.cloud.google.com/")
        print("  2. 建立或選擇一個專案")
        print("  3. 啟用以下 API：")
        print("     - Google Docs API")
        print("     - Google Drive API")
        print("     - Gmail API")
        print("  4. 前往「憑證」→「建立憑證」→「OAuth 2.0 用戶端 ID」")
        print("  5. 應用程式類型選「桌面應用程式」")
        print("  6. 下載 JSON 檔案並儲存為 credentials.json（放在 scripts/ 目錄下）")
        print()
        print("  ⚠️  注意：credentials.json 已加入 .gitignore，不會被推上 GitHub")
        sys.exit(1)

    print("🔐 開始 Google OAuth 授權流程...")
    print("瀏覽器將自動開啟，請以 ccl0320@gmail.com 帳號登入並授權。")
    print()

    flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
    creds = flow.run_local_server(port=0)

    with open(TOKEN_FILE, "w") as f:
        f.write(creds.to_json())

    print(f"✅ 授權成功！Token 已儲存至 {TOKEN_FILE}")
    print()
    print("現在可以執行工作流程：")
    print("  python notion_to_drive.py --once    # 處理最新一筆")
    print("  python notion_to_drive.py --watch   # 持續監聽")


if __name__ == "__main__":
    main()

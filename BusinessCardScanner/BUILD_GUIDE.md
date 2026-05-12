# 名片管理 App - 建置指南

## 功能特色

- 📸 **名片掃描**：使用手機相機拍照或從相簿選取名片
- 🤖 **AI 智能辨識**：透過 Google Gemini AI 自動提取姓名、公司、電話、Email 等資訊
- 🔍 **公司資訊搜尋**：自動搜尋並摘要該公司的重點資訊
- 📋 **智能分類**：AI 自動判斷聯絡人類別（客戶/供應商/合作夥伴等）及行業別
- 💾 **本地儲存**：使用 Room 資料庫，無需網路即可瀏覽名片
- 🔎 **全文搜尋**：快速搜尋姓名、公司、電話等欄位
- ⭐ **收藏功能**：重要名片加星號標記
- 📤 **分享功能**：一鍵分享聯絡資訊

---

## 取得 Gemini API Key

1. 前往 [Google AI Studio](https://aistudio.google.com)
2. 使用 Google 帳號登入
3. 點擊左側「**Get API key**」
4. 點擊「**Create API key**」
5. 複製產生的 API Key
6. 開啟 App → 右上角「設定」→ 貼上 API Key → 儲存

> **免費額度**：Gemini 1.5 Flash 每分鐘 15 次請求，每天 1500 次，完全免費使用。

---

## 編譯 APK 步驟

### 方法一：使用 Android Studio（推薦）

1. 安裝 [Android Studio](https://developer.android.com/studio)
2. 開啟此專案資料夾（`BusinessCardScanner/`）
3. 等待 Gradle sync 完成（需要網路下載依賴）
4. 點選選單 **Build → Build Bundle(s) / APK(s) → Build APK(s)**
5. APK 會產生在 `app/build/outputs/apk/debug/app-debug.apk`

### 方法二：命令列編譯

```bash
# 確保已安裝 Android SDK（設定 ANDROID_HOME 環境變數）
cd BusinessCardScanner

# 賦予執行權限
chmod +x gradlew

# 編譯 Debug APK
./gradlew assembleDebug

# APK 位置
ls app/build/outputs/apk/debug/
```

### 方法三：GitHub Actions 自動編譯

參考 `.github/workflows/build.yml`（如需 CI/CD）

---

## 安裝到手機

### 直接傳輸安裝

```bash
# 透過 ADB（需開啟手機的「開發者選項」→「USB 偵錯」）
adb install app/build/outputs/apk/debug/app-debug.apk
```

### 手動安裝
1. 將 `app-debug.apk` 傳到手機
2. 手機設定 → 安全性 → 允許安裝未知來源
3. 用檔案管理員找到 APK 點擊安裝

---

## 系統需求

- Android 8.0 (API 26) 以上
- 相機（可選，也可從相簿選取）
- 網路連線（用於 AI 分析）

---

## 專案架構

```
app/src/main/java/com/businesscard/scanner/
├── api/
│   ├── GeminiApiService.kt    # Retrofit API 介面
│   ├── GeminiClient.kt        # OkHttp + Retrofit 客戶端
│   └── GeminiRepository.kt   # 封裝 AI 分析邏輯
├── data/
│   ├── BusinessCard.kt        # Room 實體
│   ├── BusinessCardDao.kt     # 資料庫操作
│   ├── AppDatabase.kt         # Room 資料庫
│   └── BusinessCardRepository.kt
├── ui/
│   ├── MainActivity.kt        # 名片列表主頁
│   ├── ScanActivity.kt        # 相機掃描頁
│   ├── CardDetailActivity.kt  # 名片詳情頁
│   ├── SettingsActivity.kt    # 設定頁
│   └── BusinessCardAdapter.kt
├── utils/
│   ├── PreferenceManager.kt   # SharedPreferences 管理
│   └── ImageUtils.kt          # 圖片處理工具
└── viewmodel/
    ├── MainViewModel.kt
    ├── ScanViewModel.kt
    └── CardDetailViewModel.kt
```

# Showroom 人流地圖儀表板

以 Google Maps Platform 為基礎的地圖型 Dashboard，針對兩個展示中心估算周邊人流並繪製熱力圖：

| 站點 | 位置 | 定位方式 |
|---|---|---|
| 台北・信義 Showroom | 台北市信義區松仁路 136 號 | Geocoding API 依地址定位 |
| 香港・銅鑼灣 Siemens / Bosch Showroom | 香港銅鑼灣 | Geocoding API 依關鍵字定位 |

## 功能

- **地圖熱力圖**：展示中心半徑 600 m 內的人流密度熱力圖（自製 canvas overlay，不依賴已棄用的 `visualization.HeatmapLayer`），附 Showroom 標記與分析半徑圈。
- **KPI 卡**：目前時段人流指數（vs 全日平均）、估計人次／小時、尖峰時段、周邊熱點數。
- **各時段長條圖**：24 小時人流指數，可點長條或拖曳時段滑桿切換時段，熱力圖同步變化。
- **兩地比較折線圖**：台北信義 vs 香港銅鑼灣，同一 0–100 基準可直接比較。
- **平日／週末** 兩套時段曲線、深淺色主題、表格檢視（無障礙）、繁中介面。
- **Demo 模式**：未設定 API 金鑰時以模擬資料完整運作（示意街廓圖 + 熱力圖）。

## 快速開始

```bash
cd foot-traffic-dashboard
python3 -m http.server 8080   # 或 npx serve
# 瀏覽器開啟 http://localhost:8080
```

不設定金鑰即可先看 Demo 模式。要接上真實 Google 資料：

1. 在 [Google Cloud Console](https://console.cloud.google.com/) 建立專案並啟用計費。
2. 啟用三個 API：**Maps JavaScript API**、**Places API (New)**、**Geocoding API**。
3. 建立 API 金鑰，建議用 HTTP referrer 限制網域、並限制只能呼叫上述三個 API。
4. 開啟儀表板 → 右上「🔑 API 金鑰」→ 貼上金鑰 → 儲存並載入。金鑰只存在瀏覽器 localStorage。

## 人流數值怎麼來的（重要）

**Google Maps Platform 沒有官方的即時人流（footfall / popular times）API**，Google 地圖上看到的「熱門時段」並未開放于 Places API。本儀表板採用可公開取得的資料建立**代理模型**：

1. 以 **Places API (New) `searchNearby`** 取得展示中心 600 m 內的地點，分四組類型查詢（商場零售／餐飲／大眾運輸／休閒觀光），去重後合併。
2. 每個地點的權重 = `150 + 200 × log10(2 + 評論數)²` × 類型係數（車站 1.8、商場 1.6、辦公 1.2、休閒 1.1、餐飲 1.0）。
3. 依地點類型套用平日／週末的 24 小時人流曲線（商場午後至晚間、餐飲雙峰、車站通勤雙峰…）。
4. 加總後得每小時原始分數；兩地共同正規化為 **0–100 人流指數**，再以校準常數換算「估計人次／小時」。

因此所有數值是**估算值**，適用於「時段間、兩地間的相對比較」，不是實測人數。若之後需要實測級資料，可替換資料層串接 [BestTime.app](https://besttime.app/)（提供 popular times 級的 foot traffic API）或電信人流資料，模型介面（`points → 24 小時序列`）不需改動。

## 檔案結構

```
foot-traffic-dashboard/
├── index.html          # 版面與 UI 骨架
├── css/style.css       # 主題權杖（淺／深色）與樣式
└── js/
    ├── config.js       # 站點、分析半徑、時段曲線、類型權重
    ├── heatmap.js      # Canvas 熱力圖渲染 + Google Maps OverlayView
    └── app.js          # 資料模型、Maps/Places 串接、圖表、互動
```

## 已知限制

- Places `searchNearby` 每次最多 20 筆，故分四組類型查詢（每次載入約 4 次 Places 呼叫／站點，注意配額計費）。
- 香港站點以關鍵字 geocoding 定位，若 Google 收錄的展示中心地址變動，可在 `js/config.js` 更新 `geocodeQuery` 或 `fallbackCenter`。
- 「估計人次／小時」的校準常數（`personsPerIndexPoint`）為經驗值，如有實測資料可回歸校正。

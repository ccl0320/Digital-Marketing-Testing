/* 站點與人流模型設定 */
const CONFIG = {
  radiusMeters: 600,          // 分析半徑
  personsPerIndexPoint: 62,   // 指數 → 估計人次/小時 的校準常數（估算用）
};

const LOCATIONS = [
  {
    id: "taipei",
    name: "台北・信義 Showroom",
    short: "台北信義",
    address: "110 台北市信義區松仁路 136 號",
    geocodeQuery: "台北市信義區松仁路136號",
    fallbackCenter: { lat: 25.0316, lng: 121.5687 },
    timezone: "Asia/Taipei",
    seed: 20260708,
    // Demo 模式的模擬 POI 群聚（相對 showroom 的公尺偏移）
    demoClusters: [
      { dx: -320, dy: -180, group: "mall",    count: 10, spread: 130, base: 4200 }, // 台北101 / 信義商圈百貨群
      { dx:  120, dy: -260, group: "mall",    count: 8,  spread: 110, base: 2600 },
      { dx: -140, dy:   60, group: "food",    count: 16, spread: 200, base: 900 },
      { dx:  260, dy:  180, group: "food",    count: 9,  spread: 140, base: 600 },
      { dx: -420, dy:  120, group: "office",  count: 9,  spread: 150, base: 1500 },
      { dx:  340, dy: -120, group: "office",  count: 7,  spread: 120, base: 1200 },
      { dx:  180, dy:  420, group: "transit", count: 2,  spread: 60,  base: 6000 }, // 捷運站出入口
      { dx: -260, dy: -420, group: "transit", count: 2,  spread: 60,  base: 5200 },
      { dx:   40, dy: -100, group: "leisure", count: 7,  spread: 220, base: 1000 },
    ],
  },
  {
    id: "hk",
    name: "香港・銅鑼灣 Siemens / Bosch Showroom",
    short: "香港銅鑼灣",
    address: "香港銅鑼灣（Siemens / Bosch 家電展示中心）",
    geocodeQuery: "Siemens Bosch home appliances showroom Causeway Bay Hong Kong",
    fallbackCenter: { lat: 22.2802, lng: 114.1838 },
    timezone: "Asia/Hong_Kong",
    seed: 899301,
    demoClusters: [
      { dx: -180, dy:  -80, group: "mall",    count: 12, spread: 120, base: 5200 }, // 時代廣場 / 利園一帶
      { dx:  240, dy: -160, group: "mall",    count: 9,  spread: 100, base: 3400 },
      { dx:   60, dy:  120, group: "food",    count: 20, spread: 180, base: 1100 },
      { dx: -300, dy:  200, group: "food",    count: 12, spread: 150, base: 800 },
      { dx:  320, dy:  120, group: "office",  count: 8,  spread: 130, base: 1400 },
      { dx:  -60, dy: -240, group: "transit", count: 3,  spread: 70,  base: 8200 }, // 港鐵銅鑼灣站出口
      { dx:  200, dy:  300, group: "transit", count: 2,  spread: 60,  base: 5600 },
      { dx: -120, dy:  -40, group: "leisure", count: 8,  spread: 200, base: 1300 },
    ],
  },
];

/* 各類型場所的 24 小時人流曲線（相對權重，程式內會正規化到 max=1） */
const HOUR_CURVES = {
  weekday: {
    mall:    [1,1,1,1,1,1,1,2,3,5,8,10,11,12,12,13,14,15,16,17,16,12,6,2],
    food:    [2,1,1,1,1,1,2,4,6,7,8,14,18,16,9,8,9,12,17,19,15,10,6,3],
    office:  [1,1,1,1,1,2,4,8,14,17,18,17,14,16,17,17,16,14,10,6,4,3,2,1],
    transit: [2,1,1,1,1,2,5,10,16,12,9,9,10,10,10,10,11,14,17,14,11,8,5,3],
    leisure: [1,1,1,1,1,1,1,2,3,4,6,8,10,11,12,13,14,15,16,16,15,13,9,4],
    other:   [1,1,1,1,1,1,2,4,6,8,9,10,11,11,11,11,11,12,12,11,9,7,4,2],
  },
  weekend: {
    mall:    [1,1,1,1,1,1,1,1,2,4,8,12,15,17,18,18,18,17,17,16,14,10,5,2],
    food:    [2,1,1,1,1,1,1,2,4,6,9,15,19,17,12,10,11,13,18,19,16,11,7,3],
    office:  [1,1,1,1,1,1,1,2,3,4,4,4,4,4,4,4,4,3,3,2,2,2,1,1],
    transit: [2,1,1,1,1,1,2,4,7,9,11,12,13,13,13,13,13,13,13,12,10,8,5,3],
    leisure: [1,1,1,1,1,1,1,1,2,4,7,10,13,15,16,16,16,16,16,15,13,10,6,3],
    other:   [1,1,1,1,1,1,1,2,4,6,8,10,12,12,12,12,12,12,12,11,9,7,4,2],
  },
};

/* 場所類型 → 模型分組，與各分組對人流指數的貢獻係數 */
const GROUP_FACTOR = { mall: 1.6, food: 1.0, office: 1.2, transit: 1.8, leisure: 1.1, other: 0.7 };

const TYPE_TO_GROUP = {
  shopping_mall: "mall", department_store: "mall", clothing_store: "mall",
  supermarket: "mall", electronics_store: "mall", home_goods_store: "mall",
  restaurant: "food", cafe: "food", coffee_shop: "food", bar: "food",
  bakery: "food", meal_takeaway: "food", food_court: "food",
  subway_station: "transit", train_station: "transit", transit_station: "transit",
  light_rail_station: "transit", bus_station: "transit",
  corporate_office: "office", bank: "office", finance: "office",
  tourist_attraction: "leisure", movie_theater: "leisure", hotel: "leisure",
  lodging: "leisure", museum: "leisure", performing_arts_theater: "leisure",
  gym: "leisure", night_club: "leisure",
};

/* Places API (New) searchNearby 一次最多 20 筆，分四組類型查詢後合併 */
const PLACE_TYPE_QUERIES = [
  ["shopping_mall", "department_store", "supermarket", "electronics_store"],
  ["restaurant", "cafe", "bar", "bakery"],
  ["subway_station", "train_station", "transit_station", "bus_station"],
  ["tourist_attraction", "hotel", "movie_theater", "gym"],
];

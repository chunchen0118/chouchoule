# 🎲 抽抽樂 Gacha Fun

一個好玩又好看的線上抽獎小遊戲！包含三種經典抽獎遊戲：扭蛋機、卡牌翻牌樂、刮刮樂。

![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Vite](https://img.shields.io/badge/Vite-5-purple)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-cyan)

## ✨ 功能特色

### 🎰 扭蛋機 (Gacha)
- 經典扭蛋機動畫效果
- 單抽、5連抽、10連抽
- 獎品掉落動畫
- 可自訂獎品、機率、庫存

### 🃏 卡牌抽抽樂 (Card Flip)
- 精美3D翻牌動畫
- 12張神秘卡牌等你翻開
- 單張翻牌或全部翻開
- 稀有度視覺特效

### 🎫 刮刮樂 (Scratch Card)
- 四種刮刮樂款式可選
- 真實刮開效果（Canvas實現）
- 支援滑鼠與觸控操作
- 自動偵測刮開進度並揭曉獎品

## 🎮 通用功能

- 📊 **統計數據**：總抽獎次數、傳說獎品數、歷史紀錄
- ⚙️ **自訂獎品**：名稱、表情符號、權重機率、庫存數量
- 🎨 **稀有度系統**：普通、稀有、精良、史詩、傳說
- 💾 **本地儲存**：設定與紀錄自動保存於瀏覽器
- 📱 **響應式設計**：電腦與手機都能順暢遊玩
- 🌈 **精美動畫**：Framer Motion 打造流暢動效

## 🚀 快速開始

### 安裝依賴

```bash
npm install
```

### 開發模式

```bash
npm run dev
```

瀏覽器開啟 http://localhost:5173 即可開始遊玩！

### 建置專案

```bash
npm run build
```

建置完成的檔案會在 `dist` 資料夾中。

### 預覽建置結果

```bash
npm run preview
```

## 📁 專案結構

```
src/
├── components/         # 共用元件
│   ├── Layout.tsx      # 頁面佈局
│   ├── PrizeResult.tsx # 獎品揭曉彈窗
│   └── SettingsModal.tsx # 設定面板
├── pages/              # 頁面元件
│   ├── Dashboard.tsx   # 首頁
│   ├── GachaPage.tsx   # 扭蛋機
│   ├── CardsPage.tsx   # 卡牌翻牌
│   └── ScratchPage.tsx # 刮刮樂
├── hooks/              # 自訂 Hooks
│   ├── useLocalStorage.ts
│   └── useGameState.ts
├── data/               # 預設資料
│   └── defaultPrizes.ts
├── types/              # TypeScript 型別
│   └── index.ts
├── utils/              # 工具函式
│   └── random.ts
├── App.tsx             # 主應用程式
├── main.tsx            # 進入點
└── index.css           # 全域樣式
```

## 🛠️ 技術棧

- **前端框架**: React 18
- **語言**: TypeScript
- **建置工具**: Vite
- **樣式**: Tailwind CSS
- **路由**: React Router v6
- **動畫**: Framer Motion
- **狀態管理**: React Hooks + localStorage

## 🎨 自訂獎品

每個遊戲都可以在設定面板中自訂獎品：

1. 點擊「⚙️ 設定」按鈕
2. 新增、編輯或刪除獎品
3. 設定獎品名稱、表情符號、權重、庫存
4. 權重越高，抽中機率越高
5. 庫存為空表示無限供應

## 📝 License

MIT License

---

Made with ❤️ by Gacha Fun Team

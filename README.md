# 勤怠管理システム

小規模組織向けのWebベース勤怠管理システムです。従業員による日次の打刻・修正と、管理者による月次の集計・承認が可能です。

## 機能

### 従業員機能
- 日次勤怠入力（出勤・退勤・休憩時間）
- 月次カレンダー表示
- 勤務時間の自動計算（実働時間、残業時間、深夜労働時間）
- 月次サマリー表示（総勤務時間、残業時間、概算給与）
- 勤怠記録のステータス管理（下書き、申請中、承認済、差戻し）

### 管理者機能
- 全従業員の勤怠状況一覧
- 従業員別勤怠詳細表示
- 勤怠記録の承認・差戻し
- 従業員情報の管理（追加、編集、削除）
- CSV出力機能

## 技術スタック

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (Strict mode)
- **Styling**: Tailwind CSS
- **UI Components**: カスタムコンポーネント（shadcn/ui風）
- **Form Handling**: react-hook-form + zod
- **Date Library**: date-fns
- **Icons**: lucide-react
- **Storage**: LocalStorage（モック実装）

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## デフォルトユーザー

### 管理者アカウント
- メール: admin@example.com
- パスワード: fkjahdiojFJ209u

### 従業員アカウント
- メール: yamada@example.com
- パスワード: user123

- メール: sato@example.com
- パスワード: user123

## ディレクトリ構造

```
.
├── app/                      # Next.js App Router
│   ├── login/               # ログイン画面
│   ├── dashboard/           # 従業員ダッシュボード
│   ├── admin/
│   │   ├── dashboard/       # 管理者ダッシュボード
│   │   ├── employees/       # 従業員管理
│   │   └── attendance/[userId]/ # 従業員別勤怠詳細
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/                  # 基本UIコンポーネント
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── table.tsx
│   │   ├── label.tsx
│   │   └── textarea.tsx
│   └── attendance/          # 勤怠関連コンポーネント
│       ├── monthly-calendar.tsx
│       ├── monthly-summary.tsx
│       └── attendance-edit-modal.tsx
├── lib/
│   ├── utils.ts            # ユーティリティ関数
│   └── storage.ts          # LocalStorage操作
├── utils/
│   ├── time-calculation.ts # 時間計算ロジック
│   └── validation.ts       # バリデーションスキーマ
├── hooks/
│   └── use-auth.ts         # 認証フック
├── types/
│   └── index.ts            # TypeScript型定義
└── README.md
```

## 主な機能の使い方

### 従業員の勤怠入力

1. 従業員アカウントでログイン
2. ダッシュボードのカレンダーから日付をクリック
3. 出勤時刻、退勤時刻、休憩時間を入力
4. 業務内容や備考を記入（任意）
5. 「下書き保存」または「保存して申請」をクリック

### 管理者による承認

1. 管理者アカウントでログイン
2. ダッシュボードから承認待ちの従業員を確認
3. 「詳細」ボタンをクリックして勤怠詳細画面へ
4. 各勤怠記録を確認し、承認または差戻し

### 従業員管理

1. 管理者ダッシュボードから「従業員管理」をクリック
2. 「従業員を追加」ボタンで新しい従業員を登録
3. 既存の従業員は編集または削除が可能

### CSV出力

1. 管理者ダッシュボードから従業員の詳細画面へ
2. 「CSV出力」ボタンをクリック
3. 選択した月の勤怠データがCSV形式でダウンロードされます

## 時間計算ロジック

### 実働時間
```
実働時間 = (退勤時刻 - 出勤時刻) - 休憩時間の合計
```

### 残業時間
```
残業時間 = max(0, 実働時間 - 8時間)
```

### 深夜労働時間
```
深夜時間 = 22:00〜翌05:00の間に含まれる実働時間
```

## データ永続化

現在はLocalStorageを使用してデータを保存しています。将来的にSupabaseなどのバックエンドへの移行を想定した設計になっています。

## 今後の拡張予定

- [ ] バックエンドAPI実装（Supabase等）
- [ ] 実際の認証システム統合
- [ ] ダークモード対応
- [ ] モバイル対応の強化
- [ ] 通知機能
- [ ] 出勤・退勤のワンタップ打刻機能
- [ ] レポート機能の拡充

## ライセンス

MIT

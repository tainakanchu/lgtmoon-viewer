---
description: GitHub Actions バージョン指定ルール
globs:
  - ".github/workflows/**/*.yml"
  - ".github/actions/**/*.yml"
---

# GitHub Actions バージョン指定ルール

## 基本ルール

- `uses:` でアクションを指定する際は、タグアノテーション（例: `@v4`）ではなくコミットハッシュ（例: `@11bd71901bbe5b1630ceea73d27597364c9af683 # v4`）を使用すること
- サプライチェーン攻撃対策のため、必ずコミットハッシュで固定する
- コメントで元のバージョンタグを残すこと（例: `# v4`）
- ローカル/composite アクション（`uses: ./.github/actions/...`）は対象外

## 新規追加・バージョン更新時の手順

1. `gh api repos/{owner}/{repo}/releases/tags/{tag}` でリリース日（`published_at`）を取得
2. **リリースから3日以上経過していることを確認**（3日未満はサプライチェーン攻撃の検知猶予期間として使用しない）
3. 確認後、`gh api repos/{owner}/{repo}/git/ref/tags/{tag}` で SHA を取得して指定
4. 3日未満の場合はユーザーに警告し、前のバージョンを使用する

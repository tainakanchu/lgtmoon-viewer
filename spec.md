
# lgtmoon Viewer Wrapper — Comprehensive Specification

## Overview

This document describes the design and specification of a **viewer wrapper for lgtmoon**.

The wrapper provides an improved UI for browsing images and managing favorites while remaining fully client‑side and independent from the original site's API.

The system works by:

- Reading existing favorites from `localStorage`
- Generating image URLs directly
- Performing random image exploration by number
- Managing **ignore ranges** to skip unwanted number clusters
- Providing a visual UX to review and expand ignore ranges interactively

The goal is to make browsing and curating images enjoyable and exploratory.

---

# 1. Architecture

## 1.1 Design Principles

The wrapper:

- **Does not rely on the lgtmoon API**
- Uses predictable URL structure
- Operates fully client‑side
- Stores its own state separately from the original site

The application behaves as a **viewer and curation tool over a numeric image space**.

---

# 2. Image Model

## 2.1 URL Format

Images follow this format:

```
https://image.lgtmoon.dev/<imageNumber>
```

Example:

```
https://image.lgtmoon.dev/240374
https://image.lgtmoon.dev/1731
```

## 2.2 Image Number

The numeric ID at the end of the URL.

Example:

```
240374
1731
614948
```

Extraction rule:

```
imageNumber = Number(new URL(url).pathname.split("/").pop())
```

---

# 3. Legacy Favorites

## 3.1 Source

Existing favorites are stored in:

```
localStorage["favorites"]
```

Example structure:

```json
[
  {
    "url": "https://image.lgtmoon.dev/240374",
    "isConverted": true
  }
]
```

## 3.2 Legacy Favorite Type

```
type LegacyFavorite = {
  url: string
  isConverted: boolean
}
```

---

# 4. Wrapper Data Models

## 4.1 Favorite Item

```
type FavoriteItem = {
  id: string
  url: string
  imageNumber: number
  isConverted: boolean
  source: "imported" | "wrapper"
  createdAt: string
}
```

Rules:

- `id = url`
- `imageNumber` derived from URL
- duplicates prevented via URL equality

---

## 4.2 Ignore Range

```
type IgnoreRange = {
  id: string
  start: number
  end: number
  enabled: boolean
  label?: string
  createdAt: string
  updatedAt: string
}
```

Range is **inclusive**.

Example:

```
266018 – 267834
```

---

## 4.3 Settings

```
type Settings = {
  minImageNumber: number
  maxImageNumber: number
  retryLimit: number
}
```

Example default:

```
minImageNumber = 1
maxImageNumber = 700000
retryLimit = 50
```

---

# 5. Local Storage Keys

The wrapper uses independent storage.

```
lgtmoon-wrapper/favorites
lgtmoon-wrapper/ignore-ranges
lgtmoon-wrapper/settings
lgtmoon-wrapper/import-meta
```

The original `favorites` key is **never modified**.

---

# 6. Random Image System

Random images are generated internally.

Algorithm:

1. Generate random number in range
2. Check ignore ranges
3. Build image URL
4. Attempt image load
5. If load fails retry

Pseudo code:

```
for i in retryLimit:

  n = random(minImageNumber, maxImageNumber)

  if isIgnored(n):
      continue

  url = buildImageUrl(n)

  if canLoadImage(url):
      return image

throw error
```

---

# 7. Favorites Features

## 7.1 Import

Import process:

1. Read `localStorage["favorites"]`
2. Parse JSON
3. Extract imageNumber
4. Convert to internal format
5. Remove duplicates
6. Save to wrapper storage

Errors:

- JSON parse failure handled gracefully
- invalid URLs skipped

---

## 7.2 Favorites View

Grid display using:

```
<img src=url>
```

Each card displays:

- image
- image number
- copy URL button
- delete favorite button

Lazy loading recommended.

---

# 8. Ignore Range System

Ignore ranges define number regions that random browsing skips.

Example:

```
266018 – 267834
561640 – 561641
614947 – 614948
```

These commonly represent **clusters of similar images**.

---

# 9. Ignore Range Management UX

The ignore range system is designed to be **interactive and visual**, not purely numeric configuration.

Users can review and expand ranges through previews.

---

# 10. Ignore Range Proposal System

Instead of immediately saving new ranges, the system uses **proposals**.

## 10.1 Proposal Model

```
type IgnoreRangeProposal = {
  anchor: number
  mode: "new" | "extend-left" | "extend-right" | "merge"
  proposedStart: number
  proposedEnd: number
  affectedRanges: IgnoreRange[]
}
```

---

# 11. Proposal Workflow

1. User selects anchor number
2. Nearby images load
3. User adjusts start/end
4. System previews resulting ignore ranges
5. User confirms changes

---

# 12. Preview UI

The preview interface displays:

- nearby thumbnails
- existing ignore ranges
- proposed ignore range
- resulting merged ranges

Color coding:

| State | Meaning |
|------|------|
| Grey | existing ignore |
| Blue | proposed ignore |
| Normal | active region |

---

# 13. Range Adjustment Controls

Users can adjust proposal boundaries via:

```
-1
-5
-10
+1
+5
+10
```

Or direct numeric input.

This allows quick expansion/shrinking of ignore regions.

---

# 14. Merge Behavior

New ranges are normalized automatically.

Rules:

### Overlap

```
existing: 100–120
new: 110–140
result: 100–140
```

### Adjacent

```
existing: 100–120
new: 121–140
result: 100–140
```

### Contained

```
existing: 100–200
new: 120–150
result: unchanged
```

### Bridging two ranges

```
existing: 100–120
existing: 150–170
new: 121–149

result:
100–170
```

---

# 15. Preview Result Messaging

Before saving, the UI explains the outcome.

Examples:

```
A new ignore range will be created: 267832–267840
```

```
Existing range will expand:
266018–267834 → 266018–267840
```

```
Two ignore ranges will merge into:
266018–266200
```

---

# 16. Random Page Integration

From the Random page, users can quickly create ignore proposals.

Options:

```
Ignore this number
Ignore ±5
Ignore ±10
Review nearby range
```

Selecting "Review nearby range" opens the preview editor.

---

# 17. Nearby Explorer

When reviewing ranges, nearby images appear.

Example window:

```
anchor = 267835

range shown:
267825 – 267845
```

Users visually inspect clusters before extending ignore regions.

---

# 18. Ignore Range List

Each range displays:

```
266018–267834
1,817 numbers
Enabled toggle
Edit
Delete
```

Additional operations:

- expand
- shrink
- split

---

# 19. Range Splitting

If users want to restore a region inside a range.

Example:

```
266018–267834
```

Restore:

```
266500–266520
```

Result:

```
266018–266499
266521–267834
```

---

# 20. Settings Screen

Settings allow tuning of exploration.

Fields:

```
minImageNumber
maxImageNumber
retryLimit
```

Also includes:

- URL preview test
- test load button

---

# 21. Error Handling

Handled gracefully.

Cases:

| Situation | Handling |
|--------|--------|
Invalid JSON | show message |
Missing image | retry |
Too many failures | show configuration warning |

---

# 22. Performance Considerations

Recommended optimizations:

- lazy image loading
- thumbnail caching
- limited preview window size
- debounce random generation

---

# 23. Future Extensions

Possible improvements:

- automatic cluster detection
- heatmap visualization of image density
- ignore suggestion engine
- browsing history
- tag system for favorites
- advanced search by number range

---

# 24. Implementation Modules

Suggested structure:

```
services/
  legacyFavoritesAdapter.ts
  imageUrlBuilder.ts
  randomImageService.ts
  imageProbe.ts
  favoritesStore.ts
  ignoreRangeStore.ts
  settingsStore.ts

utils/
  extractImageNumber.ts
  rangeUtils.ts

pages/
  FavoritesPage
  RandomPage
  IgnoreRangesPage
  SettingsPage
  ImportPage
```

---

# 25. Summary

This wrapper transforms lgtmoon browsing into:

- a **numeric exploration tool**
- a **curation workflow**
- a **visual range editor**

Core ideas:

- numeric random exploration
- ignore range shaping
- preview‑based editing
- visual discovery

The ignore system evolves organically as the user explores the dataset.


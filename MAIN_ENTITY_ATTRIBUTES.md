# Main Entity Attributes - Implementation Status

## ✅ What EXISTS in the Database/API

### Story Attributes (from Entity Context Bot)
Stories have an `attributes` field that contains bot-generated data:

| Attribute Key | Value Format | Description | Source |
|--------------|--------------|-------------|--------|
| `main_location` | JSON array | Array of location entities with name, tag_type, confidence | Entity Context Bot |
| `w1h_where` | String | Legacy field - first location name | Entity Context Bot |
| `main_person` | JSON array | Array of person entities | Entity Context Bot |
| `w1h_who` | String | Legacy field - first person name | Entity Context Bot |
| `main_organization` | JSON array | Array of organization entities | Entity Context Bot |
| `main_address` | JSON array | Array of address entities | Entity Context Bot |
| `w1h_what` | String | Event description | Entity Context Bot |
| `w1h_when` | JSON string | Temporal information | Entity Context Bot |
| `w1h_how` | String | Method description | Entity Context Bot |

### Story Tags
- `tags`: Record<string, TagInfo> where TagInfo has `tag_type` (e.g., "Location", "Person", "Organization")
- Tags are extracted by NLP Bot and stored in `news_item_tag` table

### Database Tables
- `story_main_entity`: Stores main entities separately (Person, Location, Organization, etc.)
- `story_relationship`: Stores country relationship classifications
- `story_news_item_attribute`: Links story attributes to the attribute table

## ❌ What's MISSING in Our Implementation

### 1. **Attributes Field Not in TypeScript Interface**
**File**: `webapp/lib/sentinel/api-client.ts`

**Current**:
```typescript
interface SentinelStory {
  // ... other fields
  tags?: Record<string, TagInfo>;
  // ❌ attributes field is MISSING!
}
```

**Should be**:
```typescript
interface SentinelStory {
  // ... other fields
  tags?: Record<string, TagInfo>;
  attributes?: Record<string, {
    key: string;
    value: string;
    // ... other attribute fields
  }>;
}
```

### 2. **Not Using Main Location Attributes**
**File**: `webapp/app/api/sentinel/globe/route.ts`

**Current**: We only use `tags` for location extraction
**Missing**: We should also check `attributes.main_location` or `attributes.w1h_where`

**Priority Order Should Be**:
1. `attributes.main_location` (JSON array - most accurate)
2. `attributes.w1h_where` (legacy string - fallback)
3. `tags` with `tag_type === 'Location'` (current implementation)
4. Text matching (last resort)

### 3. **Not Using Main Person/Organization**
We're not extracting or using:
- `attributes.main_person` / `attributes.w1h_who`
- `attributes.main_organization`
- `attributes.w1h_what`, `w1h_when`, `w1h_how` (structured info)

### 4. **Not Accessing story_main_entity Table**
The database has a dedicated `story_main_entity` table that stores main entities, but we're not querying it directly.

## 📋 Implementation Checklist

- [ ] Add `attributes` field to `SentinelStory` interface
- [ ] Update location extraction to use `attributes.main_location` first
- [ ] Parse JSON from `main_location` attribute (it's a JSON array)
- [ ] Fallback chain: main_location → w1h_where → tags → text matching
- [ ] Add extraction for main person (`attributes.main_person` / `w1h_who`)
- [ ] Add extraction for main organization (`attributes.main_organization`)
- [ ] Consider using `story_main_entity` table for more structured queries
- [ ] Update globe route to use main location attributes

## 🔍 Example Attribute Structure

From Entity Context Bot, `main_location` would look like:
```json
[
  {
    "name": "Donetsk",
    "tag_type": "Location",
    "confidence": 0.9,
    "metadata": {
      "method": "llm",
      "model": "gpt-5-nano-2025-08-07",
      "all_options": ["Russia", "Donetsk", "Ukraine"]
    }
  }
]
```

And `w1h_where` would be:
```json
"Donetsk"
```

## 🎯 Recommended Next Steps

1. **Immediate**: Add `attributes` field to TypeScript interface
2. **High Priority**: Update location extraction to use `main_location` attribute
3. **Medium Priority**: Extract and use main person/organization for richer data
4. **Future**: Consider querying `story_main_entity` table directly for better performance








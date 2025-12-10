# Category Field Filtering for Ads

This document explains how to filter ads by category fields and their values on both the regular `/ads` endpoint and the GraphQL-style `/ads/search` endpoint.

## Overview

Ads can have additional structured data through category fields (e.g., "brand", "transmission", "fuel type" for vehicle categories). The CategoryField model stores metadata about these fields, and AdFieldValue links ads to specific field values.

## Schema Reference

### CategoryField

- `id`: Unique identifier
- `categoryId`: Links to the category this field belongs to
- `name`: Field name (e.g., "brand", "transmission")
- `label`: Human-readable label
- `type`: Field type (TEXT, NUMBER, SELECT, RADIO, CHECKBOX, TEXTAREA, DATE, BOOLEAN)
- `options`: JSON array of possible values for SELECT/RADIO fields
- `isRequired`: Whether the field is required

### AdFieldValue

- `adId`: Links to the ad
- `categoryFieldId`: Links to the category field
- `value`: The actual value stored for this field on this ad

## Filtering API

### Endpoint: GET /ads

Filter ads by category field values using the `categoryFields` query parameter.

#### Query Parameter

- **categoryFields**: Array of objects specifying field filters
  - `fieldName` (required): Name of the category field (e.g., "brand", "transmission")
  - `value` (required): Value to match
  - `categoryId` (optional): Category ID to disambiguate if the same field name exists in multiple categories

#### Example Requests

**Filter cars by brand:**

```bash
GET /ads?categoryFields=%5B%7B%22fieldName%22%3A%22brand%22%2C%22value%22%3A%22Toyota%22%7D%5D
```

Human-readable version: `[{"fieldName":"brand","value":"Toyota"}]`

**Filter by multiple criteria:**

```bash
GET /ads?categoryFields=%5B%7B%22fieldName%22%3A%22brand%22%2C%22value%22%3A%22Toyota%22%7D%2C%7B%22fieldName%22%3A%22transmission%22%2C%22value%22%3A%22automatic%22%7D%5D
```

Human-readable version: `[{"fieldName":"brand","value":"Toyota"},{"fieldName":"transmission","value":"automatic"}]`

**Filter with category-specific field:**

```bash
GET /ads?categoryFields=%5B%7B%22fieldName%22%3A%22brand%22%2C%22value%22%3A%22Toyota%22%2C%22categoryId%22%3A%22car-category-id%22%7D%5D
```

Human-readable version: `[{"fieldName":"brand","value":"Toyota","categoryId":"car-category-id"}]`

#### Combined with other filters

Category field filters work alongside other filters like category, price range, etc.:

```bash
GET /ads?categoryId=cars&minPrice=10000&categoryFields=%5B%7B%22fieldName%22%3A%22brand%22%2C%22value%22%3A%22Toyota%22%7D%5D&limit=20
```

### Endpoint: POST /ads/search

The GraphQL-style search endpoint supports category field filtering through the request body.

#### Request Body

The `search` object can include a `categoryFields` array with the same structure as the GET endpoint.

#### Example Request

```json
{
  "search": {
    "categoryIds": ["cars"],
    "categoryFields": [
      {
        "fieldName": "brand",
        "value": "Toyota"
      },
      {
        "fieldName": "transmission",
        "value": "automatic"
      }
    ],
    "page": 1,
    "limit": 20
  }
}
```

## Implementation Details

### Filtering Logic

- **Multiple fields**: Multiple category field filters are combined with AND logic (all conditions must be met)
- **Field resolution**: The system finds the CategoryField by name and optional categoryId
- **Ad matching**: Ads are filtered by having AdFieldValue records that match the specified field-value pairs

### Performance Considerations

- The implementation uses database joins to filter ads efficiently
- Invalid field names or values result in no matches (graceful failure)
- Multiple filters are combined into a single query for optimal performance

## Error Handling

- Invalid field names or missing categories result in empty result sets
- The API remains stable even with malformed filter parameters
- All standard validation rules apply to the filter objects

## Use Cases

1. **Vehicle Search**: Filter cars by make, model, transmission, fuel type
2. **Real Estate**: Filter properties by bedrooms, bathrooms, property type
3. **Electronics**: Filter devices by brand, storage capacity, color
4. **Clothing**: Filter items by size, color, material

## Creating and Updating Ads with Category Fields

### Ad Creation/Update Input Options

When creating or updating ads, you can specify category field values in two ways:

#### Option 1: Using Field IDs (Direct Approach)

Specify field values by providing `categoryFieldId` and `value`:

```json
{
  "title": "Toyota Camry 2020",
  "description": "Excellent condition",
  "categoryId": "cars",
  "fieldValues": [
    {
      "categoryFieldId": "ckxyz-brand-field-id",
      "value": "Toyota"
    },
    {
      "categoryFieldId": "ckxyz-model-field-id",
      "value": "Camry"
    },
    {
      "categoryFieldId": "ckxyz-year-field-id",
      "value": "2020"
    },
    {
      "categoryFieldId": "ckxyz-transmission-field-id",
      "value": "automatic"
    }
  ]
}
```

#### Option 2: Using Field Names (Developer-Friendly Approach)

Specify field values by providing `fieldName`, `value`, and optional `categoryId`:

```json
{
  "title": "Toyota Camry 2020",
  "description": "Excellent condition",
  "categoryId": "cars",
  "namedFieldValues": [
    {
      "fieldName": "brand",
      "value": "Toyota"
    },
    {
      "fieldName": "model",
      "value": "Camry"
    },
    {
      "fieldName": "year",
      "value": 2020
    },
    {
      "fieldName": "transmission",
      "value": "automatic"
    },
    {
      "fieldName": "condition",
      "value": { "rating": 4.5, "description": "Excellent" }
    }
  ]
}
```

### Field Value Types

Field values can be any type - the system automatically converts them to strings for storage:

- **Strings**: `"Toyota"`, `"automatic"`
- **Numbers**: `2020`, `15000` (mileage)
- **Booleans**: `true`, `false` (certified, etc.)
- **Objects**: `{"rating": 4.5, "description": "Excellent"}` (stored as JSON string)
- **Arrays**: `["option1", "option2"]` (for multi-select fields)

### Storage Process

1. **Field Name Resolution**: Field names are resolved to `categoryFieldId` values by searching the CategoryField table
2. **Value Conversion**: Non-string values are automatically converted to strings (objects become JSON strings)
3. **Relation Creation**: `AdFieldValue` records are created linking the ad to field values
4. **Validation**: Field availability and data types are validated before storage

### Update Behavior

When updating ads:

- Existing field values are **replaced** (delete all, then create new)
- Partial updates are supported - only provide fields you want to change
- Omitting field values entirely keeps existing values unchanged
- Setting `fieldValues` or `namedFieldValues` to empty array removes all field associations

## Integration with Frontend

Frontend applications can:

1. **Dynamic Field Discovery**: Query available CategoryField definitions for each category to build appropriate form fields
2. **Option-Based Inputs**: Use the `options` field from CategoryField to create dropdown selects for standardized values
3. **Field Name Input**: Use the `namedFieldValues` approach for simpler API integration without needing to manage field IDs
4. **Flexible Value Types**: Support various input types (text, select, checkbox, number) based on category field settings

The category field system provides maximum flexibility for both simple and complex structured data while maintaining API consistency and developer experience.

# Categories and Category Fields API Documentation

## Overview

The Categories and Category Fields API provides a flexible system for organizing ads with hierarchical categories and dynamic custom fields. This allows different categories (e.g., Vehicles, Real Estate, Electronics) to have their own specific attributes.

### Base URLs

```
Categories: https://api.willfind8.com/api/v1/categories
Category Fields: https://api.willfind8.com/api/v1/category-fields
```

### Authentication

Admin-only endpoints require JWT authentication with ADMIN role:

```
Authorization: Bearer <admin-jwt-token>
```

---

## Categories API

### 1. Create Category (Admin Only)

**Endpoint:** `POST /categories`

**Authentication:** Required (Admin)

**Description:** Create a new category or subcategory.

**Request Body:**

```json
{
  "name": "Vehicles",
  "description": "All types of vehicles including cars, motorcycles, trucks",
  "isActive": true,
  "icon": "car-icon",
  "parentId": null,
  "sortOrder": 1
}
```

**Response (201 Created):**

```json
{
  "id": "cat_vehicles_123",
  "name": "Vehicles",
  "slug": "vehicles",
  "description": "All types of vehicles including cars, motorcycles, trucks",
  "isActive": true,
  "icon": "car-icon",
  "parentId": null,
  "sortOrder": 1,
  "createdAt": "2026-01-03T10:00:00Z",
  "updatedAt": "2026-01-03T10:00:00Z"
}
```

**Creating a Subcategory:**

```json
{
  "name": "Cars",
  "description": "Passenger cars and sedans",
  "isActive": true,
  "icon": "sedan-icon",
  "parentId": "cat_vehicles_123",
  "sortOrder": 1
}
```

---

### 2. Get All Categories

**Endpoint:** `GET /categories`

**Authentication:** None

**Description:** Retrieve all categories with optional filtering.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `parentOnly` | boolean | false | Get only parent categories (no parentId) |
| `parentId` | string | - | Get categories under specific parent |
| `includeInactive` | boolean | false | Include inactive categories |
| `search` | string | - | Search in category name/description |
| `includeFields` | boolean | false | Include category custom fields |
| `includeChildren` | boolean | false | Include subcategories recursively |
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page |

**Example Request:**

```
GET /categories?includeFields=true&includeChildren=true&page=1&limit=20
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "cat_vehicles_123",
      "name": "Vehicles",
      "slug": "vehicles",
      "description": "All types of vehicles",
      "isActive": true,
      "icon": "car-icon",
      "parentId": null,
      "sortOrder": 1,
      "children": [
        {
          "id": "cat_cars_456",
          "name": "Cars",
          "slug": "cars",
          "description": "Passenger cars and sedans",
          "isActive": true,
          "icon": "sedan-icon",
          "parentId": "cat_vehicles_123",
          "sortOrder": 1
        }
      ],
      "fields": [
        {
          "id": "field_brand_789",
          "name": "brand",
          "label": "Brand",
          "type": "SELECT",
          "isRequired": true,
          "options": [
            { "label": "Toyota", "value": "toyota" },
            { "label": "Honda", "value": "honda" },
            { "label": "Ford", "value": "ford" }
          ],
          "sortOrder": 1
        }
      ]
    }
  ],
  "meta": {
    "total": 15,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

### 3. Get Parent Categories Only

**Endpoint:** `GET /categories/parents`

**Authentication:** None

**Description:** Get only top-level categories (no parent).

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `includeInactive` | boolean | false | Include inactive categories |
| `search` | string | - | Search term |
| `includeFields` | boolean | false | Include category fields |
| `includeChildren` | boolean | false | Include all subcategories |

**Response:** Same structure as Get All Categories

---

### 4. Get Subcategories by Parent ID

**Endpoint:** `GET /categories/subcategories/:parentId`

**Authentication:** None

**Description:** Get direct or recursive subcategories of a parent category.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `includeInactive` | boolean | false | Include inactive categories |
| `recursive` | boolean | false | Include all nested subcategories |

**Example Request:**

```
GET /categories/subcategories/cat_vehicles_123?recursive=true
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "cat_cars_456",
      "name": "Cars",
      "slug": "cars",
      "parentId": "cat_vehicles_123",
      "children": [
        {
          "id": "cat_sedans_789",
          "name": "Sedans",
          "slug": "sedans",
          "parentId": "cat_cars_456"
        }
      ]
    },
    {
      "id": "cat_motorcycles_790",
      "name": "Motorcycles",
      "slug": "motorcycles",
      "parentId": "cat_vehicles_123"
    }
  ]
}
```

---

### 5. Get Category Tree

**Endpoint:** `GET /categories/tree`

**Authentication:** None

**Description:** Get hierarchical tree structure of all categories.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page |

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "cat_vehicles_123",
      "name": "Vehicles",
      "children": [
        {
          "id": "cat_cars_456",
          "name": "Cars",
          "children": [
            {
              "id": "cat_sedans_789",
              "name": "Sedans",
              "children": []
            }
          ]
        }
      ]
    }
  ],
  "meta": {
    "total": 5,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### 6. Get Category by ID

**Endpoint:** `GET /categories/:id`

**Authentication:** None

**Description:** Get single category with full details including fields.

**Response (200 OK):**

```json
{
  "id": "cat_vehicles_123",
  "name": "Vehicles",
  "slug": "vehicles",
  "description": "All types of vehicles",
  "isActive": true,
  "icon": "car-icon",
  "parentId": null,
  "sortOrder": 1,
  "fields": [
    {
      "id": "field_brand_789",
      "name": "brand",
      "label": "Brand",
      "type": "SELECT",
      "isRequired": true,
      "options": [
        { "label": "Toyota", "value": "toyota" }
      ]
    }
  ],
  "createdAt": "2026-01-03T10:00:00Z",
  "updatedAt": "2026-01-03T10:00:00Z"
}
```

---

### 7. Get Category by Slug

**Endpoint:** `GET /categories/slug/:slug`

**Authentication:** None

**Description:** Get category by its URL-friendly slug.

**Example Request:**

```
GET /categories/slug/vehicles
```

**Response:** Same as Get Category by ID

---

### 8. Update Category (Admin Only)

**Endpoint:** `PATCH /categories/:id`

**Authentication:** Required (Admin)

**Request Body (all fields optional):**

```json
{
  "name": "Motor Vehicles",
  "description": "Updated description",
  "isActive": false,
  "icon": "new-icon",
  "sortOrder": 2
}
```

**Response (200 OK):**

```json
{
  "id": "cat_vehicles_123",
  "name": "Motor Vehicles",
  "slug": "motor-vehicles",
  "description": "Updated description",
  "isActive": false,
  "updatedAt": "2026-01-03T11:00:00Z"
}
```

---

### 9. Delete Category (Admin Only)

**Endpoint:** `DELETE /categories/:id`

**Authentication:** Required (Admin)

**Description:** Soft delete a category. Cannot delete if it has ads or subcategories.

**Response (200 OK):**

```json
{
  "message": "Category deleted successfully"
}
```

---

### 10. Add Field to Category (Admin Only)

**Endpoint:** `POST /categories/:id/fields`

**Authentication:** Required (Admin)

**Description:** Add a custom field to a category.

**Request Body:** See Category Fields section for detailed field examples.

---

### 11. Get Category Fields

**Endpoint:** `GET /categories/:id/fields`

**Authentication:** None

**Description:** Get all custom fields for a category.

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "field_brand_789",
      "categoryId": "cat_vehicles_123",
      "name": "brand",
      "label": "Brand",
      "type": "SELECT",
      "isRequired": true,
      "options": [
        { "label": "Toyota", "value": "toyota" },
        { "label": "Honda", "value": "honda" }
      ],
      "sortOrder": 1
    },
    {
      "id": "field_year_790",
      "categoryId": "cat_vehicles_123",
      "name": "year",
      "label": "Year",
      "type": "NUMBER",
      "isRequired": true,
      "validation": {
        "minLength": 1900,
        "maxLength": 2026
      },
      "sortOrder": 2
    }
  ]
}
```

---

### 12. Remove Field from Category (Admin Only)

**Endpoint:** `DELETE /categories/:id/fields/:fieldId`

**Authentication:** Required (Admin)

**Description:** Remove a custom field from a category.

**Response (200 OK):**

```json
{
  "message": "Category field removed successfully"
}
```

---

## Category Fields API

### Field Types

The system supports the following field types:

| Type | Description | Use Case |
|------|-------------|----------|
| `TEXT` | Single-line text input | Short text like title, name |
| `TEXTAREA` | Multi-line text input | Long descriptions, notes |
| `NUMBER` | Numeric input | Price, year, quantity |
| `SELECT` | Dropdown selection (single choice) | Brand, color, condition |
| `RADIO` | Radio buttons (single choice) | Gender, size |
| `CHECKBOX` | Multiple checkboxes (multi-select) | Features, amenities |
| `DATE` | Date picker | Manufacturing date, availability |
| `BOOLEAN` | True/False toggle | Has warranty, negotiable |

---

### 1. Create Category Field (Admin Only)

**Endpoint:** `POST /category-fields`

**Authentication:** Required (Admin)

**Description:** Create a custom field for a category.

#### Example 1: SELECT Field (Dropdown)

```json
{
  "categoryId": "cat_vehicles_123",
  "name": "brand",
  "label": "Vehicle Brand",
  "type": "SELECT",
  "isRequired": true,
  "options": [
    { "label": "Toyota", "value": "toyota" },
    { "label": "Honda", "value": "honda" },
    { "label": "Ford", "value": "ford" },
    { "label": "Chevrolet", "value": "chevrolet" },
    { "label": "BMW", "value": "bmw" },
    { "label": "Mercedes-Benz", "value": "mercedes" }
  ],
  "sortOrder": 1
}
```

#### Example 2: RADIO Field (Single Choice)

```json
{
  "categoryId": "cat_vehicles_123",
  "name": "transmission",
  "label": "Transmission Type",
  "type": "RADIO",
  "isRequired": true,
  "options": [
    { "label": "Automatic", "value": "automatic" },
    { "label": "Manual", "value": "manual" },
    { "label": "Semi-Automatic", "value": "semi_automatic" }
  ],
  "sortOrder": 2
}
```

#### Example 3: CHECKBOX Field (Multiple Selection)

```json
{
  "categoryId": "cat_real_estate_456",
  "name": "amenities",
  "label": "Property Amenities",
  "type": "CHECKBOX",
  "isRequired": false,
  "options": [
    { "label": "Swimming Pool", "value": "pool" },
    { "label": "Gym", "value": "gym" },
    { "label": "Parking", "value": "parking" },
    { "label": "Security", "value": "security" },
    { "label": "Garden", "value": "garden" },
    { "label": "Elevator", "value": "elevator" }
  ],
  "sortOrder": 5
}
```

#### Example 4: NUMBER Field

```json
{
  "categoryId": "cat_vehicles_123",
  "name": "year",
  "label": "Manufacturing Year",
  "type": "NUMBER",
  "isRequired": true,
  "validation": {
    "minLength": 1900,
    "maxLength": 2026
  },
  "sortOrder": 3
}
```

**Note:** For NUMBER fields, `minLength` and `maxLength` define the acceptable range. These values enable range filtering in search queries.

#### Example 5: TEXT Field

```json
{
  "categoryId": "cat_electronics_789",
  "name": "model_number",
  "label": "Model Number",
  "type": "TEXT",
  "isRequired": false,
  "validation": {
    "maxLength": 50,
    "pattern": "^[A-Z0-9-]+$"
  },
  "sortOrder": 2
}
```

#### Example 6: TEXTAREA Field

```json
{
  "categoryId": "cat_real_estate_456",
  "name": "special_features",
  "label": "Special Features & Notes",
  "type": "TEXTAREA",
  "isRequired": false,
  "validation": {
    "maxLength": 1000
  },
  "sortOrder": 10
}
```

#### Example 7: DATE Field

```json
{
  "categoryId": "cat_electronics_789",
  "name": "purchase_date",
  "label": "Purchase Date",
  "type": "DATE",
  "isRequired": false,
  "sortOrder": 4
}
```

#### Example 8: BOOLEAN Field

```json
{
  "categoryId": "cat_vehicles_123",
  "name": "has_warranty",
  "label": "Has Active Warranty",
  "type": "BOOLEAN",
  "isRequired": false,
  "sortOrder": 8
}
```

**Response (201 Created):**

```json
{
  "id": "field_brand_789",
  "categoryId": "cat_vehicles_123",
  "name": "brand",
  "label": "Vehicle Brand",
  "type": "SELECT",
  "isRequired": true,
  "options": [
    { "label": "Toyota", "value": "toyota" },
    { "label": "Honda", "value": "honda" }
  ],
  "validation": null,
  "sortOrder": 1,
  "createdAt": "2026-01-03T10:00:00Z",
  "updatedAt": "2026-01-03T10:00:00Z"
}
```

---

### 2. Get All Category Fields

**Endpoint:** `GET /category-fields`

**Authentication:** None

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `categoryId` | string | Filter by category ID |
| `type` | FieldType | Filter by field type |
| `search` | string | Search in field name/label |
| `isRequired` | boolean | Filter by required status |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 10) |

**Example Request:**

```
GET /category-fields?categoryId=cat_vehicles_123&isRequired=true
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "field_brand_789",
      "categoryId": "cat_vehicles_123",
      "name": "brand",
      "label": "Vehicle Brand",
      "type": "SELECT",
      "isRequired": true,
      "options": [
        { "label": "Toyota", "value": "toyota" }
      ],
      "sortOrder": 1
    }
  ],
  "meta": {
    "total": 8,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### 3. Get Category Field by ID

**Endpoint:** `GET /category-fields/:id`

**Authentication:** None

**Response (200 OK):**

```json
{
  "id": "field_brand_789",
  "categoryId": "cat_vehicles_123",
  "name": "brand",
  "label": "Vehicle Brand",
  "type": "SELECT",
  "isRequired": true,
  "options": [
    { "label": "Toyota", "value": "toyota" },
    { "label": "Honda", "value": "honda" }
  ],
  "validation": null,
  "sortOrder": 1,
  "createdAt": "2026-01-03T10:00:00Z",
  "updatedAt": "2026-01-03T10:00:00Z"
}
```

---

### 4. Get Fields by Category ID

**Endpoint:** `GET /category-fields/category/:categoryId`

**Authentication:** None

**Description:** Get all custom fields for a specific category.

**Response:** Same structure as Get All Category Fields

---

### 5. Update Category Field (Admin Only)

**Endpoint:** `PATCH /category-fields/:id`

**Authentication:** Required (Admin)

**Request Body (all fields optional):**

```json
{
  "label": "Updated Label",
  "isRequired": false,
  "options": [
    { "label": "New Option 1", "value": "opt1" },
    { "label": "New Option 2", "value": "opt2" }
  ],
  "sortOrder": 5
}
```

**Response (200 OK):**

```json
{
  "id": "field_brand_789",
  "name": "brand",
  "label": "Updated Label",
  "isRequired": false,
  "options": [
    { "label": "New Option 1", "value": "opt1" }
  ],
  "updatedAt": "2026-01-03T11:00:00Z"
}
```

---

### 6. Delete Category Field (Admin Only)

**Endpoint:** `DELETE /category-fields/:id`

**Authentication:** Required (Admin)

**Response (200 OK):**

```json
{
  "message": "Category field deleted successfully"
}
```

---

## Using Category Fields in Ads

When creating or updating an ad, you can set values for category-specific fields:

### Creating an Ad with Category Fields

**Endpoint:** `POST /ads`

**Request Body:**

```json
{
  "title": "2020 Toyota Camry - Excellent Condition",
  "description": "Well-maintained Toyota Camry with full service history",
  "price": 25000,
  "categoryId": "cat_vehicles_123",
  "namedFieldValues": [
    {
      "fieldName": "brand",
      "value": "toyota",
      "categoryId": "cat_vehicles_123"
    },
    {
      "fieldName": "transmission",
      "value": "automatic"
    },
    {
      "fieldName": "year",
      "value": "2020"
    },
    {
      "fieldName": "has_warranty",
      "value": "true"
    }
  ]
}
```

### Field Value Format by Type

| Field Type | Value Format | Example |
|------------|--------------|---------|
| TEXT | String | `"ABC123"` |
| TEXTAREA | String | `"Long description text..."` |
| NUMBER | String (numeric) | `"2020"`, `"150000"` |
| SELECT | String (option value) | `"toyota"`, `"automatic"` |
| RADIO | String (option value) | `"manual"`, `"new"` |
| CHECKBOX | Comma-separated string | `"pool,gym,parking"` |
| DATE | ISO date string | `"2020-01-15"` |
| BOOLEAN | String boolean | `"true"`, `"false"` |

---

## Complete Real-World Examples

### Example 1: Electronics Category (Phone)

**Category Setup:**

```json
{
  "name": "Mobile Phones",
  "parentId": "cat_electronics_789"
}
```

**Fields:**

```json
[
  {
    "name": "brand",
    "label": "Brand",
    "type": "SELECT",
    "isRequired": true,
    "options": [
      { "label": "Apple", "value": "apple" },
      { "label": "Samsung", "value": "samsung" },
      { "label": "Google", "value": "google" }
    ]
  },
  {
    "name": "storage",
    "label": "Storage Capacity",
    "type": "SELECT",
    "isRequired": true,
    "options": [
      { "label": "64GB", "value": "64gb" },
      { "label": "128GB", "value": "128gb" },
      { "label": "256GB", "value": "256gb" },
      { "label": "512GB", "value": "512gb" }
    ]
  },
  {
    "name": "condition",
    "label": "Phone Condition",
    "type": "RADIO",
    "isRequired": true,
    "options": [
      { "label": "Brand New", "value": "new" },
      { "label": "Like New", "value": "like_new" },
      { "label": "Good", "value": "good" },
      { "label": "Fair", "value": "fair" }
    ]
  },
  {
    "name": "has_warranty",
    "label": "Under Warranty",
    "type": "BOOLEAN",
    "isRequired": false
  }
]
```

**Creating Phone Ad:**

```json
{
  "title": "iPhone 15 Pro Max 256GB",
  "price": 1200,
  "categoryId": "cat_phones_999",
  "namedFieldValues": [
    { "fieldName": "brand", "value": "apple" },
    { "fieldName": "storage", "value": "256gb" },
    { "fieldName": "condition", "value": "like_new" },
    { "fieldName": "has_warranty", "value": "true" }
  ]
}
```

### Example 2: Real Estate Category

**Category Setup:**

```json
{
  "name": "Apartments",
  "parentId": "cat_real_estate_456"
}
```

**Fields:**

```json
[
  {
    "name": "bedrooms",
    "label": "Number of Bedrooms",
    "type": "NUMBER",
    "isRequired": true,
    "validation": { "minLength": 1, "maxLength": 10 }
  },
  {
    "name": "bathrooms",
    "label": "Number of Bathrooms",
    "type": "NUMBER",
    "isRequired": true,
    "validation": { "minLength": 1, "maxLength": 10 }
  },
  {
    "name": "furnishing",
    "label": "Furnishing Status",
    "type": "RADIO",
    "isRequired": true,
    "options": [
      { "label": "Fully Furnished", "value": "fully" },
      { "label": "Semi-Furnished", "value": "semi" },
      { "label": "Unfurnished", "value": "none" }
    ]
  },
  {
    "name": "amenities",
    "label": "Available Amenities",
    "type": "CHECKBOX",
    "isRequired": false,
    "options": [
      { "label": "Swimming Pool", "value": "pool" },
      { "label": "Gym", "value": "gym" },
      { "label": "Parking", "value": "parking" },
      { "label": "24/7 Security", "value": "security" },
      { "label": "Elevator", "value": "elevator" }
    ]
  },
  {
    "name": "available_from",
    "label": "Available From",
    "type": "DATE",
    "isRequired": false
  }
]
```

**Creating Apartment Ad:**

```json
{
  "title": "Luxury 3BR Apartment in Cantonments",
  "price": 2500,
  "categoryId": "cat_apartments_888",
  "namedFieldValues": [
    { "fieldName": "bedrooms", "value": "3" },
    { "fieldName": "bathrooms", "value": "2" },
    { "fieldName": "furnishing", "value": "fully" },
    { "fieldName": "amenities", "value": "pool,gym,parking,security" },
    { "fieldName": "available_from", "value": "2026-02-01" }
  ]
}
```

### Example 3: Automotive Category

**Fields for Cars:**

```json
[
  {
    "name": "make",
    "label": "Make",
    "type": "SELECT",
    "options": [
      { "label": "Toyota", "value": "toyota" },
      { "label": "Honda", "value": "honda" },
      { "label": "Mercedes-Benz", "value": "mercedes" }
    ]
  },
  {
    "name": "year",
    "label": "Year",
    "type": "NUMBER",
    "validation": { "minLength": 1990, "maxLength": 2026 }
  },
  {
    "name": "mileage",
    "label": "Mileage (km)",
    "type": "NUMBER"
  },
  {
    "name": "transmission",
    "label": "Transmission",
    "type": "RADIO",
    "options": [
      { "label": "Automatic", "value": "automatic" },
      { "label": "Manual", "value": "manual" }
    ]
  },
  {
    "name": "fuel_type",
    "label": "Fuel Type",
    "type": "SELECT",
    "options": [
      { "label": "Petrol", "value": "petrol" },
      { "label": "Diesel", "value": "diesel" },
      { "label": "Hybrid", "value": "hybrid" },
      { "label": "Electric", "value": "electric" }
    ]
  },
  {
    "name": "features",
    "label": "Features",
    "type": "CHECKBOX",
    "options": [
      { "label": "Air Conditioning", "value": "ac" },
      { "label": "Navigation System", "value": "nav" },
      { "label": "Sunroof", "value": "sunroof" },
      { "label": "Leather Seats", "value": "leather" }
    ]
  }
]
```

---

## Validation Rules

### Field Validation Object

The `validation` object supports:

```json
{
  "minLength": 10,
  "maxLength": 100,
  "pattern": "^[A-Za-z0-9]+$"
}
```

| Property | Type | Applicable To | Description |
|----------|------|---------------|-------------|
| `minLength` | number | TEXT, TEXTAREA, NUMBER | Minimum length (TEXT/TEXTAREA) or minimum value (NUMBER) |
| `maxLength` | number | TEXT, TEXTAREA, NUMBER | Maximum length (TEXT/TEXTAREA) or maximum value (NUMBER) |
| `pattern` | string | TEXT, TEXTAREA | Regex pattern for validation |

**Note:** For NUMBER fields, `minLength` and `maxLength` represent the minimum and maximum numeric values, enabling range-based filtering in search queries.

---

## Error Responses

### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": ["name should not be empty", "type must be a valid enum value"],
  "error": "Bad Request"
}
```

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Category not found",
  "error": "Not Found"
}
```

---

## Best Practices

### 1. Field Naming

- Use lowercase with underscores: `fuel_type`, `has_warranty`
- Keep names concise and descriptive
- Avoid spaces and special characters

### 2. Field Labels

- Use clear, user-friendly labels: "Vehicle Brand" instead of "brand"
- Include units where applicable: "Mileage (km)", "Price (USD)"

### 3. Required Fields

- Mark essential fields as required
- Keep optional fields for additional details
- Balance between data collection and user experience

### 4. Options Management

- Provide comprehensive but not overwhelming options
- Order options logically (alphabetically, by popularity, etc.)
- Use clear, unambiguous option labels

### 5. Validation

- Set appropriate min/max values for numbers
- Use regex patterns for formatted text (model numbers, IDs)
- Validate dates to prevent invalid entries

### 6. Sort Order

- Arrange fields in logical order
- Place important required fields first
- Group related fields together

---

## Summary

The Categories and Category Fields API provides:

✅ **Flexible categorization** - Hierarchical structure with unlimited depth
✅ **Dynamic custom fields** - 8 field types to match any data requirement
✅ **Type-safe validation** - Built-in validation rules and constraints
✅ **Easy integration** - Simple REST API with clear request/response format
✅ **Admin controls** - Full CRUD operations for category management
✅ **Public access** - Read-only public endpoints for frontend integration

This system allows your marketplace to support diverse product categories with their unique attributes while maintaining a consistent API structure.

# Change Contact Information Endpoints

This document describes the new endpoints for changing user email and phone numbers with password verification.

## Overview

The new endpoints allow users to securely change their email address or phone number by:
1. Providing their current password for verification
2. Receiving a verification token/code
3. Confirming the change with the verification token/code

## Endpoints

### 1. Request Email Change
**POST** `/users/change-email`

Request to change the user's email address. Requires password verification.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "newEmail": "newemail@example.com",
  "password": "currentPassword123"
}
```

**Response (200):**
```json
{
  "message": "Email change verification sent. Please check your new email address.",
  "success": true
}
```

**Error Responses:**
- `401`: Invalid password
- `409`: Email already in use
- `400`: Invalid email format

### 2. Request Phone Change
**POST** `/users/change-phone`

Request to change the user's phone number. Requires password verification.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "newPhone": "+1234567890",
  "password": "currentPassword123"
}
```

**Response (200):**
```json
{
  "message": "Phone change verification code sent. Please check your new phone number.",
  "success": true
}
```

**Error Responses:**
- `401`: Invalid password
- `409`: Phone number already in use
- `400`: Invalid phone format

### 3. Verify Email Change
**POST** `/users/verify-email-change`

Verify the email change using the token sent to the new email address.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "token": "abc123def456..."
}
```

**Response (200):**
```json
{
  "id": "user_id",
  "email": "newemail@example.com",
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "emailVerified": true,
  "phoneVerified": true,
  "isActive": true,
  "isVerified": true,
  "role": "USER",
  "provider": "LOCAL",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- `400`: Invalid or expired token
- `404`: User not found

### 4. Verify Phone Change
**POST** `/users/verify-phone-change`

Verify the phone change using the OTP code sent to the new phone number.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "code": "123456"
}
```

**Response (200):**
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "emailVerified": true,
  "phoneVerified": true,
  "isActive": true,
  "isVerified": true,
  "role": "USER",
  "provider": "LOCAL",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- `400`: Invalid or expired code
- `404`: User not found

## Security Features

1. **Password Verification**: Users must provide their current password before initiating any contact change
2. **Token Expiration**: 
   - Email verification tokens expire after 24 hours
   - Phone verification codes expire after 10 minutes
3. **Uniqueness Check**: The system prevents duplicate email addresses or phone numbers
4. **Secure Storage**: Verification tokens are stored securely in the database
5. **JWT Authentication**: All endpoints require valid JWT authentication

## Implementation Details

### Database Storage
The verification tokens are stored in the existing `emailVerificationToken` and `phoneVerificationToken` fields as JSON objects containing:

**Email Change Token:**
```json
{
  "token": "verification_token",
  "newEmail": "newemail@example.com",
  "type": "email_change",
  "expires": "2023-01-02T00:00:00.000Z"
}
```

**Phone Change Token:**
```json
{
  "code": "123456",
  "newPhone": "+1234567890",
  "type": "phone_change",
  "expires": "2023-01-01T00:10:00.000Z"
}
```

### Integration Points

**Email Service Integration:**
```typescript
// TODO: Integrate with your email service
// Send verification email with token to newEmail
```

**SMS Service Integration:**
```typescript
// TODO: Integrate with your SMS service
// Send verification code to newPhone
```

## Usage Flow

### Email Change Flow:
1. User calls `/users/change-email` with new email and current password
2. System verifies password and checks email availability
3. System generates verification token and stores it
4. System sends verification email to new email address (TODO: implement email service)
5. User receives email and calls `/users/verify-email-change` with token
6. System verifies token and updates user's email address

### Phone Change Flow:
1. User calls `/users/change-phone` with new phone and current password
2. System verifies password and checks phone availability
3. System generates 6-digit OTP code and stores it
4. System sends SMS with code to new phone number (TODO: implement SMS service)
5. User receives SMS and calls `/users/verify-phone-change` with code
6. System verifies code and updates user's phone number

## Error Handling

All endpoints include comprehensive error handling for:
- Invalid authentication
- Incorrect passwords
- Duplicate contact information
- Expired or invalid tokens/codes
- Malformed requests
- Database errors

## Testing

You can test these endpoints using tools like Postman or curl. Make sure to:
1. Authenticate first to get a JWT token
2. Use the token in the Authorization header
3. Provide valid email/phone formats
4. Use the correct password for the authenticated user

Example curl command:
```bash
curl -X POST http://localhost:3000/users/change-email \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "newEmail": "newemail@example.com",
    "password": "currentPassword123"
  }'

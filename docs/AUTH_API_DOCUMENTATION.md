# Authentication API Documentation

Complete documentation for the Willfinditt API authentication system, covering registration, login, verification, password management, social authentication, and session management.

## Table of Contents

1. [Overview](#overview)
2. [Base URL](#base-url)
3. [Registration](#registration)
4. [Login](#login)
5. [Email/Phone Verification](#emailphone-verification)
6. [Password Management](#password-management)
7. [Two-Factor Authentication (2FA)](#two-factor-authentication-2fa)
8. [Social Authentication](#social-authentication)
9. [Token Management](#token-management)
10. [Session Management](#session-management)
11. [Error Codes](#error-codes)
12. [Flow Diagrams](#flow-diagrams)

---

## Overview

The authentication system supports:
- **Email or Phone registration** - Users can register with either email or phone number
- **Email or Phone login** - Users can login with either email or phone number
- **Two-Factor Authentication (2FA)** - SMS-based OTP verification
- **Social Authentication** - Google and Facebook OAuth
- **Account Linking** - Link social accounts to existing local accounts
- **Session Management** - Multiple device sessions with individual logout
- **Password Security** - Account lockout, forced password change, password reset

### Authentication Flow Summary

```
┌──────────────────────────────────────────────────────────────────┐
│                        REGISTRATION                               │
│  POST /auth/register → Verification Required → Verify → Login    │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                           LOGIN                                   │
│  POST /auth/login → [2FA if enabled] → Access Token + User       │
└──────────────────────────────────────────────────────────────────┘
```

---

## Base URL

```
https://api.willfinditt.com/v1
```

All endpoints are prefixed with `/auth`.

---

## Registration

### Register New User

Creates a new user account with email or phone number.

```http
POST /auth/register
Content-Type: application/json
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Conditional | Email address (required if phone not provided) |
| `phone` | string | Conditional | Phone number with country code (required if email not provided) |
| `password` | string | Yes | Password (minimum 6 characters) |
| `firstName` | string | Yes | User's first name |
| `lastName` | string | Yes | User's last name |
| `username` | string | No | Unique username (auto-generated if not provided) |

**Example Request (Email):**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Example Request (Phone):**
```json
{
  "phone": "+233241234567",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Success Response (201 Created):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clx1234567890",
    "email": "john@example.com",
    "phone": null,
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER",
    "isVerified": false,
    "emailVerified": false,
    "phoneVerified": false
  }
}
```

**Notes:**
- A verification email/SMS is sent automatically
- Users receive tokens immediately but should verify their email/phone
- If a user with unverified email/phone tries to re-register, verification is resent

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | BAD_REQUEST | Validation failed |
| 409 | CONFLICT | User already exists |

---

## Login

### Login with Email/Phone

Authenticates a user with email or phone number and password.

```http
POST /auth/login
Content-Type: application/json
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Conditional | Email (required if phone not provided) |
| `phone` | string | Conditional | Phone number (required if email not provided) |
| `password` | string | Yes | User's password |

**Example Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Success Response (200 OK) - Standard Login:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clx1234567890",
    "email": "john@example.com",
    "phone": "+233241234567",
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER",
    "isVerified": true,
    "emailVerified": true,
    "phoneVerified": true,
    "twoFactorEnabled": false,
    "forcePasswordChange": false
  }
}
```

**Response - 2FA Required:**
```json
{
  "requires2FA": true,
  "message": "Please enter the verification code sent to your phone",
  "userId": "clx1234567890",
  "phone": "***4567"
}
```

**Response - Password Change Required:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "",
  "requirePasswordChange": true,
  "message": "You must change your password before accessing your account.",
  "user": {
    "id": "clx1234567890",
    "email": "john@example.com",
    "username": "johndoe"
  }
}
```

**Response - Verification Required:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "requiresVerification": true,
  "message": "Please verify your email address to access all features.",
  "user": {
    "id": "clx1234567890",
    "email": "john@example.com",
    "emailVerified": false
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Invalid credentials |
| 401 | UNAUTHORIZED | Account is locked (with remaining time) |
| 401 | UNAUTHORIZED | Account is deactivated |

### Account Lockout

After **10 failed login attempts**, the account is locked for **15 minutes**. Users receive an email notification when their account is locked.

---

## Email/Phone Verification

### Verify Email

Verifies user's email address using the token sent via email.

```http
POST /auth/verify-email
Content-Type: application/json
```

**Request Body:**
```json
{
  "token": "a1b2c3d4e5f6..."
}
```

**Success Response (200 OK):**
```json
{
  "message": "Email verified successfully"
}
```

### Verify Phone

Verifies user's phone number using the OTP code sent via SMS.

```http
POST /auth/verify-phone
Content-Type: application/json
```

**Request Body:**
```json
{
  "phone": "+233241234567",
  "token": "123456"
}
```

**Success Response (200 OK):**
```json
{
  "message": "Phone verified successfully"
}
```

### Resend Verification

Resends verification email or SMS.

```http
POST /auth/resend-verification
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

or

```json
{
  "phone": "+233241234567"
}
```

**Success Response (200 OK):**
```json
{
  "message": "Verification code sent"
}
```

---

## Password Management

### Change Password (Authenticated)

Changes password for logged-in users.

```http
POST /auth/change-password
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewSecurePass456"
}
```

**Success Response (200 OK):**
```json
{
  "message": "Password changed successfully"
}
```

### Forgot Password

Initiates password reset flow via email or phone.

```http
POST /auth/forgot-password
Content-Type: application/json
```

**Request Body (Email):**
```json
{
  "email": "john@example.com"
}
```

**Request Body (Phone):**
```json
{
  "phone": "+233241234567"
}
```

**Success Response (200 OK):**
```json
{
  "message": "If the account exists, you will receive reset instructions"
}
```

**Notes:**
- Email reset: User receives a link with a token (valid for 1 hour)
- Phone reset: User receives a 6-digit OTP (valid for 10 minutes)

### Reset Password (Email Flow)

Resets password using the token from email.

```http
POST /auth/reset-password
Content-Type: application/json
```

**Request Body:**
```json
{
  "token": "a1b2c3d4e5f6...",
  "newPassword": "NewSecurePass456"
}
```

**Success Response (200 OK):**
```json
{
  "message": "Password reset successfully"
}
```

### Verify Phone OTP for Reset

Verifies the OTP sent to phone before password reset.

```http
POST /auth/verify-reset-phone-otp
Content-Type: application/json
```

**Request Body:**
```json
{
  "phone": "+233241234567",
  "otp": "123456"
}
```

**Success Response (200 OK):**
```json
{
  "message": "OTP verified successfully. You can now reset your password.",
  "verified": true
}
```

### Reset Password (Phone Flow)

Resets password using phone OTP.

```http
POST /auth/reset-password-phone
Content-Type: application/json
```

**Request Body:**
```json
{
  "phone": "+233241234567",
  "otp": "123456",
  "newPassword": "NewSecurePass456"
}
```

**Success Response (200 OK):**
```json
{
  "message": "Password reset successfully"
}
```

---

## Two-Factor Authentication (2FA)

### How 2FA Works

1. User enables 2FA on their account
2. On login, after password verification, an OTP is sent via SMS
3. User enters OTP to complete login

### Verify 2FA OTP (During Login)

Completes login by verifying the OTP sent via SMS.

```http
POST /auth/verify-2fa-otp
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "clx1234567890",
  "otpCode": "123456"
}
```

**Success Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clx1234567890",
    "email": "john@example.com",
    "username": "johndoe",
    "twoFactorEnabled": true
  }
}
```

**Notes:**
- OTP is valid for 10 minutes
- A new OTP is generated for each login attempt

---

## Social Authentication

### Supported Providers

- **Google** - OAuth 2.0
- **Facebook** - OAuth 2.0

### Social Auth (Token-based)

Authenticates using an access token from a social provider.

```http
POST /auth/social-auth
Content-Type: application/json
```

**Request Body:**
```json
{
  "accessToken": "ya29.a0AfH6SMC...",
  "provider": "GOOGLE"
}
```

**Success Response (200 OK) - New User or Existing Social User:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clx1234567890",
    "email": "john@gmail.com",
    "username": "john",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER",
    "isVerified": true
  }
}
```

**Response - Account Linking Required:**

When a user tries to login with a social provider but already has a local account with the same email:

```json
{
  "access_token": "",
  "user": {},
  "requiresConfirmation": true,
  "message": "Account linking confirmation sent to your email"
}
```

### Link Social Account

Confirms linking a social account to an existing local account.

```http
POST /auth/link-social-account
Content-Type: application/json
```

**Request Body:**
```json
{
  "token": "abc123def456..."
}
```

**Success Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clx1234567890",
    "email": "john@example.com"
  }
}
```

### Unlink Social Account

Removes a linked social provider from the account.

```http
POST /auth/unlink-social-account
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "provider": "GOOGLE"
}
```

**Success Response (200 OK):**
```json
{
  "message": "GOOGLE account unlinked successfully"
}
```

### OAuth Web Flows

For web applications, these endpoints initiate OAuth redirects:

```http
GET /auth/google          # Redirects to Google OAuth
GET /auth/google/callback # Google OAuth callback

GET /auth/facebook          # Redirects to Facebook OAuth
GET /auth/facebook/callback # Facebook OAuth callback
```

---

## Token Management

### Get User Profile

Returns the authenticated user's profile.

```http
GET /auth/profile
Authorization: Bearer <access_token>
```

**Success Response (200 OK):**
```json
{
  "id": "clx1234567890",
  "email": "john@example.com",
  "phone": "+233241234567",
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "avatar": "https://example.com/avatar.jpg",
  "role": "USER",
  "isActive": true,
  "isVerified": true,
  "emailVerified": true,
  "phoneVerified": true,
  "twoFactorEnabled": false,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-15T00:00:00.000Z"
}
```

### Refresh Access Token

Generates a new access token using a refresh token.

```http
POST /auth/refresh
Authorization: Bearer <refresh_token>
```

**Success Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Token Expiration:**
- Access Token: 1 hour (configurable)
- Refresh Token: 90 days (configurable)

---

## Session Management

### Logout (Current Device)

Logs out from the current device only.

```http
POST /auth/logout
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body (optional):**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

### Logout (All Devices)

Logs out from all devices and revokes all sessions.

```http
POST /auth/logout-all
Authorization: Bearer <access_token>
```

**Success Response (200 OK):**
```json
{
  "message": "Logged out from all devices successfully"
}
```

### Get Active Sessions

Returns all active sessions for the user.

```http
GET /auth/sessions
Authorization: Bearer <access_token>
```

**Success Response (200 OK):**
```json
[
  {
    "id": "session_123",
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "lastActivityAt": "2024-01-15T12:00:00.000Z",
    "isCurrentSession": true
  },
  {
    "id": "session_456",
    "ipAddress": "10.0.0.1",
    "userAgent": "Mobile App/1.0",
    "createdAt": "2024-01-14T08:00:00.000Z",
    "lastActivityAt": "2024-01-14T18:00:00.000Z",
    "isCurrentSession": false
  }
]
```

### Revoke Specific Session

Revokes a specific session by ID.

```http
DELETE /auth/sessions/:sessionId
Authorization: Bearer <access_token>
```

**Success Response (200 OK):**
```json
{
  "message": "Session revoked successfully"
}
```

---

## Error Codes

### HTTP Status Codes

| Status | Description |
|--------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Validation error |
| 401 | Unauthorized - Invalid credentials or token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 429 | Too Many Requests - Rate limited |

### Error Response Format

```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

### Common Error Messages

| Error | Description |
|-------|-------------|
| `Invalid credentials` | Wrong email/phone or password |
| `Account is locked` | Too many failed login attempts |
| `Account is deactivated` | Account has been disabled |
| `User with this email already exists` | Email is already registered |
| `User with this phone number already exists` | Phone is already registered |
| `Invalid verification token` | Verification link expired or invalid |
| `Invalid or expired reset token` | Password reset link expired |
| `Either email or phone number must be provided` | Missing required field |

---

## Flow Diagrams

### Registration Flow

```
┌─────────────────┐
│   User Input    │
│ (email/phone,   │
│  password, name)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  Check if user  │────▶│  User exists?   │
│     exists      │     │  (verified)     │
└────────┬────────┘     └────────┬────────┘
         │                       │
         │ No                    │ Yes
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│  Create User    │     │  Return Error   │
│  Generate Token │     │  409 Conflict   │
└────────┬────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│ Send Verify     │
│ Email/SMS       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Return Tokens   │
│ + User Info     │
└─────────────────┘
```

### Login Flow

```
┌─────────────────┐
│   User Input    │
│ (email/phone,   │
│   password)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  Find User      │────▶│  Account Locked?│
└────────┬────────┘     └────────┬────────┘
         │                       │
         │ No                    │ Yes
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│ Validate        │     │  Return Error   │
│ Password        │     │  + Lock Time    │
└────────┬────────┘     └─────────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
  Valid    Invalid
    │         │
    │         ▼
    │    ┌─────────────────┐
    │    │ Increment Failed│
    │    │ Attempts        │
    │    └────────┬────────┘
    │             │
    │             ▼
    │    ┌─────────────────┐
    │    │ Lock if >= 10   │
    │    └────────┬────────┘
    │             │
    │             ▼
    │    ┌─────────────────┐
    │    │  Return Error   │
    │    │  401            │
    │    └─────────────────┘
    │
    ▼
┌─────────────────┐
│  2FA Enabled?   │
└────────┬────────┘
    ┌────┴────┐
    │         │
    ▼         ▼
   Yes        No
    │         │
    ▼         │
┌─────────────────┐     │
│ Send OTP via    │     │
│ SMS             │     │
└────────┬────────┘     │
         │              │
         ▼              │
┌─────────────────┐     │
│ Return          │     │
│ requires2FA     │     │
│ + userId        │     │
└─────────────────┘     │
                        │
         ┌──────────────┘
         ▼
┌─────────────────┐
│ Generate Tokens │
│ Create Session  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Return Tokens   │
│ + User Info     │
└─────────────────┘
```

### Password Reset Flow (Email)

```
┌─────────────────┐
│ Forgot Password │
│ (email)         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Generate Token  │
│ (valid 1 hour)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Send Reset      │
│ Email           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ User Clicks     │
│ Link            │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ POST /reset-    │
│ password        │
│ (token, newPwd) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Update Password │
│ Clear Token     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Send Confirm    │
│ Email           │
└─────────────────┘
```

### Password Reset Flow (Phone)

```
┌─────────────────┐
│ Forgot Password │
│ (phone)         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Generate OTP    │
│ (valid 10 min)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Send OTP via    │
│ SMS             │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ POST /verify-   │
│ reset-phone-otp │
│ (phone, otp)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ POST /reset-    │
│ password-phone  │
│ (phone, otp,    │
│  newPassword)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Update Password │
│ Clear OTP       │
└─────────────────┘
```

---

## Best Practices

### Security Recommendations

1. **Store tokens securely** - Use secure, httpOnly cookies for web or secure storage for mobile
2. **Implement token refresh** - Refresh access tokens before they expire
3. **Handle 2FA properly** - Never store the userId in client-side storage
4. **Validate on logout** - Always call logout endpoint to invalidate server-side sessions

### Rate Limiting

The API implements rate limiting on authentication endpoints:
- Login: 10 requests per minute
- Register: 5 requests per minute
- Forgot Password: 3 requests per minute

### Frontend Implementation Tips

```javascript
// Example: Login with 2FA handling
async function login(email, password) {
  const response = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  if (data.requires2FA) {
    // Show OTP input modal
    return { type: '2FA_REQUIRED', userId: data.userId, phone: data.phone };
  }
  
  if (data.requirePasswordChange) {
    // Redirect to password change page
    return { type: 'PASSWORD_CHANGE_REQUIRED', token: data.access_token };
  }
  
  if (data.requiresVerification) {
    // Show verification reminder
    return { type: 'VERIFICATION_REQUIRED', ...data };
  }
  
  // Success - store tokens
  return { type: 'SUCCESS', ...data };
}
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01-01 | Initial release |
| 1.1.0 | 2024-03-15 | Added phone-based password reset |
| 1.2.0 | 2024-06-01 | Added session management |
| 1.3.0 | 2025-01-01 | Added social account linking |

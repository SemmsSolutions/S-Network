# S-Network — Vendor Verification System
## GST + MSME Document Verification with Verified Badge
**Version:** 1.0 | Exclusive Organization Platform

---

## 1. Overview

S-Network is an exclusive platform for a selected group of vendors from a specific organization.
Every vendor who joins can optionally submit GST and MSME documents to earn a **Verified Badge**.

- Vendors WITHOUT documents: can still list their business, receive leads, use all features
- Vendors WITH verified documents: get a prominent **✓ Verified** badge on their profile and in search results
- Badge gives higher trust signal to users and better ranking in search

This is NOT a hard gate — it is an incentive-based trust system, same as Justdial's verified listing model.

---

## 2. Verification States (Exactly Like Justdial)

| State | Badge Shown | Search Ranking | Description |
|---|---|---|---|
| `unverified` | None | Standard | New vendor, no documents submitted |
| `pending` | 🕐 Pending | Standard | Documents submitted, admin reviewing |
| `verified` | ✅ Verified | Boosted | Documents approved by admin |
| `rejected` | ❌ (private) | Standard | Documents rejected, can resubmit |

---

## 3. Complete Vendor Verification Flow

### 3.1 During Registration / Onboarding
```
Vendor registers → fills basic profile → reaches "Verification" step

Step shows:
┌─────────────────────────────────────────────────────┐
│  Get Verified on S-Network                          │
│                                                     │
│  Verified vendors get:                              │
│  ✅ Verified badge on your profile                  │
│  📈 Higher ranking in search results                │
│  🔒 More trust from customers                       │
│                                                     │
│  [Upload Documents Now]    [Skip for Now]           │
└─────────────────────────────────────────────────────┘
```

If vendor clicks "Skip for Now" → account created, profile active, NO badge.
If vendor clicks "Upload Documents" → goes to document upload flow.

### 3.2 Document Upload Flow
```
Two documents accepted:

1. GST Certificate
   - GST Registration Number (text field, validated format: 15 chars)
   - Upload GST Certificate PDF or image
   - Optional: GST Filing Status (for extra trust)

2. MSME / Udyam Certificate
   - Udyam Registration Number (text field, format: UDYAM-XX-00-0000000)
   - Upload Udyam Certificate PDF or image

Vendor can submit EITHER one or BOTH documents.
Submitting at least one triggers the verification review.
```

### 3.3 After Submission
```
Vendor sees:
"Your documents have been submitted for review.
Our team will verify them within 2–3 business days.
You will be notified once verification is complete."

Status in vendor dashboard: 🕐 Verification Pending
```

### 3.4 Admin Review
```
Admin sees in panel:
- All pending verifications list
- Vendor name, business name, submitted date
- View uploaded documents (GST PDF / MSME PDF)
- GST number + MSME number (manually cross-check)

Admin actions:
  [✅ Approve] → vendor gets Verified badge + notification
  [❌ Reject]  → admin types rejection reason → vendor notified with reason
```

### 3.5 After Admin Decision

**If Approved:**
```
Vendor notification: "🎉 Congratulations! Your business is now Verified on S-Network.
Your profile will now show the Verified badge and rank higher in searches."

businesses.verification_status = 'verified'
businesses.verified_at = now()
businesses.is_verified = true
```

**If Rejected:**
```
Vendor notification: "Your verification was not approved.
Reason: [admin's reason e.g. 'GST number does not match certificate']
You can resubmit corrected documents from your Profile Settings."

businesses.verification_status = 'rejected'
businesses.verification_rejection_reason = 'admin reason'
```

### 3.6 Resubmission (from Profile Settings)
```
Vendor goes to Profile Settings → "Verification" tab
Sees current status + rejection reason
Can upload new/corrected documents and resubmit
Status resets to 'pending' on resubmission
Admin reviews again
```

---

## 4. Database Schema

```sql
-- Add to businesses table
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS verification_status text
  DEFAULT 'unverified'
  CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected'));

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS verified_at timestamp;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS verification_rejection_reason text;

-- Verification documents table
CREATE TABLE IF NOT EXISTS vendor_verifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,

  -- GST
  gst_number text,
  gst_certificate_url text,

  -- MSME / Udyam
  msme_number text,
  msme_certificate_url text,

  -- Status tracking
  status text DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),

  submitted_at timestamp DEFAULT now(),
  reviewed_at timestamp,
  reviewed_by uuid REFERENCES profiles(id),
  rejection_reason text,

  -- Resubmission tracking
  submission_count int DEFAULT 1,

  UNIQUE(business_id)  -- one active verification record per business
);

-- Indexes
CREATE INDEX idx_verifications_status ON vendor_verifications(status);
CREATE INDEX idx_verifications_business ON vendor_verifications(business_id);

-- RLS
ALTER TABLE vendor_verifications ENABLE ROW LEVEL SECURITY;

-- Vendor can view their own verification record
CREATE POLICY "Vendor views own verification"
  ON vendor_verifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = vendor_verifications.business_id
      AND b.owner_id = auth.uid()
    )
  );

-- Vendor can insert their own verification
CREATE POLICY "Vendor submits verification"
  ON vendor_verifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = vendor_verifications.business_id
      AND b.owner_id = auth.uid()
    )
  );

-- Vendor can update their own verification (for resubmission)
CREATE POLICY "Vendor resubmits verification"
  ON vendor_verifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = vendor_verifications.business_id
      AND b.owner_id = auth.uid()
    )
  );

-- Admin can do everything
CREATE POLICY "Admin manages all verifications"
  ON vendor_verifications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );
```

---

## 5. Storage Structure

```
s-network-media/
  verifications/
    {businessId}/
      gst-certificate.pdf   (or .jpg/.png)
      msme-certificate.pdf  (or .jpg/.png)
```

**Storage Policy:**
- Vendor can upload to their own business folder
- Public read: BLOCKED (documents are private — admin only)
- Admin can read all files

---

## 6. Edge Functions Required

### 6.1 submit-verification
```
POST /submit-verification
Auth: Required (vendor)
Body: { business_id, gst_number?, gst_certificate_url?, msme_number?, msme_certificate_url? }

Logic:
1. Verify caller owns this business
2. Validate: at least one of (gst_number + url) OR (msme_number + url) must be present
3. Validate GST format: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
4. Validate MSME/Udyam format: /^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$/
5. UPSERT into vendor_verifications (handle resubmission)
6. If resubmission: increment submission_count, reset status to 'pending'
7. UPDATE businesses SET verification_status = 'pending'
8. Create notification for admin: "New verification request from [business name]"
9. Return: { success: true, status: 'pending' }
```

### 6.2 review-verification (admin only)
```
POST /review-verification
Auth: Required (admin role only)
Body: { verification_id, action: 'approve' | 'reject', rejection_reason? }

Logic:
1. Verify caller has role = 'admin' in profiles table
2. If action = 'approve':
   - UPDATE vendor_verifications SET status='approved', reviewed_at=now(), reviewed_by=admin_id
   - UPDATE businesses SET verification_status='verified', is_verified=true, verified_at=now()
   - Create notification for vendor: "Your business is now Verified on S-Network! 🎉"
3. If action = 'reject':
   - rejection_reason is REQUIRED — return 400 if missing
   - UPDATE vendor_verifications SET status='rejected', rejection_reason=reason, reviewed_at=now()
   - UPDATE businesses SET verification_status='rejected', verification_rejection_reason=reason
   - Create notification for vendor with rejection reason
4. Return: { success: true }
```

---

## 7. Angular Web UI

### 7.1 Vendor Onboarding — Verification Step
- Step 5 of onboarding wizard (after portfolio upload)
- Shows benefits of verification
- "Upload Now" / "Skip, do it later" options
- If "Upload Now": shows two sections (GST + MSME) with text input + file upload per section
- File upload: drag-and-drop + click to browse, accepts PDF/JPG/PNG, max 5MB
- Submit button disabled until at least one document pair is complete
- After submit: shows success screen "Documents submitted for review"

### 7.2 Profile Settings → Verification Tab
- Shows current verification status with icon:
  - Unverified: grey badge, CTA "Get Verified"
  - Pending: orange clock, "Under Review — 2-3 business days"
  - Verified: green checkmark, "Verified since [date]"
  - Rejected: red X + rejection reason + "Resubmit Documents" button
- Document upload form (same as onboarding step)
- On resubmit: calls submit-verification function again

### 7.3 Business Profile Page (Public)
- In the header section, next to business name:
  - Verified: green pill badge "✓ Verified" with tooltip "GST/MSME Verified by S-Network"
  - Pending/Unverified: no badge shown (do not show pending state to public)
- In trust signals row: "Verified Business" with shield icon

### 7.4 Search Results Card
- Show green "✓ Verified" chip on card if is_verified = true
- Verified businesses appear before unverified in results (search function already handles this)

### 7.5 Admin Panel — Verifications Section
- Route: /admin/verifications
- Tabs: Pending | Approved | Rejected | All
- Table columns: Business Name, Vendor Name, Phone, GST No, MSME No, Submitted Date, Submission Count
- Row click → Verification Detail Modal:
  - Business info
  - Document viewer (PDF embedded or image shown in modal)
  - GST number with "Copy" button
  - MSME number with "Copy" button
  - Note: "Cross-check numbers at gstn.gov.in and udyamregistration.gov.in"
  - [Approve] and [Reject with Reason] buttons
- Reject modal: textarea for reason (required), submit button

---

## 8. Flutter Mobile UI

### 8.1 Vendor Onboarding — Verification Step
- Same flow as web, adapted for mobile
- File upload: image_picker + file_picker packages (PDF support)
- Upload progress indicator
- "Skip for Now" / "Verify Now" bottom action buttons

### 8.2 Profile Screen → Verification Card
- Prominent card in vendor profile showing verification status
- Tap card → opens VerificationScreen

### 8.3 VerificationScreen
- Current status display
- Upload form (GST + MSME sections)
- FilePicker for document upload
- Submit button

### 8.4 BusinessProfileScreen
- Verified badge next to business name (same as web)
- Shield icon in trust row

### 8.5 Notifications
- "Your verification was approved" → taps to vendor dashboard
- "Verification rejected: [reason]" → taps to VerificationScreen to resubmit

---

## 9. Verification Badge Design

```
Verified Badge (web + mobile consistent):

┌──────────────────┐
│  ✓  Verified     │  → Green background (#2ECC71), white text
│  GST/MSME        │  → Small subtext below
└──────────────────┘

Compact version (on cards):
[ ✓ Verified ]  → small green pill chip

Tooltip on hover (web):
"This business has been verified with GST/MSME documents by S-Network"
```

---

## 10. Validation Rules

### GST Number
- Format: 15 characters
- Regex: `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$`
- Example: `29ABCDE1234F1Z5`
- Validate on frontend AND in edge function

### MSME / Udyam Number
- Format: UDYAM-XX-00-0000000
- Regex: `^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$`
- Example: `UDYAM-TN-01-0012345`
- Validate on frontend AND in edge function

---

## 11. Admin Cross-Check Resources (shown in admin panel)
- GST verification: https://www.gstn.gov.in
- Udyam verification: https://udyamregistration.gov.in
- These links open in new tab from admin verification detail view

---

## 12. Notification Messages

| Event | Vendor Notification | Admin Notification |
|---|---|---|
| Verification submitted | "Documents submitted. Review in 2–3 days." | "New verification: [Business Name]" |
| Approved | "🎉 Your business is now Verified on S-Network!" | — |
| Rejected | "Verification not approved: [reason]. Resubmit from Profile Settings." | — |
| Resubmitted | "New documents submitted for review." | "Resubmission from [Business Name] (attempt #N)" |

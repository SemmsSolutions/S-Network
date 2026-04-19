# BuildConnect Manual QA Checklist

## 1. Unified Authentication (Web & Mobile)
- [ ] **Email Registration:** User and Vendor roles can register. Profiles are auto-created.
- [ ] **Google OAuth Registration/Login:** Works correctly. If profile exists, logs in. If no profile, prompts for Role Selection.
- [ ] **Phone OTP Login:** OTP is sent and verified correctly.

## 2. Material Categories (Vendor Side)
- [ ] **Vendor Profile Editor:** Materials & Products tab displays 7 groups with checkboxes.
- [ ] **Selection & Saving:** Vendor can select materials, enter custom text, and save.
- [ ] **Persistence:** Reloading the editor preserves checked materials.

## 3. Material Categories (User Side)
- [ ] **Business Profile:** Selected materials are categorized and displayed on the public profile.
- [ ] **Search Results:** "Materials" dropdown correctly filters businesses offering that material.

## 4. Build & Deployment Readiness
- [ ] **iOS Build (Codemagic):** Configuration file (`codemagic.yaml`) exists.
- [ ] **Deep Links:** Settings for `io.snetwork.app://login-callback` are present in both `AndroidManifest.xml` and `Info.plist`.

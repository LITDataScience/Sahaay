# Android Build And Release Guide

This project supports two Android release paths:

- local native release builds for validation on this Windows machine
- EAS cloud builds for staging and production delivery

The same upload keystore should be used for both paths. Do not store keystores, passwords, or `credentials.json` in the repo.

## Profiles

- `development`: local dev client, demo auth allowed
- `preview`: internal APK for PR validation, demo auth disabled
- `staging`: internal APK for Android staging validation, demo auth disabled
- `production`: store-ready Android App Bundle, demo auth disabled

## Prerequisites

1. Install Node.js, pnpm, Java 17, and the Android SDK.
2. Install the Expo/EAS CLI:

   ```powershell
   npm install -g eas-cli
   ```

3. Work from the `frontend` directory:

   ```powershell
   cd frontend
   ```

4. Log into the Expo account that owns the `shivshaktidhaam/sahaay` project:

   ```powershell
   eas login
   ```

## Local Android Release Signing

Local signed release builds are read from user-level Gradle properties, not from committed files.

Create or update:

`%USERPROFILE%\.gradle\gradle.properties`

Example:

```properties
SAHAAY_UPLOAD_STORE_FILE=C:/Users/<you>/.android/sahaay-upload.jks
SAHAAY_UPLOAD_STORE_PASSWORD=<strong-password>
SAHAAY_UPLOAD_KEY_ALIAS=upload
SAHAAY_UPLOAD_KEY_PASSWORD=<strong-password>
```

Notes:

- Use forward slashes in the keystore path on Windows.
- Keep the keystore itself outside the repo, for example in `%USERPROFILE%\.android\`.
- The same upload key should also be uploaded to Expo/EAS remote credentials and linked to Play App Signing.

## Local Signed Android Build

From `frontend`:

```powershell
cd android
.\gradlew.bat bundleRelease
```

If signing credentials are configured correctly, this produces a signed release bundle using the user-level Gradle properties above.

## EAS Staging Build

Use this for the stakeholder Phase 1 validation flow:

```powershell
cd frontend
eas build --platform android --profile staging
```

This generates an internal APK with:

- demo auth disabled
- staging app environment markers
- Android App Check provider set to `debug`
- secure startup blocking disabled for internal QA builds
- Expo remote credentials for signing

Backend expectation for internal testing:

- Firebase Functions `APP_CHECK_ENFORCEMENT` should stay `optional` for `preview` and `staging` APK QA.
- Do not turn on strict Play Integrity enforcement for sideloaded internal builds. It is a production/store gate, not an EAS-internal APK gate.

## Firebase Phone OTP Checklist

If `signInWithPhoneNumber()` fails on a physical Android staging build with `CONFIGURATION_NOT_FOUND`, the problem is in Firebase project setup, not in the React Native call site.

Verify all of these in the Firebase project used by `frontend/google-services.json`:

1. Open `Authentication` and click `Get started` if the product was never initialized.
2. In `Authentication > Sign-in method`, enable `Phone`.
3. In `Project settings > Your apps > Android`, confirm the app package is `com.shivshakti.sahaay`.
4. Add the release signing fingerprints used by the built APK:

   ```powershell
   cd frontend
   .\scripts\print-apk-signature.ps1 .\staging.apk
   ```

5. Copy both the `SHA-1` and `SHA-256` certificate digests into the Firebase Android app settings.
6. Download a fresh `google-services.json` after updating Android app settings and keep it at `frontend/google-services.json`.

## Phase 1 Staging Smoke Path

Use two real staging users:

- `publisher`: approved user who can publish listings
- `borrower`: approved user who can discover and book listings

Recommended sequence:

1. Install the staging APK on a physical Android device.
2. Sign in as the publisher with real phone OTP.
3. Allow location access.
4. Create and publish one verified listing end-to-end.
5. Clean-install the staging APK or use a second device.
6. Sign in as the borrower with real phone OTP.
7. Allow location access.
8. Search for the publisher listing and open the item detail screen.
9. Start a protected booking and confirm the backend-created booking ID path.

The repo smoke asset for the borrower side lives in:

- `e2e/maestro/happy_path.yaml`

Run it with environment variables:

```powershell
maestro test e2e/maestro/happy_path.yaml `
  -e BORROWER_PHONE=9876543210 `
  -e BORROWER_OTP=123456 `
  -e LISTING_QUERY="Bosch Hammer Drill"
```

Notes:

- Use a clean install so local listing fallbacks do not hide backend failures.
- Do not use `debug_build.ps1` as the staging validation path. That script is for local emulator/dev-client iteration.
- Staging validation must use real Firebase Auth and real signing fingerprints.
- For sideloaded `preview` and `staging` APKs, keep backend App Check enforcement optional unless you have explicitly provisioned a Firebase debug token path for internal QA.

## Production App Check Switch

Before shipping the Play build, move Android App Check back to strict mode:

1. Deploy Firebase Functions with `APP_CHECK_ENFORCEMENT=required`.
2. Build the Android production profile so the app uses `playIntegrity`.
3. Verify the Play signing fingerprints and Play Integrity linkage in Firebase before store rollout.

## EAS Production Build

Use this only when you are intentionally creating a store-ready artifact:

```powershell
cd frontend
eas build --platform android --profile production
```

Production builds generate an Android App Bundle (`.aab`) and should only run from a controlled/manual release step.

## CI/CD Behavior

- Pull requests build the `preview` profile.
- Pushes to `main` build the `staging` profile.
- Production builds run manually via GitHub Actions `workflow_dispatch`.

This prevents routine merges from consuming production build numbers or producing store-intended artifacts.

## Secrets And Files That Must Stay Out Of Git

Never commit:

- `frontend/credentials.json`
- `frontend/android/key.properties`
- any `*.jks` or `*.keystore`
- local Gradle signing passwords
- stale EAS build artifacts like `frontend/build.json`

## Common Questions

**Q: Can Firebase build the Android app?**  
A: No. Firebase provides backend services. EAS or local Gradle builds compile the mobile binary.

**Q: Can I still build an APK for internal testing?**  
A: Yes. Use `eas build --platform android --profile staging` or `preview`.

**Q: Do I need Android Studio?**  
A: Not for EAS cloud builds. You only need a local JDK/SDK if you want to produce native Android builds on this machine.

# How to Build Your App (No Android Studio Needed!)

You don't need a powerful computer or Android Studio to build this app. We use **Expo Application Services (EAS)** to build it in the cloud.

## Prerequisites

1. **Create an Expo Account**: Go to [expo.dev](https://expo.dev/signup) and sign up (it's free).
2. **Install EAS CLI**: Open your terminal (PowerShell) and run:

    ```powershell
    npm install -g eas-cli
    ```

3. **Open Terminal in Frontend Folder**:
    It is crucial to run these commands inside the `frontend` folder, not the root folder.

    ```powershell
    cd frontend
    ```

4. **Login**:

    ```powershell
    eas login
    ```

## Building the Android App (APK)

To generate an APK file that you can install on your phone:

1. Navigate to the `frontend` folder:

    ```powershell
    cd frontend
    ```

2. Run the build command:

    ```powershell
    eas build --platform android --profile preview
    ```

3. **Follow the prompts**:
    - It will ask to generate a Keystore -> Say **Yes** (Y).
    - It will upload your code to Expo's servers.

4. **Wait**: The build takes about 10-15 minutes in the cloud.
5. **Download**: When finished, it will give you a link to download the `.apk` file.
6. **Install**: Transfer the file to your Android phone and install it!

## Common Questions

**Q: Can Firebase build my app?**
A: No, Firebase *distributes* apps (like sending a test version to friends), but it doesn't *compile* the code. EAS Build compiles the code for you.

**Q: Is this free?**
A: Yes, the free tier of Expo allows plenty of builds for a startup.

**Q: What about iOS?**
A: You can build for iOS too using `eas build --platform ios`, but you need an Apple Developer Account ($99/year). For now, stick to Android to test your idea.

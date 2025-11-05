Here are the instructions to set up the Firebase backend for the optional cloud sync. The app is already configured to work with this, but you need to create the project in your own Google account.

This will be **100% free** for this app's usage.

### Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/).

2. Click **"Add project"** and give it a name (e.g., "Toku-Hauora-App").

3. You can **disable** "Enable Google Analytics for this project" (we don't need it).

4. Click **"Create project"**.

### Step 2: Register Your Web App

1. Once your project loads, click the **Web icon** (it looks like `</>`) to add a web app.

2. Give it a nickname (e.g., "Toku Hauora Web").

3. **DO NOT** check the box for "Firebase Hosting".

4. Click **"Register app"**.

5. Firebase will show you a `firebaseConfig` object. You **do not** need to copy this. The app is set up to get this from the environment it runs in. Just click **"Continue to console"**.

### Step 3: Enable Authentication

This allows users to create accounts to sync their data.

1. In the left-hand menu, go to **Build > Authentication**.

2. Click **"Get started"**.

3. On the **"Sign-in method"** tab, you need to enable providers:

   * Click **"Google"** -> click the **"Enable"** toggle -> select a "Project support email" -> click **"Save"**.

   * Click **"Email/Password"** -> click the **"Enable"** toggle -> click **"Save"**.

4. That's it. Authentication is now enabled.

### Step 4: Enable Firestore (The Database)

This is where the encrypted data will be stored.

1. In the left-hand menu, go to **Build > Firestore Database**.

2. Click **"Create database"**.

3. Choose **"Start in production mode"**. This is important for security.

4. Choose a location for your database (e.g., `australia-southeast1` or the one closest to you).

5. Click **"Enable"**.

### Step 5: Set Up Security Rules (CRITICAL)

This is the most important step to ensure user data is private.

1. In the Firestore Database section, click the **"Rules"** tab.

2. You will see some default rules. **Delete all of them.**

3. **Copy and paste** the following rules into the editor:

rules_version = '2'; service cloud.firestore { match /databases/{database}/documents {

// This rule allows a user to read and write their *own* 'meta' document.
// This document stores their PIN salt and encrypted master key.
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}

// This rule allows a user to read, write, and delete data 
// *only* within their own private 'data' collection.
// Another user (e.g., /users/otherUser/...) cannot access this data.
match /users/{userId}/data/{collection}/{docId} {
  allow read, write, create, delete: if request.auth != null && request.auth.uid == userId;
}
} }


4. Click the **"Publish"** button.

Your backend is now fully configured and secure. The Tōku Hauora app will now be able to use these services for authentication and encrypted data sync.

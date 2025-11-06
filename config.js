// ------------------------------------------------------------------
// PASTE YOUR FIREBASE CONFIGURATION HERE
// ------------------------------------------------------------------
// 1. Go to your Firebase project console.
// 2. Click the "Settings" gear icon -> "Project settings".
// 3. In the "General" tab, scroll down to "Your apps".
// 4. Click on your web app (e.g., "Toku Hauora Web").
// 5. Select "Config" from the SDK setup and configuration.
// 6. Copy the entire 'firebaseConfig' object and paste it below.
// ------------------------------------------------------------------

// IMPORTANT: Make this const, not var, to prevent it from being changed.
const firebaseConfig = {
  apiKey: "AIzaSyA7delxnLZYvTLYP16reHLOX46M5keK68Y",
  authDomain: "toku-hauora-app.firebaseapp.com",
  projectId: "toku-hauora-app",
  storageBucket: "toku-hauora-app.firebasestorage.app",
  messagingSenderId: "326563349615",
  appId: "1:326563349615:web:f61e256c97d060a45df99a"
};

// This makes the config available to the main app script.
// We check for this in TokuHauora index.html
window.firebaseConfig = firebaseConfig;

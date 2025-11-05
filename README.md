Programme Specifications: Tōku Hauora (v2.0)

(Detailed Blueprint for Reconstruction)

1. Project Summary

Tōku Hauora is a private, secure, offline-first Progressive Web App (PWA) designed for personal wellbeing reflection.

The app's primary function is to provide a trusted, private space for users to complete regular, structured check-ins related to their hauora (wellbeing).

1.1. Target Audience

Clergy, ministers, or individuals in high-stress helping professions who need a completely private (zero-knowledge) tool for self-reflection and trend-spotting in their wellbeing.

1.2. Core Philosophy

The app's architecture is built on Trust through Privacy. The technical foundation (client-side encryption) is the primary "feature" that enables honest self-reflection.

Zero-Knowledge: The user's data is unreadable by anyone but them, including the app's creators or server hosts.

Local-First: The app must be 100% functional offline. The local device is the primary source of truth.

Optional Sync: Cloud backup is a user-opt-in, not a requirement. It must adhere to the zero-knowledge principle.

2. Core Feature Modules

2.1. Warning Sign Check-in

Purpose: To identify and quantify the presence of negative wellbeing indicators.

Data Model (per entry, in checkinHistory array):

{
  "date": "YYYY-MM-DD",
  "type": "warning",
  "scores": {
    "emotional": 2,
    "mentalCognitive": 1,
    "physical": 0,
    "spiritual": 3,
    "behaviouralRelational": 1
  },
  "totalScore": 7,
  "notes": "User's optional notes for this day."
}


UI Flow & Logic:

User starts a new check-in. App finds today's entry in checkinHistory or creates a new one.

A multi-step view is presented, one for each category (emotional, mental, etc.).

For each category, all predefined "warning signs" are listed.

User selects "Noticed" (score 1) or "Not Really" (score 0) for each sign.

The scores object is populated. totalScore is the sum of all category scores.

After the final category, the user is shown a summary and can add optional notes.

Data is saved (encrypted) to IndexedDB and/or synced.

2.2. Positive Sign Check-in

Purpose: To identify and reinforce positive wellbeing indicators, serving as a counter-balance to the warning signs.

Data Model (per entry, in checkinHistory array):

{
  "date": "YYYY-MM-DD",
  "type": "positive",
  "scores": {
    "connection": 1,
    "purpose": 2,
    "engagement": 0,
    "selfCare": 1,
    "spiritual": 1
  },
  "totalScore": 5,
  "notes": "Optional notes."
}


UI Flow & Logic: Identical to the Warning Sign Check-in, but uses the "positive signs" categories and questions.

2.3. Sabbath Quality Check-in

Purpose: To reflect on the restorative quality of a user's day off.

Data Model (per entry, in sabbathHistory array):

{
  "date": "YYYY-MM-DD",
  "scores": {
    "disengagement": 2,
    "rest": 1,
    "connection": 1,
    "spiritual": 0
  },
  "totalScore": 4,
  "notes": "Optional notes on the Sabbath."
}


UI Flow & Logic:

User starts a Sabbath check-in. App finds/creates an entry for the selected date.

Presents a multi-step view for each of the 4 categories.

Each category lists predefined "sabbath signs."

User selects "Noticed" (1) or "Not Really" (0).

scores and totalScore are calculated and saved.

2.4. Gratitude Journal

Purpose: A simple, unstructured space for gratitude.

Data Model (per entry, in gratitudeHistory array):

{
  "date": "YYYY-MM-DD",
  "entry": "User's free-text gratitude entry."
}


UI Flow & Logic:

User opens module. App finds/creates journal entry for today.

A single <textarea> is presented.

A "Save" button writes the content to the entry field.

A "Past Entries" view lists previous entries by date.

2.5. My Rule of Life

Purpose: To define personal intentions (the "Rule") and track adherence (the "Check-in"). This module has two distinct data models.

Data Model 1 (The Rule, stored as a single object ruleOfLife):

{
  "intentions": [
    "First intention (text)",
    "Second intention (text)",
    "..."
  ]
}


Data Model 2 (The History, in ruleOfLifeHistory array):

{
  "date": "YYYY-MM-DD",
  "adherence": [true, false, true, true],
  "score": 3,
  "notes": "Optional notes."
}


UI Flow & Logic:

Setting the Rule: A view with <input> fields allows the user to define their intentions. These are saved to the ruleOfLife object.

Check-in: The app loads the intentions and presents them as a checklist.

User checks true or false for each intention they followed that day.

The adherence array is saved (booleans), and the score is calculated (sum of true values).

3. Key Functionality

Data Visualization:

Trends: A Chart.js line chart plotting totalScore from checkinHistory over time.

Rule of Life: A Chart.js bar chart showing adherence percentage for each intention over time.

Wellbeing Insights: A non-ML algorithm that correlates data.

Logic: Compares the totalScore from sabbathHistory with the average totalScore from checkinHistory for the following week.

Output: Generates a simple text insight, e.g., "When your Sabbath score is high, your warning signs are 30% lower."

Data Portability (Export):

Loops through all data arrays (checkinHistory, gratitudeHistory, etc.).

Packages them into a single, unencrypted JSON object.

Uses a browser <a> tag with a data:text/json href and a download attribute to save the file.

Data Portability (Import):

Uses an <input type="file"> to read a JSON file.

FileReader API reads the file as text.

JSON.parse() converts the text to an object.

The app validates the object structure and then overwrites the in-memory state (e.g., App.state.allCheckinHistory = importedData.checkinHistory).

Triggers a full save of all modules to re-encrypt and save the imported data.

Full Data Deletion:

Wipes all data from IndexedDB.

Clears all localStorage keys (PIN, salt, etc.).

If App.state.user is present (logged in), it iterates through the user's Firestore collections and performs a batched delete of all documents before signing the user out.

4. App Launch, State, & Navigation

This describes the app's core runtime logic.

4.1. Application Launch Sequence

Load index.html: The page loads.

Firebase Config: An inline script checks for global __firebase_config.

Auth Init: The app initializes Firebase Auth and onAuthStateChanged listener.

onAuthStateChanged Fires:

Case A: User is Logged In (user exists):

Set App.state.storageDriver = 'firestore'.

Fetch the metaDoc from /users/{userId}.

If metaDoc exists: Load pinSalt and encryptedMasterKey from it. Show PIN screen (mode: 'login').

If metaDoc not exists (first login): Check localStorage for local data to migrate. Show PIN screen (mode: 'migrate').

Case B: User is Logged Out (user is null):

Show the Login View (#loginView), which offers "Sign In" or "Stay Local".

If User clicks "Stay Local":

Set App.state.storageDriver = 'localStorage'.

Check localStorage for an existing pinHash.

If pinHash exists: Load pinSalt and encryptedMasterKey from localStorage. Show PIN screen (mode: 'login').

If pinHash not exists: Show PIN screen (mode: 'setup').

PIN Screen Unlock:

User enters PIN. On success (see section 5.2.1), the masterEncryptionKey is loaded into memory.

App calls App.storage.loadHistory() which decrypts and loads all data from the active storageDriver into App.state.

PIN screen is hidden, main app UI is shown.

4.2. State Management

A single, global App object serves as a namespace.

App.state: A "live" object holding all dynamic data (the loaded histories, current user, etc.).

App.config: Holds static data (warning sign lists, category names).

App.dom: A cache of DOM elements (document.getElementById).

Data is "bound" by manually calling render functions (e.t., App.moduleGratitude.saveEntry() calls App.storage.saveGratitudeHistory() and then App.moduleGratitude.renderPastEntries()).

4.3. Navigation

Single Page App (SPA): The app is one HTML file.

View Swapping: All "views" (e.g., #welcomeView, #checkinView, #settingsView) are div elements.

Logic: A function App.navigation.navigateTo('viewId') hides all views (display: none) and then shows the target view (display: flex/block).

The main navigation bar's buttons call this function.

5. Data Storage & Architecture

5.1. Local Storage: IndexedDB

Uses the idb library for a simpler promise-based API.

Database Schema: A single IndexedDB database ('hauora-db') with one object store ('keyval-store').

Logic: Instead of tables, data is saved as key-value pairs (e.g., key: 'checkinHistory', value: [encrypted_blob]).

5.2. Mandatory Client-Side Encryption (Zero-Knowledge)

Mandatory PIN: Enforced on first use.

5.2.1 Key Derivation

Salt: A 16-byte pinSalt is generated (window.crypto.getRandomValues).

PIN Key: The PIN (string) and pinSalt (buffer) are fed into window.crypto.subtle.deriveKey using PBKDF2 with 100,000 iterations (SHA-256) to generate a 256-bit AES-GCM key (the "PIN Key").

Master Key: A 256-bit AES-GCM "Master Key" is generated (window.crypto.subtle.generateKey).

Encrypted Master Key: The "Master Key" is exported (exportKey), encrypted (encrypt) with the "PIN Key", and the resulting ArrayBuffer (IV + ciphertext) is stored in localStorage as a hex/base64 string.

Data Encryption:

When saving data (e.g., checkinHistory array): JSON.stringify() -> TextEncoder -> window.crypto.subtle.encrypt (using the Master Key).

The resulting ArrayBuffer (IV + ciphertext) is stored in IndexedDB.

Unlock Flow:

User enters PIN.

Step 5.2.1 is repeated to re-derive the "PIN Key".

The "PIN Key" decrypts the "Encrypted Master Key" from localStorage.

The "Master Key" is imported and loaded into App.state.masterEncryptionKey.

This in-memory "Master Key" is then used to decrypt data from IndexedDB for the rest of the session.

Result: The PIN is the only thing that can unlock the "Master Key," and the "Master Key" is the only thing that can unlock the data. The PIN itself is never stored.

6. Optional Cloud Sync & Backup

6.1. Authentication (Firebase Auth)

Standard SDK implementation for Google (popup) and Email/Password (form).

User account creation triggers the "migrate local data" flow (see 4.1).

6.2. Cloud Storage (Firestore)

Data Model: Follows the security rules.

/users/{userId}: A single "meta" document storing the exact same pinSalt and encryptedMasterKey as localStorage.

/users/{userId}/data/{dataType}: A document for each data type (e.g., dataType = 'checkinHistory'). The document contains a single field: payload: [encrypted_blob].

Sync Logic:

The App.storage.saveData() function checks App.state.storageDriver.

If 'localStorage', it writes the encrypted blob to IndexedDB.

If 'firestore', it writes the same encrypted blob to the corresponding Firestore document.

6.3. Server Security Rules

The rules are critical and must be set in the Firebase console.

match /users/{userId}: Allows a user to read/write only their own meta doc.

match /users/{userId}/data/{docId}: Allows a user to read/write only documents within their own /data/ subcollection.

7. UI/UX Principles

Color: A unified, calming palette based on Indigo (primary accent) and Slate (text, backgrounds). Avoids "clown car" colors; all modules feel part of one app.

Layout: Single-column, mobile-first (<meta name="viewport">).

Desktop: Constrained to a max-w-2xl on desktop for readability.

Feel: Soft, layered, and clean. Uses a light bg-slate-50 body, with bg-white cards.

Tailwind: All styling is done via Tailwind CSS utility classes.

Key Elements:

Cards: bg-white, rounded-xl, shadow-md.

Buttons (Primary): bg-indigo-600, text-white, rounded-lg.

Buttons (Secondary): bg-white, text-indigo-600, border, rounded-lg.

Inputs: rounded-lg, border-slate-300, focus:ring-indigo-500.

8. Technology Stack

Core: HTML5, CSS3, ES6+ JavaScript (Vanilla)

UI: Tailwind CSS (loaded via CDN)

Charts: Chart.js (loaded via CDN)

Database: IndexedDB (managed via the idb library CDN)

Encryption: Web Crypto API (native browser API)

Backend-as-a-Service (BaaS):

Firebase Authentication (CDN)

Firebase Firestore (CDN)

PWA: manifest.json and sw.js (Service Worker)

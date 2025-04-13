# PartoMat Telegram Mini App

## Overview

PartoMat is a Telegram Mini App designed to help users find automotive parts. It allows users to manage their vehicles and submit search queries (future functionality) directly within Telegram. The application leverages Firebase for backend services (Cloud Functions, Firestore, Hosting) and the Telegram Web App SDK for frontend integration.

## Features

*   **Telegram Mini App Integration:** Runs seamlessly inside the Telegram application.
*   **User Authentication:** Implicitly handled via Telegram `initData` passed to Firebase Functions.
*   **Vehicle Management:**
    *   Add new vehicles with details (Make, Model, Year).
    *   Select a current vehicle for context.
    *   Edit existing vehicle details (via Add Vehicle page).
    *   Delete vehicles.
    *   Set a default vehicle.
    *   (Optional) Upload vehicle passport photo (Texpassport).
*   **Part Search:** (Core goal - specific implementation may vary)
    *   Search by text.
    *   Search by photo.
*   **Query History:** View recent searches/queries (currently mocked).
*   **Dynamic Theming:** Adapts UI colors based on the user's Telegram theme settings.

## Technical Stack

*   **Frontend:**
    *   HTML5
    *   CSS3 (with CSS Variables for theming)
    *   Vanilla JavaScript (ES6 Modules pattern)
    *   Telegram Web App SDK
*   **Backend:**
    *   Firebase Cloud Functions (Node.js)
*   **Database:**
    *   Firebase Firestore
*   **Hosting:**
    *   Firebase Hosting
*   **Other Firebase Services:**
    *   Firebase Storage (for optional photo uploads)
    *   Firebase Authentication (used by Cloud Functions context)

## Project Structure

```
.
├── .firebaserc           # Firebase project configuration link
├── .gitignore            # Git ignore rules
├── firebase.json         # Firebase Hosting & Functions deployment rules, headers
├── functions/            # Firebase Cloud Functions source code
│   ├── index.js          # Main Cloud Functions file
│   ├── package.json      # Node.js dependencies for functions
│   └── package-lock.json # Lockfile for function dependencies
├── partomat-miniapp/     # Public root directory for Firebase Hosting
│   ├── index.html        # Main HTML entry point for the Mini App
│   ├── app.js            # Core application logic, routing, initialization
│   ├── pages/            # JavaScript modules for each application "page"
│   │   ├── home.js
│   │   ├── add-vehicle.js
│   │   ├── query.js
│   │   ├── search.js
│   │   ├── responses.js
│   │   └── profile.js
│   ├── components/       # Reusable JavaScript UI component modules (or templates)
│   │   ├── header.js
│   │   ├── vehicle-selector.js # (Note: currently refactored into home.js)
│   │   ├── part-form.js
│   │   └── response-card.js
│   ├── services/         # Shared JavaScript services/utilities
│   │   └── telegram.js     # Wrapper for Telegram Web App SDK interactions
│   │   # (Potentially firebase.js, api.js if added later)
│   ├── styles/           # CSS stylesheets
│   │   ├── main.css        # Global styles, layout
│   │   └── components.css  # Styles for specific UI components
│   ├── assets/           # Static assets (images, icons, fonts)
│   └── ...               # Other static files
└── README.md             # This file
```

## Setup Instructions

1.  **Clone Repository:** `git clone <repository-url>`
2.  **Install Node.js:** Ensure you have Node.js (LTS version recommended) installed, which includes `npm`. This is required for Firebase Functions development and the Firebase CLI.
3.  **Install Firebase CLI:** If you haven't already, install the Firebase CLI globally:
    ```bash
    npm install -g firebase-tools
    ```
4.  **Login to Firebase:**
    ```bash
    firebase login
    ```
5.  **Install Function Dependencies:** Navigate to the `functions` directory and install dependencies:
    ```bash
    cd functions
    npm install
    cd .. 
    ```
6.  **Firebase Project:** Make sure the project is linked to your Firebase project. Check the `.firebaserc` file or run `firebase use <your-project-id>`.
7.  **Configure Telegram Bot Token:** Set the Telegram Bot Token required by the Firebase Functions. **Replace `YOUR_BOT_TOKEN` with your actual token.**
    ```bash
    # Run from the project root directory
    firebase functions:config:set telegram.token="YOUR_BOT_TOKEN" 
    ```
    *(Note: You might need other configuration variables later, e.g., for external APIs)*

## Running Locally (Development)

It's highly recommended to use the Firebase Local Emulator Suite for development.

1.  **Start Emulators:** From the project root directory, start the emulators for Functions, Firestore, Hosting, and potentially Auth/Storage.
    ```bash
    firebase emulators:start 
    ```
    *(This command might require initial setup using `firebase init emulators`)*
2.  **Access the App:** The Hosting emulator typically serves the app at `http://localhost:5000` (check terminal output). Open this URL in your browser. Note that Telegram SDK features might not fully work outside the Telegram environment, but you can test UI and core JS logic. Use browser developer tools for debugging.
3.  **Functions Logs:** The terminal running `emulators:start` will show logs from your Cloud Functions as they are called by the local app.

## Firebase Configuration Notes

*   **Frontend Firebase Config:** The Firebase SDK configuration keys (apiKey, projectId, etc.) are currently embedded directly in `partomat-miniapp/index.html`. For better security and flexibility, consider loading these from a configuration file or environment variables during a build step if you implement one later.
*   **Cloud Functions Configuration:** Sensitive keys like the Telegram Bot Token should *always* be stored using Firebase Functions configuration (`functions.config()`) as shown in the setup, never hardcoded in the functions source code.

## Deployment

1.  **Ensure Clean State:** Make sure your local code is committed and you are ready to deploy.
2.  **Deploy All:** To deploy Hosting, Functions, Firestore rules, etc.:
    ```bash
    firebase deploy
    ```
3.  **Deploy Specific Services:**
    *   Hosting only: `firebase deploy --only hosting`
    *   Functions only: `firebase deploy --only functions`
    *   Firestore rules only: `firebase deploy --only firestore`

## Architecture & Key Concepts

*   **Single Page Application (SPA):** The frontend operates as an SPA. `index.html` is the single entry point. `app.js` handles page loading, routing (`navigateTo`), and initialization.
*   **Page Modules:** Each "page" (e.g., Home, Add Vehicle) is defined in a JavaScript object/module within the `pages/` directory. These typically have methods like:
    *   `show(params)`: Called when navigating to the page. Initializes state, loads data, renders UI.
    *   `init()`: Sets up initial state, often called by `show`.
    *   `render()`: Generates the HTML for the page and inserts it into the main content area.
    *   `setupEventListeners()`: Attaches necessary event listeners after rendering.
    *   `cleanupEventListeners()`: Removes event listeners when navigating away from the page to prevent memory leaks.
    *   `state`: An object holding the page's current data and UI state.
    *   `eventListeners`: An object to hold references to attached listeners for easy cleanup.
*   **Services:** Shared functionality is encapsulated in services within the `services/` directory.
    *   `TelegramService`: Provides a wrapper around `window.Telegram.WebApp` for common interactions (buttons, theme, user data, haptics, alerts).
*   **Firebase Integration:**
    *   The frontend calls Firebase Cloud Functions for backend operations (fetching/saving data).
    *   Functions interact with Firestore (database) and potentially Storage.
    *   Authentication is handled server-side within functions using `context.auth` derived from the `initData` sent by the frontend.
*   **State Management:** Currently managed locally within each page module's `state` object. For more complex applications, consider a dedicated state management library or pattern.
*   **Caching Strategy:**
    *   **Cache Busting:** Version query parameters (`?v=X.Y.Z`) are appended to CSS and JS links in `index.html`. This parameter **must be manually incremented** when deploying changes to these files to force browsers to download the new version.
    *   **Cache Control Headers:** `firebase.json` is configured with `Cache-Control: public, max-age=0, must-revalidate` headers for `/` and `/index.html`. This forces the browser to check if the main HTML file has changed on every load, ensuring the latest version (with updated asset links) is served promptly after deployment.

## Adding New Functionality (e.g., New Page)

1.  **Define Requirements:** Clearly outline the purpose and interactions of the new feature/page.
2.  **Backend (if needed):**
    *   Define necessary data structures in Firestore.
    *   Create new Cloud Function(s) in `functions/index.js` to handle related backend logic (data fetching, saving, processing). Remember to handle authentication (`context.auth`).
    *   Test the function locally using emulators or deploy it.
3.  **Frontend Page Module:**
    *   Create a new JavaScript file in `partomat-miniapp/pages/` (e.g., `newPage.js`).
    *   Structure the file as an object following the standard page module pattern (`show`, `render`, `setupEventListeners`, `cleanupEventListeners`, `state`, etc.).
    *   Implement the `render` function to generate the required HTML.
    *   Implement `setupEventListeners` to handle user interactions on the new page.
    *   Implement `show` to initialize the page, potentially call Firebase Functions (using `firebase.functions().httpsCallable('yourFunctionName')`) to load data, and trigger rendering.
4.  **Routing:**
    *   In `partomat-miniapp/app.js`, update the `navigateTo` function or the page mapping logic to include the new page key (e.g., `'new-page'`) and associate it with the `NewPage` object.
    *   Add navigation triggers (e.g., buttons on other pages) that call `PartoMatApp.navigateTo('new-page')`.
5.  **Components (if needed):**
    *   If parts of the UI are reusable, create component modules in `partomat-miniapp/components/`.
    *   Import and use these components within your new page's `render` function.
6.  **Styling:**
    *   Add necessary CSS rules to `styles/main.css` or `styles/components.css`.
7.  **Include Script:**
    *   Add a `<script>` tag for your new page module (`pages/newPage.js`) in `partomat-miniapp/index.html`, **including the current cache-busting version parameter** (e.g., `?v=1.0.3`).
8.  **Update Version Parameter:** Increment the version parameter for `pages/newPage.js` (and any other modified JS/CSS files) in `index.html` before deployment.
9.  **Testing:** Test thoroughly using local emulators and ideally within the Telegram environment.
10. **Deployment:** Deploy the changes (Hosting and Functions).

## Firebase Functions Notes

*   The `functions/index.js` file contains the backend logic. Key existing functions include:
    *   `checkUserRegistration`: Checks if a user exists based on Telegram ID.
    *   `saveVehicle`: Creates or updates a vehicle document in Firestore. Handles photo uploads (requires Storage).
    *   `getVehicle`: Retrieves details for a specific vehicle.
    *   `getUserVehicles`: Retrieves all vehicles for the authenticated user.
    *   `deleteVehicle`: (Needs implementation if not already done) Deletes a specified vehicle for the user.
*   Remember to handle errors gracefully and return consistent response formats (e.g., `{ success: true, data: ... }` or `{ success: false, error: '...' }`).

---

This README provides a solid foundation. Remember to keep it updated as the project evolves! 
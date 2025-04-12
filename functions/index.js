/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// const {onRequest} = require("firebase-functions/v2/https");
// const logger = require("firebase-functions/logger");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "partomatminiapp.firebaseapp.com",
  projectId: "partomatminiapp",
  storageBucket: "partomatminiapp.appspot.com",
  messagingSenderId: "...",
  appId: "1:..."
};

// Import necessary modules
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto");

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

// Helper function to validate initData
const validateTelegramData = (initDataString, botToken) => {
  if (!initDataString || !botToken) {
    return {valid: false, data: null};
  }

  const params = new URLSearchParams(initDataString);
  const hash = params.get("hash");
  // Ensure hash exists before proceeding
  if (!hash) {
      return {valid: false, data: null};
  }
  params.delete("hash"); // Remove hash before validation

  // Sort parameters alphabetically
  const dataCheckArr = [];
  params.sort(); // Essential for correct hash calculation
  for (const [key, value] of params.entries()) {
    dataCheckArr.push(`${key}=${value}`);
  }
  const dataCheckString = dataCheckArr.join("\n");

  // Calculate the secret key
  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();

  // Calculate the hash of the data string
  const calculatedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (calculatedHash === hash) {
    // Data is from Telegram
    let user = {};
    try {
        // Ensure user data is valid JSON before parsing
        const userJson = params.get("user") || "{}";
        user = JSON.parse(userJson);
    } catch (e) {
        console.error("Failed to parse user JSON from initData:", e);
        return {valid: false, data: null}; // Invalid if user JSON fails
    }
    // Add other useful params if needed
    return {valid: true, data: {user: user, raw: params}};
  } else {
    return {valid: false, data: null};
  }
};

// --- checkUserExists Function ---
exports.checkUserExists = functions.https.onCall(async (data, context) => {
  const initDataString = data.initData;
  // Use the helper function to get the token
  const functionsConfig = functions.config();
  const botToken = functionsConfig.telegram && functionsConfig.telegram.token;

  if (!botToken) {
    console.error("Bot token is not configured.");
    throw new functions.https.HttpsError(
        "internal",
        "Server configuration error.",
    );
  }

  const validationResult = validateTelegramData(initDataString, botToken);

  // Use the corrected check
  if (!validationResult.valid || !(validationResult.data.user && validationResult.data.user.id)) {
    console.warn("Invalid initData received in checkUserExists:", initDataString);
    throw new functions.https.HttpsError(
        "unauthenticated",
        "Invalid authentication data.",
    );
  }

  const telegramUserId = String(validationResult.data.user.id);

  try {
    const userDocRef = db.collection("users").doc(telegramUserId);
    const userDoc = await userDocRef.get();

    return {exists: userDoc.exists};
  } catch (error) {
    console.error("Error checking user existence:", error);
    throw new functions.https.HttpsError(
        "internal",
        "Could not check user existence.",
    );
  }
});

// --- registerUser Function ---
exports.registerUser = functions.https.onCall(async (data, context) => {
  const initDataString = data.initData;
  // Use the helper function to get the token
  const functionsConfig = functions.config();
  const botToken = functionsConfig.telegram && functionsConfig.telegram.token;

  if (!botToken) {
    console.error("Bot token is not configured.");
    throw new functions.https.HttpsError(
        "internal",
        "Server configuration error.",
    );
  }

  const validationResult = validateTelegramData(initDataString, botToken);

  // Use the corrected check
  if (!validationResult.valid || !(validationResult.data.user && validationResult.data.user.id)) {
    console.warn("Invalid initData received in registerUser:", initDataString);
    throw new functions.https.HttpsError(
        "unauthenticated",
        "Invalid authentication data.",
    );
  }

  const user = validationResult.data.user;
  const telegramUserId = String(user.id);

  try {
    const userDocRef = db.collection("users").doc(telegramUserId);
    const userDoc = await userDocRef.get();

    if (userDoc.exists) {
      console.log(`User ${telegramUserId} already exists.`);
      // Optionally update last login time here
      // await userDocRef.update({ lastLoginAt: admin.firestore.FieldValue.serverTimestamp() });
      return {success: true, message: "User already exists."};
    } else {
      // Create new user document
      const newUser = {
        telegramId: user.id,
        firstName: user.first_name || null,
        lastName: user.last_name || null,
        username: user.username || null,
        languageCode: user.language_code || null,
        isPremium: user.is_premium || false,
        registeredAt: admin.firestore.FieldValue.serverTimestamp(),
        // Add any other fields you want to store initially
      };
      await userDocRef.set(newUser);
      console.log(`User ${telegramUserId} created successfully.`);
      return {success: true, message: "User registered successfully."};
    }
  } catch (error) {
    console.error("Error during user registration:", error);
    throw new functions.https.HttpsError(
        "internal",
        "Could not register user.",
    );
  }
});

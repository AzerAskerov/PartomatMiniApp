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

// --- Vehicle Management Functions ---

// Get all vehicles for a user
exports.getUserVehicles = functions.https.onCall(async (data, context) => {
  const initDataString = data.initData;
  const functionsConfig = functions.config();
  const botToken = functionsConfig.telegram && functionsConfig.telegram.token;

  if (!botToken) {
    console.error("Bot token is not configured.");
    throw new functions.https.HttpsError(
      "internal",
      "Server configuration error."
    );
  }

  const validationResult = validateTelegramData(initDataString, botToken);
  if (!validationResult.valid || !(validationResult.data.user && validationResult.data.user.id)) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Invalid authentication data."
    );
  }

  const telegramUserId = String(validationResult.data.user.id);

  try {
    const vehiclesSnapshot = await db.collection('vehicles')
      .where('telegramUserId', '==', telegramUserId)
      .get();

    const vehicles = [];
    vehiclesSnapshot.forEach(doc => {
      vehicles.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return {
      success: true,
      vehicles: vehicles
    };
  } catch (error) {
    console.error('Error getting user vehicles:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Could not get user vehicles.'
    );
  }
});

// Get a specific vehicle
exports.getVehicle = functions.getVehicle = functions.https.onCall(async (data, context) => {
  const { vehicleId, initData } = data;
  const functionsConfig = functions.config();
  const botToken = functionsConfig.telegram && functionsConfig.telegram.token;

  if (!botToken) {
    console.error("Bot token is not configured.");
    throw new functions.https.HttpsError(
      "internal",
      "Server configuration error."
    );
  }

  const validationResult = validateTelegramData(initData, botToken);
  if (!validationResult.valid || !(validationResult.data.user && validationResult.data.user.id)) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Invalid authentication data."
    );
  }

  const telegramUserId = String(validationResult.data.user.id);

  if (!vehicleId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Vehicle ID is required.'
    );
  }

  try {
    const vehicleDoc = await db.collection('vehicles').doc(vehicleId).get();
    
    if (!vehicleDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Vehicle not found.'
      );
    }

    const vehicleData = vehicleDoc.data();
    if (vehicleData.telegramUserId !== telegramUserId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'You do not have permission to access this vehicle.'
      );
    }

    return {
      success: true,
      vehicle: {
        id: vehicleDoc.id,
        ...vehicleData
      }
    };
  } catch (error) {
    console.error('Error getting vehicle:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Could not get vehicle.'
    );
  }
});

// Save vehicle (create or update)
exports.saveVehicle = functions.https.onCall(async (data, context) => {
  const { vehicleId, vehicleData, initData } = data;
  const functionsConfig = functions.config();
  const botToken = functionsConfig.telegram && functionsConfig.telegram.token;

  if (!botToken) {
    console.error("Bot token is not configured.");
    throw new functions.https.HttpsError(
      "internal",
      "Server configuration error."
    );
  }

  const validationResult = validateTelegramData(initData, botToken);
  if (!validationResult.valid || !(validationResult.data.user && validationResult.data.user.id)) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Invalid authentication data."
    );
  }

  const telegramUserId = String(validationResult.data.user.id);

  if (!vehicleData || !vehicleData.make || !vehicleData.model || !vehicleData.year) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Vehicle data is incomplete.'
    );
  }

  try {
    const vehicleRef = vehicleId 
      ? db.collection('vehicles').doc(vehicleId)
      : db.collection('vehicles').doc();

    // Check if updating existing vehicle
    if (vehicleId) {
      const existingVehicle = await vehicleRef.get();
      if (!existingVehicle.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'Vehicle not found.'
        );
      }
      if (existingVehicle.data().telegramUserId !== telegramUserId) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'You do not have permission to update this vehicle.'
        );
      }
    }

    // Handle photo upload if present
    let photoUrl = vehicleData.passportPhoto;
    if (photoUrl && photoUrl.startsWith('data:')) {
      // Convert base64 to buffer
      const base64Data = photoUrl.replace(/^data:image\/\w+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      // Generate unique filename
      const filename = `vehicles/${telegramUserId}/${vehicleRef.id}/passport.jpg`;
      
      // Upload to Firebase Storage
      const bucket = admin.storage().bucket();
      const file = bucket.file(filename);
      
      await file.save(imageBuffer, {
        metadata: {
          contentType: 'image/jpeg',
        },
      });
      
      // Get signed URL
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: '03-01-2500', // Long expiration
      });
      
      photoUrl = url;
    }

    // Prepare vehicle data
    const vehicleToSave = {
      telegramUserId,
      make: vehicleData.make,
      model: vehicleData.model,
      year: vehicleData.year,
      passportPhoto: photoUrl,
      isDefault: vehicleData.isDefault || false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // If this is a new vehicle, add createdAt
    if (!vehicleId) {
      vehicleToSave.createdAt = admin.firestore.FieldValue.serverTimestamp();
    }

    // If setting as default, update other vehicles
    if (vehicleToSave.isDefault) {
      const batch = db.batch();
      
      // Update this vehicle
      batch.set(vehicleRef, vehicleToSave, { merge: true });
      
      // Update other vehicles to not be default
      const otherVehicles = await db.collection('vehicles')
        .where('telegramUserId', '==', telegramUserId)
        .where('isDefault', '==', true)
        .get();
      
      otherVehicles.forEach(doc => {
        if (doc.id !== vehicleRef.id) {
          batch.update(doc.ref, { isDefault: false });
        }
      });
      
      await batch.commit();
    } else {
      await vehicleRef.set(vehicleToSave, { merge: true });
    }

    return {
      success: true,
      vehicleId: vehicleRef.id
    };
  } catch (error) {
    console.error('Error saving vehicle:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Could not save vehicle.'
    );
  }
});

// Delete vehicle
exports.deleteVehicle = functions.https.onCall(async (data, context) => {
  const { vehicleId, initData } = data;
  const functionsConfig = functions.config();
  const botToken = functionsConfig.telegram && functionsConfig.telegram.token;

  if (!botToken) {
    console.error("Bot token is not configured.");
    throw new functions.https.HttpsError(
      "internal",
      "Server configuration error."
    );
  }

  const validationResult = validateTelegramData(initData, botToken);
  if (!validationResult.valid || !(validationResult.data.user && validationResult.data.user.id)) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Invalid authentication data."
    );
  }

  const telegramUserId = String(validationResult.data.user.id);

  if (!vehicleId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Vehicle ID is required.'
    );
  }

  try {
    const vehicleRef = db.collection('vehicles').doc(vehicleId);
    const vehicleDoc = await vehicleRef.get();

    if (!vehicleDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Vehicle not found.'
      );
    }

    if (vehicleDoc.data().telegramUserId !== telegramUserId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'You do not have permission to delete this vehicle.'
      );
    }

    // Delete vehicle document
    await vehicleRef.delete();

    // Delete associated photo if exists
    const photoUrl = vehicleDoc.data().passportPhoto;
    if (photoUrl) {
      try {
        const bucket = admin.storage().bucket();
        const filename = `vehicles/${telegramUserId}/${vehicleId}/passport.jpg`;
        await bucket.file(filename).delete();
      } catch (error) {
        console.error('Error deleting vehicle photo:', error);
        // Continue even if photo deletion fails
      }
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Could not delete vehicle.'
    );
  }
});

# PartoMat Firebase Firestore Database Schema

This document outlines the complete database schema for the PartoMat application, a mobile platform for auto parts search built with Flutter and Firebase. The schema is designed based on the application screens and functionality requirements.

## Data Structure Overview

Firebase Firestore is a NoSQL database that organizes data in collections and documents. This schema uses the following structural patterns:

1. **Root Collections**: Primary data entities like users, vehicles, queries
2. **Subcollections**: Child collections nested under specific documents (e.g., messages under conversations)
3. **References**: Document IDs used to create relationships between collections
4. **Denormalization**: Strategic duplication of data to optimize read operations

## Collections

### 1. `users`
Stores basic user information for both clients and partners.

```
users/{userId}
{
  uid: string,               // Firebase Authentication UID
  phoneNumber: string,       // User's phone number (primary auth method)
  displayName: string,       // User's full name
  email: string,             // User's email (from Google auth)
  userType: string,          // "client" or "partner"
  createdAt: timestamp,      // Account creation date
  lastLoginAt: timestamp,    // Last login time
  deviceTokens: [string],    // FCM tokens for push notifications
}
```

### 2. `vehicles`
Stores information about client vehicles.

```
vehicles/{vehicleId}
{
  userId: string,            // Owner reference to users collection
  make: string,              // Vehicle manufacturer (BMW, Mercedes, etc.)
  model: string,             // Vehicle model (X5, C200, etc.)
  year: number,              // Manufacturing year (2020, 2019, etc.)
  passportPhotos: {          // URLs to Firebase Storage
    frontPhotoURL: string,   // Front technical passport photo URL
    backPhotoURL: string     // Back technical passport photo URL
  },
  isDefault: boolean,        // Whether this is the default vehicle
  createdAt: timestamp       // When vehicle was added
}
```

### 3. `queries`
Stores part request queries made by clients.

```
queries/{queryId}
{
  queryCode: string,         // Human-readable unique code (e.g., "Q-2354")
  userId: string,            // Reference to client in users collection
  vehicleId: string,         // Reference to vehicles collection
  vehicleInfo: {             // Denormalized for quick access
    make: string,            // Vehicle make
    model: string,           // Vehicle model
    year: number             // Vehicle year
  },
  partName: string,          // Name of the requested part (e.g., "Ön əyləc diski")
  partDescription: string,   // Additional details about the part
  partCondition: string,     // "new", "used", or "both"
  imageURLs: [string],       // URLs to part images uploaded by client (Firebase Storage)
  status: string,            // "active" (seeking responses), "resolved" (client selected response), "canceled"
  createdAt: timestamp,      // When query was created
  responseCount: number      // Number of responses received (denormalized)
}
```

### 4. `responses` (Subcollection)
Stores partner responses to part queries as a subcollection of `queries`.

```
queries/{queryId}/responses/{responseId}
{
  partnerId: string,         // Reference to partner in users collection
  partnerInfo: {             // Denormalized for quick display
    businessName: string,    // Partner business name (e.g., "BMWParts")
    location: string         // Partner location (e.g., "Nərimanov") - Consider storing main location only
  },
  partInfo: {
    name: string,            // Part name as described by partner
    condition: string,       // "new" (Yeni) or "used" (İşlənmiş)
    type: string,            // "original" or "analog"
    availability: string,    // "available" (Mövcuddur), "on_order" (Sifarişlə)
    price: number            // Price in AZN (e.g., 180)
  },
  notes: string,             // Additional notes from the partner
  createdAt: timestamp       // When response was created
}
```

**Note on Responses Subcollection:** This design keeps responses tied to their query, simplifying reads and security rules.

### 5. `partnerProfiles`
Stores detailed information about partner businesses.

```
partnerProfiles/{userId}
{
  userId: string,            // Reference to users collection (matches the user's uid)
  businessName: string,      // Business/shop name
  businessLogoURL: string,   // URL to business logo (Firebase Storage)
  description: string,       // Business description
  locations: [               // Array of business locations
    {
      address: string,       // Location address
      coordinates: geopoint, // Geolocation for maps
      isMain: boolean        // Whether this is the main location
    }
  ],
  specializations: {         // Areas the partner specializes in
    brands: [string],        // Car brands they specialize in (e.g., ["BMW", "Mercedes"])
    partCategories: [string] // Part categories they specialize in (e.g., ["Brakes", "Engine"])
  },
  contactInfo: {
    phone: string,           // Business contact phone
    email: string,           // Business contact email
    website: string          // Business website (optional)
  },
  subscriptionLevel: string, // e.g., "free", "standard", "premium"
  isActive: boolean          // Whether the partner profile is active
}
```

### 6. `conversations`
Stores metadata about messaging threads between clients and partners related to a specific query response.

```
conversations/{conversationId}
{
  participants: [string],    // Array of two userIds involved [clientId, partnerId]
  queryId: string,           // Reference to the related query
  responseId: string,        // Reference to the specific response being discussed
  createdAt: timestamp,      // When conversation started
  updatedAt: timestamp,      // Last message time (for sorting conversations)
  lastMessage: {             // Denormalized preview of the last message
    text: string,            // Preview text
    sentAt: timestamp,       // When last message was sent
    sentBy: string           // userId of the sender
  },
  clientUnreadCount: number, // Unread count for the client
  partnerUnreadCount: number // Unread count for the partner
}
```

### 7. `messages` (Subcollection)
Stores individual messages within a conversation as a subcollection of `conversations`.

```
conversations/{conversationId}/messages/{messageId}
{
  senderId: string,          // Reference to sender in users collection
  text: string,              // Message content
  sentAt: timestamp,         // When message was sent
  // status: string          // Optional: "sent", "delivered", "read" - Can be complex to implement reliably
}
```

**Note on Messages Subcollection:** Keeps messages organized under their conversation, allowing efficient loading of chat history.

### 8. `notifications`
Stores user notifications.

```
notifications/{notificationId}
{
  userId: string,            // Recipient user ID
  title: string,             // Notification title (e.g., "Yeni Cavab")
  body: string,              // Notification content (e.g., "BMWParts sorğunuza cavab verdi.")
  type: string,              // e.g., "query_response", "new_message", "system_alert"
  referenceId: string,       // ID of the related entity (queryId, conversationId, etc.)
  isRead: boolean,           // Whether notification has been read
  createdAt: timestamp       // When notification was created
}
```

### 9. `systemData` (Single Document Collection)
Stores application-wide reference data like car brands and part categories. Typically uses a single document with a known ID.

```
systemData/appConfig
{
  carBrands: [               // Array of available car brands and their models/years
    {
      name: string,          // Brand name (e.g., "BMW")
      models: [              // Array of available models
        {
          name: string,      // Model name (e.g., "X5")
          years: [number]    // Array of available years (e.g., [2020, 2021, 2022])
        }
      ]
    }
    // ... other brands
  ],
  partCategories: [          // Array of part categories for organization
    {
      name: string,          // Category name (e.g., "Əyləc Sistemi")
      subcategories: [string] // Subcategories (e.g., ["Əyləc Diski", "Əyləc Bəndi"])
    }
    // ... other categories
  ]
  // ... other global config like maintenance status, etc.
}
```

*(Note: The `parts` and `vehicleParts` collections mentioned in the original prompt seem overly complex for an initial MVP and might be better integrated into `systemData` or handled differently unless a very detailed parts catalog is a core Day 1 feature. The schema above focuses on the core user flows.)*

## Relationships and Data Access Patterns

(As described in the prompt, focusing on querying based on the schema above. Key patterns involve querying collections by `userId`, using `participants` arrays for conversations, and accessing subcollections directly.)

## Common Query Operations

*   **Client Home:** Fetch default vehicle (`vehicles` where `userId`, `isDefault`), fetch recent active queries (`queries` where `userId`, `status == 'active'`, order by `createdAt`), count unread notifications (`notifications` where `userId`, `isRead == false`).
*   **Add/Manage Vehicles:** Query `vehicles` where `userId`.
*   **Create Query:** Add document to `queries`.
*   **View Query Responses:** Query `queries/{queryId}/responses`.
*   **View Conversations:** Query `conversations` where `participants` array-contains `userId`, order by `updatedAt`.
*   **View Messages:** Query `conversations/{conversationId}/messages` order by `sentAt`.
*   **Partner View Queries:** Query `queries` where `status == 'active'` (potentially filtered by partner specializations stored in `partnerProfiles`).

## Indexes

Key composite indexes needed:

*   `vehicles(userId, isDefault)`
*   `queries(userId, status, createdAt)`
*   `queries(status, createdAt)` (Potentially for partner view, might need specialization fields)
*   `conversations(participants, updatedAt)`
*   `notifications(userId, isRead, createdAt)`

Subcollection indexes (`responses`, `messages`) are usually automatic based on the single field used for ordering (`createdAt`, `sentAt`).

## Security Rules

Firestore security rules are crucial:

*   Users can only read/write their own `users`, `vehicles`, `queries`, `notifications`.
*   Users can only read/write `conversations` they are a participant in.
*   Users can only read/write `messages` within conversations they participate in.
*   Clients can read `responses` in their own `queries`.
*   Partners (check `userType` in `users` document) can read active `queries` (potentially filtered) and create `responses` under those queries.
*   Partners can only update/delete their own `responses`.
*   `systemData` might be globally readable.
*   `partnerProfiles` might be readable by clients, writable only by the partner user.

## Data Denormalization

*   **`vehicleInfo` in `queries`:** Avoids joining `vehicles` when listing queries.
*   **`partnerInfo` in `responses`:** Avoids joining `partnerProfiles` when listing responses.
*   **`lastMessage` in `conversations`:** Allows preview without reading the `messages` subcollection.
*   **`responseCount` in `queries`:** Efficiently display the count without reading the subcollection.

This schema provides a robust structure for the PartoMat Mini App using Firebase Firestore. 
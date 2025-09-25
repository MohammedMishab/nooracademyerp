# Push Notification Setup for Noor Academy PWA

This document explains how the push notification system works in your PWA and how to test it.

## 🚀 Features

- **Real-time Notifications**: Automatically shows notifications when new announcements are added
- **Mobile Support**: Works on both Android and iOS devices
- **Background Notifications**: Notifications appear even when the app is closed
- **Click Actions**: Users can click notifications to open the app
- **Test Interface**: Built-in test component to verify notifications work

## 📱 How It Works

1. **Service Worker**: Handles push notifications in the background
2. **Firebase Cloud Messaging**: Manages notification delivery
3. **Real-time Listener**: Watches for new notifications in Firestore
4. **Notification Service**: Manages notification permissions and display

## 🛠️ Setup Instructions

### 1. Firebase Configuration

Your Firebase project is already configured with:
- Project ID: `erpnooracademy`
- Cloud Messaging enabled
- Service account for backend notifications

### 2. VAPID Key Setup

The app uses a VAPID key for Firebase Cloud Messaging. The current key in the code is a placeholder. To get your actual VAPID key:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`erpnooracademy`)
3. Go to Project Settings > Cloud Messaging
4. Copy the Web Push certificates (VAPID key)
5. Replace the VAPID_KEY in `src/app/services/notificationService.ts`

### 3. Service Account Key (for backend notifications)

To send notifications from a backend script:

1. Go to Firebase Console > Project Settings > Service Accounts
2. Click "Generate New Private Key"
3. Download the JSON file
4. Update the service account details in `scripts/send-notification.js`

## 🧪 Testing Notifications

### Method 1: Using the Test Component

1. Open your PWA in a browser
2. Go to the Dashboard
3. Find the "Notification Test" section
4. Click "Send Test Notification"
5. Allow notifications when prompted
6. You should see a notification appear

### Method 2: Using the Backend Script

1. Install Firebase Admin SDK:
   ```bash
   npm install firebase-admin
   ```

2. Send a test notification:
   ```bash
   npm run send-notification
   ```

3. Send a custom notification:
   ```bash
   node scripts/send-notification.js "Important Update" "This is a custom notification message"
   ```

### Method 3: Adding Notifications via Firestore

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Navigate to Firestore Database
3. Go to the `notification` collection
4. Add a new document with:
   - `heading`: "Test Notification"
   - `content`: "Your notification message"
   - `date`: Current timestamp
   - `type`: "announcement"

## 📱 Mobile Testing

### Android
1. Open your PWA in Chrome
2. Install the app (use the install prompt)
3. Allow notifications when prompted
4. Test notifications - they should appear in the notification tray

### iOS
1. Open your PWA in Safari
2. Add to Home Screen
3. Open the installed app
4. Allow notifications when prompted
5. Test notifications - they should appear in the notification center

## 🔧 Troubleshooting

### Notifications Not Appearing

1. **Check Permissions**: Ensure notifications are allowed in browser settings
2. **Check Service Worker**: Verify the service worker is registered (check browser dev tools)
3. **Check Console**: Look for errors in the browser console
4. **Check FCM Token**: Use the test component to get and verify the FCM token

### Common Issues

1. **"Notification permission denied"**: User needs to manually enable notifications in browser settings
2. **"Service Worker not registered"**: Check if the app is served over HTTPS
3. **"FCM token not available"**: Verify Firebase configuration and VAPID key

## 📋 Notification Flow

1. **New Notification Added**: When a new document is added to the `notification` collection in Firestore
2. **Real-time Detection**: The app detects the new notification via Firestore listener
3. **Notification Display**: A push notification is shown to the user
4. **User Interaction**: User can click the notification to open the app
5. **App Navigation**: The app opens to the notifications page

## 🎯 Customization

### Notification Appearance

You can customize notification appearance in:
- `public/sw.js` - Service worker notification options
- `src/app/services/notificationService.ts` - Notification service settings

### Notification Content

Notifications are automatically generated from Firestore documents with:
- `heading`: Notification title
- `content`: Notification body
- `date`: Timestamp
- `type`: Notification type (optional)

## 🔒 Security Notes

- VAPID keys are safe to include in client-side code
- Service account keys should never be committed to version control
- Use environment variables for sensitive configuration in production

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Verify Firebase project configuration
3. Test on different devices/browsers
4. Check notification permissions in browser settings

---

**Note**: This notification system works best when the PWA is installed on the device and notifications are allowed. Make sure to test on actual mobile devices for the best experience.

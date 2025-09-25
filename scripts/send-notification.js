// Script to send test notifications to your PWA
// Run this with: node scripts/send-notification.js

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = {
  // You'll need to download your service account key from Firebase Console
  // Go to Project Settings > Service Accounts > Generate New Private Key
  // Replace this with your actual service account key
  type: "service_account",
  project_id: "erpnooracademy",
  private_key_id: "your-private-key-id",
  private_key: "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-xxxxx@erpnooracademy.iam.gserviceaccount.com",
  client_id: "your-client-id",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40erpnooracademy.iam.gserviceaccount.com"
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'erpnooracademy'
});

const db = admin.firestore();

// Function to send a test notification
async function sendTestNotification() {
  try {
    // Add a new notification to Firestore
    const notificationData = {
      heading: "Test Notification",
      content: "This is a test notification sent from the backend script. If you see this, your push notification system is working!",
      date: admin.firestore.FieldValue.serverTimestamp(),
      type: "test"
    };

    const docRef = await db.collection('notification').add(notificationData);
    console.log('Test notification added with ID:', docRef.id);
    
    // You can also send FCM messages directly if you have device tokens
    // const message = {
    //   notification: {
    //     title: 'New Notification',
    //     body: 'You have a new notification from Noor Academy'
    //   },
    //   topic: 'notifications' // or use specific device tokens
    // };
    
    // await admin.messaging().send(message);
    // console.log('FCM message sent successfully');
    
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

// Function to send a real notification
async function sendRealNotification(heading, content) {
  try {
    const notificationData = {
      heading: heading,
      content: content,
      date: admin.firestore.FieldValue.serverTimestamp(),
      type: "announcement"
    };

    const docRef = await db.collection('notification').add(notificationData);
    console.log('Notification added with ID:', docRef.id);
    console.log('Notification will appear in the app and trigger push notifications for subscribed users.');
    
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length >= 2) {
    // Send custom notification
    const heading = args[0];
    const content = args.slice(1).join(' ');
    await sendRealNotification(heading, content);
  } else {
    // Send test notification
    await sendTestNotification();
  }
  
  // Close the connection
  process.exit(0);
}

main().catch(console.error);

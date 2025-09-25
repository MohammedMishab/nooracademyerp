'use client';

import { useState } from 'react';
import { notificationService } from '../services/notificationService';
import { Bell, TestTube } from 'lucide-react';

const NotificationTest = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  const handleTestNotification = async () => {
    setIsTesting(true);
    try {
      await notificationService.sendTestNotification();
      console.log('Test notification sent');
    } catch (error) {
      console.error('Error sending test notification:', error);
    } finally {
      setIsTesting(false);
    }
  };

  const getFCMToken = () => {
    const token = notificationService.getFCMToken();
    setFcmToken(token);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold text-gray-800">Notification Test</h3>
      </div>
      
      <div className="space-y-3">
        <button
          onClick={handleTestNotification}
          disabled={isTesting}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isTesting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <TestTube className="w-4 h-4" />
              Send Test Notification
            </>
          )}
        </button>

        <button
          onClick={getFCMToken}
          className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors duration-200"
        >
          Get FCM Token
        </button>

        {fcmToken && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-2">FCM Token:</p>
            <p className="text-xs font-mono text-gray-800 break-all">{fcmToken}</p>
            <button
              onClick={() => navigator.clipboard.writeText(fcmToken)}
              className="mt-2 text-xs text-blue-500 hover:text-blue-700"
            >
              Copy to Clipboard
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>Note:</strong> Make sure to allow notifications in your browser. 
          You'll receive notifications when new announcements are added to the system.
        </p>
      </div>
    </div>
  );
};

export default NotificationTest;

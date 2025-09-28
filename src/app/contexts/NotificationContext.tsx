"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { auth, db } from '../firebase';
import { User } from 'firebase/auth';
import { collection, query, where, getDocs, doc, setDoc, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { useAuth } from '../AuthContext';

interface NotificationCounts {
  attendance: number;
  results: number;
  achievements: number;
  negatives: number;
  notifications: number;
  projects: number;
}

interface NotificationContextType {
  counts: NotificationCounts;
  markAsRead: (type: keyof NotificationCounts, recordId?: string) => Promise<void>;
  refreshCounts: () => Promise<void>;
  loading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [counts, setCounts] = useState<NotificationCounts>({
    attendance: 0,
    results: 0,
    achievements: 0,
    negatives: 0,
    notifications: 0,
    projects: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadCounts(user);
    } else {
      setCounts({
        attendance: 0,
        results: 0,
        achievements: 0,
        negatives: 0,
        notifications: 0,
        projects: 0,
      });
      setLoading(false);
    }
  }, [user]);

  const loadCounts = async (user: User) => {
    try {
      setLoading(true);

      // Get user details
      const userQuery = query(
        collection(db, "details"),
        where("email", "==", user.email)
      );
      const userSnap = await getDocs(userQuery);

      if (userSnap.empty) {
        setLoading(false);
        return;
      }

      const userData = userSnap.docs[0].data();
      const rollno = userData.rollno;
      const userId = user.uid;

      // Get last read timestamps
      const lastReadRef = doc(db, 'lastReadTimestamps', userId);
      const lastReadSnap = await getDocs(query(collection(db, 'lastReadTimestamps'), where('userId', '==', userId)));
      
      let lastReadData: any = {};
      if (!lastReadSnap.empty) {
        lastReadData = lastReadSnap.docs[0].data();
      }

      // Calculate counts for each type
      const newCounts: NotificationCounts = {
        attendance: 0,
        results: 0,
        achievements: 0,
        negatives: 0,
        notifications: 0,
        projects: 0,
      };

      // Attendance count (new absent records) - using client-side filtering
      try {
        const attendanceQuery = query(collection(db, "attentence"));
        const attendanceSnap = await getDocs(attendanceQuery);
        
        const attendanceData = attendanceSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        const userAttendance = attendanceData.filter(record => 
          record.rollno === rollno && record.status === "absent"
        );
        
        if (lastReadData.attendance) {
          const lastReadDate = new Date(lastReadData.attendance);
          newCounts.attendance = userAttendance.filter(record => 
            record.date && record.date.toDate() > lastReadDate
          ).length;
        } else {
          newCounts.attendance = userAttendance.length;
        }
      } catch (error) {
        console.warn('Error loading attendance count:', error);
        newCounts.attendance = 0;
      }

      // Results count - using client-side filtering
      try {
        const resultsQuery = query(collection(db, "result"));
        const resultsSnap = await getDocs(resultsQuery);
        
        const resultsData = resultsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        const userResults = resultsData.filter(result => result.rollno === rollno);
        
        if (lastReadData.results) {
          const lastReadDate = new Date(lastReadData.results);
          newCounts.results = userResults.filter(result => 
            result.date && result.date.toDate() > lastReadDate
          ).length;
        } else {
          newCounts.results = userResults.length;
        }
      } catch (error) {
        console.warn('Error loading results count:', error);
        newCounts.results = 0;
      }

      // Achievements count - using client-side filtering
      try {
        const achievementsQuery = query(collection(db, "achivement"));
        const achievementsSnap = await getDocs(achievementsQuery);
        
        const achievementsData = achievementsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        const userAchievements = achievementsData.filter(achievement => achievement.rollno === rollno);
        
        if (lastReadData.achievements) {
          const lastReadDate = new Date(lastReadData.achievements);
          newCounts.achievements = userAchievements.filter(achievement => 
            achievement.date && achievement.date.toDate() > lastReadDate
          ).length;
        } else {
          newCounts.achievements = userAchievements.length;
        }
      } catch (error) {
        console.warn('Error loading achievements count:', error);
        newCounts.achievements = 0;
      }

      // Negatives count - using client-side filtering
      try {
        const negativesQuery = query(collection(db, "negatives"));
        const negativesSnap = await getDocs(negativesQuery);
        
        const negativesData = negativesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        const userNegatives = negativesData.filter(negative => negative.rollno === rollno);
        
        if (lastReadData.negatives) {
          const lastReadDate = new Date(lastReadData.negatives);
          newCounts.negatives = userNegatives.filter(negative => 
            negative.date && negative.date.toDate() > lastReadDate
          ).length;
        } else {
          newCounts.negatives = userNegatives.length;
        }
      } catch (error) {
        console.warn('Error loading negatives count:', error);
        newCounts.negatives = 0;
      }

      // Notifications count - using client-side filtering
      try {
        const notificationsQuery = query(collection(db, "notification"));
        const notificationsSnap = await getDocs(notificationsQuery);
        
        const notificationsData = notificationsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        if (lastReadData.notifications) {
          const lastReadDate = new Date(lastReadData.notifications);
          newCounts.notifications = notificationsData.filter(notification => 
            notification.date && notification.date.toDate() > lastReadDate
          ).length;
        } else {
          newCounts.notifications = notificationsData.length;
        }
      } catch (error) {
        console.warn('Error loading notifications count:', error);
        newCounts.notifications = 0;
      }

      // Projects count - using client-side filtering
      try {
        const projectsQuery = query(collection(db, "projecet"));
        const projectsSnap = await getDocs(projectsQuery);
        
        const projectsData = projectsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        const userProjects = projectsData.filter(project => project.rollno === rollno);
        
        if (lastReadData.projects) {
          const lastReadDate = new Date(lastReadData.projects);
          newCounts.projects = userProjects.filter(project => 
            project.date && project.date.toDate() > lastReadDate
          ).length;
        } else {
          newCounts.projects = userProjects.length;
        }
      } catch (error) {
        console.warn('Error loading projects count:', error);
        newCounts.projects = 0;
      }

      setCounts(newCounts);
    } catch (error) {
      console.error('Error loading notification counts:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = useCallback(async (type: keyof NotificationCounts, recordId?: string) => {
    if (!user) return;

    try {
      const userId = user.uid;
      const now = new Date().toISOString();
      
      const lastReadRef = doc(db, 'lastReadTimestamps', userId);
      await setDoc(lastReadRef, {
        userId,
        [type]: now,
        updatedAt: now
      }, { merge: true });

      // Update local counts
      setCounts(prev => ({
        ...prev,
        [type]: 0
      }));

      // Refresh counts to get accurate numbers
      await loadCounts(user);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, [user]);

  const refreshCounts = useCallback(async () => {
    if (user) {
      await loadCounts(user);
    }
  }, [user]);

  const value: NotificationContextType = {
    counts,
    markAsRead,
    refreshCounts,
    loading,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

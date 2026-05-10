/**
 * api.js — Firestore-backed API service for Admin pages.
 * 
 * Structure:
 *   college_code (collection)
 *     └── admins (document)
 *           └── subjects (subcollection)
 *                 └── {courseCode} (document, e.g. "hx102")
 */

import { db } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';

// Reference to college_code -> admins -> subjects
const SUBJECTS_REF = collection(db, 'college_code', 'admins', 'subjects');

const api = {
  /**
   * Read a user profile by document ID (read-only)
   */
  getUserById: async (userId) => {
    try {
      if (!userId) return { data: null };
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { data: { id: docSnap.id, ...docSnap.data() } };
      }
      return { data: null };
    } catch (err) {
      console.error('Error fetching user:', err);
      return { data: null };
    }
  },
  /**
   * Get subjects for a given semester from Firestore
   */
  getSubjects: async (semester) => {
    try {
      const q = query(
        SUBJECTS_REF,
        where('semester', '==', Number(semester))
      );
      const snapshot = await getDocs(q);
      const subjects = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
        // Map fields for UI compatibility
        name: docSnap.data().subjectName,
        code: docSnap.data().courseCode,
        category: docSnap.data().courseType,
        icon: '📚',
        units: docSnap.data().noOfUnits || 0,
        progress: 0, // Default progress for students
      }));
      // Sort client-side (newest first)
      subjects.sort((a, b) => {
        const ta = a.createdAt?.seconds || 0;
        const tb = b.createdAt?.seconds || 0;
        return tb - ta;
      });
      return { data: subjects };
    } catch (err) {
      console.error('Error fetching subjects:', err);
      return { data: [] };
    }
  },

  /**
   * Get a single subject by its ID (courseCode)
   * @param {string} courseCode
   */
  getSubjectById: async (courseCode) => {
    try {
      const docRef = doc(db, 'college_code', 'admins', 'subjects', courseCode);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return {
          data: {
            id: docSnap.id,
            ...docSnap.data(),
            // Map fields for UI compatibility
            name: docSnap.data().subjectName,
            code: docSnap.data().courseCode,
            category: docSnap.data().courseType,
            icon: '📚',
            units: docSnap.data().noOfUnits || 0,
            progress: 0,
          }
        };
      }
      return { data: null };
    } catch (err) {
      console.error('Error fetching subject:', err);
      return { data: null };
    }
  },

  /**
   * Add a new subject to Firestore.
   * Path: college_code/admins/subjects/{courseCode}
   */
  addSubject: async (subjectData) => {
    try {
      const courseCode = subjectData.courseCode.trim();
      if (!courseCode) throw new Error('Course code is required');

      const docData = {
        subjectName: subjectData.subjectName,
        courseCode: courseCode,
        courseType: subjectData.courseType,
        semester: Number(subjectData.semester),
        noOfUnits: Number(subjectData.noOfUnits) || 1,
        syllabus: subjectData.syllabus || {},
        notes: subjectData.notes || {},
        pyqs: subjectData.pyqs || {},
        createdAt: serverTimestamp(),
      };

      // Set document directly in the subjects collection with courseCode as ID
      const docRef = doc(db, 'college_code', 'admins', 'subjects', courseCode);
      await setDoc(docRef, docData);

      return {
        data: {
          id: courseCode,
          ...docData,
          name: docData.subjectName,
          icon: '📚',
          units: docData.noOfUnits,
        },
      };
    } catch (err) {
      console.error('Error adding subject:', err);
      throw err;
    }
  },

  /**
   * Update the Payment status of a subject in Firestore
   */
  updateSubjectPayment: async (courseCode, paymentStatus) => {
    try {
      const docRef = doc(db, 'college_code', 'admins', 'subjects', courseCode);
      await updateDoc(docRef, { Payment: paymentStatus });
      return { success: true };
    } catch (err) {
      console.error('Error updating payment status:', err);
      throw err;
    }
  },

  /**
   * Update notes and PYQs for a subject
   */
  updateSubjectAssets: async (courseCode, notes, pyqs) => {
    try {
      if (!courseCode) throw new Error('Course code is required');
      const docRef = doc(db, 'college_code', 'admins', 'subjects', courseCode);
      await updateDoc(docRef, {
        notes: notes || {},
        pyqs: pyqs || {},
      });
      return { success: true };
    } catch (err) {
      console.error('Error updating subject assets:', err);
      throw err;
    }
  },

  /**
   * Update an existing subject without changing field names
   */
  updateSubject: async (courseCode, subjectData) => {
    try {
      if (!courseCode) throw new Error('Course code is required');

      const docRef = doc(db, 'college_code', 'admins', 'subjects', courseCode);
      const docData = {
        subjectName: subjectData.subjectName,
        courseCode: courseCode,
        courseType: subjectData.courseType,
        semester: Number(subjectData.semester),
        noOfUnits: Number(subjectData.noOfUnits) || 1,
        syllabus: subjectData.syllabus || {},
        notes: subjectData.notes || {},
        pyqs: subjectData.pyqs || {},
      };

      await updateDoc(docRef, docData);

      return {
        data: {
          id: courseCode,
          ...docData,
          name: docData.subjectName,
          icon: '📚',
          units: docData.noOfUnits,
        },
      };
    } catch (err) {
      console.error('Error updating subject:', err);
      throw err;
    }
  }
};

export default api;

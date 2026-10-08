/**
 * api.js — Firestore-backed API service for Admin/Author pages.
 * 
 * Structure:
 *   examsync (collection)
 *     └── {college_id} (document, e.g. "gmrit")
 *           ├── admins: [{ username, password, name, role }]
 *           ├── examites: [{ username, password, subjects: [...], createdAt }]
 *           └── subjects (subcollection)
 *                 └── {courseCode} (document — METADATA only)
 *                       ├── subjectName, courseCode, courseType, semester
 *                       ├── noOfUnits, customTags, price, Payment
 *                       │
 *                       ├── exam_data/ (subcollection)
 *                       │     ├── syllabus (document)
 *                       │     ├── notes (document)
 *                       │     ├── pyqs (document)
 *                       │     └── ImpQuestions (document)
 *                       │
 *                       └── paid_users/ (subcollection)
 *                             └── {userId} (document)
 */

import { db } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';

/**
 * Get the current college ID from localStorage (set during login).
 * Falls back to 'admins' for backward compatibility with student pages.
 */
export const getCollegeId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('examsync_user') || '{}');
    return user.collegeId || 'admins';
  } catch {
    return 'admins';
  }
};

// Dynamic reference to subjects subcollection based on logged-in user's college
const getSubjectsRef = () => {
  return collection(db, 'examsync', getCollegeId(), 'subjects');
};

// Get a reference to a specific document in exam_data sub-collection
const getExamDocRef = (courseCode, docName) => {
  return doc(db, 'examsync', getCollegeId(), 'subjects', courseCode, 'exam_data', docName);
};

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
   * Get subjects for a given semester (METADATA only, for listing)
   */
  getSubjects: async (semester) => {
    try {
      const q = query(
        getSubjectsRef(),
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
        progress: 0,
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
   * Get all subjects for a college (METADATA only)
   */
  getAllSubjects: async () => {
    try {
      const snapshot = await getDocs(getSubjectsRef());
      const subjects = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
        name: docSnap.data().subjectName,
        code: docSnap.data().courseCode,
        category: docSnap.data().courseType,
        icon: '📚',
        units: docSnap.data().noOfUnits || 0,
        progress: 0,
      }));
      return { data: subjects };
    } catch (err) {
      console.error('Error fetching all subjects:', err);
      return { data: [] };
    }
  },

  /**
   * Get a single subject by its ID (courseCode).
   * Returns MERGED data: metadata + exam_data/content.
   */
  getSubjectById: async (courseCode) => {
    try {
      const cid = getCollegeId();
      // 1. Read metadata document
      const metaRef = doc(db, 'examsync', cid, 'subjects', courseCode);
      const metaSnap = await getDoc(metaRef);

      if (!metaSnap.exists()) return { data: null };

      const metaData = metaSnap.data();

      // 2. Read separate exam_data documents
      const syllabusSnap = await getDoc(getExamDocRef(courseCode, 'syllabus'));
      const notesSnap = await getDoc(getExamDocRef(courseCode, 'notes'));
      const pyqsSnap = await getDoc(getExamDocRef(courseCode, 'pyqs'));
      const impQsSnap = await getDoc(getExamDocRef(courseCode, 'ImpQuestions'));

      const examData = {
        syllabus: syllabusSnap.exists() ? syllabusSnap.data().data || {} : {},
        notes: notesSnap.exists() ? notesSnap.data().data || {} : {},
        pyqs: pyqsSnap.exists() ? pyqsSnap.data().data || {} : {},
        ImpQuestions: impQsSnap.exists() ? impQsSnap.data().data || {} : {},
      };

      // 3. Merge metadata + exam data
      return {
        data: {
          id: metaSnap.id,
          ...metaData,
          ...examData, // syllabus, notes, pyqs, ImpQuestions
          // Map fields for UI compatibility
          name: metaData.subjectName,
          code: metaData.courseCode,
          category: metaData.courseType,
          icon: '📚',
          units: metaData.noOfUnits || 0,
          progress: 0,
        }
      };
    } catch (err) {
      console.error('Error fetching subject:', err);
      return { data: null };
    }
  },

  /**
   * Add a new subject to Firestore (METADATA only).
   * Path: examsync/{collegeId}/subjects/{courseCode}
   */
  addSubject: async (subjectData) => {
    try {
      const courseCode = subjectData.courseCode.trim();
      if (!courseCode) throw new Error('Course code is required');

      const cid = getCollegeId();

      // Only metadata fields in the subject document
      const metaDoc = {
        subjectName: subjectData.subjectName,
        courseCode: courseCode,
        courseType: subjectData.courseType,
        semester: Number(subjectData.semester),
        noOfUnits: Number(subjectData.noOfUnits) || 1,
        customTags: subjectData.customTags || [],
        price: Number(subjectData.price) || 0,
        Payment: subjectData.Payment || false,
        createdAt: serverTimestamp(),
      };

      const docRef = doc(db, 'examsync', cid, 'subjects', courseCode);
      await setDoc(docRef, metaDoc);

      return {
        data: {
          id: courseCode,
          ...metaDoc,
          name: metaDoc.subjectName,
          icon: '📚',
          units: metaDoc.noOfUnits,
        },
      };
    } catch (err) {
      console.error('Error adding subject:', err);
      throw err;
    }
  },

  /**
   * Update subject metadata only
   */
  updateSubject: async (courseCode, subjectData) => {
    try {
      if (!courseCode) throw new Error('Course code is required');

      const cid = getCollegeId();
      const docRef = doc(db, 'examsync', cid, 'subjects', courseCode);

      const metaDoc = {
        subjectName: subjectData.subjectName,
        courseCode: courseCode,
        courseType: subjectData.courseType,
        semester: Number(subjectData.semester),
        noOfUnits: Number(subjectData.noOfUnits) || 1,
        customTags: subjectData.customTags || [],
        price: Number(subjectData.price) || 0,
        Payment: subjectData.Payment || false,
      };

      await updateDoc(docRef, metaDoc);

      return {
        data: {
          id: courseCode,
          ...metaDoc,
          name: metaDoc.subjectName,
          icon: '📚',
          units: metaDoc.noOfUnits,
        },
      };
    } catch (err) {
      console.error('Error updating subject:', err);
      throw err;
    }
  },

  /**
   * Update the Payment status of a subject in Firestore
   */
  updateSubjectPayment: async (courseCode, paymentStatus) => {
    try {
      const cid = getCollegeId();
      const docRef = doc(db, 'examsync', cid, 'subjects', courseCode);
      await updateDoc(docRef, { Payment: paymentStatus });
      return { success: true };
    } catch (err) {
      console.error('Error updating payment status:', err);
      throw err;
    }
  },

  // ─── Exam Data Sub-collection ──────────────────────────────────

  /**
   * Get exam data (syllabus, notes, pyqs, ImpQuestions) for a subject
   */
  getExamData: async (courseCode) => {
    try {
      const syllabusSnap = await getDoc(getExamDocRef(courseCode, 'syllabus'));
      const notesSnap = await getDoc(getExamDocRef(courseCode, 'notes'));
      const pyqsSnap = await getDoc(getExamDocRef(courseCode, 'pyqs'));
      const impQsSnap = await getDoc(getExamDocRef(courseCode, 'ImpQuestions'));

      return {
        data: {
          syllabus: syllabusSnap.exists() ? syllabusSnap.data().data || {} : {},
          notes: notesSnap.exists() ? notesSnap.data().data || {} : {},
          pyqs: pyqsSnap.exists() ? pyqsSnap.data().data || {} : {},
          ImpQuestions: impQsSnap.exists() ? impQsSnap.data().data || {} : {},
        }
      };
    } catch (err) {
      console.error('Error fetching exam data:', err);
      return { data: { syllabus: {}, notes: {}, pyqs: {}, ImpQuestions: {} } };
    }
  },

  /**
   * Update exam data (syllabus, notes, pyqs, ImpQuestions).
   * Uses setDoc with merge to create or update the document.
   */
  updateExamData: async (courseCode, data) => {
    try {
      if (!courseCode) throw new Error('Course code is required');
      
      const promises = [];
      if (data.syllabus !== undefined) {
        promises.push(setDoc(getExamDocRef(courseCode, 'syllabus'), { data: data.syllabus }, { merge: true }));
      }
      if (data.notes !== undefined) {
        promises.push(setDoc(getExamDocRef(courseCode, 'notes'), { data: data.notes }, { merge: true }));
      }
      if (data.pyqs !== undefined) {
        promises.push(setDoc(getExamDocRef(courseCode, 'pyqs'), { data: data.pyqs }, { merge: true }));
      }
      if (data.ImpQuestions !== undefined) {
        promises.push(setDoc(getExamDocRef(courseCode, 'ImpQuestions'), { data: data.ImpQuestions }, { merge: true }));
      }
      
      await Promise.all(promises);
      return { success: true };
    } catch (err) {
      console.error('Error updating exam data:', err);
      throw err;
    }
  },

  /**
   * Update notes and PYQs for a subject (writes to exam_data/content)
   */
  updateSubjectAssets: async (courseCode, notes, pyqs) => {
    try {
      if (!courseCode) throw new Error('Course code is required');
      const examRef = getExamDataRef(courseCode);
      await setDoc(examRef, {
        notes: notes || {},
        pyqs: pyqs || {},
      }, { merge: true });
      return { success: true };
    } catch (err) {
      console.error('Error updating subject assets:', err);
      throw err;
    }
  },

  // ─── Paid Users Sub-collection ─────────────────────────────────

  /**
   * Check if a user has paid for a subject
   */
  checkPaidUser: async (courseCode, userId) => {
    try {
      const cid = getCollegeId();
      const paidRef = doc(db, 'examsync', cid, 'subjects', courseCode, 'paid_users', userId);
      const paidSnap = await getDoc(paidRef);
      return { isPaid: paidSnap.exists() };
    } catch (err) {
      console.error('Error checking paid user:', err);
      return { isPaid: false };
    }
  },

  /**
   * Add a user to the paid_users sub-collection for a subject
   */
  addPaidUser: async (courseCode, userId) => {
    try {
      const cid = getCollegeId();
      const paidRef = doc(db, 'examsync', cid, 'subjects', courseCode, 'paid_users', userId);
      await setDoc(paidRef, { paidAt: serverTimestamp() });
      return { success: true };
    } catch (err) {
      console.error('Error adding paid user:', err);
      throw err;
    }
  },

  // ─── Examite Management ───────────────────────────────────────

  /**
   * Get all examites for a college
   */
  getExamites: async (collegeId) => {
    try {
      const cid = collegeId || getCollegeId();
      const collegeRef = doc(db, 'examsync', cid);
      const collegeSnap = await getDoc(collegeRef);
      if (collegeSnap.exists()) {
        return { data: collegeSnap.data().examites || [] };
      }
      return { data: [] };
    } catch (err) {
      console.error('Error fetching examites:', err);
      return { data: [] };
    }
  },

  /**
   * Add a new examite to the college document
   */
  addExamite: async (collegeId, examiteData) => {
    try {
      const cid = collegeId || getCollegeId();
      const collegeRef = doc(db, 'examsync', cid);
      const collegeSnap = await getDoc(collegeRef);

      if (!collegeSnap.exists()) {
        throw new Error('College not found');
      }

      const data = collegeSnap.data();
      const examites = data.examites || [];

      // Check for duplicate username
      if (examites.some(e => e.username.toLowerCase() === examiteData.username.toLowerCase())) {
        throw new Error('This username is already registered as an examite');
      }

      examites.push({
        username: examiteData.username.trim().toLowerCase(),
        password: examiteData.password,
        subjects: examiteData.subjects || [],
        createdAt: new Date().toISOString(),
      });

      await updateDoc(collegeRef, { examites });
      return { success: true, data: examites };
    } catch (err) {
      console.error('Error adding examite:', err);
      throw err;
    }
  },

  /**
   * Update an examite's assigned subjects
   */
  updateExamiteSubjects: async (collegeId, username, subjects) => {
    try {
      const cid = collegeId || getCollegeId();
      const collegeRef = doc(db, 'examsync', cid);
      const collegeSnap = await getDoc(collegeRef);

      if (!collegeSnap.exists()) throw new Error('College not found');

      const data = collegeSnap.data();
      const examites = (data.examites || []).map(e => {
        if (e.username.toLowerCase() === username.toLowerCase()) {
          return { ...e, subjects: subjects };
        }
        return e;
      });

      await updateDoc(collegeRef, { examites });
      return { success: true, data: examites };
    } catch (err) {
      console.error('Error updating examite subjects:', err);
      throw err;
    }
  },

  /**
   * Remove an examite by username
   */
  removeExamite: async (collegeId, username) => {
    try {
      const cid = collegeId || getCollegeId();
      const collegeRef = doc(db, 'examsync', cid);
      const collegeSnap = await getDoc(collegeRef);

      if (!collegeSnap.exists()) {
        throw new Error('College not found');
      }

      const data = collegeSnap.data();
      const examites = (data.examites || []).filter(
        e => e.username.toLowerCase() !== username.toLowerCase()
      );

      await updateDoc(collegeRef, { examites });
      return { success: true, data: examites };
    } catch (err) {
      console.error('Error removing examite:', err);
      throw err;
    }
  },
};

export default api;

/** Navigation state shared by both dashboards when opening the syllabus editor. */
export const editState = (subject) => ({
  isEdit: true,
  semester: subject.semester,
  subjectName: subject.subjectName || subject.name,
  courseCode: subject.courseCode || subject.code,
  courseType: subject.courseType || subject.category,
  noOfUnits: subject.noOfUnits || subject.units || 1,
  customTags: subject.customTags || [],
  price: subject.price || 0,
  Payment: subject.Payment || false,
});

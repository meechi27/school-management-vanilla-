import { failure, success } from '../reducer-utils.js';

export function schoolReducer(state, action) {
  const payload = action.payload ?? {};

  switch (action.type) {
    case 'ADD_STUDENT': {
      if (!payload.id || !payload.firstName?.trim() || !payload.lastName?.trim()) {
        return failure(state, 'Student ID, first name, and last name are required.');
      }
      if (state.students.some((student) => student.id === payload.id)) {
        return failure(state, 'That student ID is already registered.');
      }
      return success({ ...state, students: [...state.students, payload] }, 'Student registered.');
    }
    case 'UPDATE_STUDENT': {
      if (!payload.id || !payload.firstName?.trim() || !payload.lastName?.trim() || !state.classes.some((item) => item.id === payload.classId)) {
        return failure(state, 'Student identity and a valid class are required.');
      }
      if (state.students.some((student) => student.id === payload.id && student.id !== payload.originalId)) {
        return failure(state, 'That student ID is already registered.');
      }
      return success({
        ...state,
        students: state.students.map((student) =>
          student.id === payload.originalId ? payload : student,
        ),
        routes: state.routes.map((route) => ({
          ...route,
          studentIds: route.studentIds.map((id) =>
            id === payload.originalId ? payload.id : id,
          ),
        })),
      }, 'Student details updated.');
    }
    case 'CHANGE_STUDENT_CLASS':
      if (!state.students.some((student) => student.id === payload.studentId) || !state.classes.some((item) => item.id === payload.classId)) {
        return failure(state, 'Select an existing student and class.');
      }
      return success({
        ...state,
        students: state.students.map((student) =>
          student.id === payload.studentId
            ? { ...student, classId: payload.classId }
            : student,
        ),
      }, 'Student class changed.');
    default:
      return undefined;
  }
}

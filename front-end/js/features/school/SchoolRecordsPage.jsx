import { useState } from 'react';

import {
  Button, DataTable, RecordDrawer, StatCards,
} from '../../components/ui.jsx';
import { ActionForm, ScreenFrame, useScreen } from '../shared/ScreenParts.jsx';

export function SchoolRecordsPage() {
  const screen = useScreen();
  const { state, sendAction } = screen;
  const tab = screen.tab || 'Students';
  const [classFilter, setClassFilter] = useState('');
  const student = screen.selected;
  const className = (id) => state.classes.find((item) => item.id === id)?.name ?? '—';
  const studentFields = [
    { name: 'id', label: 'Student ID', required: true },
    { name: 'firstName', label: 'First name', required: true },
    { name: 'lastName', label: 'Last name', required: true },
    { name: 'classId', label: 'Class', type: 'select', required: true, options: state.classes.map((item) => ({ value: item.id, label: item.name })) },
    { name: 'academicYear', label: 'Academic year', required: true, defaultValue: state.academicYear },
    { name: 'guardianName', label: 'Guardian name' },
    { name: 'guardianPhone', label: 'Guardian phone', type: 'tel' },
  ];
  const formConfig = screen.form?.kind === 'student'
    ? { type: screen.form.record ? 'UPDATE_STUDENT' : 'ADD_STUDENT', title: screen.form.record ? 'Edit student' : 'Register student', fields: studentFields,
      initialValues: screen.form.record,
      transform: (values) => screen.form.record ? { ...values, originalId: screen.form.record.id } : values }
    : screen.form?.kind === 'class'
      ? { type: 'CHANGE_STUDENT_CLASS', title: 'Change class', fields: [{ name: 'classId', label: 'New class', type: 'select', required: true, options: state.classes.map((item) => ({ value: item.id, label: item.name })) }],
        transform: (values) => ({ ...values, studentId: student.id }) }
      : null;
  const filtered = state.students.filter((item) => !classFilter || item.classId === classFilter);
  return (
    <>
      <ScreenFrame activeTab={tab} action={tab === 'Students' && <Button onClick={() => screen.setForm({ kind: 'student' })}>Register Student</Button>} description="Manage students and their academic assignments." onTab={screen.setTab} tabs={['Students', 'Classes', 'Enrollment']} title="School Records">
        <StatCards items={[{ label: 'Total Students', value: state.students.length }, { label: 'Classes', value: state.classes.length }, { label: 'Academic Year', value: state.academicYear }]} />
        {tab === 'Students' && <><label className="filter-field">Filter by class <select onChange={(event) => setClassFilter(event.target.value)} value={classFilter}><option value="">All classes</option>{state.classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><DataTable columns={[{ key: 'id', label: 'Student ID' }, { key: 'firstName', label: 'First Name' }, { key: 'lastName', label: 'Last Name' }, { key: 'classId', label: 'Class', render: (item) => className(item.classId) }, { key: 'academicYear', label: 'Academic Year' }, { key: 'actions', label: 'Actions', render: (item) => <Button onClick={(event) => { event.stopPropagation(); screen.setSelected(item); }} variant="quiet">Details</Button> }]} onRowClick={screen.setSelected} rows={filtered} searchKeys={['firstName', 'lastName', 'id']} /></>}
        {tab === 'Classes' && <DataTable columns={[{ key: 'name', label: 'Class' }, { key: 'academicYear', label: 'Academic Year' }, { key: 'students', label: 'Students', render: (item) => state.students.filter((studentItem) => studentItem.classId === item.id).length }]} onRowClick={(item) => screen.setSelected({ ...item, isClass: true })} rows={state.classes} />}
        {tab === 'Enrollment' && <section className="content-card"><h2>Enrollment by class</h2>{state.classes.map((item) => { const count = state.students.filter((studentItem) => studentItem.classId === item.id).length; return <div className="bar-row" key={item.id}><span>{item.name} · {count} students</span><div className="bar-track"><span style={{ width: `${state.students.length ? count / state.students.length * 100 : 0}%` }} /></div></div>; })}</section>}
      </ScreenFrame>
      {formConfig && <ActionForm config={formConfig} sendAction={sendAction} onClose={() => screen.setForm(null)} state={state} />}
      {student && <RecordDrawer fields={student.isClass ? [['Class', student.name], ['Academic year', student.academicYear], ['Students', state.students.filter((item) => item.classId === student.id).map((item) => `${item.firstName} ${item.lastName}`).join(', ')]] : [['Student ID', student.id], ['Name', `${student.firstName} ${student.lastName}`], ['Class', className(student.classId)], ['Academic year', student.academicYear], ['Guardian', student.guardianName], ['Guardian phone', student.guardianPhone]]} onClose={() => screen.setSelected(null)} record={student} title={student.isClass ? 'Class details' : 'Student details'} actions={!student.isClass && <><Button onClick={() => { screen.setForm({ kind: 'student', record: student }); screen.setSelected(null); }} variant="secondary">Edit</Button><Button onClick={() => screen.setForm({ kind: 'class' })} variant="secondary">Change Class</Button></>} />}
    </>
  );
}

import { useState } from 'react';

import {
  ActionForm,
  Button,
  DataTable,
  RecordDrawer,
  ScreenFrame,
  StatCards,
  useScreen,
} from '../components/ui.jsx';

export function SchoolRecordsPage() {
  const screen = useScreen();
  const { state, sendAction } = screen;
  const tab = screen.tab || 'Students';
  const [classFilter, setClassFilter] = useState('');
  const student = screen.selected;

  const className = (id) =>
    state.classes.find((item) => item.id === id)?.name ?? '—';

  const classOptions = state.classes.map((item) => ({
    value: item.id,
    label: item.name,
  }));

  const studentFields = [
    { name: 'id', label: 'Student ID', required: true },
    { name: 'firstName', label: 'First name', required: true },
    { name: 'lastName', label: 'Last name', required: true },
    { name: 'classId', label: 'Class', type: 'select', required: true, options: classOptions },
    { name: 'academicYear', label: 'Academic year', required: true, defaultValue: state.academicYear },
    { name: 'guardianName', label: 'Guardian name' },
    { name: 'guardianPhone', label: 'Guardian phone', type: 'tel' },
  ];

  let formConfig = null;
  if (screen.form?.kind === 'student') {
    formConfig = {
      type: screen.form.record ? 'UPDATE_STUDENT' : 'ADD_STUDENT',
      title: screen.form.record ? 'Edit student' : 'Register student',
      fields: studentFields,
      initialValues: screen.form.record,
      transform: (values) =>
        screen.form.record ? { ...values, originalId: screen.form.record.id } : values,
    };
  } else if (screen.form?.kind === 'class') {
    formConfig = {
      type: 'CHANGE_STUDENT_CLASS',
      title: 'Change class',
      fields: [{ name: 'classId', label: 'New class', type: 'select', required: true, options: classOptions }],
      transform: (values) => ({ ...values, studentId: student.id }),
    };
  }

  const filteredStudents = state.students.filter(
    (item) => !classFilter || item.classId === classFilter,
  );

  return (
    <>
      <ScreenFrame
        activeTab={tab}
        action={
          tab === 'Students' && (
            <Button onClick={() => screen.setForm({ kind: 'student' })}>
              Register Student
            </Button>
          )
        }
        description="Manage students and their academic assignments."
        onTab={screen.setTab}
        tabs={['Students', 'Classes', 'Enrollment']}
        title="School Records"
      >
        <StatCards
          items={[
            { label: 'Total Students', value: state.students.length },
            { label: 'Classes', value: state.classes.length },
            { label: 'Academic Year', value: state.academicYear },
          ]}
        />

        {tab === 'Students' && (
          <>
            <label className="filter-field">
              Filter by class
              <select
                onChange={(event) => setClassFilter(event.target.value)}
                value={classFilter}
              >
                <option value="">All classes</option>
                {state.classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>

            <DataTable
              columns={[
                { key: 'id', label: 'Student ID' },
                { key: 'firstName', label: 'First Name' },
                { key: 'lastName', label: 'Last Name' },
                { key: 'classId', label: 'Class', render: (item) => className(item.classId) },
                { key: 'academicYear', label: 'Academic Year' },
                {
                  key: 'actions',
                  label: 'Actions',
                  render: (item) => (
                    <Button
                      onClick={(event) => {
                        event.stopPropagation();
                        screen.setSelected(item);
                      }}
                      variant="quiet"
                    >
                      Details
                    </Button>
                  ),
                },
              ]}
              onRowClick={screen.setSelected}
              rows={filteredStudents}
              searchKeys={['firstName', 'lastName', 'id']}
            />
          </>
        )}

        {tab === 'Classes' && (
          <DataTable
            columns={[
              { key: 'name', label: 'Class' },
              { key: 'academicYear', label: 'Academic Year' },
              {
                key: 'students',
                label: 'Students',
                render: (item) =>
                  state.students.filter((studentItem) => studentItem.classId === item.id).length,
              },
            ]}
            onRowClick={(item) => screen.setSelected({ ...item, isClass: true })}
            rows={state.classes}
          />
        )}

        {tab === 'Enrollment' && (
          <section className="content-card">
            <h2>Enrollment by class</h2>
            <div className="space-y-3">
              {state.classes.map((item) => {
                const count = state.students.filter(
                  (studentItem) => studentItem.classId === item.id,
                ).length;
                const percent = state.students.length
                  ? (count / state.students.length) * 100
                  : 0;

                return (
                  <div className="space-y-1" key={item.id}>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground">{count} students</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </ScreenFrame>

      {formConfig && (
        <ActionForm
          config={formConfig}
          onClose={() => screen.setForm(null)}
          sendAction={sendAction}
          state={state}
        />
      )}

      {student && (
        <RecordDrawer
          actions={
            !student.isClass && (
              <>
                <Button
                  onClick={() => {
                    screen.setForm({ kind: 'student', record: student });
                    screen.setSelected(null);
                  }}
                  variant="secondary"
                >
                  Edit
                </Button>
                <Button
                  onClick={() => screen.setForm({ kind: 'class' })}
                  variant="secondary"
                >
                  Change Class
                </Button>
              </>
            )
          }
          fields={
            student.isClass
              ? [
                  ['Class', student.name],
                  ['Academic year', student.academicYear],
                  [
                    'Students',
                    state.students
                      .filter((item) => item.classId === student.id)
                      .map((item) => `${item.firstName} ${item.lastName}`)
                      .join(', '),
                  ],
                ]
              : [
                  ['Student ID', student.id],
                  ['Name', `${student.firstName} ${student.lastName}`],
                  ['Class', className(student.classId)],
                  ['Academic year', student.academicYear],
                  ['Guardian', student.guardianName],
                  ['Guardian phone', student.guardianPhone],
                ]
          }
          onClose={() => screen.setSelected(null)}
          record={student}
          title={student.isClass ? 'Class details' : 'Student details'}
        />
      )}
    </>
  );
}

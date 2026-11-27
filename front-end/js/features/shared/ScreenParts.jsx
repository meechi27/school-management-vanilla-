import { useState } from 'react';

import { FormDialog, PageHeader, Tabs } from '../../components/ui.jsx';
import { useApp } from '../../context/AppContext.jsx';

export function useScreen() {
  const { state, dispatch } = useApp();
  const [tab, setTab] = useState('');
  const [form, setForm] = useState(null);
  const [selected, setSelected] = useState(null);
  return { state, dispatch, tab, setTab, form, setForm, selected, setSelected };
}

export function ActionForm({ config, state, dispatch, onClose }) {
  const { type, title, fields, transform, submitLabel } = config;
  return (
    <FormDialog
      fields={typeof fields === 'function' ? fields(state) : fields}
      initialValues={config.initialValues}
      onClose={onClose}
      onSubmit={(values) => {
        dispatch({ type, payload: transform ? transform(values, state) : values });
        onClose();
      }}
      submitLabel={submitLabel}
      title={title}
      size="large"
    />
  );
}

export function ScreenFrame({ title, description, action, tabs, activeTab, onTab, children }) {
  return (
    <>
      <PageHeader action={action} description={description} title={title} />
      {tabs && <Tabs items={tabs} onChange={onTab} value={activeTab} />}
      {children}
    </>
  );
}

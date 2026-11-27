import { useEffect, useRef, useState } from 'react';

import { useApp } from '../context/AppContext.jsx';

export function PageHeader({ title, description, action }) {
  return (
    <div className="page-heading">
      <div>
        <p className="breadcrumb">Workspace / {title}</p>
        <h1>{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function Button({ children, variant = 'primary', ...props }) {
  return <button className={`button button--${variant}`} {...props}>{children}</button>;
}

export function StatCards({ items }) {
  return (
    <section className="stat-grid" aria-label="Summary">
      {items.map(({ label, value, note }) => (
        <article className="stat-card" key={label}>
          <p>{label}</p>
          <strong>{value}</strong>
          {note && <small>{note}</small>}
        </article>
      ))}
    </section>
  );
}

export function Tabs({ items, value, onChange }) {
  return (
    <div className="tabs" role="tablist" aria-label="Screen sections">
      {items.map((item) => (
        <button
          aria-selected={value === item}
          className="tab"
          key={item}
          onClick={() => onChange(item)}
          role="tab"
          type="button"
        >
          {item}
        </button>
      ))}
    </div>
  );
}

export function StatusBadge({ value }) {
  const label = String(value ?? 'Unknown').replaceAll('_', ' ');
  return <span className={`status-badge status-badge--${label.toLowerCase().replaceAll(' ', '-')}`}>{label}</span>;
}

export function DataTable({ columns, rows, searchKeys = [], empty = 'No records yet.', onRowClick }) {
  const [query, setQuery] = useState('');
  const filtered = rows.filter((row) =>
    !query || searchKeys.some((key) => String(key.split('.').reduce((value, part) => value?.[part], row) ?? '').toLowerCase().includes(query.toLowerCase())),
  );
  return (
    <section className="table-card">
      {searchKeys.length > 0 && (
        <label className="search-field">
          <span className="visually-hidden">Search records</span>
          <input onChange={(event) => setQuery(event.target.value)} placeholder="Search records…" type="search" value={query} />
        </label>
      )}
      <div className="table-scroll">
        <table>
          <thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead>
          <tbody>
            {filtered.map((row) => (
              <tr
                aria-label={onRowClick ? `Open details for ${row.reference ?? row.name ?? row.id}` : undefined}
                key={row.id ?? row.reference}
                onClick={onRowClick ? (event) => {
                  if (event.target instanceof Element && event.target.closest('button, a, input, select, textarea')) return;
                  onRowClick(row);
                } : undefined}
                onKeyDown={onRowClick ? (event) => {
                  if (event.target instanceof Element && event.target.closest('button, a, input, select, textarea')) return;
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onRowClick(row);
                  }
                } : undefined}
                tabIndex={onRowClick ? 0 : undefined}
              >
                {columns.map((column) => (
                  <td key={column.key}>
                    {column.render ? column.render(row) : String(column.key.split('.').reduce((value, part) => value?.[part], row) ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
            {filtered.length === 0 && <tr><td className="empty-cell" colSpan={columns.length}>{empty}</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="table-count">{filtered.length} {filtered.length === 1 ? 'record' : 'records'}</p>
    </section>
  );
}

function useDialogFocus(ref, onClose) {
  useEffect(() => {
    const previousFocus = document.activeElement;
    ref.current?.focus();
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = ref.current?.closest('[role="dialog"]')?.querySelectorAll(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);
}

export function Dialog({ title, onClose, children, size = 'medium' }) {
  const closeRef = useRef(null);
  useDialogFocus(closeRef, onClose);
  return (
    <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section aria-labelledby="dialog-title" aria-modal="true" className={`dialog dialog--${size}`} role="dialog">
        <header className="dialog__header">
          <h2 id="dialog-title">{title}</h2>
          <button aria-label="Close dialog" className="icon-button" onClick={onClose} ref={closeRef} type="button">×</button>
        </header>
        {children}
      </section>
    </div>
  );
}

export function FormDialog({ title, fields, initialValues = {}, onClose, onSubmit, submitLabel = 'Save', size }) {
  const defaults = Object.fromEntries(fields.map((field) => [
    field.name,
    initialValues[field.name] ?? field.defaultValue ??
      (field.type === 'checkbox' ? false : field.type === 'multi-select' ? [] : field.type === 'item-lines' ? [{ itemId: '', quantity: 1, unitPrice: '' }] : ''),
  ]));
  const [values, setValues] = useState(defaults);
  const [error, setError] = useState('');

  function submit(event) {
    event.preventDefault();
    const invalid = fields.find((field) => {
      const value = values[field.name];
      if (field.required && (Array.isArray(value) ? value.length === 0 : String(value ?? '').trim() === '')) return true;
      if (field.type === 'item-lines' && (!value?.length || value.some((line) => Number(line.quantity) <= 0))) return true;
      if (field.type === 'number' && field.min !== undefined && Number(value) < field.min) return true;
      return false;
    });
    if (invalid) {
      setError(`${invalid.label} is required or invalid.`);
      return;
    }
    onSubmit(values);
  }

  return (
    <Dialog onClose={onClose} size={size} title={title}>
      <form className="form-grid" onSubmit={submit}>
        {fields.map((field) => (
          <label className={`form-field ${field.wide ? 'form-field--wide' : ''}`} key={field.name}>
            <span>{field.label}{field.required && <b aria-label="required"> *</b>}</span>
            {field.type === 'textarea' ? (
              <textarea onChange={(event) => setValues({ ...values, [field.name]: event.target.value })} required={field.required} rows={3} value={values[field.name]} />
            ) : field.type === 'select' ? (
              <select onChange={(event) => setValues({ ...values, [field.name]: event.target.value })} required={field.required} value={values[field.name]}>
                {!field.required && <option value="">Select…</option>}
                {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            ) : field.type === 'multi-select' ? (
              <select multiple onChange={(event) => setValues({ ...values, [field.name]: Array.from(event.target.selectedOptions, (option) => option.value) })} value={values[field.name]}>
                {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            ) : field.type === 'checkbox' ? (
              <input checked={Boolean(values[field.name])} onChange={(event) => setValues({ ...values, [field.name]: event.target.checked })} type="checkbox" />
            ) : field.type === 'item-lines' ? (
              <ItemLines
                items={field.items}
                lines={values[field.name] ?? []}
                onChange={(lines) => setValues({ ...values, [field.name]: lines })}
                withPrice={field.withPrice}
              />
            ) : (
              <input
                max={field.max}
                min={field.min}
                onChange={(event) => setValues({ ...values, [field.name]: event.target.value })}
                required={field.required}
                step={field.step}
                type={field.type ?? 'text'}
                value={values[field.name]}
              />
            )}
          </label>
        ))}
        {error && <p className="form-error form-field--wide" role="alert">{error}</p>}
        <footer className="form-actions form-field--wide">
          <Button onClick={onClose} type="button" variant="secondary">Cancel</Button>
          <Button type="submit">{submitLabel}</Button>
        </footer>
      </form>
    </Dialog>
  );
}

function ItemLines({ items, lines, onChange, withPrice }) {
  function update(index, key, value) {
    onChange(lines.map((line, lineIndex) => lineIndex === index ? { ...line, [key]: value } : line));
  }
  return (
    <div className="item-lines">
      {lines.map((line, index) => (
        <div className="item-line" key={index}>
          <select aria-label="Item" onChange={(event) => update(index, 'itemId', event.target.value)} value={line.itemId}>
            <option value="">Choose item</option>
            {items.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.code})</option>)}
          </select>
          <input aria-label="Quantity" min="1" onChange={(event) => update(index, 'quantity', event.target.value)} type="number" value={line.quantity} />
          {withPrice && <input aria-label="Unit price" min="0" onChange={(event) => update(index, 'unitPrice', event.target.value)} placeholder="Unit price" type="number" value={line.unitPrice ?? ''} />}
          <button aria-label="Remove item" className="icon-button" onClick={() => onChange(lines.filter((_, lineIndex) => lineIndex !== index))} type="button">×</button>
        </div>
      ))}
      <Button onClick={() => onChange([...lines, { itemId: '', quantity: 1, unitPrice: '' }])} type="button" variant="secondary">Add item</Button>
    </div>
  );
}

export function Drawer({ title, onClose, children }) {
  const closeRef = useRef(null);
  useDialogFocus(closeRef, onClose);
  return (
    <div className="overlay overlay--drawer" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside aria-labelledby="drawer-title" aria-modal="true" className="drawer" role="dialog">
        <header className="dialog__header">
          <h2 id="drawer-title">{title}</h2>
          <button aria-label="Close details" className="icon-button" onClick={onClose} ref={closeRef} type="button">×</button>
        </header>
        {children}
      </aside>
    </div>
  );
}

export function RecordDrawer({ title, record, fields, onClose, actions }) {
  if (!record) return null;
  return (
    <Drawer onClose={onClose} title={title}>
      <dl className="record-details">
        {fields.map(([label, value]) => (
          <div key={label}><dt>{label}</dt><dd>{value ?? '—'}</dd></div>
        ))}
      </dl>
      {actions && <div className="drawer-actions">{actions}</div>}
    </Drawer>
  );
}

export function ConfirmAction({ children = 'Confirm', title = 'Confirm action', message, onConfirm, variant = 'primary', disabled = false }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button disabled={disabled} onClick={() => setOpen(true)} type="button" variant={variant}>{children}</Button>
      {open && (
        <Dialog onClose={() => setOpen(false)} title={title}>
          <p className="dialog-copy">{message}</p>
          <div className="form-actions">
            <Button onClick={() => setOpen(false)} type="button" variant="secondary">Cancel</Button>
            <Button onClick={() => { onConfirm(); setOpen(false); }} type="button">Confirm</Button>
          </div>
        </Dialog>
      )}
    </>
  );
}

export function Toasts() {
  const { state, dispatch } = useApp();
  return (
    <div aria-live="polite" className="toast-stack">
      {state.notifications.map((notification) => (
        <div className={`toast toast--${notification.type}`} key={notification.id} role={notification.type === 'error' ? 'alert' : 'status'}>
          <span>{notification.message}</span>
          <button aria-label="Dismiss notification" onClick={() => dispatch({ type: 'DISMISS_NOTIFICATION', payload: { id: notification.id } })} type="button">×</button>
        </div>
      ))}
    </div>
  );
}

export function statusColumn(key = 'status') {
  return { key, label: 'Status', render: (row) => <StatusBadge value={key.split('.').reduce((value, part) => value?.[part], row)} /> };
}

export function formatMoney(value) {
  return new Intl.NumberFormat('en-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(Number(value) || 0);
}

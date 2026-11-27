import { useEffect, useRef, useState } from 'react';

import { Button } from './actions.jsx';

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

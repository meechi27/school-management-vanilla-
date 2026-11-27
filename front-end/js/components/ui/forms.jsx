import { useState } from 'react';

import { Button } from './actions.jsx';
import { Dialog } from './overlays.jsx';

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

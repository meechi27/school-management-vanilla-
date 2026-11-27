import { useState } from 'react';

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

export function formatMoney(value) {
  return new Intl.NumberFormat('en-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(Number(value) || 0);
}

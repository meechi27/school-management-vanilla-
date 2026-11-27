import { useState } from 'react';
import { PlusIcon, SearchIcon, Trash2Icon } from 'lucide-react';
import { cn } from 'cn';

import { useApp } from '../context/AppContext.jsx';

import { Badge } from './ui/badge.jsx';
import { Button as ShadcnButton } from './ui/button.jsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card.jsx';
import {
  Dialog as ShadcnDialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog.jsx';
import { Input } from './ui/input.jsx';
import { Label } from './ui/label.jsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table.jsx';
import {
  Tabs as ShadcnTabs,
  TabsList,
  TabsTrigger,
} from './ui/tabs.jsx';
import { Textarea } from './ui/textarea.jsx';

const buttonVariantMap = {
  primary: 'default',
  secondary: 'outline',
  quiet: 'ghost',
  danger: 'destructive',
};

export function Button({ children, variant = 'primary', className, ...props }) {
  const mappedVariant = buttonVariantMap[variant] ?? variant;
  const isPrimary = mappedVariant === 'default';
  return (
    <ShadcnButton
      className={cn(isPrimary && 'button--primary', className)}
      variant={mappedVariant}
      {...props}
    >
      {children}
    </ShadcnButton>
  );
}

export function PageHeader({ title, description, action }) {
  return (
    <div className="page-heading flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Workspace / {title}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="page-description text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function StatCards({ items }) {
  return (
    <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(({ label, value, note }) => (
        <Card key={label} size="sm">
          <CardHeader>
            <CardDescription>{label}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">{value}</CardTitle>
          </CardHeader>
          {note && (
            <CardContent>
              <p className="text-xs text-muted-foreground">{note}</p>
            </CardContent>
          )}
        </Card>
      ))}
    </section>
  );
}

export function Tabs({ items, value, onChange }) {
  return (
    <ShadcnTabs onValueChange={onChange} value={value}>
      <TabsList aria-label="Screen sections">
        {items.map((item) => (
          <TabsTrigger key={item} value={item}>
            {item}
          </TabsTrigger>
        ))}
      </TabsList>
    </ShadcnTabs>
  );
}

const statusToneClasses = {
  approved: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/20',
  fulfilled: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/20',
  completed: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/20',
  selected: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/20',
  resolved: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/20',
  active: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/20',
  pending: 'bg-amber-500/15 text-amber-700 border-amber-500/20',
  pending_approval: 'bg-amber-500/15 text-amber-700 border-amber-500/20',
  scheduled: 'bg-amber-500/15 text-amber-700 border-amber-500/20',
  in_progress: 'bg-blue-500/15 text-blue-700 border-blue-500/20',
  open: 'bg-blue-500/15 text-blue-700 border-blue-500/20',
  rejected: 'bg-destructive/15 text-destructive border-destructive/20',
  cancelled: 'bg-destructive/15 text-destructive border-destructive/20',
  incident: 'bg-destructive/15 text-destructive border-destructive/20',
  maintenance: 'bg-destructive/15 text-destructive border-destructive/20',
};

export function StatusBadge({ value }) {
  const key = String(value ?? 'unknown').toLowerCase();
  const label = String(value ?? 'Unknown').replaceAll('_', ' ');
  return (
    <Badge
      className={cn('capitalize', statusToneClasses[key])}
      variant={statusToneClasses[key] ? 'outline' : 'secondary'}
    >
      {label}
    </Badge>
  );
}

function getNestedValue(row, path) {
  return path.split('.').reduce((value, part) => value?.[part], row);
}

export function DataTable({ columns, rows, searchKeys = [], empty = 'No records yet.', onRowClick }) {
  const [query, setQuery] = useState('');
  const filtered = rows.filter((row) =>
    !query ||
    searchKeys.some((key) =>
      String(getNestedValue(row, key) ?? '')
        .toLowerCase()
        .includes(query.toLowerCase()),
    ),
  );

  return (
    <Card className="overflow-hidden py-0">
      {searchKeys.length > 0 && (
        <div className="border-b border-border p-3">
          <div className="relative max-w-sm">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search records"
              className="pl-8"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search records…"
              type="search"
              value={query}
            />
          </div>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key}>{column.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((row) => (
            <TableRow
              aria-label={onRowClick ? `Open details for ${row.reference ?? row.name ?? row.id}` : undefined}
              className={onRowClick ? 'cursor-pointer' : undefined}
              key={row.id ?? row.reference}
              onClick={
                onRowClick
                  ? (event) => {
                      if (event.target instanceof Element && event.target.closest('button, a, input, select, textarea')) return;
                      onRowClick(row);
                    }
                  : undefined
              }
              onKeyDown={
                onRowClick
                  ? (event) => {
                      if (event.target instanceof Element && event.target.closest('button, a, input, select, textarea')) return;
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onRowClick(row);
                      }
                    }
                  : undefined
              }
              tabIndex={onRowClick ? 0 : undefined}
            >
              {columns.map((column) => (
                <TableCell key={column.key}>
                  {column.render
                    ? column.render(row)
                    : String(getNestedValue(row, column.key) ?? '—')}
                </TableCell>
              ))}
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell className="py-8 text-center text-muted-foreground" colSpan={columns.length}>
                {empty}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="border-t border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? 'record' : 'records'}
      </div>
    </Card>
  );
}

export function formatMoney(value) {
  return new Intl.NumberFormat('en-DZ', {
    style: 'currency',
    currency: 'DZD',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export function Dialog({ title, onClose, children, size = 'medium' }) {
  return (
    <ShadcnDialog onOpenChange={(open) => !open && onClose()} open>
      <DialogContent className={cn(size === 'large' ? 'sm:max-w-2xl' : 'sm:max-w-md')}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </ShadcnDialog>
  );
}

export function RecordDrawer({ title, record, fields, onClose, actions }) {
  if (!record) return null;
  return (
    <Dialog onClose={onClose} size="large" title={title}>
      <dl className="grid gap-3 sm:grid-cols-2">
        {fields.map(([label, value]) => (
          <div className="rounded-lg border border-border bg-muted/30 p-3" key={label}>
            <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
            <dd className="mt-1 text-sm font-medium">{value ?? '—'}</dd>
          </div>
        ))}
      </dl>
      {actions && <div className="flex flex-wrap justify-end gap-2 pt-2">{actions}</div>}
    </Dialog>
  );
}

export function ConfirmAction({
  children = 'Confirm',
  title = 'Confirm action',
  message,
  onConfirm,
  variant = 'primary',
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button disabled={disabled} onClick={() => setOpen(true)} type="button" variant={variant}>
        {children}
      </Button>
      {open && (
        <Dialog onClose={() => setOpen(false)} title={title}>
          <p className="text-sm text-muted-foreground">{message}</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => setOpen(false)} type="button" variant="secondary">
              Cancel
            </Button>
            <Button
              onClick={() => {
                onConfirm();
                setOpen(false);
              }}
              type="button"
              variant="primary"
            >
              Confirm
            </Button>
          </div>
        </Dialog>
      )}
    </>
  );
}

const nativeSelectClass =
  'w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

export function FormDialog({
  title,
  fields,
  initialValues = {},
  onClose,
  onSubmit,
  submitLabel = 'Save',
  size,
}) {
  const defaults = Object.fromEntries(
    fields.map((field) => [
      field.name,
      initialValues[field.name] ??
        field.defaultValue ??
        (field.type === 'checkbox'
          ? false
          : field.type === 'multi-select'
            ? []
            : field.type === 'item-lines'
              ? [{ itemId: '', quantity: 1, unitPrice: '' }]
              : ''),
    ]),
  );
  const [values, setValues] = useState(defaults);
  const [error, setError] = useState('');

  function submit(event) {
    event.preventDefault();
    const invalid = fields.find((field) => {
      const value = values[field.name];
      if (field.required && (Array.isArray(value) ? value.length === 0 : String(value ?? '').trim() === '')) {
        return true;
      }
      if (field.type === 'item-lines' && (!value?.length || value.some((line) => Number(line.quantity) <= 0))) {
        return true;
      }
      if (field.type === 'number' && field.min !== undefined && Number(value) < field.min) {
        return true;
      }
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
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
        {fields.map((field) => (
          <div className={cn('space-y-1.5', field.wide && 'sm:col-span-2')} key={field.name}>
            <Label>
              {field.label}
              {field.required && <span aria-label="required" className="text-destructive"> *</span>}
            </Label>
            {field.type === 'textarea' ? (
              <Textarea
                onChange={(event) => setValues({ ...values, [field.name]: event.target.value })}
                required={field.required}
                rows={3}
                value={values[field.name]}
              />
            ) : field.type === 'select' ? (
              <select
                className={cn(nativeSelectClass, 'h-8')}
                onChange={(event) => setValues({ ...values, [field.name]: event.target.value })}
                required={field.required}
                value={values[field.name]}
              >
                {!field.required && <option value="">Select…</option>}
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : field.type === 'multi-select' ? (
              <select
                className={cn(nativeSelectClass, 'min-h-24')}
                multiple
                onChange={(event) =>
                  setValues({
                    ...values,
                    [field.name]: Array.from(event.target.selectedOptions, (option) => option.value),
                  })
                }
                value={values[field.name]}
              >
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : field.type === 'checkbox' ? (
              <div className="pt-1">
                <input
                  checked={Boolean(values[field.name])}
                  className="size-4 rounded border-input"
                  onChange={(event) => setValues({ ...values, [field.name]: event.target.checked })}
                  type="checkbox"
                />
              </div>
            ) : field.type === 'item-lines' ? (
              <ItemLines
                items={field.items}
                lines={values[field.name] ?? []}
                onChange={(lines) => setValues({ ...values, [field.name]: lines })}
                withPrice={field.withPrice}
              />
            ) : (
              <Input
                max={field.max}
                min={field.min}
                onChange={(event) => setValues({ ...values, [field.name]: event.target.value })}
                required={field.required}
                step={field.step}
                type={field.type ?? 'text'}
                value={values[field.name]}
              />
            )}
          </div>
        ))}
        {error && (
          <p className="text-sm font-medium text-destructive sm:col-span-2" role="alert">
            {error}
          </p>
        )}
        <footer className="flex justify-end gap-2 pt-2 sm:col-span-2">
          <Button onClick={onClose} type="button" variant="secondary">
            Cancel
          </Button>
          <Button type="submit">{submitLabel}</Button>
        </footer>
      </form>
    </Dialog>
  );
}

function ItemLines({ items, lines, onChange, withPrice }) {
  function update(index, key, value) {
    onChange(lines.map((line, lineIndex) => (lineIndex === index ? { ...line, [key]: value } : line)));
  }

  return (
    <div className="space-y-2">
      {lines.map((line, index) => (
        <div className="flex flex-wrap items-center gap-2" key={index}>
          <select
            aria-label="Item"
            className={cn(nativeSelectClass, 'h-8 flex-1 min-w-40')}
            onChange={(event) => update(index, 'itemId', event.target.value)}
            value={line.itemId}
          >
            <option value="">Choose item</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.code})
              </option>
            ))}
          </select>
          <Input
            aria-label="Quantity"
            className="w-24"
            min="1"
            onChange={(event) => update(index, 'quantity', event.target.value)}
            type="number"
            value={line.quantity}
          />
          {withPrice && (
            <Input
              aria-label="Unit price"
              className="w-28"
              min="0"
              onChange={(event) => update(index, 'unitPrice', event.target.value)}
              placeholder="Unit price"
              type="number"
              value={line.unitPrice ?? ''}
            />
          )}
          <Button
            aria-label="Remove item"
            onClick={() => onChange(lines.filter((_, lineIndex) => lineIndex !== index))}
            size="icon"
            type="button"
            variant="quiet"
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      ))}
      <Button
        onClick={() => onChange([...lines, { itemId: '', quantity: 1, unitPrice: '' }])}
        size="sm"
        type="button"
        variant="secondary"
      >
        <PlusIcon className="size-3.5" />
        Add item
      </Button>
    </div>
  );
}

export function useScreen() {
  const { state, sendAction } = useApp();
  const [tab, setTab] = useState('');
  const [form, setForm] = useState(null);
  const [selected, setSelected] = useState(null);
  return { state, sendAction, tab, setTab, form, setForm, selected, setSelected };
}

export function ActionForm({ config, state, sendAction, onClose }) {
  const { type, title, fields, transform, submitLabel } = config;
  return (
    <FormDialog
      fields={typeof fields === 'function' ? fields(state) : fields}
      initialValues={config.initialValues}
      onClose={onClose}
      onSubmit={async (formValues) => {
        const actionSent = await sendAction({
          type,
          payload: transform ? transform(formValues, state) : formValues,
        });
        if (actionSent) onClose();
      }}
      size="large"
      submitLabel={submitLabel}
      title={title}
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

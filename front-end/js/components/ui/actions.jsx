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

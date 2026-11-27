import { useApp } from '../../context/AppContext.jsx';

export function Toasts() {
  const { state, dismissNotification } = useApp();
  return (
    <div aria-live="polite" className="toast-stack">
      {state.notifications.map((notification) => (
        <div className={`toast toast--${notification.type}`} key={notification.id} role={notification.type === 'error' ? 'alert' : 'status'}>
          <span>{notification.message}</span>
          <button aria-label="Dismiss notification" onClick={() => dismissNotification(notification.id)} type="button">×</button>
        </div>
      ))}
    </div>
  );
}

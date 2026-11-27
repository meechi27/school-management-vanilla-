import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { Button } from '../../components/ui.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { dashboardPath } from '../../data/navigation.js';

export function LoginPage() {
  const { user, logIn } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('amira.benali@example.test');
  const [password, setPassword] = useState('schooldemo123');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  if (user) {
    return <Navigate replace to={dashboardPath[user.actorId] ?? '/principal/dashboard'} />;
  }

  async function submitLogin(event) {
    event.preventDefault();
    setError('');
    setIsLoggingIn(true);

    try {
      const signedInUser = await logIn({ email, password });
      navigate(dashboardPath[signedInUser.actorId] ?? '/principal/dashboard', {
        replace: true,
      });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Login failed.');
    } finally {
      setIsLoggingIn(false);
    }
  }

  return (
    <main className="access-selection">
      <header className="access-brand">
        <span aria-hidden="true" className="brand-mark">S</span>
        <p>Secondary School Management</p>
      </header>
      <h1>Sign in</h1>
      <p className="page-description">Use a demo account to open its school workspace.</p>
      <form className="login-form access-card" onSubmit={submitLogin}>
        <label className="form-field" htmlFor="login-email">
          Email
          <input
            autoComplete="username"
            id="login-email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>
        <label className="form-field" htmlFor="login-password">
          Password
          <input
            autoComplete="current-password"
            id="login-password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <Button disabled={isLoggingIn} type="submit">
          {isLoggingIn ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <p className="demo-notice">
        Demo password: <code>schooldemo123</code>. Use any demo email in the README.
      </p>
    </main>
  );
}

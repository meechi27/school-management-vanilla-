import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { Button } from '../components/ui.jsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card.jsx';
import { Input } from '../components/ui/input.jsx';
import { Label } from '../components/ui/label.jsx';
import { useApp } from '../context/AppContext.jsx';
import { dashboardPath } from '../routes.jsx';

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
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-sm space-y-6">
        <header className="flex items-center justify-center gap-2.5 text-sm font-semibold">
          <span
            aria-hidden="true"
            className="flex size-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground"
          >
            S
          </span>
          <span>Secondary School Management</span>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>
              Use a demo account to open its school workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="login-form space-y-4" onSubmit={submitLogin}>
              <div className="space-y-1.5">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  autoComplete="username"
                  id="login-email"
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  type="email"
                  value={email}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  autoComplete="current-password"
                  id="login-password"
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  type="password"
                  value={password}
                />
              </div>

              {error && (
                <p className="text-sm font-medium text-destructive" role="alert">
                  {error}
                </p>
              )}

              <Button className="w-full" disabled={isLoggingIn} type="submit">
                {isLoggingIn ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Demo password: <code className="rounded bg-muted px-1 py-0.5 font-mono">schooldemo123</code>. Use any demo email in the README.
        </p>
      </div>
    </main>
  );
}

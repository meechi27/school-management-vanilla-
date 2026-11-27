import { useNavigate } from 'react-router-dom';

import { useApp } from '../context/AppContext.jsx';
import { Button } from '../components/ui.jsx';

const dashboards = {
  principal: '/principal/dashboard',
  inventory_manager: '/inventory/dashboard',
  teacher: '/teacher/dashboard',
  supplier: '/supplier/dashboard',
  driver: '/driver/dashboard',
};

export function AccessPage() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  return (
    <main className="access-selection">
      <header className="access-brand">
        <span aria-hidden="true" className="brand-mark">S</span>
        <p>Secondary School Management</p>
      </header>
      <h1>Select your working environment</h1>
      <p className="page-description">Choose a demonstration workspace to continue.</p>
      <div className="access-grid">
        {state.actors.map((actor) => (
          <article className="access-card" key={actor.id}>
            <span aria-hidden="true" className="role-mark">{actor.title.slice(0, 1)}</span>
            <h2 className="access-card__name">{actor.title}</h2>
            <p className="access-card__description">{actor.description}</p>
            <Button onClick={() => {
              dispatch({ type: 'SET_ACTOR', payload: { actorId: actor.id } });
              navigate(dashboards[actor.id]);
            }}>Enter Workspace</Button>
          </article>
        ))}
      </div>
      <p className="demo-notice">Demo mode · No password or real account required</p>
    </main>
  );
}

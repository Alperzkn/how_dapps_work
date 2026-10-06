import * as Tooltip from '@radix-ui/react-tooltip';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { AppRoutes } from './app/routes';
import './styles/app.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <Tooltip.Provider delayDuration={150}>
        <AppRoutes />
      </Tooltip.Provider>
    </HashRouter>
  </StrictMode>,
);

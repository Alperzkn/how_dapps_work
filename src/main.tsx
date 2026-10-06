import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/instrument-sans';
import '@fontsource-variable/jetbrains-mono';
import * as Tooltip from '@radix-ui/react-tooltip';
import { MotionConfig } from 'motion/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { AppRoutes } from './app/routes';
import './styles/app.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <MotionConfig reducedMotion="user">
        <Tooltip.Provider delayDuration={150}>
          <AppRoutes />
        </Tooltip.Provider>
      </MotionConfig>
    </HashRouter>
  </StrictMode>,
);

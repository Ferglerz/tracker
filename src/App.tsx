import React, { lazy, Suspense, useEffect } from 'react';
import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact, useIonToast } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { App as CapacitorApp, AppState, URLOpenListenerEvent } from '@capacitor/app'; // Import App and AppState
import { useHistory } from 'react-router-dom';
import Home from './pages/Home';
import { HabitEntity } from '@utils/HabitEntity';
import { HabitStorage } from '@utils/Storage';

if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as Window & { HabitEntity?: typeof HabitEntity }).HabitEntity = HabitEntity;
}

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

const WidgetConfig = lazy(() => import('./pages/WidgetConfig'));

setupIonicReact();

const AppContent: React.FC = () => {
  const [present] = useIonToast();
  const history = useHistory();

  useEffect(() => {
    let mounted = true;
    let stateListener: Promise<{ remove: () => Promise<void> }> | null = null;
    let urlListener: Promise<{ remove: () => Promise<void> }> | null = null;

    const handleAppStateChange = async ({ isActive }: AppState) => {
      try {
        if (isActive && mounted) {
          await HabitEntity.loadAll();
        } else if (!isActive) {
          await HabitStorage.getInstance().flushSave();
        }
      } catch {
        if (mounted) {
          present({
            message: isActive
              ? 'Failed to reload habit data. Please reopen the app.'
              : 'Failed to finish saving habit data.',
            duration: 4000,
            position: 'top',
            color: 'danger',
          });
        }
      }
    };

    const handleUrlOpen = (event: URLOpenListenerEvent) => {
      try {
        const url = new URL(event.url);
        if (url.host === 'widget-config') {
          history.push('/widget-config');
        } else if (url.host === 'habit') {
          const habitId = url.pathname.replace(/^\/+/, '');
          if (habitId) {
            history.push(`/home?openHabit=${encodeURIComponent(habitId)}`);
          } else {
            present({
              message: 'Habit link is invalid.',
              duration: 2500,
              position: 'top',
              color: 'warning',
            });
          }
        }
      } catch {
        present({
          message: 'Could not open invalid app link.',
          duration: 2500,
          position: 'top',
          color: 'warning',
        });
      }
    };

    stateListener = CapacitorApp.addListener('appStateChange', handleAppStateChange);
    urlListener = CapacitorApp.addListener('appUrlOpen', handleUrlOpen);

    // Clean up to prevent state updates after unmount
    return () => {
      mounted = false;
      if (stateListener) {
        stateListener.then(h => h.remove());
      }
      if (urlListener) {
        urlListener.then(h => h.remove());
      }
    };
  }, [history, present]);

  return (
    <div className="app-container">
      <IonRouterOutlet>
        <Route exact path="/home" component={Home} />
        <Route exact path="/widget-config">
          <Suspense fallback={null}>
            <WidgetConfig />
          </Suspense>
        </Route>
        <Route exact path="/">
          <Redirect to="/home" />
        </Route>
      </IonRouterOutlet>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <IonApp>
      <IonReactRouter>
        <AppContent />
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
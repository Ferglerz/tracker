import React, { useEffect } from 'react';
import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { App as CapacitorApp, AppState } from '@capacitor/app'; // Import App and AppState
import Home from './pages/Home';
import { HabitEntity } from '@utils/HabitEntity'; // Import HabitEntity

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
import WidgetConfig from './pages/WidgetConfig';

setupIonicReact();

const App: React.FC = () => {

  useEffect(() => {
    let mounted = true;
    
    const handleAppStateChange = async ({ isActive }: AppState) => {
      console.log('App state changed, isActive:', isActive);
      
      if (isActive && mounted) {
        try {
          await HabitEntity.loadAll(); 
          console.log('Completed refresh after app state change');
        } catch (error) {
          console.error('Error refreshing after app state change:', error);
        }
      }
    };
  
    CapacitorApp.addListener('appStateChange', handleAppStateChange);
  
    // Clean up to prevent state updates after unmount
    return () => {
      mounted = false;
      CapacitorApp.removeAllListeners();
    };
  }, []);

  return (
    <IonApp>
      <IonReactRouter>
        <div style={{ 
          maxWidth: '450px', 
          margin: '0 auto', 
          height: '100%',
          width: '100%',
          position: 'relative'
        }}>
          <IonRouterOutlet>
            <Route exact path="/home" component={Home} />
            <Route exact path="/widget-config" component={WidgetConfig} />
            <Route exact path="/">
              <Redirect to="/home" />
            </Route>
          </IonRouterOutlet>
        </div>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
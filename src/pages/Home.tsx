import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonFab,
  IonFabButton,
  IonIcon,
  IonInput,
  IonRadioGroup,
  IonRadio,
  IonButtons,
  IonCheckbox,
  IonBadge,
  IonItemSliding,
  IonItemOption,
  IonItemOptions,
  IonModal,
  IonAlert,
  IonToast,
  IonRippleEffect,
} from '@ionic/react';
import { add, remove, pencil, trash, calendar, checkmark, downloadOutline } from 'ionicons/icons';
import { format } from 'date-fns';
import { HabitStorageAPI, type Habit, type HabitData } from './HabitStorage';
import { 
  updateQuantity, 
  updateCheckbox, 
  deleteHabit,
  exportHabitHistoryToCSV
} from './home.functions';

const PRESET_COLORS = [
  '#ff9aa2',
  '#ffb7b2',
  '#ffdac1',
  '#e2f0cb',
  '#b5ead7',
  '#c7ceea',
  '#9b9b9b',
  '#f8c8dc'
];

interface HabitFormProps {
  onClose: () => void;
  onSave: (habit: Omit<Habit, 'id' | 'isChecked' | 'isComplete' | 'isBegun' | 'quantity'>) => void;
  initialData?: Habit;
  title: string;
}

const HabitForm: React.FC<HabitFormProps> = ({ onClose, onSave, initialData, title }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [type, setType] = useState<'checkbox' | 'quantity'>(initialData?.type || 'checkbox');
  const [unit, setUnit] = useState(initialData?.unit || '');
  const [goal, setGoal] = useState<number | undefined>(initialData?.goal);
  const [color, setColor] = useState(initialData?.bgColor || PRESET_COLORS[0]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name,
      type,
      unit: type === 'quantity' ? unit : undefined,
      goal: type === 'quantity' ? goal : undefined,
      bgColor: color
    });
  };

  return (
    <IonModal isOpen={true} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{title}</IonTitle>
          <IonButtons slot="start">
            <IonButton onClick={onClose}>Cancel</IonButton>
          </IonButtons>
          <IonButtons slot="end">
            <IonButton strong={true} onClick={handleSave}>Save</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonList>
          <IonItem>
            <IonLabel position="stacked">Habit Name</IonLabel>
            <IonInput value={name} onIonInput={e => setName(e.detail.value!)} placeholder="Enter habit name" />
          </IonItem>
          
          {!initialData && (
            <IonRadioGroup value={type} onIonChange={e => setType(e.detail.value)}>
              <div style={{ display: 'flex', width: '100%' }}>
                <IonItem 
                  style={{ flex: 1, cursor: 'pointer' }}
                  onClick={() => setType('checkbox')}
                >
                  <IonLabel>Checkbox</IonLabel>
                  <IonRadio slot="start" value="checkbox" />
                </IonItem>
                <IonItem 
                  style={{ flex: 1, cursor: 'pointer' }}
                  onClick={() => setType('quantity')}
                >
                  <IonLabel>Quantity</IonLabel>
                  <IonRadio slot="start" value="quantity" />
                </IonItem>
              </div>
            </IonRadioGroup>
          )}

          {type === 'quantity' && (
            <>
              <IonItem>
                <IonLabel position="stacked">Unit</IonLabel>
                <IonInput value={unit} onIonInput={e => setUnit(e.detail.value!)} placeholder="Enter unit (e.g., cups, minutes)" />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Goal (optional)</IonLabel>
                <IonInput type="number" value={goal} onIonInput={e => setGoal(Number(e.detail.value))} placeholder="Enter target quantity" />
              </IonItem>
            </>
          )}
          <IonItem>
            <IonLabel position="stacked">Color</IonLabel>
            <div style={{ display: 'flex', gap: '10px', padding: '10px 0' }}>
              {PRESET_COLORS.map((presetColor) => (
                <div
                  key={presetColor}
                  onClick={() => setColor(presetColor)}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    backgroundColor: presetColor,
                    cursor: 'pointer',
                    border: color === presetColor ? '2px solid #000' : '2px solid transparent',
                    position: 'relative'
                  }}
                >
                  {color === presetColor && (
                    <IonIcon
                      icon={checkmark}
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: '#000'
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </IonItem>
        </IonList>
      </IonContent>
    </IonModal>
  );
};

const Home: React.FC = () => {
  const history = useHistory();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [habitToDelete, setHabitToDelete] = useState<string | null>(null);
  const [showLongPressToast, setShowLongPressToast] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDebugToast, setShowDebugToast] = useState(false);
  const [debugData, setDebugData] = useState('');

  const handleExport = async () => {
    try {
      await exportHabitHistoryToCSV(habits);
    } catch (error) {
      console.error('Export error:', error);
      setErrorMessage('Failed to export habit data');
      setShowErrorToast(true);
    }
  };

  let longPressTimer: NodeJS.Timeout;

  const handleLongPress = (habit: Habit) => {
    longPressTimer = setTimeout(() => {
      setSelectedHabit(habit);
      setShowLongPressToast(true);
    }, 500);
  };

  const handlePressEnd = () => {
    clearTimeout(longPressTimer);
  };
  

  useEffect(() => {
    const initData = async () => {
      try {
        console.log('Loading initial data...');
        const data = await HabitStorageAPI.handleHabitData('load') as HabitData;
        console.log('Loaded data:', data);
        
        // Set debug data
        setDebugData(JSON.stringify({
          rawData: data,
          habitCount: data.habits?.length || 0,
          hasHistory: Object.keys(data.history || {}).length > 0
        }, null, 2));
        setShowDebugToast(true);
        
        setHabits(data.habits || []);
      } catch (error) {
        console.error('Error loading initial data:', error);
        setErrorMessage('Failed to load habits');
        setShowErrorToast(true);
      }
    };
    initData();
  }, []);
  
  useEffect(() => {
    const saveHabitsData = async () => {
      if (habits.length > 0) {
        try {
          console.log('Saving habits data:', habits);
          // Direct save without reloading first
          await HabitStorageAPI.handleHabitData('save', { 
            habits,
            history: {} // History will be merged in the storage layer
          });
        } catch (error) {
          console.error('Error saving habits data:', error);
          setErrorMessage('Failed to save habits');
          setShowErrorToast(true);
        }
      }
    };
    saveHabitsData();
  }, [habits]);

  const handleUpdateQuantity = async (id: string, delta: number) => {
    try {
      const updatedHabits = await updateQuantity(habits, id, delta);
      setHabits(updatedHabits);
    } catch (error) {
      console.error('Error updating quantity:', error);
      setErrorMessage('Failed to update quantity');
      setShowErrorToast(true);
    }
  };

  const handleUpdateCheckbox = async (id: string, checked: boolean) => {
    try {
      const updatedHabits = await updateCheckbox(habits, id, checked);
      setHabits(updatedHabits);
    } catch (error) {
      console.error('Error updating checkbox:', error);
      setErrorMessage('Failed to update habit');
      setShowErrorToast(true);
    }
  };

  const handleDeleteHabit = async (id: string) => {
    try {
      const updatedHabits = await deleteHabit(habits, id);
      setHabits(updatedHabits);
    } catch (error) {
      console.error('Error deleting habit:', error);
      setErrorMessage('Failed to delete habit');
      setShowErrorToast(true);
    }
  };

  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setShowForm(true);
  };

  const handleViewCalendar = (habit: Habit) => {
    history.push(`/habit/${habit.id}/calendar`, { habit: habit });
  };

  const handleSaveHabit = async (habitData: Omit<Habit, 'id' | 'isChecked' | 'isComplete' | 'isBegun' | 'quantity'>) => {
    try {
      console.log('Starting habit save process...');
      const data = await HabitStorageAPI.handleHabitData('load') as HabitData;
      console.log('Loaded existing data:', data);
      
      let updatedHabits: Habit[];
      const currentHabits = data.habits?.length ? data.habits : habits;
      
      if (editingHabit) {
        console.log('Editing existing habit:', editingHabit.id);
        updatedHabits = currentHabits.map(h => 
          h.id === editingHabit.id 
            ? { ...h, ...habitData }
            : h
        );
      } else {
        console.log('Creating new habit');
        const newHabit: Habit = {
          ...habitData,
          id: Date.now().toString(),
          quantity: 0,
          isChecked: false,
          isComplete: false,
          isBegun: false
        };
        updatedHabits = [...currentHabits, newHabit];
      }
      
      console.log('Saving updated habits:', updatedHabits);
      await HabitStorageAPI.handleHabitData('save', {
        habits: updatedHabits,
        history: data.history || {}
      });
      
      setHabits(updatedHabits);
      setShowForm(false);
      setEditingHabit(null);
      
    } catch (error) {
      console.error('Error saving habit:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to save habit';
      setErrorMessage(`Error: ${errorMsg}`);
      setShowErrorToast(true);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle className="ion-text-center">Habits</IonTitle>
          {habits.length > 0 && (
            <IonButtons slot="end">
              <IonButton onClick={handleExport}>
                <IonIcon slot="icon-only" icon={downloadOutline} />
              </IonButton>
            </IonButtons>
          )}
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {habits.length === 0 ? (
          <div className="ion-padding ion-text-center" style={{ marginTop: '2rem' }}>
            Add a new habit to track with the + button, bottom right.
          </div>
        ) : (
          <IonList>
            {habits.map((habit) => (
              <React.Fragment key={habit.id}>
                <IonItemSliding>
                  <IonItem 
                    className="ion-activatable habit"
                    onTouchStart={() => handleLongPress(habit)}
                    onTouchEnd={handlePressEnd}
                    onMouseDown={() => handleLongPress(habit)}
                    onMouseUp={handlePressEnd}
                    onMouseLeave={handlePressEnd}
                  >
                    {habit.type === 'checkbox' ? (
                      <>
                        <IonCheckbox
                          slot="start"
                          checked={habit.isChecked}
                          onIonChange={(e) => handleUpdateCheckbox(habit.id, e.detail.checked)}
                          style={{ zIndex: 1, '--background': 'transparent' }}
                          labelPlacement="end"
                        />
                        {habit.name}
                      </>
                    ) : (
                      <>
                        <IonLabel style={{ zIndex: 1 }}>
                          <h2>{habit.name}</h2>
                          <p>{habit.quantity}{habit.goal ? ` / ${habit.goal}` : ''} {habit.unit}</p>
                        </IonLabel>
                        {habit.isComplete && <IonBadge color="success" style={{ zIndex: 1 }}>Complete!</IonBadge>}
                        <div slot="end" style={{ display: 'flex', alignItems: 'center', zIndex: 1 }}>
                          <IonButton
                            fill="clear"
                            onClick={() => handleUpdateQuantity(habit.id, -1)}
                          >
                            <IonIcon icon={remove} />
                          </IonButton>
                          <IonButton
                            fill="clear"
                            onClick={() => handleUpdateQuantity(habit.id, 1)}
                          >
                            <IonIcon icon={add} />
                          </IonButton>
                        </div>
                      </>
                    )}
                    <IonRippleEffect />
                  </IonItem>
                  <IonItemOptions side="end">
                    <IonItemOption color="primary" onClick={() => handleViewCalendar(habit)}>
                      <IonIcon slot="icon-only" icon={calendar} />
                    </IonItemOption>
                    <IonItemOption color="warning" onClick={() => handleEdit(habit)}>
                      <IonIcon slot="icon-only" icon={pencil} />
                    </IonItemOption>
                    <IonItemOption color="danger" onClick={() => setHabitToDelete(habit.id)}>
                      <IonIcon slot="icon-only" icon={trash} />
                    </IonItemOption>
                  </IonItemOptions>
                </IonItemSliding>
                <div className="habitDivider" />
              </React.Fragment>
            ))}
          </IonList>
        )}

        <IonToast
          isOpen={showDebugToast}
          onDidDismiss={() => setShowDebugToast(false)}
          message={`Debug Data: ${debugData}`}
          duration={10000}
          position="middle"
          buttons={[
            {
              text: 'Copy',
              handler: () => {
                navigator.clipboard.writeText(debugData);
              }
            },
            {
              text: 'Dismiss',
              role: 'cancel'
            }
          ]}
        />

        <IonToast
          isOpen={showLongPressToast}
          onDidDismiss={() => setShowLongPressToast(false)}
          message={`Long pressed: ${selectedHabit?.name}`}
          duration={5000}
          position="bottom"
          buttons={[
            {
              text: 'Dismiss',
              role: 'cancel'
            }
          ]}
        />

        <IonAlert
          isOpen={!!habitToDelete}
          onDidDismiss={() => setHabitToDelete(null)}
          header="Delete Habit"
          message="Are you sure you want to delete this habit? This action cannot be undone."
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel'
            },
            {
              text: 'Delete',
              role: 'destructive',
              handler: () => {
                if (habitToDelete) handleDeleteHabit(habitToDelete);
              }
            }
          ]}
        />

        <IonToast
          isOpen={showErrorToast}
          onDidDismiss={() => {
            setShowErrorToast(false);
            setErrorMessage('');
          }}
          message={errorMessage}
          duration={3000}
          position="bottom"
          color="danger"
          buttons={[
            {
              text: 'Dismiss',
              role: 'cancel',
            }
          ]}
        />

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => {
            setEditingHabit(null);
            setShowForm(true);
          }}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        {showForm && (
          <HabitForm 
            title={editingHabit ? "Edit Habit" : "New Habit"}
            initialData={editingHabit || undefined}
            onClose={() => {
              setShowForm(false);
              setEditingHabit(null);
            }}
            onSave={handleSaveHabit}
          />
        )}
      </IonContent>
    </IonPage>
  );
};

export default Home;
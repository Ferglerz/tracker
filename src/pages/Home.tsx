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
import {
  Habit,
  loadHabits,
  saveHabits,
  updateQuantity,
  updateCheckbox,
  deleteHabit,
  createHabit,
  editHabit,
  loadHistory,
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
  const [habitHistory, setHabitHistory] = useState<Record<string, Record<string, number | boolean>>>({});
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [habitToDelete, setHabitToDelete] = useState<string | null>(null);
  const [showLongPressToast, setShowLongPressToast] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const today = format(new Date(), 'yyyy-MM-dd');

  const handleExport = async () => {
    try {
      await exportHabitHistoryToCSV(habits);
    } catch (error) {
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
      const [loadedHabits, loadedHistory] = await Promise.all([
        loadHabits(),
        loadHistory()
      ]);
      setHabits(loadedHabits);
      setHabitHistory(loadedHistory);
    };
    initData();
  }, []);

  useEffect(() => {
    const saveHabitsData = async () => {
      await saveHabits(habits);
    };
    saveHabitsData();
  }, [habits]);

  const handleUpdateQuantity = async (id: string, delta: number) => {
    const updatedHabits = await updateQuantity(habits, id, delta);
    setHabits(updatedHabits);
  };

  const handleUpdateCheckbox = async (id: string, checked: boolean) => {
    const updatedHabits = await updateCheckbox(habits, id, checked);
    setHabits(updatedHabits);
  };

  const handleDeleteHabit = (id: string) => {
    setHabits(prevHabits => deleteHabit(prevHabits, id));
  };

  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setShowForm(true);
  };

  const handleViewCalendar = (habit: Habit) => {
    history.push(`/habit/${habit.id}/calendar`, { habit: habit });
  };

  return (
    <IonPage>
      <IonHeader>
      <IonToolbar>
          <IonTitle class="ion-text-center">Habits</IonTitle>
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
        onDidDismiss={() => setShowErrorToast(false)}
        message="Failed to export habit data. Please try again."
        duration={3000}
        position="bottom"
        color="danger"
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
            onSave={(habitData) => {
              if (editingHabit) {
                setHabits(prevHabits => editHabit(prevHabits, editingHabit.id, habitData));
              } else {
                setHabits(prevHabits => createHabit(prevHabits, habitData));
              }
              setShowForm(false);
              setEditingHabit(null);
            }}
          />
        )}
      </IonContent>
    </IonPage>
  );
};

export default Home;
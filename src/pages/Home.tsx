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
  IonSelect,
  IonSelectOption,
  IonButtons,
  IonCheckbox,
  IonBadge,
  IonItemSliding,
  IonItemOption,
  IonItemOptions,
  IonModal
} from '@ionic/react';
import { add, remove, pencil, trash } from 'ionicons/icons';
import {
  Habit,
  loadHabits,
  saveHabits,
  updateQuantity,
  updateCheckbox,
  deleteHabit,
  createHabit,
  editHabit
} from './home.functions';

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

  const handleSave = () => {
    if (!name.trim()) return;

    const habitData = {
      name,
      type,
      unit: type === 'quantity' ? unit : undefined,
      goal: type === 'quantity' ? goal : undefined,
    };

    onSave(habitData);
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
            <IonButton strong={true} onClick={handleSave}>
              Save
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonList>
          <IonItem>
            <IonLabel position="stacked">Habit Name</IonLabel>
            <IonInput 
              value={name} 
              onIonInput={e => setName(e.detail.value!)} 
              placeholder="Enter habit name"
            />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Type</IonLabel>
            <IonSelect 
              value={type} 
              onIonChange={e => setType(e.detail.value)}
              disabled={!!initialData}
            >
              <IonSelectOption value="checkbox">Checkbox</IonSelectOption>
              <IonSelectOption value="quantity">Quantity</IonSelectOption>
            </IonSelect>
          </IonItem>
          {type === 'quantity' && (
            <>
              <IonItem>
                <IonLabel position="stacked">Unit</IonLabel>
                <IonInput 
                  value={unit} 
                  onIonInput={e => setUnit(e.detail.value!)} 
                  placeholder="Enter unit (e.g., cups, minutes)"
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Goal (optional)</IonLabel>
                <IonInput 
                  type="number"
                  value={goal} 
                  onIonInput={e => setGoal(Number(e.detail.value))} 
                  placeholder="Enter target quantity"
                />
              </IonItem>
            </>
          )}
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

  useEffect(() => {
    const initHabits = async () => {
      const loadedHabits = await loadHabits();
      setHabits(loadedHabits);
    };
    initHabits();
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

  const handleHabitClick = (habit: Habit) => {
    history.push(`/habit/${habit.id}`, { habit });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Habit Tracker</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList>
          {habits.map((habit) => (
              <IonItemSliding key={habit.id}>
  {habit.type === 'checkbox' ? (
    <IonItem>
      <IonCheckbox 
        slot="start"
        checked={habit.isChecked}
        onIonChange={(e) => {
          e.stopPropagation();
          handleUpdateCheckbox(habit.id, e.detail.checked);
        }}
      />
      <IonLabel onClick={() => handleHabitClick(habit.id)}>{habit.name}</IonLabel>
    </IonItem>
  ) : (
    <IonItem style={{ minHeight: '48px' }}> {/* Add minimum height */}
      <div style={{ 
        display: 'flex', 
        width: '100%', 
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 'inherit'
      }}>
        <div 
          onClick={() => handleHabitClick(habit.id)} 
          style={{ 
            flex: '1 1 auto',
            cursor: 'pointer',
            paddingRight: '8px'
          }}
        >
          <IonLabel>
            <h2>{habit.name}</h2>
            <p style={{ margin: '0' }}>{habit.quantity} {habit.unit} {habit.goal ? `/ ${habit.goal} ${habit.unit}` : ''}</p>
          </IonLabel>
          {habit.isComplete && <IonBadge color="success">Complete!</IonBadge>}
        </div>
        <div 
          onClick={e => e.stopPropagation()} 
          style={{ 
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0
          }}
        >
          <IonButton 
            fill="clear"
            onClick={() => handleUpdateQuantity(habit.id, -1)}
            style={{ margin: 0 }}
          >
            <IonIcon icon={remove} />
          </IonButton>
          <IonButton 
            fill="clear"
            onClick={() => handleUpdateQuantity(habit.id, 1)}
            style={{ margin: 0 }}
          >
            <IonIcon icon={add} />
          </IonButton>
        </div>
      </div>
    </IonItem>
  )}
  <IonItemOptions side="end">
    <IonItemOption color="warning" onClick={() => handleEdit(habit)}>
      <IonIcon slot="icon-only" icon={pencil} />
    </IonItemOption>
    <IonItemOption color="danger" onClick={() => handleDeleteHabit(habit.id)}>
      <IonIcon slot="icon-only" icon={trash} />
    </IonItemOption>
  </IonItemOptions>
</IonItemSliding>
          ))}
        </IonList>
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => {
            setEditingHabit(null);
            setShowForm(true);
          }}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
        <IonModal isOpen={showForm} onDidDismiss={() => setShowForm(false)}>
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
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Home;
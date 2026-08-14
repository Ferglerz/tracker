describe('Widget Config Bug Verification', () => {
  it('Should correctly list a habit in the pool on lock screen if it has homescreen assignment but no lock screen assignment', () => {
    cy.viewport(1000, 1000);
    cy.visit('/');

    // Clear storage first so we start fresh
    cy.window().then((win) => {
      win.localStorage.clear();
      // Also clear IndexedDB database if Ionic Storage uses it
      if (win.indexedDB) {
        win.indexedDB.deleteDatabase('_ionickv');
      }
    });

    cy.visit('/');

    // 1. Create habit via HabitEntity static method
    cy.window().should('have.property', 'HabitEntity').then(async (win) => {
      const HabitEntity = win.HabitEntity!;
      const today = new Date();
      const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      await HabitEntity.create({
        id: 'exercise-id',
        name: 'Exercise',
        type: 'checkbox',
        goal: 1,
        bgColor: '#3880f4',
        quantity: 0,
        history: {
          [todayKey]: { quantity: 0, goal: 1 }
        }
      });

      // Assign to lock1-1 and small1-1
      await HabitEntity.applyWidgetAssignmentBatch([
        {
          habitId: 'exercise-id',
          widgets: {
            assignments: [
              { type: 'lock1', order: 1 },
              { type: 'small1', order: 1 }
            ]
          }
        }
      ]);

      // Load all to trigger subject.next and update UI
      await HabitEntity.loadAll();
    });

    // 2. Go to Widget Configuration
    cy.get('ion-buttons[slot="start"] ion-button').eq(1).click({ force: true });
    cy.url().should('include', '/widget-config');

    // Check that we are on Lock Screen tab by default and Exercise is NOT in the Available Habits pool
    cy.contains('Available Habits').should('exist');
    cy.contains('Available Habits').parent().contains('Exercise').should('not.exist');

    // 3. Programmatically drag off / remove lock1-1 assignment (simulating drop on pool)
    cy.window().should('have.property', 'HabitEntity').then(async (win) => {
      const HabitEntity = win.HabitEntity!;
      await HabitEntity.applyWidgetAssignmentBatch([
        {
          habitId: 'exercise-id',
          widgets: {
            assignments: [
              { type: 'small1', order: 1 }
            ]
          }
        }
      ]);
    });

    // 4. Verify it now SHOWS UP in the pool on Lock Screen tab
    cy.contains('Available Habits').parent().contains('Exercise').should('exist');

    // 5. Switch to Homescreen tab
    cy.get('ion-segment-button[value="home"]').click();

    // Verify it is NOT in the pool on Homescreen tab (since it is still assigned to small1-1)
    cy.contains('Available Habits').parent().contains('Exercise').should('not.exist');

    // 6. Switch back to Lock Screen tab
    cy.get('ion-segment-button[value="lock"]').click();

    // Verify it IS in the pool on Lock Screen tab
    cy.contains('Available Habits').parent().contains('Exercise').should('exist');
  });
});
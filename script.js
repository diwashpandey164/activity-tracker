document.addEventListener('DOMContentLoaded', () => {
    const addActivityForm = document.getElementById('add-activity-form');
    const newActivityNameInput = document.getElementById('new-activity-name');
    const newActivityTypeSelect = document.getElementById('new-activity-type');
    const newActivityStreakTypeSelect = document.getElementById('new-activity-streak-type');
    const activityListContainer = document.getElementById('activity-list');
    const todayDateDisplay = document.getElementById('today-date-display');
    const streakListContainer = document.getElementById('streak-list');
    const historyContainer = document.getElementById('activity-history');
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    // Load theme preference from local storage
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark') {
        body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i> <span>Light Mode</span>'; // Sun icon for light mode
    } else {
        themeToggle.innerHTML = '<i class="fas fa-moon"></i> <span>Dark Mode</span>'; // Moon icon for dark mode
    }

    // Toggle theme
    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        const isDarkMode = body.classList.contains('dark-mode');
        if (isDarkMode) {
            themeToggle.innerHTML = '<i class="fas fa-sun"></i> <span>Light Mode</span>';
        } else {
            themeToggle.innerHTML = '<i class="fas fa-moon"></i> <span>Dark Mode</span>';
        }
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    });

    // Load data from local storage
    let activities = JSON.parse(localStorage.getItem('activities')) || [];
    let dailyLogs = JSON.parse(localStorage.getItem('dailyLogs')) || {};

    // Save data to local storage
    const saveData = () => {
        localStorage.setItem('activities', JSON.stringify(activities));
        localStorage.setItem('dailyLogs', JSON.stringify(dailyLogs));
    };

    // Get today's date in YYYY-MM-DD format
    const getTodayDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    const getFormattedDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    const todayDate = getTodayDate();
    todayDateDisplay.textContent = getFormattedDate(todayDate);

    // Initialize today's log if it doesn't exist, using the stored activities
    if (!dailyLogs.hasOwnProperty(todayDate)) {
        dailyLogs = {
            ...dailyLogs,
            [`${todayDate}`]: activities.map(activity => ({
                name: activity.name,
                type: activity.type,
                unit: activity.unit || '',
                completed: false,
                value: activity.type === 'quantity' ? 0 : false,
                streakCountType: activity.streakCountType || 'count-if-done' // Default to 'count-if-done'
            }))
        };
    } else {
        // Handle new activities added after today's log was created
        const existingActivities = dailyLogs[`${todayDate}`].map(a => a.name);
        activities.forEach(activity => {
            if (!existingActivities.includes(activity.name)) {
                dailyLogs[`${todayDate}`].push({
                    name: activity.name,
                    type: activity.type,
                    unit: activity.unit || '',
                    completed: false,
                    value: activity.type === 'quantity' ? 0 : false,
                    streakCountType: activity.streakCountType || 'count-if-done'
                });
            }
        });
    }

    // Render daily activities
    const renderActivities = () => {
        activityListContainer.innerHTML = '';
        dailyLogs[`${todayDate}`].forEach(activity => {
            const card = document.createElement('div');
            card.className = `activity-card ${activity.completed ? 'completed' : ''}`;
            card.dataset.activityName = activity.name;

            const activityName = document.createElement('span');
            activityName.textContent = activity.name;
            card.appendChild(activityName);

            const inputGroup = document.createElement('div');
            inputGroup.className = 'input-group';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = activity.completed;
            checkbox.addEventListener('change', (e) => {
                activity.completed = e.target.checked;
                // Only reset quantity if it's a quantity type and unchecked
                if (!e.target.checked && activity.type === 'quantity') {
                    activity.value = 0;
                }
                // Update quantity input display if it exists and is a quantity type
                const quantityInput = card.querySelector('input[type="number"]');
                if (quantityInput) {
                    quantityInput.style.display = e.target.checked ? 'inline-block' : 'none';
                }
                saveData();
                renderActivities(); // Re-render to update completed class and quantity display
                renderStreaks();
                renderHistory();
            });
            inputGroup.appendChild(checkbox);

            // Only render quantity input if the activity type is 'quantity'
            if (activity.type === 'quantity') {
                const quantityInput = document.createElement('input');
                quantityInput.type = 'number';
                quantityInput.placeholder = 'Qty';
                quantityInput.value = activity.value;
                quantityInput.style.display = activity.completed ? 'inline-block' : 'none'; // Show only if completed
                quantityInput.addEventListener('input', (e) => {
                    activity.value = parseInt(e.target.value) || 0;
                    activity.completed = activity.value > 0; // Mark as completed if quantity > 0
                    checkbox.checked = activity.completed; // Update checkbox state
                    saveData();
                    renderActivities();
                    renderStreaks();
                    renderHistory();
                });
                inputGroup.appendChild(quantityInput);
                if (activity.unit) {
                    const unitSpan = document.createElement('span');
                    unitSpan.textContent = activity.unit;
                    inputGroup.appendChild(unitSpan);
                }
            }

            card.appendChild(inputGroup);
            activityListContainer.appendChild(card);
        });
    };

    // Render streaks
    const renderStreaks = () => {
        streakListContainer.innerHTML = '';
        activities.forEach(activity => {
            let streak = 0;
            const dates = Object.keys(dailyLogs).sort().reverse(); // Sort dates descending
            for (const date of dates) {
                const log = dailyLogs[`${date}`].find(a => a.name === activity.name);
                if (log) {
                    let isCompletedForStreak;
                    if (activity.streakCountType === 'count-if-not-done') {
                        // Streak means NOT completed (unchecked)
                        isCompletedForStreak = !log.completed;
                    } else {
                        // Streak means completed (checked)
                        isCompletedForStreak = log.completed;
                    }

                    if (isCompletedForStreak) {
                        streak++;
                    } else {
                        break; // Break streak if the condition is not met
                    }
                } else {
                    // If a day's log is missing for this activity, assume not completed for streak purposes
                    break;
                }
            }

            const streakText = (activity.streakCountType === 'count-if-not-done') ? 'Days without' : 'Day streak';

            const streakItem = document.createElement('div');
            streakItem.className = 'streak-item';
            streakItem.textContent = `${activity.name}: ${streak} ${streakText}`;
            streakListContainer.appendChild(streakItem);
        });
    };

    // Render activity history
    const renderHistory = () => {
        historyContainer.innerHTML = '';
        const sortedDates = Object.keys(dailyLogs).sort().reverse(); // Sort dates descending for history
        sortedDates.forEach(date => {
            const historyCard = document.createElement('div');
            historyCard.className = 'history-card';

            const dateHeader = document.createElement('div');
            dateHeader.className = 'history-card-header';
            dateHeader.textContent = getFormattedDate(date);
            historyCard.appendChild(dateHeader);

            dailyLogs[`${date}`].forEach(activity => {
                const historyActivity = document.createElement('div');
                historyActivity.className = 'history-activity';

                const activityName = document.createElement('span');
                activityName.textContent = activity.name;
                historyActivity.appendChild(activityName);

                const status = document.createElement('span');
                status.className = 'status';
                if (activity.type === 'quantity') {
                    status.textContent = `${activity.value} ${activity.unit || ''}`;
                    status.classList.add(activity.completed ? 'status-done' : 'status-not-done');
                } else {
                    status.textContent = activity.completed ? 'Done' : 'Not Done';
                    status.classList.add(activity.completed ? 'status-done' : 'status-not-done');
                }
                historyActivity.appendChild(status);

                historyCard.appendChild(historyActivity);
            });
            historyContainer.appendChild(historyCard);
        });
    };

    // Add new activity handler
    addActivityForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newActivityName = newActivityNameInput.value.trim();
        const newActivityType = newActivityTypeSelect.value;
        const newActivityStreakType = newActivityStreakTypeSelect.value;

        if (newActivityName && !activities.some(a => a.name === newActivityName)) {
            const newActivity = {
                name: newActivityName,
                type: newActivityType,
                unit: '',
                streakCountType: newActivityStreakType
            };
            activities.push(newActivity);

            // Add the new activity to today's log
            dailyLogs[`${todayDate}`].push({
                ...newActivity,
                completed: false,
                value: newActivityType === 'quantity' ? 0 : false
            });
            saveData();
            renderActivities();
            renderStreaks();
            renderHistory();
            newActivityNameInput.value = '';
        }
    });

    // Initial render
    renderActivities();
    renderStreaks();
    renderHistory();
});

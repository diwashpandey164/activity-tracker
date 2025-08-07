// --- START OF script.js content ---

// Get DOM elements
const body = document.body;
const themeToggle = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");
const toggleAddFormBtn = document.getElementById("toggle-add-form");
const closeAddFormBtn = document.getElementById("close-add-form");
const addActivitySection = document.getElementById("add-activity-section");
const activityForm = document.getElementById("activity-form");
const formTitle = document.getElementById("form-title");
const activityNameInput = document.getElementById("activity-name-input");
const activityTypeSelect = document.getElementById("activity-type-select");
const activityCountTypeSelect = document.getElementById(
   "activity-count-type-select"
);
const activityGoalInput = document.getElementById("activity-goal-input");
const submitButton = document.getElementById("submit-button");
const activityList = document.getElementById("activity-list");
const noActivitiesMessage = document.getElementById("no-activities-message");
const todayActivityList = document.getElementById("today-activity-list");
const todayDateSpan = document.getElementById("today-date");
const streakList = document.getElementById("streak-list");
const longestHistoryList = document.getElementById("longest-history-list");
const historyList = document.getElementById("history-list");
const progressCharts = document.getElementById("progress-charts");
const confirmationModal = document.getElementById("confirmation-modal");
const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
const cancelDeleteBtn = document.getElementById("cancel-delete-btn");

// --- Data Handling ---
let activities = JSON.parse(localStorage.getItem("activities")) || [];
let editingActivityId = null; // Track the ID of the activity being edited

/**
 * Saves the current activities array to local storage.
 */
const saveActivities = () => {
   localStorage.setItem("activities", JSON.stringify(activities));
};

/**
 * Renders all sections of the UI based on the current data.
 */
const renderAll = () => {
   renderActivitiesList();
   renderTodaysActivities();
   renderStreaks();
   renderLongestStreaks();
   renderHistory();
   renderCharts();
};

/**
 * Gets today's date in a consistent format (YYYY-MM-DD).
 * @returns {string} The formatted date string.
 */
const getTodayDate = () => {
   return new Date().toISOString().split("T")[0];
};

// --- Initial Setup and Event Listeners ---

document.addEventListener("DOMContentLoaded", () => {
   // Set today's date
   todayDateSpan.textContent = new Date().toLocaleDateString();

   // Load and apply theme from local storage
   const currentTheme = localStorage.getItem("theme");
   if (currentTheme === "dark") {
      body.classList.add("dark-mode");
      themeIcon.classList.remove("fa-sun");
      themeIcon.classList.add("fa-moon");
   }

   // Render the UI initially
   renderAll();
});

// Theme toggle button
themeToggle.addEventListener("click", () => {
   body.classList.toggle("dark-mode");
   const theme = body.classList.contains("dark-mode") ? "dark" : "light";
   localStorage.setItem("theme", theme);
   if (theme === "dark") {
      themeIcon.classList.remove("fa-sun");
      themeIcon.classList.add("fa-moon");
   } else {
      themeIcon.classList.remove("fa-moon");
      themeIcon.classList.add("fa-sun");
   }
});

// Toggle add/edit activity form visibility
toggleAddFormBtn.addEventListener("click", () => {
   addActivitySection.classList.toggle("hidden");
   toggleAddFormBtn.classList.toggle("hidden");
   // Reset form when opening to add a new activity
   editingActivityId = null;
   activityForm.reset();
   formTitle.textContent = "Add New Activity";
   submitButton.innerHTML = `<i class="fas fa-plus-circle mr-2"></i> Add Activity`;
});

closeAddFormBtn.addEventListener("click", () => {
   addActivitySection.classList.add("hidden");
   toggleAddFormBtn.classList.remove("hidden");
});

// Add/Edit activity form submission
activityForm.addEventListener("submit", (e) => {
   e.preventDefault();

   const name = activityNameInput.value.trim();
   const type = activityTypeSelect.value;
   const countType = activityCountTypeSelect.value;
   const goal = activityGoalInput.value
      ? parseInt(activityGoalInput.value, 10)
      : 0;

   if (!name) return;

   if (editingActivityId) {
      // Update existing activity
      const activityToUpdate = activities.find(
         (a) => a.id === editingActivityId
      );
      if (activityToUpdate) {
         activityToUpdate.name = name;
         activityToUpdate.type = type;
         activityToUpdate.countType = countType;
         activityToUpdate.goal = goal;
      }
   } else {
      // Create new activity
      const newActivity = {
         id: Date.now(),
         name: name,
         type: type,
         countType: countType,
         goal: goal,
         history: {},
         currentStreak: 0,
         longestStreak: 0,
      };
      activities.push(newActivity);
   }

   saveActivities();
   renderAll();

   // Reset state and hide form
   editingActivityId = null;
   activityForm.reset();
   addActivitySection.classList.add("hidden");
   toggleAddFormBtn.classList.remove("hidden");
});

// --- Rendering Functions ---

/**
 * Renders the list of all activities in the Activities List section.
 */
const renderActivitiesList = () => {
   activityList.innerHTML = "";
   if (activities.length === 0) {
      noActivitiesMessage.classList.remove("hidden");
   } else {
      noActivitiesMessage.classList.add("hidden");
      activities.forEach((activity) => {
         const div = document.createElement("div");
         div.className =
            "card p-4 rounded-xl flex justify-between items-center transition-colors duration-200";
         div.innerHTML = `
                        <div>
                            <strong class="text-lg text-gray-900 dark:text-gray-100">${
                               activity.name
                            }</strong>
                            <p class="text-sm text-gray-600 dark:text-gray-400 capitalize">Type: ${
                               activity.type
                            } | Goal: ${activity.goal || "None"}</p>
                        </div>
                        <div class="flex space-x-2">
                            <button onclick="editActivity(${
                               activity.id
                            })" class="p-2 text-blue-500 hover:text-blue-700 transition-colors duration-200">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="showDeleteModal(${
                               activity.id
                            })" class="p-2 text-red-500 hover:text-red-700 transition-colors duration-200">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    `;
         activityList.appendChild(div);
      });
   }
};

/**
 * Renders today's activities with completion controls.
 */
const renderTodaysActivities = () => {
   todayActivityList.innerHTML = "";
   const today = getTodayDate();

   activities.forEach((activity) => {
      // Initialize today's history if it doesn't exist
      if (!activity.history[today]) {
         activity.history[today] = {value: 0, notes: ""};
      }
      const todayHistory = activity.history[today];
      const isCompleted =
         todayHistory.value === true ||
         (activity.type === "quantity" && todayHistory.value > 0);
      const isGoalMet =
         activity.goal &&
         activity.type === "quantity" &&
         todayHistory.value >= activity.goal;

      const cardClasses = isCompleted
         ? "today-activity-completed dark:bg-green-800"
         : "today-activity-card dark:bg-gray-700";

      const div = document.createElement("div");
      div.className = `card p-4 rounded-xl flex flex-col space-y-2 ${cardClasses} transition-colors duration-200`;

      div.innerHTML = `
                    <div class="flex items-center justify-between">
                        <div class="flex flex-col">
                            <strong class="text-lg text-gray-900 dark:text-gray-100">${
                               activity.name
                            }</strong>
                            ${
                               activity.type === "quantity" && activity.goal > 0
                                  ? `<span class="text-sm text-gray-600 dark:text-gray-400">Goal: ${
                                       activity.goal
                                    } ${
                                       isGoalMet
                                          ? '<span class="text-green-600 dark:text-green-400 font-semibold">(Met!)</span>'
                                          : ""
                                    }</span>`
                                  : ""
                            }
                        </div>
                        ${
                           activity.type === "boolean"
                              ? `<button onclick="toggleCompletion(${
                                   activity.id
                                })" class="p-2 rounded-full ${
                                   isCompleted
                                      ? "bg-green-500 text-white"
                                      : "bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200"
                                }">
                                <i class="fas fa-check"></i>
                            </button>`
                              : ""
                        }
                    </div>
                    ${
                       activity.type === "quantity"
                          ? `<div class="flex items-center space-x-2">
                            <input type="number" id="quantity-input-${activity.id}" value="${todayHistory.value}" min="0" 
                                class="quantity-input w-24 p-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100" />
                            <button onclick="updateQuantity(${activity.id})" class="p-2 rounded-lg bg-blue-600 text-white">
                                <i class="fas fa-save"></i>
                            </button>
                        </div>`
                          : ""
                    }
                    <textarea id="notes-input-${
                       activity.id
                    }" onblur="saveNotes(${
         activity.id
      }, this.value)" rows="2" placeholder="Add some notes for today..."
                        class="notes-input w-full p-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 dark:text-gray-100">${
                           todayHistory.notes || ""
                        }</textarea>
                `;
      todayActivityList.appendChild(div);
   });
};

/**
 * Renders the current streaks for all activities.
 */
const renderStreaks = () => {
   streakList.innerHTML = "";
   activities.forEach((activity) => {
      calculateStreaks(activity); // Recalculate streak before rendering
      const div = document.createElement("div");
      div.className = "card p-4 rounded-xl flex items-center space-x-4";
      div.innerHTML = `
                    <div class="text-3xl text-yellow-500">
                        <i class="fas fa-fire"></i>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600 dark:text-gray-400">${activity.name}</p>
                        <strong class="text-xl text-gray-900 dark:text-gray-100">${activity.currentStreak} day streak</strong>
                    </div>
                `;
      streakList.appendChild(div);
   });
};

/**
 * Renders the longest streaks for all activities.
 */
const renderLongestStreaks = () => {
   longestHistoryList.innerHTML = "";
   activities.forEach((activity) => {
      const div = document.createElement("div");
      div.className = "card p-4 rounded-xl flex items-center space-x-4";
      div.innerHTML = `
                    <div class="text-3xl text-purple-500">
                        <i class="fas fa-trophy"></i>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600 dark:text-gray-400">${activity.name}</p>
                        <strong class="text-xl text-gray-900 dark:text-gray-100">${activity.longestStreak} day record</strong>
                    </div>
                `;
      longestHistoryList.appendChild(div);
   });
};

/**
 * Renders the full history of all activities.
 */
const renderHistory = () => {
   historyList.innerHTML = "";
   activities.forEach((activity) => {
      const historyEntries = Object.entries(activity.history).sort(
         (a, b) => new Date(b[0]) - new Date(a[0])
      );
      if (historyEntries.length === 0) return;

      const activityHeader = document.createElement("h3");
      activityHeader.className =
         "font-semibold mt-4 mb-2 text-gray-900 dark:text-gray-100";
      activityHeader.textContent = activity.name;
      historyList.appendChild(activityHeader);

      historyEntries.forEach(([date, data]) => {
         const value = data.value;
         const notes = data.notes;
         const div = document.createElement("div");
         const statusText =
            activity.type === "boolean"
               ? value
                  ? '<i class="fas fa-check-circle text-green-500 mr-2"></i>Done'
                  : '<i class="fas fa-times-circle text-red-500 mr-2"></i>Not Done'
               : `<i class="fas fa-chart-line text-blue-500 mr-2"></i>${value}`;

         div.className = "card p-3 rounded-lg flex flex-col space-y-2 text-sm";
         div.innerHTML = `
                        <div class="flex justify-between items-center">
                            <span class="text-gray-600 dark:text-gray-300">${date}</span>
                            <div class="font-medium text-gray-900 dark:text-gray-100">${statusText}</div>
                        </div>
                        ${
                           notes
                              ? `<p class="text-gray-500 dark:text-gray-400 italic">${notes}</p>`
                              : ""
                        }
                    `;
         historyList.appendChild(div);
      });
   });
};

/**
 * Renders simple progress bar charts for the last 7 days of each activity.
 */
const renderCharts = () => {
   progressCharts.innerHTML = "";
   const today = new Date();
   const last7Days = [];
   for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      last7Days.push(d.toISOString().split("T")[0]);
   }

   activities.forEach((activity) => {
      const chartDiv = document.createElement("div");
      chartDiv.className = "card p-4 rounded-xl";
      chartDiv.innerHTML = `
                    <h3 class="font-semibold mb-2 text-gray-900 dark:text-gray-100">${
                       activity.name
                    }</h3>
                    <div class="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
                        ${last7Days
                           .map(
                              (d) =>
                                 `<span>${new Date(d).toLocaleDateString(
                                    "en-US",
                                    {weekday: "short"}
                                 )}</span>`
                           )
                           .join("")}
                    </div>
                    <div class="flex items-end h-24 space-x-1">
                        ${last7Days
                           .map((date) => {
                              const data = activity.history[date] || {value: 0};
                              let value = 0;
                              if (activity.type === "boolean" && data.value) {
                                 value = 1;
                              } else if (activity.type === "quantity") {
                                 value = data.value;
                              }

                              const maxVal =
                                 activity.goal > 0
                                    ? activity.goal
                                    : activity.type === "boolean"
                                    ? 1
                                    : Math.max(
                                         ...last7Days.map(
                                            (d) =>
                                               (
                                                  activity.history[d] || {
                                                     value: 0,
                                                  }
                                               ).value
                                         ),
                                         10
                                      );
                              const heightPercentage =
                                 maxVal > 0
                                    ? Math.min((value / maxVal) * 100, 100)
                                    : 0;

                              return `<div class="w-1/7 h-full flex flex-col items-center">
                                        <div class="relative w-full rounded-t-lg bg-gray-200 dark:bg-gray-700 overflow-hidden flex-grow">
                                            <div class="chart-bar absolute bottom-0 w-full rounded-t-lg" style="height: ${heightPercentage}%;"></div>
                                        </div>
                                    </div>`;
                           })
                           .join("")}
                    </div>
                `;
      progressCharts.appendChild(chartDiv);
   });
};

// --- Core Logic Functions ---

/**
 * Toggles the completion status for a boolean activity.
 * @param {number} id The ID of the activity.
 */
window.toggleCompletion = (id) => {
   const today = getTodayDate();
   const activity = activities.find((a) => a.id === id);
   if (!activity) return;

   // Get the current notes from the textarea before re-rendering
   const notesInput = document.getElementById(`notes-input-${id}`);
   const currentNotes = notesInput ? notesInput.value : "";

   // Ensure today's history object exists and update it
   if (!activity.history[today]) {
      activity.history[today] = {value: false, notes: currentNotes};
   }
   activity.history[today].value = !activity.history[today].value;
   activity.history[today].notes = currentNotes;

   saveActivities();
   // Re-render only the affected sections
   renderTodaysActivities();
   renderStreaks();
   renderHistory();
   renderCharts();
};

/**
 * Updates the quantity for a quantity-based activity.
 * @param {number} id The ID of the activity.
 */
window.updateQuantity = (id) => {
   const today = getTodayDate();
   const activity = activities.find((a) => a.id === id);
   if (!activity) return;

   // Get the current notes from the textarea before re-rendering
   const notesInput = document.getElementById(`notes-input-${id}`);
   const currentNotes = notesInput ? notesInput.value : "";

   const quantityInput = document.getElementById(`quantity-input-${id}`);
   const quantity = parseInt(quantityInput.value, 10);

   if (isNaN(quantity) || quantity < 0) {
      // If invalid input, reset the field but don't re-render
      quantityInput.value =
         (activity.history[today] && activity.history[today].value) || 0;
      return;
   }

   // Ensure today's history object exists and update it
   if (!activity.history[today]) {
      activity.history[today] = {value: 0, notes: currentNotes};
   }
   activity.history[today].value = quantity;
   activity.history[today].notes = currentNotes;

   saveActivities();
   // Re-render only the affected sections
   renderTodaysActivities();
   renderStreaks();
   renderHistory();
   renderCharts();
};

/**
 * Saves a note for a specific activity on the current day.
 * @param {number} id The ID of the activity.
 * @param {string} notes The notes to save.
 */
window.saveNotes = (id, notes) => {
   const today = getTodayDate();
   const activity = activities.find((a) => a.id === id);
   if (!activity) return;

   // Ensure today's history object exists before trying to update it
   if (!activity.history[today]) {
      activity.history[today] = {value: 0, notes: ""};
   }
   activity.history[today].notes = notes;

   saveActivities();
   // Re-render only the history section
   renderHistory();
};

/**
 * Shows the custom confirmation modal for deleting an activity.
 * @param {number} id The ID of the activity to delete.
 */
window.showDeleteModal = (id) => {
   confirmationModal.classList.remove("hidden");
   confirmDeleteBtn.onclick = () => {
      deleteActivity(id);
      confirmationModal.classList.add("hidden");
   };
};

cancelDeleteBtn.addEventListener("click", () => {
   confirmationModal.classList.add("hidden");
});

/**
 * Deletes an activity from the list.
 * @param {number} id The ID of the activity to delete.
 */
const deleteActivity = (id) => {
   activities = activities.filter((a) => a.id !== id);
   saveActivities();
   renderAll();
};

/**
 * Fills the form with an activity's data for editing.
 * @param {number} id The ID of the activity to edit.
 */
window.editActivity = (id) => {
   const activity = activities.find((a) => a.id === id);
   if (!activity) return;

   editingActivityId = id;
   activityNameInput.value = activity.name;
   activityTypeSelect.value = activity.type;
   activityCountTypeSelect.value = activity.countType;
   activityGoalInput.value = activity.goal || "";

   formTitle.textContent = "Edit Activity";
   submitButton.innerHTML = `<i class="fas fa-save mr-2"></i> Update Activity`;

   addActivitySection.classList.remove("hidden");
   toggleAddFormBtn.classList.add("hidden");
};

/**
 * Calculates the current and longest streak for a given activity.
 * @param {Object} activity The activity object to calculate streaks for.
 */
const calculateStreaks = (activity) => {
   const historyDates = Object.keys(activity.history).sort();
   if (historyDates.length === 0) {
      activity.currentStreak = 0;
      return;
   }

   let longestStreak = 0;
   let streakInProgress = 0;

   // Helper function to check completion based on count type
   const completionCriteria = (date) => {
      const data = activity.history[date];
      if (!data) return false;

      const value = data.value;
      if (activity.countType === "count-if-done") {
         return activity.type === "boolean" ? value === true : value > 0;
      } else {
         // count-if-not-done
         return activity.type === "boolean" ? value === false : value === 0;
      }
   };

   // Calculate longest streak
   for (let i = 0; i < historyDates.length; i++) {
      const dateStr = historyDates[i];
      if (completionCriteria(dateStr)) {
         streakInProgress++;
      } else {
         longestStreak = Math.max(longestStreak, streakInProgress);
         streakInProgress = 0;
      }
   }
   longestStreak = Math.max(longestStreak, streakInProgress);
   activity.longestStreak = longestStreak;

   // Calculate current streak
   let currentStreakCount = 0;
   const today = getTodayDate();

   // Check if today is completed first
   if (completionCriteria(today)) {
      currentStreakCount++;
   } else {
      activity.currentStreak = 0;
      return;
   }

   // Go backward from yesterday
   let dYesterday = new Date();
   dYesterday.setDate(dYesterday.getDate() - 1);
   let dateYesterday = dYesterday.toISOString().split("T")[0];

   while (completionCriteria(dateYesterday)) {
      currentStreakCount++;
      dYesterday.setDate(dYesterday.getDate() - 1);
      dateYesterday = dYesterday.toISOString().split("T")[0];
   }

   activity.currentStreak = currentStreakCount;

   saveActivities();
};

// --- Utility to initialize local storage if it's empty on first load
if (activities.length === 0) {
   console.log("No activities found, initializing with an empty array.");
   saveActivities();
}

// --- END OF script.js content ---

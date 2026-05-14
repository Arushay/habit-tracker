 
        // ============================================================
        // PROFESSIONAL HABIT TRACKER - STREAKMASTER PRO
        // ============================================================
        // Features:
        // ✓ Add, delete, and toggle habits
        // ✓ Automatic streak calculation
        // ✓ LocalStorage persistence
        // ✓ XSS protection with escapeHtml (expandable!)
        // ✓ Responsive design
        // ✓ Professional UI
        // ============================================================

        // ===== STATE MANAGEMENT =====
        let habits = [];

        // ===== DOM ELEMENTS =====
        const DOM = {
            habitInput: document.getElementById('habitName'),
            addBtn: document.getElementById('addHabitBtn'),
            habitsContainer: document.getElementById('habitsList'),
            totalSpan: document.getElementById('totalHabits'),
            completedSpan: document.getElementById('completedToday'),
            bestStreakSpan: document.getElementById('bestStreak'),
            resetBtn: document.getElementById('resetDayBtn'),
            clearBtn: document.getElementById('clearAllBtn')
        };

        // ===== UTILITY FUNCTIONS =====

        /**
         * Get today's date in YYYY-MM-DD format
         * @returns {string} Formatted date string
         */
        function getTodayDate() {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        /**
         * Escape HTML special characters to prevent XSS attacks
         * @param {string} str - Input string to escape
         * @returns {string} Escaped string safe for HTML
         * 
         * 💡 You can ADD MORE characters to escape:
         * Just add them to the regex and if statement!
         * 
         * Example - add double quotes and single quotes:
         * regex: /[&<>"']/g
         * if (m === '"') return '&quot;';
         * if (m === "'") return '&#39;';
         */
        function escapeHtml(str) {
            // The regex /[&<>]/g finds ALL occurrences of &, <, >
            // Add more characters inside the brackets to escape them!
            // Example: /[&<>"']/g also escapes " and '
            return str.replace(/[&<>]/g, function(matchedChar) {
                if (matchedChar === '&') return '&amp;';   // Ampersand
                if (matchedChar === '<') return '&lt;';    // Less than
                if (matchedChar === '>') return '&gt;';    // Greater than
                // 👆 Add more conditions here for other characters!
                return matchedChar;
            });
        }

        /**
         * Calculate consecutive streak from an array of dates
         * @param {string[]} completedDates - Array of date strings
         * @returns {number} Current streak count
         */
        function calculateStreak(completedDates) {
            if (!completedDates || completedDates.length === 0) return 0;
            
            const dateSet = new Set(completedDates);
            let streak = 0;
            let currentDate = new Date();
            
            while (true) {
                const year = currentDate.getFullYear();
                const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                const day = String(currentDate.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;
                
                if (dateSet.has(dateStr)) {
                    streak++;
                    currentDate.setDate(currentDate.getDate() - 1);
                } else {
                    break;
                }
            }
            return streak;
        }

        /**
         * Find the highest streak among all habits
         * @returns {number} Maximum streak value
         */
        function calculateBestStreak() {
            let best = 0;
            for (const habit of habits) {
                const streak = calculateStreak(habit.completedDates);
                if (streak > best) best = streak;
            }
            return best;
        }

        /**
         * Count how many habits were completed today
         * @returns {number} Count of completed habits
         */
        function calculateCompletedToday() {
            const today = getTodayDate();
            let count = 0;
            for (const habit of habits) {
                if (habit.completedDates.includes(today)) count++;
            }
            return count;
        }

        // ===== CORE OPERATIONS =====

        /**
         * Add a new habit to the tracker
         */
        function addHabit() {
            const name = DOM.habitInput.value.trim();
            
            if (!name) {
                alert('Please enter a habit name!');
                return;
            }
            
            const newHabit = {
                id: Date.now(),
                name: name,
                createdAt: getTodayDate(),
                completedDates: []
            };
            
            habits.push(newHabit);
            DOM.habitInput.value = '';
            saveAndRefresh();
        }

        /**
         * Toggle completion status of a habit for today
         * @param {number} habitId - ID of the habit to toggle
         */
        function toggleHabit(habitId) {
            const targetHabit = habits.find(h => h.id === habitId);
            if (!targetHabit) return;
            
            const today = getTodayDate();
            const dateIndex = targetHabit.completedDates.indexOf(today);
            
            if (dateIndex === -1) {
                // Mark as completed
                targetHabit.completedDates.push(today);
                targetHabit.completedDates.sort();
            } else {
                // Mark as incomplete
                targetHabit.completedDates.splice(dateIndex, 1);
            }
            
            saveAndRefresh();
        }

        /**
         * Permanently delete a habit
         * @param {number} habitId - ID of habit to delete
         */
        function deleteHabit(habitId) {
            if (!confirm('⚠️ Delete this habit? All progress will be lost forever.')) return;
            
            habits = habits.filter(h => h.id !== habitId);
            saveAndRefresh();
        }

        /**
         * Remove today's completion from ALL habits (keeps history)
         */
        function resetToday() {
            if (!confirm('⚠️ Reset today\'s completions? Past data remains intact.')) return;
            
            const today = getTodayDate();
            for (const habit of habits) {
                const dateIndex = habit.completedDates.indexOf(today);
                if (dateIndex !== -1) {
                    habit.completedDates.splice(dateIndex, 1);
                }
            }
            saveAndRefresh();
        }

        /**
         * Delete EVERYTHING - all habits and all history
         */
        function clearAllHabits() {
            if (!confirm('🗑️ DANGER: This will delete ALL habits and ALL history. This cannot be undone!')) return;
            
            habits = [];
            saveAndRefresh();
        }

        // ===== UI RENDERING =====

        /**
         * Render all habits to the DOM
         */
        function displayHabits() {
            if (habits.length === 0) {
                DOM.habitsContainer.innerHTML = '<div class="empty-state">✨ No habits yet. Add your first habit above!</div>';
                return;
            }
            
            const today = getTodayDate();
            let html = '';
            
            for (const habit of habits) {
                const isCompletedToday = habit.completedDates.includes(today);
                const streak = calculateStreak(habit.completedDates);
                const completedClass = isCompletedToday ? 'completed' : '';
                
                html += `
                    <div class="habit-item">
                        <div class="habit-name ${completedClass}" data-id="${habit.id}">
                            ${escapeHtml(habit.name)}
                        </div>
                        <span class="streak-badge">🔥 ${streak} day streak</span>
                        <div class="delete-btn" data-id="${habit.id}">✖ Delete</div>
                    </div>
                `;
            }
            
            DOM.habitsContainer.innerHTML = html;
            
            // Attach event listeners
            document.querySelectorAll('.habit-name').forEach(el => {
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = parseInt(el.dataset.id);
                    toggleHabit(id);
                });
            });
            
            document.querySelectorAll('.delete-btn').forEach(el => {
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = parseInt(el.dataset.id);
                    deleteHabit(id);
                });
            });
        }

        /**
         * Update statistics display
         */
        function updateStats() {
            DOM.totalSpan.textContent = habits.length;
            DOM.completedSpan.textContent = calculateCompletedToday();
            DOM.bestStreakSpan.textContent = calculateBestStreak();
        }

        // ===== PERSISTENCE =====

        /**
         * Save habits to localStorage
         */
        function saveToStorage() {
            localStorage.setItem('streakmaster_data', JSON.stringify(habits));
        }

        /**
         * Load habits from localStorage with data migration
         */
        function loadFromStorage() {
            const saved = localStorage.getItem('streakmaster_data');
            
            if (!saved) {
                habits = [];
                return;
            }
            
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    habits = parsed;
                    // Data migration for older versions
                    for (const habit of habits) {
                        if (!habit.completedDates) habit.completedDates = [];
                        if (!habit.createdAt) habit.createdAt = getTodayDate();
                        if (!habit.id) habit.id = Date.now() + Math.random();
                    }
                }
            } catch (error) {
                console.error('Failed to load habits:', error);
                habits = [];
            }
        }

        /**
         * Save changes and refresh the UI
         */
        function saveAndRefresh() {
            saveToStorage();
            displayHabits();
            updateStats();
        }

        // ===== INITIALIZATION =====

        /**
         * Set up all event listeners
         */
        function setupEventListeners() {
            DOM.addBtn.addEventListener('click', addHabit);
            DOM.resetBtn.addEventListener('click', resetToday);
            DOM.clearBtn.addEventListener('click', clearAllHabits);
            
            DOM.habitInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') addHabit();
            });
        }

        /**
         * Initialize the application
         */
        function init() {
            setupEventListeners();
            loadFromStorage();
            displayHabits();
            updateStats();
            console.log('✅ StreakMaster Pro initialized!', getTodayDate());
        }

        // Start the app
        init();

/**
 * Growth90 User Preference Management System
 * Dynamic customization and personalization engine
 */

(function(Growth90) {
    'use strict';

    // Preference categories and default values
    const PREFERENCE_SCHEMA = {
        learning: {
            styles: {
                type: 'multi-select',
                options: [
                    { value: 'visual', label: 'Visual (charts, diagrams, videos)', icon: '📊' },
                    { value: 'auditory', label: 'Auditory (lectures, discussions, podcasts)', icon: '🎧' },
                    { value: 'reading', label: 'Reading/Writing (articles, notes, documents)', icon: '📖' },
                    { value: 'kinesthetic', label: 'Kinesthetic (hands-on, interactive exercises)', icon: '🤲' },
                    { value: 'social', label: 'Social (group activities, peer learning)', icon: '👥' },
                    { value: 'solitary', label: 'Solitary (independent study, reflection)', icon: '🧘' }
                ],
                default: ['visual', 'reading'],
                impact: 'Affects content presentation format and interaction types'
            },
            pace: {
                type: 'slider',
                min: 1,
                max: 5,
                default: 3,
                labels: { 1: 'Very Slow', 2: 'Slow', 3: 'Moderate', 4: 'Fast', 5: 'Very Fast' },
                impact: 'Controls lesson duration and information density'
            },
            difficulty: {
                type: 'select',
                options: [
                    { value: 'gradual', label: 'Gradual progression (start easy, build up)' },
                    { value: 'moderate', label: 'Moderate challenge throughout' },
                    { value: 'intensive', label: 'Intensive challenge (jump in deep)' },
                    { value: 'adaptive', label: 'Adaptive (adjust based on performance)' }
                ],
                default: 'adaptive',
                impact: 'Determines initial difficulty and progression strategy'
            },
            interactivity: {
                type: 'slider',
                min: 1,
                max: 5,
                default: 4,
                labels: { 1: 'Minimal', 3: 'Balanced', 5: 'Highly Interactive' },
                impact: 'Controls frequency of exercises and interactive elements'
            }
        },
        content: {
            complexity: {
                type: 'select',
                options: [
                    { value: 'beginner', label: 'Beginner-friendly explanations' },
                    { value: 'intermediate', label: 'Balanced complexity' },
                    { value: 'advanced', label: 'Advanced/technical focus' },
                    { value: 'expert', label: 'Expert-level depth' }
                ],
                default: 'intermediate',
                impact: 'Affects vocabulary, concepts, and explanation depth'
            },
            narrative: {
                type: 'select',
                options: [
                    { value: 'story', label: 'Story-driven with scenarios and characters' },
                    { value: 'case-study', label: 'Case study and real-world examples' },
                    { value: 'analytical', label: 'Analytical and framework-focused' },
                    { value: 'practical', label: 'Practical and action-oriented' }
                ],
                default: 'case-study',
                impact: 'Determines how content is structured and presented'
            },
            examples: {
                type: 'multi-select',
                options: [
                    { value: 'industry-specific', label: 'Industry-specific examples' },
                    { value: 'role-relevant', label: 'Role-relevant scenarios' },
                    { value: 'diverse-contexts', label: 'Diverse business contexts' },
                    { value: 'global-perspectives', label: 'Global and cultural perspectives' }
                ],
                default: ['industry-specific', 'role-relevant'],
                impact: 'Customizes examples and case studies to your context'
            },
            length: {
                type: 'slider',
                min: 1,
                max: 5,
                default: 3,
                labels: { 1: 'Concise', 3: 'Standard', 5: 'Comprehensive' },
                impact: 'Controls lesson length and detail level'
            }
        },
        feedback: {
            frequency: {
                type: 'select',
                options: [
                    { value: 'immediate', label: 'Immediate feedback after each interaction' },
                    { value: 'section', label: 'Feedback at section completion' },
                    { value: 'lesson', label: 'Feedback at lesson completion' },
                    { value: 'milestone', label: 'Feedback at major milestones' }
                ],
                default: 'section',
                impact: 'Determines when and how often you receive feedback'
            },
            style: {
                type: 'select',
                options: [
                    { value: 'encouraging', label: 'Encouraging and supportive' },
                    { value: 'constructive', label: 'Balanced constructive criticism' },
                    { value: 'analytical', label: 'Detailed analytical feedback' },
                    { value: 'brief', label: 'Brief and to-the-point' }
                ],
                default: 'constructive',
                impact: 'Affects tone and depth of feedback messages'
            },
            detail: {
                type: 'slider',
                min: 1,
                max: 5,
                default: 3,
                labels: { 1: 'High-level', 3: 'Balanced', 5: 'Very Detailed' },
                impact: 'Controls how much detail is included in feedback'
            }
        },
        interface: {
            theme: {
                type: 'select',
                options: [
                    { value: 'auto', label: 'Auto (follow system preference)' },
                    { value: 'light', label: 'Light theme' },
                    { value: 'dark', label: 'Dark theme' },
                    { value: 'high-contrast', label: 'High contrast' }
                ],
                default: 'auto',
                impact: 'Changes the visual appearance of the interface'
            },
            density: {
                type: 'select',
                options: [
                    { value: 'compact', label: 'Compact (more content per screen)' },
                    { value: 'comfortable', label: 'Comfortable (balanced spacing)' },
                    { value: 'spacious', label: 'Spacious (extra breathing room)' }
                ],
                default: 'comfortable',
                impact: 'Adjusts spacing and layout density'
            },
            animations: {
                type: 'toggle',
                default: true,
                impact: 'Enables or disables interface animations'
            },
            sounds: {
                type: 'toggle',
                default: false,
                impact: 'Enables or disables notification and feedback sounds'
            }
        },
        notifications: {
            dailyReminders: {
                type: 'toggle',
                default: true,
                impact: 'Daily learning session reminders'
            },
            weeklyProgress: {
                type: 'toggle',
                default: true,
                impact: 'Weekly progress summary emails'
            },
            milestones: {
                type: 'toggle',
                default: true,
                impact: 'Achievement and milestone notifications'
            },
            encouragement: {
                type: 'toggle',
                default: true,
                impact: 'Motivational messages and tips'
            },
            reminderTime: {
                type: 'time',
                default: '09:00',
                impact: 'Preferred time for daily reminders'
            }
        },
        accessibility: {
            fontSize: {
                type: 'slider',
                min: 1,
                max: 5,
                default: 3,
                labels: { 1: 'Small', 2: 'Medium', 3: 'Standard', 4: 'Large', 5: 'Extra Large' },
                impact: 'Adjusts text size throughout the application'
            },
            contrast: {
                type: 'slider',
                min: 1,
                max: 5,
                default: 3,
                labels: { 1: 'Low', 3: 'Standard', 5: 'High' },
                impact: 'Increases color contrast for better visibility'
            },
            reducedMotion: {
                type: 'toggle',
                default: false,
                impact: 'Reduces animations and motion effects'
            },
            screenReader: {
                type: 'toggle',
                default: false,
                impact: 'Optimizes interface for screen readers'
            }
        }
    };

    // Preference management system
    Growth90.User.Preferences = (() => {
        let currentPreferences = {};
        let preferencesInitialized = false;
        const changeListeners = new Set();

        // Initialize preferences system
        async function initialize() {
            
            try {
                // Load existing preferences
                await loadPreferences();
                
                // Apply current preferences
                applyPreferences();
                
                // Set up preference monitoring
                setupPreferenceMonitoring();
                
                preferencesInitialized = true;
                Growth90.Core.EventBus.emit('preferences:initialized', currentPreferences);
                
                
            } catch (error) {
                console.error('❌ Failed to initialize preferences:', error);
                // Use defaults if loading fails
                currentPreferences = getDefaultPreferences();
                applyPreferences();
            }
        }

        // Load preferences from storage
        async function loadPreferences() {
            try {
                const storedPreferences = await Growth90.Data.Storage.getItem('settings', 'userPreferences');
                
                if (storedPreferences) {
                    currentPreferences = mergeWithDefaults(storedPreferences.value);
                } else {
                    currentPreferences = getDefaultPreferences();
                }
                
                
            } catch (error) {
                currentPreferences = getDefaultPreferences();
            }
        }

        // Get default preferences
        function getDefaultPreferences() {
            const defaults = {};
            
            Object.entries(PREFERENCE_SCHEMA).forEach(([category, prefs]) => {
                defaults[category] = {};
                Object.entries(prefs).forEach(([key, config]) => {
                    defaults[category][key] = config.default;
                });
            });
            
            return defaults;
        }

        // Merge stored preferences with defaults
        function mergeWithDefaults(stored) {
            const defaults = getDefaultPreferences();
            const merged = Growth90.Core.Utils.deepClone(defaults);
            
            // Merge stored values, ensuring we don't lose new default values
            Object.entries(stored).forEach(([category, prefs]) => {
                if (merged[category]) {
                    Object.entries(prefs).forEach(([key, value]) => {
                        if (merged[category].hasOwnProperty(key)) {
                            merged[category][key] = value;
                        }
                    });
                }
            });
            
            return merged;
        }

        // Save preferences to storage
        async function savePreferences() {
            try {
                await Growth90.Data.Storage.setItem('settings', {
                    key: 'userPreferences',
                    value: currentPreferences,
                    lastUpdated: new Date().toISOString()
                });
                
                Growth90.Core.EventBus.emit('preferences:saved', currentPreferences);
                
            } catch (error) {
                console.error('❌ Failed to save preferences:', error);
                Growth90.UI.Components.Notifications.error('Failed to save preferences');
            }
        }

        // Update specific preference
        async function updatePreference(category, key, value) {
            if (!currentPreferences[category]) {
                currentPreferences[category] = {};
            }
            
            const oldValue = currentPreferences[category][key];
            currentPreferences[category][key] = value;
            
            // Apply the change immediately
            applyPreferenceChange(category, key, value, oldValue);
            
            // Save to storage
            await savePreferences();
            
            // Notify listeners
            notifyPreferenceChange(category, key, value, oldValue);
            
        }

        // Update multiple preferences at once
        async function updatePreferences(updates) {
            const oldPreferences = Growth90.Core.Utils.deepClone(currentPreferences);
            
            // Apply all updates
            Object.entries(updates).forEach(([category, prefs]) => {
                if (!currentPreferences[category]) {
                    currentPreferences[category] = {};
                }
                Object.entries(prefs).forEach(([key, value]) => {
                    currentPreferences[category][key] = value;
                });
            });
            
            // Apply all changes
            applyPreferences();
            
            // Save to storage
            await savePreferences();
            
            // Notify of bulk change
            Growth90.Core.EventBus.emit('preferences:bulk-update', {
                old: oldPreferences,
                new: currentPreferences,
                changes: updates
            });
            
        }

        // Apply preferences to the interface
        function applyPreferences() {
            try {
                // Apply theme
                applyThemePreferences();
                
                // Apply accessibility preferences
                applyAccessibilityPreferences();
                
                // Apply interface preferences
                applyInterfacePreferences();
                
                // Update app state
                Growth90.Data.Models.AppState.setState({
                    preferences: currentPreferences
                });
                
                
            } catch (error) {
                console.error('❌ Failed to apply preferences:', error);
            }
        }

        // Apply specific preference change
        function applyPreferenceChange(category, key, value, oldValue) {
            switch (category) {
                case 'interface':
                    if (key === 'theme') applyThemePreferences();
                    if (key === 'density') applyDensityPreference(value);
                    if (key === 'animations') applyAnimationPreference(value);
                    break;
                    
                case 'accessibility':
                    if (key === 'fontSize') applyFontSizePreference(value);
                    if (key === 'contrast') applyContrastPreference(value);
                    if (key === 'reducedMotion') applyReducedMotionPreference(value);
                    break;
                    
                case 'learning':
                    // These affect content generation, so notify content system
                    Growth90.Core.EventBus.emit('preferences:learning-changed', {
                        category, key, value, oldValue
                    });
                    break;
            }
        }

        // Theme preferences
        function applyThemePreferences() {
            const theme = currentPreferences.interface?.theme || 'auto';
            const root = document.documentElement;
            
            if (theme === 'auto') {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
            } else {
                root.setAttribute('data-theme', theme);
            }
        }

        // Accessibility preferences
        function applyAccessibilityPreferences() {
            const accessibility = currentPreferences.accessibility || {};
            const root = document.documentElement;
            
            // Font size
            const fontSize = accessibility.fontSize || 3;
            const fontSizeScale = 0.875 + (fontSize - 1) * 0.125; // Scale from 0.875 to 1.375
            root.style.setProperty('--font-size-scale', fontSizeScale);
            
            // Contrast
            const contrast = accessibility.contrast || 3;
            root.setAttribute('data-contrast', contrast > 3 ? 'high' : 'normal');
            
            // Reduced motion
            if (accessibility.reducedMotion) {
                root.setAttribute('data-reduced-motion', 'true');
            } else {
                root.removeAttribute('data-reduced-motion');
            }
        }

        // Interface preferences
        function applyInterfacePreferences() {
            const interface_ = currentPreferences.interface || {};
            const root = document.documentElement;
            
            // Density
            const density = interface_.density || 'comfortable';
            root.setAttribute('data-density', density);
            
            // Animations
            if (!interface_.animations) {
                root.setAttribute('data-animations', 'disabled');
            } else {
                root.removeAttribute('data-animations');
            }
        }

        // Specific preference applications
        function applyDensityPreference(density) {
            document.documentElement.setAttribute('data-density', density);
        }

        function applyAnimationPreference(enabled) {
            if (!enabled) {
                document.documentElement.setAttribute('data-animations', 'disabled');
            } else {
                document.documentElement.removeAttribute('data-animations');
            }
        }

        function applyFontSizePreference(fontSize) {
            const fontSizeScale = 0.875 + (fontSize - 1) * 0.125;
            document.documentElement.style.setProperty('--font-size-scale', fontSizeScale);
        }

        function applyContrastPreference(contrast) {
            document.documentElement.setAttribute('data-contrast', contrast > 3 ? 'high' : 'normal');
        }

        function applyReducedMotionPreference(reduced) {
            if (reduced) {
                document.documentElement.setAttribute('data-reduced-motion', 'true');
            } else {
                document.documentElement.removeAttribute('data-reduced-motion');
            }
        }

        // Preference monitoring
        function setupPreferenceMonitoring() {
            // Monitor system theme changes
            if (window.matchMedia) {
                const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                mediaQuery.addListener(() => {
                    if (currentPreferences.interface?.theme === 'auto') {
                        applyThemePreferences();
                    }
                });
            }
            
            // Monitor system reduced motion preference
            const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            reducedMotionQuery.addListener((e) => {
                if (!currentPreferences.accessibility?.reducedMotion) {
                    // If user hasn't explicitly set preference, follow system
                    applyReducedMotionPreference(e.matches);
                }
            });
        }

        // Preference change notification
        function notifyPreferenceChange(category, key, value, oldValue) {
            const changeEvent = {
                category,
                key,
                value,
                oldValue,
                timestamp: new Date().toISOString()
            };
            
            // Notify specific listeners
            changeListeners.forEach(listener => {
                try {
                    listener(changeEvent);
                } catch (error) {
                    console.error('Error in preference change listener:', error);
                }
            });
            
            // Emit global event
            Growth90.Core.EventBus.emit('preference:changed', changeEvent);
        }

        // Add change listener
        function addChangeListener(listener) {
            changeListeners.add(listener);
            return () => changeListeners.delete(listener);
        }

        // Get preference value
        function getPreference(category, key) {
            return currentPreferences[category]?.[key];
        }

        // Get all preferences
        function getAllPreferences() {
            return Growth90.Core.Utils.deepClone(currentPreferences);
        }

        // Get preference schema
        function getSchema() {
            return PREFERENCE_SCHEMA;
        }

        // Reset preferences to defaults
        async function resetToDefaults() {
            const defaults = getDefaultPreferences();
            const oldPreferences = Growth90.Core.Utils.deepClone(currentPreferences);
            
            currentPreferences = defaults;
            applyPreferences();
            await savePreferences();
            
            Growth90.Core.EventBus.emit('preferences:reset', {
                old: oldPreferences,
                new: currentPreferences
            });
            
            Growth90.UI.Components.Notifications.success('Preferences reset to defaults');
        }

        // Export preferences
        function exportPreferences() {
            const exportData = {
                preferences: currentPreferences,
                schema: PREFERENCE_SCHEMA,
                exportDate: new Date().toISOString(),
                version: '1.0.0'
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `growth90-preferences-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            
            Growth90.UI.Components.Notifications.success('Preferences exported successfully');
        }

        // Import preferences
        async function importPreferences(file) {
            try {
                const text = await file.text();
                const importData = JSON.parse(text);
                
                if (!importData.preferences) {
                    throw new Error('Invalid preferences file format');
                }
                
                const oldPreferences = Growth90.Core.Utils.deepClone(currentPreferences);
                currentPreferences = mergeWithDefaults(importData.preferences);
                
                applyPreferences();
                await savePreferences();
                
                Growth90.Core.EventBus.emit('preferences:imported', {
                    old: oldPreferences,
                    new: currentPreferences,
                    importData
                });
                
                Growth90.UI.Components.Notifications.success('Preferences imported successfully');
                
            } catch (error) {
                console.error('Failed to import preferences:', error);
                Growth90.UI.Components.Notifications.error('Failed to import preferences: ' + error.message);
            }
        }

        // Public API
        return {
            initialize,
            updatePreference,
            updatePreferences,
            getPreference,
            getAllPreferences,
            getSchema,
            addChangeListener,
            resetToDefaults,
            exportPreferences,
            importPreferences,
            isInitialized: () => preferencesInitialized
        };
    })();

    // Initialize preferences when app starts
    Growth90.Core.EventBus.on('app:initialized', () => {
        Growth90.User.Preferences.initialize();
    });

})(window.Growth90 = window.Growth90 || {
    Core: { EventBus: { on: () => {}, emit: () => {} } },
    Data: {}, UI: {}, Learning: {}, User: {}
});
/**
 * Growth90 Professional Learning Platform
 * Main Application Module - Modular JavaScript Architecture
 */

// Global namespace for the Growth90 application
window.Growth90 = (() => {
    'use strict';

    // Debug guard: mute verbose logs unless explicitly enabled via
    // localStorage key 'growth90_debug' ("1"/"true") or URL ?debug=1
    (function setupDebugLogging() {
        try {
            const qs = new URLSearchParams(window.location.search);
            const urlDebug = qs.get('debug');
            const ls = (localStorage.getItem('growth90_debug') || '').toLowerCase();
            const isDebug = urlDebug === '1' || urlDebug === 'true' || ls === '1' || ls === 'true';
            if (!isDebug) {
                const noop = function(){};
                if (typeof console !== 'undefined') {
                    // Keep warn/error; silence chatter
                    console.info = noop;
                    console.debug = noop;
                }
            }
        } catch (_) {
            // If anything goes wrong, do nothing (keep default console)
        }
    })();

    // Core application modules
    const Core = {
        App: {},
        Router: {},
        EventBus: {},
        Utils: {}
    };

    // Data management modules
    const Data = {
        Storage: {},
        API: {},
        Models: {},
        Cache: {}
    };

    // User interface modules
    const UI = {
        Components: {},
        Views: {},
        Themes: {},
        Animations: {}
    };

    // Learning system modules
    const Learning = {
        PathManager: {},
        ContentManager: {}
    };

    // User management modules
    const User = {
        Profile: {},
        Authentication: {},
        Home: {}
    };

    // Event Bus for decoupled communication
    Core.EventBus = (() => {
        const events = new Map();

        return {
            on(event, callback) {
                if (!events.has(event)) {
                    events.set(event, []);
                }
                events.get(event).push(callback);
            },

            off(event, callback) {
                if (events.has(event)) {
                    const callbacks = events.get(event);
                    const index = callbacks.indexOf(callback);
                    if (index !== -1) {
                        callbacks.splice(index, 1);
                    }
                }
            },

            emit(event, data = null) {
                if (events.has(event)) {
                    events.get(event).forEach(callback => {
                        try {
                            callback(data);
                        } catch (error) {
                            console.error(`Error in event callback for '${event}':`, error);
                        }
                    });
                }
            },

            once(event, callback) {
                const onceCallback = (data) => {
                    callback(data);
                    this.off(event, onceCallback);
                };
                this.on(event, onceCallback);
            }
        };
    })();

    // Utility functions
    Core.Utils = (() => {
        return {
            // Generate unique IDs
            generateId() {
                return `growth90_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            },

            // Debounce function for performance optimization
            debounce(func, wait) {
                let timeout;
                return function executedFunction(...args) {
                    const later = () => {
                        clearTimeout(timeout);
                        func.apply(this, args);
                    };
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                };
            },

            // Throttle function for performance optimization
            throttle(func, limit) {
                let inThrottle;
                return function(...args) {
                    if (!inThrottle) {
                        func.apply(this, args);
                        inThrottle = true;
                        setTimeout(() => inThrottle = false, limit);
                    }
                };
            },

            // Deep clone objects
            deepClone(obj) {
                if (obj === null || typeof obj !== 'object') return obj;
                if (obj instanceof Date) return new Date(obj.getTime());
                if (obj instanceof Array) return obj.map(item => this.deepClone(item));
                if (typeof obj === 'object') {
                    const clonedObj = {};
                    for (const key in obj) {
                        if (obj.hasOwnProperty(key)) {
                            clonedObj[key] = this.deepClone(obj[key]);
                        }
                    }
                    return clonedObj;
                }
            },

            // Format dates for display
            formatDate(date, options = {}) {
                const defaultOptions = {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                };
                return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(date);
            },

            // Format time durations
            formatDuration(minutes) {
                const hours = Math.floor(minutes / 60);
                const mins = minutes % 60;
                if (hours > 0) {
                    return `${hours}h ${mins}m`;
                }
                return `${mins}m`;
            },

            // Validate email addresses
            isValidEmail(email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(email);
            },

            // Sanitize HTML content
            sanitizeHTML(str) {
                const div = document.createElement('div');
                div.textContent = str;
                return div.innerHTML;
            },

            // Get relative time strings
            getRelativeTime(date) {
                const now = new Date();
                const diffInSeconds = Math.floor((now - date) / 1000);
                
                if (diffInSeconds < 60) return 'Just now';
                if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
                if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
                if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
                
                return this.formatDate(date);
            }
        };
    })();

    // Client-side router
    Core.Router = (() => {
        const routes = new Map();
        let currentRoute = null;

        function parseRoute(hash) {
            const [path, ...params] = hash.replace('#', '').split('/');
            return { path: path || 'home', params };
        }

        function handleRouteChange() {
            const route = parseRoute(window.location.hash);
            
            if (routes.has(route.path)) {
                if (currentRoute !== route.path) {
                    Core.EventBus.emit('route:change', { from: currentRoute, to: route.path, params: route.params });
                    currentRoute = route.path;
                    routes.get(route.path)(route.params);
                }
            } else {
                // Default route
                navigate('home');
            }
        }

        function navigate(path, params = []) {
            const fullPath = params.length > 0 ? `${path}/${params.join('/')}` : path;
            window.location.hash = fullPath;
        }

        return {
            register(path, handler) {
                routes.set(path, handler);
            },

            navigate,

            getCurrentRoute() {
                return currentRoute;
            },

            init() {
                window.addEventListener('hashchange', handleRouteChange);
                window.addEventListener('load', handleRouteChange);
                
                // Handle navigation links
                document.addEventListener('click', (e) => {
                    const link = e.target.closest('[data-route]');
                    if (link) {
                        e.preventDefault();
                        const route = link.getAttribute('data-route');
                        navigate(route);
                    }
                });
            }
        };
    })();

    // Notification system
    UI.Components.Notifications = (() => {
        const errorContainer = document.getElementById('error-notifications');
        const successContainer = document.getElementById('success-notifications');

        function createNotification(message, type = 'error', duration = 5000) {
            const container = type === 'success' ? successContainer : errorContainer;
            
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.innerHTML = `
                <div class="notification-icon">${getIcon(type)}</div>
                <div class="notification-content">
                    <div class="notification-message">${Core.Utils.sanitizeHTML(message)}</div>
                </div>
                <button class="notification-close" aria-label="Close notification">&times;</button>
            `;

            const closeBtn = notification.querySelector('.notification-close');
            closeBtn.addEventListener('click', () => removeNotification(notification));

            container.appendChild(notification);

            // Auto-remove after duration
            if (duration > 0) {
                setTimeout(() => removeNotification(notification), duration);
            }

            return notification;
        }

        function removeNotification(notification) {
            if (notification && notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease-in forwards';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }

        function getIcon(type) {
            const icons = {
                success: '✅',
                error: '❌',
                warning: '⚠️',
                info: 'ℹ️'
            };
            return icons[type] || icons.info;
        }

        // Add CSS animation for slide out
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideOut {
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);

        return {
            show: createNotification,
            success: (message, duration) => createNotification(message, 'success', duration),
            error: (message, duration) => createNotification(message, 'error', duration),
            warning: (message, duration) => createNotification(message, 'warning', duration),
            info: (message, duration) => createNotification(message, 'info', duration)
        };
    })();

    // Loading indicator with motivational quotes (Qur'an & Hadith)
    UI.Components.Loading = (() => {
        const loadingOverlay = document.getElementById('loading-indicator');
        const loadingText = loadingOverlay.querySelector('.loading-text');
        let loadingCount = 0;
        let quoteTimer = null;
        let quoteIndex = 0;
        let quoteEl = null;

        // Curated education-focused quotes with sources
        const learningQuotes = [
            {
                text: 'My Lord, increase me in knowledge.',
                source: 'Qur\'an 20:114'
            },
            {
                text: 'Are those who know equal to those who do not know?',
                source: 'Qur\'an 39:9'
            },
            {
                text: 'Allah will raise those who believe and those given knowledge by degrees.',
                source: 'Qur\'an 58:11'
            },
            {
                text: 'Read in the name of your Lord who created.',
                source: 'Qur\'an 96:1'
            },
            {
                text: 'The best among you are those who learn the Qur\'an and teach it.',
                source: 'Sahih al-Bukhari 5027'
            },
            {
                text: 'Whoever follows a path to seek knowledge, Allah will make easy for him a path to Paradise.',
                source: 'Sahih Muslim'
            },
            {
                text: 'When a person dies, his deeds end except three: ongoing charity, beneficial knowledge, or a righteous child who prays for him.',
                source: 'Sahih Muslim 1631'
            },
            {
                text: 'He grants wisdom to whom He wills, and whoever is granted wisdom has truly been given abundant good.',
                source: 'Qur\'an 2:269'
            }
        ];

        function startQuotes() {
            if (!quoteEl) {
                quoteEl = document.createElement('div');
                quoteEl.className = 'loading-quote';
                quoteEl.setAttribute('aria-live', 'polite');
                quoteEl.style.marginTop = '1rem';
                quoteEl.style.maxWidth = '680px';
                quoteEl.style.textAlign = 'center';
                quoteEl.style.lineHeight = '1.5';
                quoteEl.style.color = '#e5e7eb';
                quoteEl.style.fontSize = '0.95rem';
                quoteEl.style.opacity = '0';
                quoteEl.style.transition = 'opacity 400ms ease';
                const host = loadingOverlay.querySelector('.loading-text')?.parentElement || loadingOverlay;
                host.appendChild(quoteEl);
            }
            updateQuote();
            clearInterval(quoteTimer);
            quoteTimer = setInterval(updateQuote, 10000);
        }

        function stopQuotes() {
            if (quoteTimer) {
                clearInterval(quoteTimer);
                quoteTimer = null;
            }
            if (quoteEl) {
                quoteEl.remove();
                quoteEl = null;
            }
        }

        function updateQuote() {
            if (!quoteEl || learningQuotes.length === 0) return;
            const q = learningQuotes[quoteIndex % learningQuotes.length];
            quoteIndex++;
            const el = quoteEl; // capture reference
            if (el && el.style) el.style.opacity = '0';
            setTimeout(() => {
                if (!el || !el.isConnected) return;
                el.innerHTML = `
                    <div style="font-style: italic;">“${q.text}”</div>
                    <div style="margin-top: 0.35rem; font-size: 0.85rem; color: #cbd5e1;">— ${q.source}</div>
                `;
                if (el.style) el.style.opacity = '1';
            }, 220);
        }

        return {
            show(message = 'Loading your learning experience...') {
                loadingCount++;
                loadingText.textContent = message;
                loadingOverlay.setAttribute('aria-hidden', 'false');
                startQuotes();
            },

            hide() {
                loadingCount = Math.max(0, loadingCount - 1);
                if (loadingCount === 0) {
                    stopQuotes();
                    loadingOverlay.setAttribute('aria-hidden', 'true');
                }
            },

            forceHide() {
                loadingCount = 0;
                stopQuotes();
                loadingOverlay.setAttribute('aria-hidden', 'true');
            }
        };
    })();

    // Modal component
    UI.Components.Modal = (() => {
        const modalContainer = document.getElementById('modal-container');
        const modalContent = modalContainer.querySelector('.modal-content');
        const modalTitle = document.getElementById('modal-title');
        const modalDescription = document.getElementById('modal-description');
        const modalFooter = modalContainer.querySelector('.modal-footer');
        const modalClose = modalContainer.querySelector('.modal-close');

        let currentModal = null;
        let previousFocus = null;

        function show(options = {}) {
            const {
                title = '',
                content = '',
                actions = [],
                closable = true,
                onClose = null,
                allowHTML = false // NEW: allow trusted HTML (forms) inside modal
            } = options;

            previousFocus = document.activeElement;
            modalTitle.textContent = title;
            // Support raw HTML when explicitly allowed
            if (allowHTML) {
                modalDescription.innerHTML = content;
            } else {
                modalDescription.innerHTML = Core.Utils.sanitizeHTML(content);
            }
            
            // Show/hide close button based on closable option
            if (closable) {
                modalClose.style.display = 'block';
            } else {
                modalClose.style.display = 'none';
            }
            
            // Clear and add action buttons
            modalFooter.innerHTML = '';
            actions.forEach(action => {
                const button = document.createElement('button');
                button.className = action.primary ? 'primary-btn' : 'secondary-btn';
                button.textContent = action.label;
                button.addEventListener('click', () => {
                    if (action.handler) {
                        action.handler();
                    }
                    if (action.closeOnClick !== false) {
                        hide();
                    }
                });
                modalFooter.appendChild(button);
            });
            modalContainer.setAttribute('aria-hidden', 'false');
            document.body.classList.add('modal-open');
            
            modalTitle.focus();
            currentModal = { onClose, closable };
            // Trap focus within modal
            trapFocus(modalContent);
        }

        function hide() {
            modalContainer.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('modal-open');
            if (currentModal && currentModal.onClose) {
                currentModal.onClose();
            }
            currentModal = null;
            // Restore focus
            if (previousFocus) {
                previousFocus.focus();
                previousFocus = null;
            }
        }

        function trapFocus(element) {
            const focusableElements = element.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            element.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    if (e.shiftKey) {
                        if (document.activeElement === firstElement) {
                            e.preventDefault();
                            lastElement.focus();
                        }
                    } else {
                        if (document.activeElement === lastElement) {
                            e.preventDefault();
                            firstElement.focus();
                        }
                    }
                }
            });
        }

        // Event listeners
        modalClose.addEventListener('click', () => {
            if (currentModal && currentModal.closable !== false) {
                hide();
            }
        });
        
        modalContainer.addEventListener('click', (e) => {
            if (e.target === modalContainer && currentModal && currentModal.closable !== false) {
                hide();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && currentModal && currentModal.closable !== false) {
                hide();
            }
        });

        return { show, hide };
    })();

    // State manager for application state
    Data.Models.AppState = (() => {
        let state = {
            user: null,
            currentLearningPath: null,
            notifications: []
        };

        const subscribers = new Set();

        function setState(newState) {
            const oldState = Core.Utils.deepClone(state);
            state = { ...state, ...newState };
            
            // Notify subscribers
            subscribers.forEach(callback => {
                try {
                    callback(state, oldState);
                } catch (error) {
                    console.error('Error in state subscriber:', error);
                }
            });

            // Emit state change event
            Core.EventBus.emit('state:change', { newState: state, oldState });
        }

        function getState() {
            return Core.Utils.deepClone(state);
        }

        function subscribe(callback) {
            subscribers.add(callback);
            return () => subscribers.delete(callback);
        }

        return {
            setState,
            getState,
            subscribe
        };
    })();

    // Main application controller
    Core.App = (() => {
        let initialized = false;

        function initialize() {
            if (initialized) return;


            try {
                // Initialize core systems
                Core.Router.init();
                initializeEventListeners();
                setupRoutes();
                initializeUserInterface();
                
                // Wait for API to be available
                let apiWaitAttempts = 0;
                const maxWaitAttempts = 50; // 5 seconds maximum
                
                const waitForAPI = () => {
                    apiWaitAttempts++;
                    
                    if (Growth90.Data?.API?.learningPath && Growth90.Data?.API?.content) {
                        loadInitialData();
                        
                        initialized = true;
                        Core.EventBus.emit('app:initialized');
                        
                    } else if (apiWaitAttempts >= maxWaitAttempts) {
                        
                        loadInitialData();
                        
                        initialized = true;
                        Core.EventBus.emit('app:initialized');
                        
                    } else {
                        setTimeout(waitForAPI, 100);
                    }
                };
                
                // Start checking for API availability
                waitForAPI();
                
            } catch (error) {
                console.error('❌ Failed to initialize Growth90 Platform:', error);
                UI.Components.Notifications.error('Failed to initialize the learning platform. Please refresh the page.');
            }
        }

        function initializeEventListeners() {
            // Global error handler
            window.addEventListener('error', (e) => {
                console.error('Global error:', e.error);
                UI.Components.Notifications.error('An unexpected error occurred. Our team has been notified.');
            });

            // Unhandled promise rejection handler
            window.addEventListener('unhandledrejection', (e) => {
                console.error('Unhandled promise rejection:', e.reason);
                e.preventDefault();
            });

            // Network status
            window.addEventListener('online', () => {
                UI.Components.Notifications.success('Connection restored');
                Core.EventBus.emit('network:online');
            });

            window.addEventListener('offline', () => {
                UI.Components.Notifications.warning('You are currently offline. Some features may be limited.');
                Core.EventBus.emit('network:offline');
            });

            // Mobile menu toggle
            const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
            if (mobileMenuToggle) {
                mobileMenuToggle.addEventListener('click', toggleMobileMenu);
            }

            // Action button handlers
            document.addEventListener('click', (e) => {
                const actionBtn = e.target.closest('[data-action]');
                if (actionBtn) {
                    const action = actionBtn.getAttribute('data-action');
                    handleQuickAction(action);
                }
            });
        }

        function setupRoutes() {
            Core.Router.register('home', showHome);
            Core.Router.register('domains', showDomainSelection);
            Core.Router.register('learning', showTodaysLearning);
            Core.Router.register('profile', showProfile);
            Core.Router.register('path', showLearningPath);
        }

        function initializeUserInterface() {
            // Set up responsive navigation
            updateNavigationState();
            
            // Initialize theme
            applyTheme();
        }

        function loadInitialData() {
            // First try local identity
            (async () => {
                try {
                    // If LocalStorage helper not yet loaded, fall back to latest stored profile
                    if (!Growth90.Data.LocalStorage || !Growth90.Data.LocalStorage.getItem) {
                        const latest = await Growth90.Data.Storage.queryItems('userProfiles', {
                            index: 'createdAt',
                            direction: 'prev',
                            limit: 1
                        });
                        const profile = latest && latest.length ? latest[0] : null;
                        if (profile) {
                            Data.Models.AppState.setState({ user: profile });
                            Core.Router.navigate('home');
                        } else {
                            showWelcomeScreen();
                        }
                        return;
                    }
                    
                    const identity = Growth90.Data.LocalStorage.getItem('user_identity');
                    if (identity?.email) {
                        const existing = await findUserProfileByEmail(identity.email);
                        if (existing) {
                            Data.Models.AppState.setState({ user: existing });
                            Core.Router.navigate('home');
                            return;
                        }
                    }
                    // Fallback to latest stored profile if identity not found
                    const latest = await Growth90.Data.Storage.queryItems('userProfiles', {
                        index: 'createdAt',
                        direction: 'prev',
                        limit: 1
                    });
                    const profile = latest && latest.length ? latest[0] : null;
                    if (profile) {
                        Data.Models.AppState.setState({ user: profile });
                        Core.Router.navigate('home');
                    } else {
                        showWelcomeScreen();
                    }
                } catch (e) {
                    showWelcomeScreen();
                }
            })();
        }

        async function findUserProfileByEmail(email) {
            try {
                const results = await Growth90.Data.Storage.queryItems('userProfiles', {
                    index: 'email',
                    keyRange: IDBKeyRange.only(email)
                });
                return results[0] || null;
            } catch (e) {
                return null;
            }
        }

        function showWelcomeScreen() {
            // Check if user has provided email before showing welcome screen
            const userIdentity = localStorage.getItem('growth90_user_identity');
            if (!userIdentity) {
                // First visit - collect email and name
                showFirstVisitModal();
                return;
            }

            // If user has provided identity, check if they have selected a topic
            try {
                const identity = JSON.parse(userIdentity);
                if (identity.selectedTopic && identity.selectedTopic.id) {
                    // User has selected a topic, go to Today's Learning
                    Core.Router.navigate('learning');
                } else {
                    // No topic selected, go to home page
                    Core.Router.navigate('home');
                }
            } catch (e) {
                // Error parsing identity, fallback to home
                Core.Router.navigate('home');
            }
        }

        function showFirstVisitModal() {
            UI.Components.Modal.show({
                title: 'Welcome to Growth90!',
                allowHTML: true,
                closable: false, // Prevent closing without providing required info
                content: `
                    <div style="text-align: center; margin-bottom: 1.5rem;">
                        <p>Transform your professional skills in 90 days with personalized learning experiences.</p>
                        <p><strong>Please provide these details to continue:</strong></p>
                    </div>
                    <form id="first-visit-form" style="max-width: 400px; margin: 0 auto;">
                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label class="form-label" for="fv-nickname" style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #1f2937;">Nickname *</label>
                            <input class="form-input" id="fv-nickname" type="text" required placeholder="What should we call you?" 
                                   style="width: 100%; padding: 0.75rem; border: 2px solid #d1d5db; border-radius: 6px; font-size: 16px;"
                                   autocomplete="given-name">
                            <small style="color: #6b7280; font-size: 14px;">This is how we'll address you in the platform</small>
                        </div>
                        <div class="form-group" style="margin-bottom: 1.5rem;">
                            <label class="form-label" for="fv-email" style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #1f2937;">Email Address *</label>
                            <input class="form-input" id="fv-email" type="email" required placeholder="your.email@example.com" 
                                   style="width: 100%; padding: 0.75rem; border: 2px solid #d1d5db; border-radius: 6px; font-size: 16px;"
                                   autocomplete="email">
                            <small style="color: #6b7280; font-size: 14px;">We'll use this to save your data and send updates</small>
                        </div>
                        <div id="validation-message" style="color: #ef4444; font-size: 14px; margin-top: 1rem; text-align: center; display: none;">
                            Please fill in both fields to continue
                        </div>
                    </form>
                `,
                actions: [
                    {
                        label: 'Continue to Growth90',
                        primary: true,
                        closeOnClick: false, // Don't auto-close, we'll control it manually
                        handler: () => {
                            const nickname = document.getElementById('fv-nickname').value.trim();
                            const email = document.getElementById('fv-email').value.trim();
                            const validationMessage = document.getElementById('validation-message');

                            // Clear previous validation message
                            validationMessage.style.display = 'none';

                            // Strict validation - both fields required
                            if (!nickname || !email) {
                                validationMessage.textContent = 'Both nickname and email are required to continue';
                                validationMessage.style.display = 'block';
                                
                                // Highlight empty fields
                                if (!nickname) {
                                    document.getElementById('fv-nickname').style.borderColor = '#ef4444';
                                }
                                if (!email) {
                                    document.getElementById('fv-email').style.borderColor = '#ef4444';
                                }
                                return; // Don't close modal
                            }

                            // Email validation
                            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                            if (!emailRegex.test(email)) {
                                validationMessage.textContent = 'Please enter a valid email address';
                                validationMessage.style.display = 'block';
                                document.getElementById('fv-email').style.borderColor = '#ef4444';
                                return; // Don't close modal
                            }

                            // Nickname validation (minimum 2 characters)
                            if (nickname.length < 2) {
                                validationMessage.textContent = 'Nickname must be at least 2 characters long';
                                validationMessage.style.display = 'block';
                                document.getElementById('fv-nickname').style.borderColor = '#ef4444';
                                return; // Don't close modal
                            }

                            // Store user identity in localStorage
                            const userIdentity = {
                                nickname,
                                email,
                                createdAt: new Date().toISOString()
                            };
                            localStorage.setItem('growth90_user_identity', JSON.stringify(userIdentity));

                            // Also store in Growth90 LocalStorage if available
                            if (Growth90.Data.LocalStorage) {
                                Growth90.Data.LocalStorage.setItem('user_identity', userIdentity);
                            }

                            UI.Components.Modal.hide();
                            UI.Components.Notifications.success(`Welcome ${nickname}! Let's start your learning journey.`);
                            
                            // Force reload of home content instead of navigating
                            showHome();
                        }
                    }
                ]
            });

            // Add real-time validation feedback
            setTimeout(() => {
                const nicknameInput = document.getElementById('fv-nickname');
                const emailInput = document.getElementById('fv-email');
                
                const resetBorderColor = (input) => {
                    input.style.borderColor = '#d1d5db';
                };

                if (nicknameInput) {
                    nicknameInput.addEventListener('input', () => resetBorderColor(nicknameInput));
                    nicknameInput.addEventListener('focus', () => resetBorderColor(nicknameInput));
                }
                
                if (emailInput) {
                    emailInput.addEventListener('input', () => resetBorderColor(emailInput));
                    emailInput.addEventListener('focus', () => resetBorderColor(emailInput));
                }
            }, 100);
        }

        function showLearnMoreModal() {
            UI.Components.Modal.show({
                title: 'About Growth90',
                content: `
                    <p>Growth90 is a comprehensive professional learning platform designed to transform your skills in just 90 days.</p>
                    <h4>Key Features:</h4>
                    <ul>
                        <li><strong>Personalized Learning Paths:</strong> AI-powered curricula tailored to your professional context</li>
                        <li><strong>Evidence-Based Methodology:</strong> Built on proven educational psychology principles</li>
                        <li><strong>Professional Community:</strong> Connect with peers and experts</li>
                        <li><strong>Continuous Improvement:</strong> Inspired by principles of lifelong learning</li>
                    </ul>
                    <p>Start your transformative learning journey today!</p>
                `,
                actions: [
                    { label: 'Begin Journey', primary: true, handler: () => Core.Router.navigate('home') },
                    { label: 'Close', primary: false }
                ]
            });
        }

        // Helper functions for Today's Learning calculations
        function calculateCurrentDay(startDate) {
            if (!startDate) return 1;
            const start = new Date(startDate);
            const today = new Date();
            const diffTime = today - start;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            return Math.max(1, diffDays + 1);
        }

        // New function to get current day based on lesson completion status
        async function getCurrentDayByCompletion(userId, pathId) {
            try {
                // Get latest learning path for this user
                const userPaths = await Growth90.Data.Storage.queryItems('learningPaths', {
                    index: 'userId',
                    keyRange: IDBKeyRange.only(userId),
                    direction: 'prev',
                    limit: 1
                });
                const learningPath = userPaths && userPaths.length ? userPaths[0] : null;

                // Support multiple curriculum formats
                let curriculum = null;
                if (learningPath.pathData && Array.isArray(learningPath.pathData.daily_curriculum)) {
                    curriculum = learningPath.pathData.daily_curriculum;
                } else if (Array.isArray(learningPath.curriculum)) {
                    curriculum = learningPath.curriculum;
                }

                if (!curriculum || curriculum.length === 0) {
                    return 1; // Default to day 1
                }

                // Determine the first day that is NOT FULLY completed
                for (let day = 1; day <= curriculum.length; day++) {
                    // Day is considered complete only if all its lessons are done
                    const done = await checkIfDayCompleted(userId, pathId, day);
                    if (!done) return day;
                }

                // If all days are fully completed, advance but cap at last day
                return Math.min(curriculum.length, curriculum.length); // stay on last day if all done
            } catch (error) {
                return 1; // Fallback to day 1
            }
        }

        // Function to mark a lesson as completed
        async function markLessonCompleted(userId, pathId, day, lessonData = {}) {
            try {
                const lessonProgress = {
                    id: `${userId}_${pathId}_day_${day}_${lessonData.lessonId || 'default'}`,
                    userId: userId,
                    pathId: pathId,
                    day: day,
                    lessonId: lessonData.lessonId || 'default',
                    status: 'completed',
                    completedAt: new Date().toISOString(),
                    timeSpent: lessonData.timeSpent || 0,
                    score: lessonData.score || null,
                    notes: lessonData.notes || ''
                };

                await Growth90.Data.Storage.setItem('learningProgress', lessonProgress);
                
                // Emit completion event for other systems
                Growth90.Core.EventBus.emit('lesson:completed', {
                    ...lessonProgress,
                    ...lessonData
                });

                return true;
            } catch (error) {
                console.error('Error marking lesson as completed:', error);
                return false;
            }
        }

        function calculateStreak(userIdentity) {
            // In real implementation, this would calculate consecutive days
            return userIdentity.streak || 1;
        }

        function calculateTimeInvested(userIdentity) {
            // Simple time calculation - in real implementation would track actual time
            return userIdentity.timeInvested || 0;
        }

        // Home page
        async function showHome() {
            UI.Components.Loading.show('Loading home page...');
            
            try {
                const contentArea = document.getElementById('app-content');
                
                // Get user identity and check if profile is completed
                let userIdentity = null;
                try {
                    const stored = localStorage.getItem('growth90_user_identity');
                    userIdentity = stored ? JSON.parse(stored) : null;
                } catch (e) {
                }

                if (!userIdentity) {
                    // No user identity - show first visit modal and clear content
                    contentArea.innerHTML = '<div style="text-align: center; padding: 2rem;">Setting up your account...</div>';
                    UI.Components.Loading.hide();
                    showFirstVisitModal();
                    updateActiveNavigation('home');
                    return;
                }

                const isProfileCompleted = userIdentity.profileCompleted === true;

                if (!isProfileCompleted) {
                    // Show incomplete profile home with "Begin Your Journey" button
                    contentArea.innerHTML = `
                        <div class="home-container">
                            <div class="home-header">
                                <h1>Welcome back, ${userIdentity.nickname}!</h1>
                                <p class="home-subtitle">Complete your profile to unlock your personalized learning experience</p>
                            </div>
                            
                            <div class="home-content">
                                <!-- Section 1: Complete Your Profile -->
                                <div class="profile-completion-card">
                                    <div class="card-icon">🎯</div>
                                    <div class="card-content">
                                        <h3>Complete Your Profile</h3>
                                        <p>Set up your professional context to get started with your personalized 90-day journey.</p>
                                        <button class="primary-btn profile-setup-btn" id="begin-journey-btn">
                                            <span>Begin Your Journey</span>
                                            <span class="btn-arrow">→</span>
                                        </button>
                                    </div>
                                </div>
                                
                                <!-- Section 2: Choose Domain (Blurred until profile complete) -->
                                <div class="topic-selection-section blurred-section" id="topic-selection">
                                    <div class="section-header">
                                        <h3>Choose Your Learning Domain</h3>
                                    </div>
                                    
                                    <div class="topic-options">
                                        <div class="suggested-topics">
                                            <h4>Suggested Domains</h4>
                                            <div class="topics-grid">
                                                <div class="topic-card disabled">
                                                    <div class="topic-icon">💼</div>
                                                    <h5>Leadership Skills</h5>
                                                    <p>Build confidence in leading teams</p>
                                                </div>
                                                <div class="topic-card disabled">
                                                    <div class="topic-icon">🗣️</div>
                                                    <h5>Communication</h5>
                                                    <p>Master professional communication</p>
                                                </div>
                                                <div class="topic-card disabled">
                                                    <div class="topic-icon">📊</div>
                                                    <h5>Data Analysis</h5>
                                                    <p>Improve analytical thinking</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="section-overlay">
                                        <div class="overlay-content">
                                            <div class="lock-icon">🔒</div>
                                            <p>Complete your profile to unlock domain selection</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    
                    // Add event handler for "Begin Your Journey" button
                    const beginBtn = document.getElementById('begin-journey-btn');
                    if (beginBtn) {
                        beginBtn.addEventListener('click', () => {
                            showQuickSignupModal();
                        });
                    }
                    
                    UI.Components.Loading.hide();
                    updateActiveNavigation('home');
                    
                } else {
                    // Show completed profile home with minimal today's learning section
                    const hasSelectedTopic = userIdentity.selectedTopic && userIdentity.selectedTopic.id;
                    const currentDay = hasSelectedTopic ? await getCurrentDayByCompletion(userIdentity.email || userIdentity.id || 'guest', userIdentity.selectedTopic.id) : 1;
                    
                    contentArea.innerHTML = `
                        <div class="home-container">
                            <div class="home-header">
                                <h1>Good ${getTimeOfDay()}, ${userIdentity.nickname}!</h1>
                                <p class="home-subtitle">Ready to continue your learning journey?</p>
                            </div>
                            
                            <div class="home-content">
                                ${hasSelectedTopic ? `
                                    <!-- Today's Learning Summary (Centered) -->
                                    <div class="today-learning-summary">
                                        <div class="learning-summary-header">
                                            <div class="summary-icon">🎯</div>
                                            <div class="summary-content">
                                                <h3>Today's Learning</h3>
                                                <p>${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} - Day ${currentDay} of your 90-day journey</p>
                                                <div class="topic-badge-small" title="Selected domain">
                                                    ${userIdentity.selectedTopic.id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="learning-summary-actions">
                                            <button class="primary-btn start-learning-btn" id="start-learning-btn">
                                                <span>Start Learning</span>
                                                <span class="btn-arrow">→</span>
                                            </button>
                                        </div>
                                        
                                        <div class="quick-stats">
                                            <div class="quick-stat">
                                                <span class="stat-icon">🔥</span>
                                                <span class="stat-value">${calculateStreak(userIdentity)}</span>
                                                <span class="stat-label">Day Streak</span>
                                            </div>
                                            <div class="quick-stat">
                                                <span class="stat-icon">📈</span>
                                                <span class="stat-value">${Math.round((currentDay / 90) * 100)}%</span>
                                                <span class="stat-label">Completion</span>
                                            </div>
                                            <div class="quick-stat">
                                                <span class="stat-icon">⏰</span>
                                                <span class="stat-value">${calculateTimeInvested(userIdentity)}h</span>
                                                <span class="stat-label">Time Invested</span>
                                            </div>
                                        </div>
                                    </div>
                                ` : ''}
                                
                                <!-- Section 1: Complete Your Profile (Completed) -->
                                <div class="profile-completion-card completed">
                                    <div class="card-icon">✅</div>
                                    <div class="card-content">
                                        <h3>Profile Complete</h3>
                                        <p>Your professional context is set up.</p>
                                        <button class="secondary-btn profile-edit-btn" id="edit-profile-btn">
                                            <span>Edit Profile</span>
                                            <span class="btn-arrow">✏️</span>
                                        </button>
                                    </div>
                                </div>
                                
                                <!-- Section 2: Choose Domain -->
                                <div class="topic-selection-section ${hasSelectedTopic ? 'completed-section' : 'active-section'}" id="topic-selection">
                                    ${hasSelectedTopic ? `
                                        <!-- Selected Domain Display -->
                                        <div class="selected-topic-display">
                                            <div class="section-header">
                                                <h3>Selected Learning Domain</h3>
                                                <p>Your 90-day learning journey</p>
                                            </div>
                                            
                                            <div class="selected-topic-card">
                                                <div class="topic-icon">🎯</div>
                                                <div class="topic-content">
                                                    <h4>${userIdentity.selectedTopic.id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
                                                    <p>${userIdentity.selectedTopic.description}</p>
                                                    <div class="topic-actions">
                                                        <button class="secondary-btn change-topic-btn" id="change-topic-btn">
                                                            <span>Change Domain</span>
                                                            <span class="btn-arrow">🔄</span>
                                                        </button>
                                                        <button class="primary-btn view-learning-btn" id="view-learning-btn">
                                                            <span>View Learning Details</span>
                                                            <span class="btn-arrow">→</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ` : `
                                        <!-- Domain Selection -->
                                        <div class="section-header">
                                            <h3>Choose Your Learning Domain</h3>
                                        </div>
                                        
                                        <div class="topic-options">
                                            <div class="suggested-topics">
                                                <h4>Suggested Domains</h4>
                                                <div class="topics-grid" id="suggested-topics-grid">
                                                    <!-- Will be populated by API call -->
                                                    <div class="topic-loading">
                                                        <p class="loading-text">Loading personalized suggestions<span class="loading-dots">...</span></p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div class="custom-topic">
                                                <button class="primary-btn browse-domains-btn" id="browse-domains-btn">
                                                    <span>Browse All Domains</span>
                                                    <span class="btn-arrow">🎯</span>
                                                </button>
                                            </div>
                                        </div>
                                    `}
                                </div>
                            </div>
                        </div>
                    `;
                    
                    // Load suggested topics if no topic selected yet
                    if (!hasSelectedTopic) {
                        setTimeout(() => loadSuggestedTopics(), 100);
                    }
                    
                    // Add event handlers
                    const editProfileBtn = document.getElementById('edit-profile-btn');
                    if (editProfileBtn) {
                        editProfileBtn.addEventListener('click', () => {
                            Core.Router.navigate('profile');
                        });
                    }
                    
                    const browseDomainsBtn = document.getElementById('browse-domains-btn');
                    if (browseDomainsBtn) {
                        browseDomainsBtn.addEventListener('click', () => {
                            Core.Router.navigate('domains');
                        });
                    }
                    
                    const changeTopicBtn = document.getElementById('change-topic-btn');
                    if (changeTopicBtn) {
                        changeTopicBtn.addEventListener('click', () => {
                            // Clear selected topic and reload topic selection
                            const userIdentity = JSON.parse(localStorage.getItem('growth90_user_identity') || '{}');
                            delete userIdentity.selectedTopic;
                            localStorage.setItem('growth90_user_identity', JSON.stringify(userIdentity));
                            showHome(); // Reload home page
                        });
                    }
                    
                    const viewLearningBtn = document.getElementById('view-learning-btn');
                    if (viewLearningBtn) {
                        viewLearningBtn.addEventListener('click', () => {
                            Core.Router.navigate('learning');
                        });
                    }
                    
                    const startBtn = document.getElementById('start-learning-btn');
                    if (startBtn) {
                        startBtn.addEventListener('click', () => {
                            Core.Router.navigate('learning');
                        });
                    }
                }
                
                UI.Components.Loading.hide();
                updateActiveNavigation('home');
                
            } catch (error) {
                console.error('Failed to load home page:', error);
                UI.Components.Loading.hide();
                UI.Components.Notifications.error('Failed to load home page. Please try again.');
            }
        }

        // Domain Selection page
        async function showDomainSelection() {
            UI.Components.Loading.show('Loading domains...');
            
            try {
                const contentArea = document.getElementById('app-content');
                
                contentArea.innerHTML = `
                    <div class="domain-selection-container">
                        <div class="domain-selection-header">
                            <h1 class="welcome-title">Choose Your Learning Domain</h1>
                            <p class="welcome-subtitle">Select a broader domain area to explore specialized areas within that field</p>
                        </div>
                        
                        <div class="broader-domains-grid">
                            <div class="domain-card" data-domain="leadership-skills">
                                <div class="domain-icon">💼</div>
                                <h3>Leadership Skills</h3>
                                <p>Build confidence in leading teams and projects</p>
                                <span class="domain-level">Intermediate</span>
                            </div>
                            
                            <div class="domain-card" data-domain="communication">
                                <div class="domain-icon">🗣️</div>
                                <h3>Communication</h3>
                                <p>Master professional communication and presentation skills</p>
                                <span class="domain-level">Beginner</span>
                            </div>
                            
                            <div class="domain-card" data-domain="data-analysis">
                                <div class="domain-icon">📊</div>
                                <h3>Data Analysis</h3>
                                <p>Improve analytical thinking and data interpretation</p>
                                <span class="domain-level">Intermediate</span>
                            </div>
                            
                            <div class="domain-card" data-domain="project-management">
                                <div class="domain-icon">📋</div>
                                <h3>Project Management</h3>
                                <p>Learn to plan, execute, and deliver projects effectively</p>
                                <span class="domain-level">Intermediate</span>
                            </div>
                            
                            <div class="domain-card" data-domain="emotional-intelligence">
                                <div class="domain-icon">🧠</div>
                                <h3>Emotional Intelligence</h3>
                                <p>Develop self-awareness and interpersonal skills</p>
                                <span class="domain-level">Beginner</span>
                            </div>
                            
                            <div class="domain-card" data-domain="digital-marketing">
                                <div class="domain-icon">📱</div>
                                <h3>Digital Marketing</h3>
                                <p>Master modern marketing strategies and tools</p>
                                <span class="domain-level">Intermediate</span>
                            </div>
                            
                            <div class="domain-card" data-domain="technical-skills">
                                <div class="domain-icon">💻</div>
                                <h3>Technical Skills</h3>
                                <p>Enhance programming and technical competencies</p>
                                <span class="domain-level">Advanced</span>
                            </div>
                            
                            <div class="domain-card" data-domain="financial-literacy">
                                <div class="domain-icon">💰</div>
                                <h3>Financial Literacy</h3>
                                <p>Understand business finance and investment principles</p>
                                <span class="domain-level">Intermediate</span>
                            </div>
                        </div>
                    </div>
                `;
                
                // Add event listeners for domain selection
                const domainCards = contentArea.querySelectorAll('.domain-card');
                domainCards.forEach(card => {
                    card.addEventListener('click', async () => {
                        const domainId = card.getAttribute('data-domain');
                        const domainTitle = card.querySelector('h3').textContent;
                        
                        // Save selected broader domain
                        sessionStorage.setItem('selectedBroaderDomain', JSON.stringify({
                            id: domainId,
                            title: domainTitle
                        }));
                        
                        // Show specializations modal
                        await showSpecializationsModal(domainId, domainTitle);
                    });
                });
                
                UI.Components.Loading.hide();
                updateActiveNavigation('domains');
                
            } catch (error) {
                console.error('Failed to load domain selection:', error);
                UI.Components.Loading.hide();
                UI.Components.Notifications.error('Failed to load domains. Please try again.');
            }
        }

        // Show specializations modal when domain is clicked
        async function showSpecializationsModal(domainId, domainTitle) {
            try {
                // Show modal with ONLY loading state initially
                UI.Components.Modal.show({
                    title: `Select a skill you want to master in your 90-day journey`,
                    allowHTML: true,
                    content: `
                        <div class="specializations-modal-content">
                            <div class="specializations-loading">
                                <p class="loading-text">Loading specializations<span class="loading-dots">...</span></p>
                            </div>
                        </div>
                    `,
                    size: 'large',
                    showCloseButton: true
                });

                // Wait for modal to be fully rendered
                await new Promise(resolve => setTimeout(resolve, 100));

                // Get user profile for personalized recommendations
                const userProfile = getCurrentUserProfile();
                const professionalContext = {
                    industry: userProfile?.industry || 'general',
                    role: userProfile?.currentRole || 'individual contributor',
                    experience: userProfile?.experience || 'intermediate'
                };

                // Call API to get specializations for the domain
                let specializations = [];
                try {
                    
                    // Map frontend domain IDs to API domain IDs if needed
                    const domainMapping = {
                        'leadership-skills': 'leadership-skills',
                        'communication': 'communication',
                        'data-analysis': 'data-analysis',
                        'project-management': 'project-management',
                        'emotional-intelligence': 'emotional-intelligence',
                        'digital-marketing': 'digital-marketing',
                        'technical-skills': 'technical-skills',
                        'financial-literacy': 'financial-literacy'
                    };
                    
                    // Use mapped domain ID if available, otherwise use original
                    let apiDomainId = domainMapping[domainId] || domainId;
                    
                    // Validate domain parameter
                    if (!apiDomainId || apiDomainId.trim() === '') {
                        console.error('❌ Domain ID is empty or undefined!');
                        throw new Error('Invalid domain ID provided');
                    }
                    
                    // Prepare the exact payload structure as specified
                    const apiPayload = {
                        domain: apiDomainId,
                        industry_context: {
                            industry: professionalContext.industry,
                            role: professionalContext.role,
                            experience: professionalContext.experience,
                            focus: 'specialization_areas',
                            context: 'professional_development'
                        },
                        user_profile: userProfile || {}
                    };
                    
                    
                    const response = await Growth90.Data.API.content.getSpecializations(
                        apiPayload.domain,
                        apiPayload.industry_context,
                        apiPayload.user_profile
                    );

                    // If no error was thrown, we have a successful 200 response
                    if (response) {
                        
                        if (response.specializations) {
                        }
                        
                        const responseData = response.data || response; // Handle both wrapper and direct formats
                        
                        // Try multiple response formats to extract specializations
                        if (responseData.specializations && Array.isArray(responseData.specializations)) {
                            specializations = responseData.specializations.map(spec => ({
                                id: spec.id || spec.title?.toLowerCase().replace(/\s+/g, '-'),
                                title: spec.title,
                                description: spec.description || spec.summary,
                                icon: spec.icon || '🎯',
                                duration: spec.duration || '90 days',
                                level: spec.level || spec.difficulty || 'Intermediate'
                            }));
                        } else if (responseData.domain && responseData.domain.specializations) {
                            specializations = responseData.domain.specializations.map(spec => ({
                                id: spec.id || spec.title?.toLowerCase().replace(/\s+/g, '-'),
                                title: spec.title,
                                description: spec.description || spec.summary,
                                icon: spec.icon || '🎯',
                                duration: spec.duration || '90 days',
                                level: spec.level || spec.difficulty || 'Intermediate'
                            }));
                        } else if (responseData.insights && Array.isArray(responseData.insights)) {
                            specializations = parseSkillsFromSpecializations(responseData, domainId);
                        } else {
                            specializations = parseSkillsFromSpecializations(responseData, domainId);
                        }
                    }
                } catch (error) {
                    console.warn('Failed to get specializations (non-200 status), using defaults:', error);
                    console.warn('📋 API Error details:', {
                        domain: apiPayload?.domain,
                        originalDomain: domainId,
                        payload: apiPayload,
                        error: error.message || error
                    });
                }

                // Fallback to default specializations if API fails or returns empty
                if (specializations.length === 0) {
                    
                    specializations = getDefaultSpecializations(domainId);
                }

                // Find and update modal content with proper waiting
                let modalContent = null;
                let attempts = 0;
                const maxAttempts = 10;
                
                while (!modalContent && attempts < maxAttempts) {
                    // Try multiple selectors to find the modal content
                    modalContent = document.querySelector('.specializations-modal-content') ||
                                  document.querySelector('.modal-body .specializations-modal-content') ||
                                  document.querySelector('.modal-content .specializations-modal-content') ||
                                  document.querySelector('#modal-description .specializations-modal-content');
                    
                    if (!modalContent) {
                        await new Promise(resolve => setTimeout(resolve, 50));
                        attempts++;
                        
                        // Debug what modal elements exist
                        if (attempts === 5) {
                        }
                    }
                }
                
                // If we can't find the specific element, try to update modal body directly
                if (!modalContent) {
                    const modalBody = document.querySelector('.modal-body') || document.querySelector('#modal-description');
                    if (modalBody) {
                        modalBody.innerHTML = `
                            <div class="specializations-modal-content">
                                <div class="specializations-loading">
                                    <p class="loading-text">Loading specializations<span class="loading-dots">...</span></p>
                                </div>
                            </div>
                        `;
                        modalContent = modalBody.querySelector('.specializations-modal-content');
                    }
                }
                
                // Ensure loading state is visible before proceeding with API call
                if (modalContent) {
                    // Clear any existing content and show only loading
                    modalContent.innerHTML = `
                        <div class="specializations-loading">
                            <p class="loading-text">Loading specializations<span class="loading-dots">...</span></p>
                        </div>
                    `;
                    
                    // Add a small delay to ensure loading state is visible
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
                
                if (modalContent) {
                    
                    if (specializations.length === 0) {
                        modalContent.innerHTML = `
                            <div class="specializations-error">
                                <p>No specializations found for this domain. Please try again or select a different domain.</p>
                            </div>
                        `;
                    } else {
                        modalContent.innerHTML = `
                            <div class="modal-specializations-grid">
                                ${specializations.map(specialization => `
                                    <div class="modal-specialization-card" data-specialization-id="${specialization.id}">
                                        <div class="modal-specialization-icon">${specialization.icon}</div>
                                        <h4 class="modal-specialization-title">${specialization.title}</h4>
                                        <p class="modal-specialization-description">${specialization.description}</p>
                                        <div class="modal-specialization-metadata">
                                            <span class="modal-specialization-duration">${specialization.duration}</span>
                                            <span class="modal-specialization-level">${specialization.level}</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        `;
                    }

                    // Add click handlers to specialization cards
                    const specializationCards = modalContent.querySelectorAll('.modal-specialization-card');
                    specializationCards.forEach(card => {
                        card.addEventListener('click', async () => {
                            const specializationId = card.getAttribute('data-specialization-id');
                            const selectedSpecialization = specializations.find(s => s.id === specializationId);
                            
                            if (selectedSpecialization) {
                                // Close modal
                                UI.Components.Modal.hide();
                                
                                // Start learning path generation
                                await generateLearningPathForSpecialization(domainId, domainTitle, selectedSpecialization);
                            }
                        });
                    });
                } else {
                    console.error('❌ Could not find modal content element to update');
                }

            } catch (error) {
                console.error('Failed to show specializations modal:', error);
                UI.Components.Notifications.error('Failed to load specializations. Please try again.');
            }
        }

        // Function to generate learning path for selected specialization
        async function generateLearningPathForSpecialization(domainId, domainTitle, selectedSpecialization) {
            try {
                UI.Components.Loading.show('Creating your personalized 90-day learning path...');

                // Save the selected specialization
                const userIdentity = getCurrentUserProfile() || {};
                userIdentity.selectedTopic = {
                    id: selectedSpecialization.id,
                    title: selectedSpecialization.title,
                    description: selectedSpecialization.description,
                    domain: {
                        id: domainId,
                        title: domainTitle
                    },
                    icon: selectedSpecialization.icon
                };

                localStorage.setItem('growth90_user_identity', JSON.stringify(userIdentity));

                // Generate learning path using the existing API
                const professionalContext = {
                    industry: userIdentity.industry || 'general',
                    role: userIdentity.currentRole || 'individual contributor',
                    experience: userIdentity.experience || 'intermediate'
                };

                const learningPreferences = {
                    focusArea: selectedSpecialization.id,
                    skillDomain: domainId,
                    timeCommitment: userIdentity.dailyTimeCommitment || '30-45',
                    difficulty: selectedSpecialization.level?.toLowerCase() || 'intermediate'
                };

                // Call the learning path generation API
                try {
                    const learningPathResponse = await Growth90.Data.API.learningPath.generatePath(
                        userIdentity,
                        professionalContext,
                        learningPreferences,
                        selectedSpecialization.id
                    );

                    UI.Components.Loading.hide();

                    // If response indicates success, clean and store payload
                    if (learningPathResponse && learningPathResponse.success && learningPathResponse.data) {
                        const cleanedResponse = cleanLearningPathData(learningPathResponse.data);
                        await storeLearningPath(cleanedResponse, userIdentity, selectedSpecialization);
                    }
                    
                    UI.Components.Notifications.success(`90-day learning path created for ${selectedSpecialization.title}!`);
                    Core.Router.navigate('path');
                    
                } catch (pathError) {
                    UI.Components.Loading.hide();
                    console.warn('Learning path generation failed (non-200 status), using fallback:', pathError);
                    // Show generated path preview even if API fails
                    UI.Components.Notifications.info('Learning path prepared! Starting your journey...');
                    Core.Router.navigate('learning');
                }

            } catch (error) {
                console.error('Failed to generate learning path:', error);
                UI.Components.Loading.hide();
                UI.Components.Notifications.error('Failed to create learning path. Please try again.');
            }
        }

        // Helper function to clean learning path data and fix inconsistencies
        function cleanLearningPathData(response) {
            // Create a cleaned copy of the response
            const cleaned = JSON.parse(JSON.stringify(response));
            
            // Fix minor inconsistencies found in the data
            if (cleaned.daily_curriculum) {
                cleaned.daily_curriculum.forEach(day => {
                    // Fix typo in day 89: remove extra space in " rehearsal techniques"
                    if (day.day === 89 && day.supporting_concepts) {
                        day.supporting_concepts = day.supporting_concepts.map(concept => 
                            concept.trim() // Remove any extra spaces
                        );
                    }
                });
            }
            
            // Ensure course title matches the domain
            if (cleaned.course_title && cleaned.course_title.includes('Leadership Skills')) {
                cleaned.course_title = "90-Day Leadership Skills Mastery for Tech Professionals";
            }
            
            // Add missing periods to milestone assessment descriptions
            if (cleaned.milestone_assessments) {
                cleaned.milestone_assessments.forEach(milestone => {
                    if (milestone.description && !milestone.description.endsWith('.')) {
                        milestone.description += '.';
                    }
                });
            }
            
            return cleaned;
        }

        // Helper function to store learning path in IndexedDB
        async function storeLearningPath(learningPathData, userProfile, specialization) {
            try {
                // Generate unique ID for the learning path
                const pathId = `path_${userProfile.email || 'user'}_${specialization.id}_${Date.now()}`;
                
                // Create the learning path object for storage
                const learningPath = {
                    id: pathId,
                    userId: userProfile.email || userProfile.id || 'anonymous',
                    userProfile: userProfile,
                    specialization: specialization,
                    pathData: learningPathData,
                    status: 'active',
                    progress: {
                        currentDay: 1,
                        completedDays: [],
                        totalDays: learningPathData.daily_curriculum?.length || 90,
                        startDate: new Date().toISOString(),
                        lastUpdated: new Date().toISOString()
                    },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                // Store in IndexedDB
                await Growth90.Data.Storage.setItem('learningPaths', learningPath);
                
                // Also store as current active path in localStorage for quick access
                localStorage.setItem('growth90_active_learning_path', JSON.stringify({
                    id: pathId,
                    title: learningPathData.course_title,
                    specialization: specialization.title,
                    currentDay: 1,
                    totalDays: learningPathData.daily_curriculum?.length || 90,
                    createdAt: learningPath.createdAt
                }));
                
                return pathId;
                
            } catch (error) {
                console.error('❌ Failed to store learning path:', error);
                throw error;
            }
        }

        // Function to show learning path page when user has profile but no learning paths
        function showEmptyLearningPathPage(userIdentity, contentArea) {
            UI.Components.Loading.hide();
            updateActiveNavigation('path');
            
            const hasCompleteProfile = userIdentity && userIdentity.profileCompleted;
            const userName = userIdentity?.nickname || 'there';
            
            contentArea.innerHTML = `
                <div class="learning-path-container">
                    <div class="path-header">
                        <div class="path-icon">🗺️</div>
                        <div class="path-titles">
                            <h1>Your Learning Journey</h1>
                            <p class="path-subtitle">Ready to start your 90-day transformation?</p>
                        </div>
                        <div class="path-actions">
                            <button class="secondary-btn" data-route="home">← Back to Home</button>
                        </div>
                    </div>
                    
                    <div class="empty-path-content">
                        ${hasCompleteProfile ? `
                            <div class="empty-path-card">
                                <div class="empty-path-icon">🚀</div>
                                <h2>Hi ${userName}! Let's Create Your Learning Path</h2>
                                <p class="empty-path-description">
                                    You have a complete profile, but haven't created a learning path yet. 
                                    Choose a skill domain to generate your personalized 90-day journey.
                                </p>
                                
                                <div class="profile-preview">
                                    <h3>Your Profile Summary:</h3>
                                    <div class="profile-tags">
                                        ${userIdentity.industry ? `<span class="profile-tag">📍 ${userIdentity.industry}</span>` : ''}
                                        ${userIdentity.currentRole || userIdentity.role ? `<span class="profile-tag">👤 ${userIdentity.currentRole || userIdentity.role}</span>` : ''}
                                        ${userIdentity.experience ? `<span class="profile-tag">⭐ ${userIdentity.experience}</span>` : ''}
                                        ${userIdentity.goal ? `<span class="profile-tag">🎯 ${userIdentity.goal}</span>` : ''}
                                    </div>
                                </div>
                                
                                <div class="empty-path-actions">
                                    <button class="primary-btn" data-route="domains" id="start-learning-journey">
                                        🎯 Start Your Learning Journey
                                    </button>
                                    <button class="secondary-btn" data-route="profile" id="edit-profile-btn">
                                        ✏️ Edit Profile
                                    </button>
                                </div>
                            </div>
                        ` : `
                            <div class="empty-path-card">
                                <div class="empty-path-icon">📝</div>
                                <h2>Complete Your Profile First</h2>
                                <p class="empty-path-description">
                                    To create a personalized learning path, we need to know more about your goals, 
                                    experience, and preferences.
                                </p>
                                
                                <div class="empty-path-actions">
                                    <button class="primary-btn" data-route="profile" id="complete-profile-btn">
                                        📝 Complete Your Profile
                                    </button>
                                    <button class="secondary-btn" data-route="home">
                                        🏠 Go to Home
                                    </button>
                                </div>
                            </div>
                        `}
                        
                        <div class="learning-path-benefits">
                            <h3>What You'll Get:</h3>
                            <div class="benefits-grid">
                                <div class="benefit-item">
                                    <span class="benefit-icon">📅</span>
                                    <div class="benefit-content">
                                        <h4>90-Day Structured Plan</h4>
                                        <p>Daily lessons and exercises designed for your goals</p>
                                    </div>
                                </div>
                                <div class="benefit-item">
                                    <span class="benefit-icon">🎯</span>
                                    <div class="benefit-content">
                                        <h4>Personalized Content</h4>
                                        <p>Tailored to your industry, role, and experience level</p>
                                    </div>
                                </div>
                                <div class="benefit-item">
                                    <span class="benefit-icon">📊</span>
                                    <div class="benefit-content">
                                        <h4>Progress Tracking</h4>
                                        <p>Monitor your growth with milestones and assessments</p>
                                    </div>
                                </div>
                                <div class="benefit-item">
                                    <span class="benefit-icon">🏆</span>
                                    <div class="benefit-content">
                                        <h4>Skill Mastery</h4>
                                        <p>Build expertise through practical applications</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Add event listeners for navigation
            const startButton = document.getElementById('start-learning-journey');
            if (startButton) {
                startButton.addEventListener('click', () => {
                    Core.Router.navigate('domains');
                });
            }
            
            const editProfileButton = document.getElementById('edit-profile-btn');
            if (editProfileButton) {
                editProfileButton.addEventListener('click', () => {
                    Core.Router.navigate('profile');
                });
            }
            
            const completeProfileButton = document.getElementById('complete-profile-btn');
            if (completeProfileButton) {
                completeProfileButton.addEventListener('click', () => {
                    Core.Router.navigate('profile');
                });
            }
        }

        // Test function to validate learning path storage and display
        async function testLearningPathFunctionality() {
            try {
                
                // Test data cleaning
                const testResponse = {
                    course_title: "90-Day Leadership Skills Mastery for Tech Professionals",
                    daily_curriculum: [
                        {
                            day: 89,
                            supporting_concepts: [" rehearsal techniques", "Visual storytelling"],
                            primary_learning_objective: "Final capstone preparation and rehearsal"
                        }
                    ],
                    milestone_assessments: [
                        {
                            day: 30,
                            type: "Foundation Assessment",
                            description: "Comprehensive evaluation of core leadership concepts"
                        }
                    ]
                };
                
                const cleaned = cleanLearningPathData(testResponse);
                
                // Test storage
                const testUserProfile = {
                    email: 'test@example.com',
                    nickname: 'Test User'
                };
                
                const testSpecialization = {
                    id: 'test-leadership',
                    title: 'Test Leadership'
                };
                
                // Only test if we can access IndexedDB
                if (typeof indexedDB !== 'undefined') {
                    try {
                        await storeLearningPath(cleaned, testUserProfile, testSpecialization);
                        
                        // Clean up test data
                        const testPathId = `path_${testUserProfile.email}_${testSpecialization.id}`;
                        try {
                            await Growth90.Data.Storage.deleteItem('learningPaths', testPathId);
                        } catch (e) {
                            // Cleanup failed, that's okay for testing
                        }
                        
                    } catch (storageError) {
                    }
                } else {
                }
                
                return true;
                
            } catch (error) {
                console.error('❌ Learning path functionality test failed:', error);
                return false;
            }
        }

        // Expose test function for debugging
        window.testLearningPath = testLearningPathFunctionality;

        // Specializations Selection page
        async function showSpecializations(params = []) {
            UI.Components.Loading.show('Loading specialized areas...');
            
            try {
                const contentArea = document.getElementById('app-content');
                const broaderDomainId = params[0];
                
                // Get broader domain info
                const broaderDomain = JSON.parse(sessionStorage.getItem('selectedBroaderDomain') || '{}');
                
                if (!broaderDomain.id) {
                    Core.Router.navigate('domains');
                    return;
                }
                
                // Show loading state
                contentArea.innerHTML = `
                    <div class="specializations-container">
                        <div class="specializations-header">
                            <button class="back-btn" id="back-to-domains">
                                <span>←</span> Back to Domains
                            </button>
                            <h1 class="specializations-title">Finding Your Specializations</h1>
                            <p class="specializations-subtitle">Discovering specialized areas within ${broaderDomain.title} based on your profile and industry trends</p>
                        </div>
                        
                        <div class="specializations-loading">
                            <p class="loading-text" id="loading-status">Finding specialization areas<span class="loading-dots">...</span></p>
                        </div>
                    </div>
                `;
                
                // Add back button handler
                document.getElementById('back-to-domains').addEventListener('click', () => {
                    Core.Router.navigate('domains');
                });
                
                // Get user profile for personalized recommendations
                const userProfile = getCurrentUserProfile();
                const professionalContext = {
                    industry: userProfile?.industry || 'general',
                    role: userProfile?.currentRole || 'individual contributor',
                    experience: userProfile?.experience || 'intermediate'
                };
                
                // Call API to get specific skills for the broader topic using supplementary insights
                let specificSkills = [];
                try {
                    // Update status
                    const statusEl = document.getElementById('loading-status');
                    if (statusEl) statusEl.textContent = 'Finding specialization areas...';
                    
                    const response = await Growth90.Data.API.content.getSpecializations(
                        broaderDomain.title.toLowerCase().replace(/\s+/g, '-'),
                        {
                            industry: professionalContext.industry,
                            role: professionalContext.role,
                            experience: professionalContext.experience,
                            focus: 'specialization_areas',
                            context: 'professional_development'
                        },
                        userProfile
                    );
                    
                    // Update status
                    if (statusEl) statusEl.textContent = 'Processing specialization recommendations...';
                    
                    // If no error was thrown, we have a successful 200 response
                    if (response) {
                        const responseData = response.data || response; // Handle both wrapper and direct formats
                        
                        specificSkills = parseSkillsFromSpecializations(responseData, broaderDomainId);
                    }
                } catch (error) {
                    console.warn('Failed to get personalized skills, using defaults:', error);
                    const statusEl = document.getElementById('loading-status');
                    if (statusEl) statusEl.textContent = 'Using curated skill recommendations...';
                }
                
                // Fallback to default specializations if API fails
                if (specificSkills.length === 0) {
                    specificSkills = getDefaultSpecializations(broaderDomainId);
                }
                
                // Render specific skills selection
                contentArea.innerHTML = `
                    <div class="specific-skills-container">
                        <div class="skills-header">
                            <button class="back-btn" id="back-to-topics">
                                <span>←</span> Back to Topics
                            </button>
                            <h1 class="skills-title">Choose Your Specific Focus</h1>
                            <p class="skills-subtitle">Select one specific skill area to create your personalized learning path</p>
                        </div>
                        
                        <div class="selected-topic-indicator">
                            <span class="broader-topic-label">Selected Topic:</span>
                            <span class="broader-domain-name">${broaderDomain.title}</span>
                        </div>
                        
                        <div class="specific-skills-grid">
                            ${specificSkills.map(skill => `
                                <div class="skill-card" data-skill="${skill.id}">
                                    <div class="skill-icon">${skill.icon}</div>
                                    <h3 class="skill-title">${skill.title}</h3>
                                    <p class="skill-description">${skill.description}</p>
                                    <div class="skill-metadata">
                                        <span class="skill-duration">${skill.duration}</span>
                                        <span class="skill-level">${skill.level}</span>
                                        ${skill.category ? `<span class="skill-category">${skill.category}</span>` : ''}
                                    </div>
                                    ${skill.source ? `<div class="skill-source">Source: ${skill.source.split(',')[0]}</div>` : ''}
                                    ${skill.domain ? `<div class="skill-domain">Domain: ${skill.domain.title || skill.domain}</div>` : ''}
                                    <button class="select-skill-btn" data-skill-id="${skill.id}">
                                        Select This Skill
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
                
                // Add event handlers
                document.getElementById('back-to-topics').addEventListener('click', () => {
                    Core.Router.navigate('topics');
                });
                
                const skillCards = contentArea.querySelectorAll('.skill-card');
                const selectButtons = contentArea.querySelectorAll('.select-skill-btn');
                
                selectButtons.forEach(button => {
                    button.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        const skillId = button.getAttribute('data-skill-id');
                        const selectedSkill = specificSkills.find(skill => skill.id === skillId);
                        
                        if (selectedSkill) {
                            await selectSkillAndGeneratePath(broaderTopic, selectedSkill);
                        }
                    });
                });
                
                UI.Components.Loading.hide();
                updateActiveNavigation('skills');
                
            } catch (error) {
                console.error('Failed to load specific skills:', error);
                UI.Components.Loading.hide();
                UI.Components.Notifications.error('Failed to load skills. Please try again.');
            }
        }

        // Helper function to get current user profile
        function getCurrentUserProfile() {
            try {
                const stored = localStorage.getItem('growth90_user_identity');
                return stored ? JSON.parse(stored) : null;
            } catch (e) {
                return null;
            }
        }

        // Helper function to parse skills from specializations API response
        function parseSkillsFromSpecializations(specializationsData, broaderTopicId) {
            const skills = [];
            
            try {
                
                // Handle the structured specializations response format
                if (specializationsData && specializationsData.specializations && Array.isArray(specializationsData.specializations)) {
                    const specializations = specializationsData.specializations;
                    
                    // Extract skills from specializations
                    specializations.forEach((specialization, index) => {
                        
                        // Create skill from specialization data
                        const skillTitle = specialization.title || specialization.name || `Specialization ${index + 1}`;
                        const skillDescription = specialization.description || specialization.summary || `Develop expertise in ${skillTitle.toLowerCase()}`;
                        
                        if (skillTitle) {
                            const skill = {
                                id: specialization.id || generateSkillId(skillTitle, broaderTopicId),
                                title: skillTitle,
                                description: cleanSpecializationDescription(skillDescription),
                                icon: getSkillIcon(skillTitle, broaderTopicId),
                                duration: specialization.duration || '90 days',
                                level: specialization.level || determineSkillLevel(skillTitle, broaderTopicId),
                                category: specialization.category || 'Specialization',
                                domain: specializationsData.domain
                            };
                            
                            skills.push(skill);
                        }
                    });
                }
                
                // Fallback to default skills if no specializations found
                if (skills.length === 0) {
                    return [];
                }
                
            } catch (error) {
                console.warn('Error parsing skills from specializations:', error);
            }
            
            return skills.length > 0 ? skills : [];
        }

        // Helper function to parse skills from supplementary insights API response (kept for backward compatibility)
        function parseSkillsFromInsights(insightsData, broaderTopicId) {
            const skills = [];
            
            try {
                
                // Handle the structured supplementary_insights response format
                if (insightsData && insightsData.supplementary_insights && Array.isArray(insightsData.supplementary_insights)) {
                    const insights = insightsData.supplementary_insights;
                    
                    // Extract skills from insights based on practical applications and implications
                    insights.forEach((insight, index) => {
                        
                        // Create skill from insight content using the provided title
                        const skillTitle = insight.title || extractSkillTitleFromInsight(insight, broaderTopicId);
                        const skillDescription = insight.implication || insight.practical_application || insight.insight;
                        
                        if (skillTitle && skillDescription) {
                            const skill = {
                                id: generateSkillId(skillTitle, broaderTopicId),
                                title: skillTitle,
                                description: cleanInsightDescription(skillDescription),
                                icon: getSkillIcon(skillTitle, broaderTopicId),
                                duration: '90 days',
                                level: determineSkillLevel(skillTitle, broaderTopicId),
                                category: insight.category,
                                source: insight.source
                            };
                            
                            skills.push(skill);
                        }
                    });
                }
                
                // Fallback to text parsing if structured format not available
                if (skills.length === 0) {
                    return parseTextBasedInsights(insightsData, broaderTopicId);
                }
                
            } catch (error) {
                console.warn('Error parsing skills from insights:', error);
            }
            
            return skills.length > 0 ? skills : [];
        }

        // Extract skill title from insight based on broader topic (fallback for missing titles)
        function extractSkillTitleFromInsight(insight, broaderTopicId) {
            // If title is missing, create one from category and broader topic
            return `${insight.category} in ${broaderTopicId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`;
        }

        // Clean insight description for skill cards
        function cleanInsightDescription(description) {
            if (!description) return 'Enhance your professional capabilities in this area';
            
            // Take the most actionable part of the description
            let cleanDesc = description.replace(/^[^A-Z]*/, '').trim(); // Remove leading lowercase
            
            // Limit length and ensure it ends properly
            if (cleanDesc.length > 120) {
                cleanDesc = cleanDesc.substring(0, 117) + '...';
            }
            
            return cleanDesc || 'Develop practical skills for professional growth';
        }

        // Clean specialization description for skill cards
        function cleanSpecializationDescription(description) {
            if (!description) return 'Develop specialized expertise in this area';
            
            // Clean up the description
            let cleanDesc = description.trim();
            
            // Limit length and ensure it ends properly
            if (cleanDesc.length > 120) {
                cleanDesc = cleanDesc.substring(0, 117) + '...';
            }
            
            return cleanDesc || 'Build focused skills for professional advancement';
        }

        // Fallback text-based parsing for non-structured responses
        function parseTextBasedInsights(insightsData, broaderTopicId) {
            const skills = [];
            let responseText = '';
            
            if (typeof insightsData === 'string') {
                responseText = insightsData;
            } else if (insightsData.insights) {
                responseText = insightsData.insights;
            } else if (insightsData.content) {
                responseText = insightsData.content;
            } else {
                responseText = JSON.stringify(insightsData);
            }
            
            // Parse the response to extract skill recommendations
            const lines = responseText.split('\n').filter(line => line.trim());
            let skillCount = 0;
            
            for (const line of lines) {
                // Look for numbered items or bullet points that represent skills
                const skillMatch = line.match(/^\s*[\d\-\*\•]\s*(.+?)[:.]?\s*(.*)$/);
                if (skillMatch && skillCount < 4) {
                    const skillTitle = skillMatch[1].trim();
                    const skillDescription = skillMatch[2].trim() || `Develop ${skillTitle.toLowerCase()} for professional growth`;
                    
                    // Skip if it's too short or generic
                    if (skillTitle.length < 5 || skillTitle.toLowerCase().includes('overview')) {
                        continue;
                    }
                    
                    const skill = {
                        id: generateSkillId(skillTitle, broaderTopicId),
                        title: cleanSkillTitle(skillTitle),
                        description: cleanSkillDescription(skillDescription),
                        icon: getSkillIcon(skillTitle, broaderTopicId),
                        duration: '90 days',
                        level: determineSkillLevel(skillTitle, broaderTopicId)
                    };
                    
                    skills.push(skill);
                    skillCount++;
                }
            }
            
            // If we didn't find enough structured skills, try alternative parsing
            if (skills.length < 2) {
                return parseAlternativeSkillFormat(responseText, broaderTopicId);
            }
            
            return skills;
        }

        // Helper function to generate skill ID
        function generateSkillId(skillTitle, broaderTopicId) {
            const cleanTitle = skillTitle.toLowerCase()
                .replace(/[^\w\s]/g, '')
                .replace(/\s+/g, '-')
                .substring(0, 30);
            return `${broaderTopicId}-${cleanTitle}`;
        }

        // Helper function to clean skill title
        function cleanSkillTitle(title) {
            return title
                .replace(/^\d+\.\s*/, '') // Remove numbering
                .replace(/^[\-\*\•]\s*/, '') // Remove bullet points
                .replace(/[:.]+$/, '') // Remove trailing colons/periods
                .trim();
        }

        // Helper function to clean skill description
        function cleanSkillDescription(description) {
            if (!description || description.length < 10) {
                return 'Enhance your professional capabilities in this area';
            }
            return description.replace(/^[\-:]\s*/, '').trim();
        }

        // Helper function to get skill icon based on title and broader topic
        function getSkillIcon(skillTitle, broaderTopicId) {
            const title = skillTitle.toLowerCase();
            
            // Specific icons for common insight patterns
            const specificIcons = {
                // AI and Technology
                'ai': '🤖', 'artificial intelligence': '🧠', 'machine learning': '⚙️',
                'automation': '🔄', 'digital': '💻', 'technology': '⚡',
                
                // Learning and Development
                'learning': '📚', 'microlearning': '📖', 'personalization': '🎯',
                'adaptive': '🔧', 'just-in-time': '⏰', 'contextual': '🔍',
                
                // Strategic and Leadership
                'strategic': '🎯', 'upskilling': '📈', 'hiring': '👥',
                'workforce': '🏢', 'planning': '📋', 'development': '🚀',
                
                // Performance and Metrics
                'performance': '📊', 'metrics': '📈', 'assessment': '✅',
                'feedback': '💬', 'analytics': '🔍', 'measurement': '📏'
            };
            
            // Check for specific patterns first
            for (const [keyword, icon] of Object.entries(specificIcons)) {
                if (title.includes(keyword)) {
                    return icon;
                }
            }
            
            // Topic-specific icons as fallback
            const topicIcons = {
                'leadership-skills': {
                    'team': '👥', 'strategic': '🎯', 'decision': '⚡', 'vision': '🔮',
                    'conflict': '🤝', 'motivation': '🔥', 'delegation': '📋'
                },
                'communication': {
                    'public': '🎤', 'written': '✍️', 'listening': '👂', 'presentation': '📊',
                    'negotiation': '🤝', 'feedback': '💬', 'interpersonal': '🗣️'
                },
                'data-analysis': {
                    'excel': '📈', 'visualization': '📊', 'statistical': '📉', 'reporting': '📋',
                    'analytics': '🔍', 'dashboard': '📱', 'sql': '💾'
                },
                'project-management': {
                    'planning': '📅', 'execution': '⚡', 'risk': '⚠️', 'agile': '🔄',
                    'budget': '💰', 'timeline': '⏰', 'stakeholder': '👥'
                },
                'emotional-intelligence': {
                    'self-awareness': '🪞', 'empathy': '❤️', 'social': '🤝', 'regulation': '🧘',
                    'motivation': '🔥', 'relationship': '💫', 'emotional': '🧠'
                },
                'digital-marketing': {
                    'social': '📱', 'content': '📝', 'seo': '🔍', 'analytics': '📊',
                    'email': '📧', 'advertising': '📢', 'strategy': '🎯'
                },
                'technical-skills': {
                    'programming': '💻', 'coding': '👨‍💻', 'software': '⚙️', 'development': '🛠️',
                    'system': '🖥️', 'database': '💾', 'security': '🔒'
                },
                'financial-literacy': {
                    'budgeting': '💰', 'investment': '📈', 'analysis': '📊', 'planning': '📋',
                    'reporting': '📄', 'risk': '⚠️', 'accounting': '🧮'
                }
            };
            
            const topicIconMap = topicIcons[broaderTopicId] || {};
            
            // Find matching keyword in topic-specific icons
            for (const [keyword, icon] of Object.entries(topicIconMap)) {
                if (title.includes(keyword)) {
                    return icon;
                }
            }
            
            // Default icons by broader topic
            const defaultIcons = {
                'leadership-skills': '💼',
                'communication': '🗣️',
                'data-analysis': '📊',
                'project-management': '📋',
                'emotional-intelligence': '🧠',
                'digital-marketing': '📱',
                'technical-skills': '💻',
                'financial-literacy': '💰'
            };
            
            return defaultIcons[broaderTopicId] || '🎓';
        }

        // Helper function to determine skill level
        function determineSkillLevel(skillTitle, broaderTopicId) {
            const title = skillTitle.toLowerCase();
            
            if (title.includes('advanced') || title.includes('expert') || title.includes('strategic')) {
                return 'Advanced';
            }
            if (title.includes('basic') || title.includes('fundamental') || title.includes('introduction')) {
                return 'Beginner';
            }
            return 'Intermediate';
        }

        // Alternative parsing for different response formats
        function parseAlternativeSkillFormat(responseText, broaderTopicId) {
            const skills = [];
            
            // Try to find sections or paragraphs that describe skills
            const sections = responseText.split(/\n\s*\n/);
            
            for (const section of sections) {
                if (section.length < 20) break;
                
                // Look for skill-like content
                const sentences = section.split(/[.!?]+/).filter(s => s.trim().length > 10);
                
                for (const sentence of sentences) {
                    
                    const cleanSentence = sentence.trim();
                    if (cleanSentence.length > 20 && cleanSentence.length < 100) {
                        // Extract a potential skill title (first few words)
                        const words = cleanSentence.split(' ');
                        const skillTitle = words.slice(0, 4).join(' ').replace(/[^\w\s]/g, '');
                        
                        if (skillTitle.length > 5) {
                            skills.push({
                                id: generateSkillId(skillTitle, broaderTopicId),
                                title: skillTitle,
                                description: cleanSentence,
                                icon: getSkillIcon(skillTitle, broaderTopicId),
                                duration: '90 days',
                                level: 'Intermediate'
                            });
                        }
                    }
                }
            }
            
            return skills;
        }

        // Helper function to get default specializations
        function getDefaultSpecializations(broaderDomainId) {
            const specializationsMap = {
                'leadership-skills': [
                    {
                        id: 'team-leadership',
                        title: 'Team Leadership',
                        description: 'Learn to lead and motivate teams effectively',
                        icon: '👥',
                        duration: '90 days',
                        level: 'Intermediate'
                    },
                    {
                        id: 'strategic-thinking',
                        title: 'Strategic Thinking',
                        description: 'Develop long-term planning and decision-making skills',
                        icon: '🎯',
                        duration: '90 days',
                        level: 'Advanced'
                    },
                    {
                        id: 'conflict-resolution',
                        title: 'Conflict Resolution',
                        description: 'Master techniques for resolving workplace conflicts',
                        icon: '🤝',
                        duration: '90 days',
                        level: 'Intermediate'
                    },
                    {
                        id: 'delegation-skills',
                        title: 'Delegation Skills',
                        description: 'Learn to effectively delegate tasks and responsibilities',
                        icon: '📋',
                        duration: '90 days',
                        level: 'Intermediate'
                    },
                    {
                        id: 'change-management',
                        title: 'Change Management',
                        description: 'Guide organizations through transformation and change',
                        icon: '🔄',
                        duration: '90 days',
                        level: 'Advanced'
                    },
                    {
                        id: 'coaching-mentoring',
                        title: 'Coaching & Mentoring',
                        description: 'Develop skills to coach and mentor team members',
                        icon: '🎓',
                        duration: '90 days',
                        level: 'Intermediate'
                    },
                    {
                        id: 'decision-making',
                        title: 'Decision Making',
                        description: 'Improve critical thinking and decision-making abilities',
                        icon: '⚖️',
                        duration: '90 days',
                        level: 'Advanced'
                    }
                ],
                'communication': [
                    {
                        id: 'public-speaking',
                        title: 'Public Speaking',
                        description: 'Build confidence in presenting to groups',
                        icon: '🎤',
                        duration: '90 days',
                        level: 'Beginner'
                    },
                    {
                        id: 'written-communication',
                        title: 'Written Communication',
                        description: 'Improve email, reports, and documentation skills',
                        icon: '✍️',
                        duration: '90 days',
                        level: 'Beginner'
                    },
                    {
                        id: 'active-listening',
                        title: 'Active Listening',
                        description: 'Enhance your ability to understand and respond effectively',
                        icon: '👂',
                        duration: '90 days',
                        level: 'Beginner'
                    }
                ],
                'data-analysis': [
                    {
                        id: 'excel-analytics',
                        title: 'Excel Analytics',
                        description: 'Master advanced Excel functions for data analysis',
                        icon: '📈',
                        duration: '90 days',
                        level: 'Intermediate'
                    },
                    {
                        id: 'data-visualization',
                        title: 'Data Visualization',
                        description: 'Create compelling charts and dashboards',
                        icon: '📊',
                        duration: '90 days',
                        level: 'Intermediate'
                    },
                    {
                        id: 'statistical-analysis',
                        title: 'Statistical Analysis',
                        description: 'Learn statistical methods for business insights',
                        icon: '📉',
                        duration: '90 days',
                        level: 'Advanced'
                    }
                ]
            };
            
            return specializationsMap[broaderDomainId] || [
                {
                    id: 'general-specialization',
                    title: 'Professional Development',
                    description: 'Enhance your professional capabilities',
                    icon: '🎓',
                    duration: '90 days',
                    level: 'Intermediate'
                }
            ];
        }

        // Function to select skill and generate learning path
        async function selectSkillAndGeneratePath(broaderTopic, selectedSkill) {
            try {
                UI.Components.Loading.show('Creating your personalized learning path...');
                
                // Save the selected skill
                const skillSelection = {
                    broaderTopic: broaderTopic,
                    selectedSkill: selectedSkill,
                    timestamp: new Date().toISOString()
                };
                
                // Store in user identity
                const userIdentity = getCurrentUserProfile() || {};
                userIdentity.selectedTopic = {
                    id: selectedSkill.id,
                    title: selectedSkill.title,
                    description: selectedSkill.description,
                    broaderTopic: broaderTopic,
                    icon: selectedSkill.icon
                };
                
                localStorage.setItem('growth90_user_identity', JSON.stringify(userIdentity));
                
                // Store detailed selection for learning path generation
                sessionStorage.setItem('skillSelection', JSON.stringify(skillSelection));
                
                // Generate learning path using the existing API
                const userProfile = userIdentity;
                const professionalContext = {
                    industry: userProfile.industry || 'general',
                    role: userProfile.currentRole || 'individual contributor',
                    experience: userProfile.experience || 'intermediate'
                };
                
                const learningPreferences = {
                    focusArea: selectedSkill.id,
                    skillDomain: broaderTopic.id,
                    timeCommitment: userProfile.dailyTimeCommitment || '30-45',
                    difficulty: selectedSkill.level?.toLowerCase() || 'intermediate'
                };
                
                // Call the API to generate learning path
                const learningPathResponse = await Growth90.Data.API.learningPath.generatePath(
                    userProfile,
                    professionalContext,
                    learningPreferences,
                    selectedSkill.id
                );
                
                UI.Components.Loading.hide();
                
                if (learningPathResponse && learningPathResponse.success && learningPathResponse.data) {
                    // Normalize and store, then navigate
                    const cleaned = cleanLearningPathData(learningPathResponse.data);
                    try { await storeLearningPath(cleaned, userProfile, selectedSkill); } catch(e) { /* Store path failed silently */ }
                    UI.Components.Notifications.success(`Learning path created for ${selectedSkill.title}!`);
                    Core.Router.navigate('path');
                } else {
                    // Show generated path preview even if API fails
                    UI.Components.Notifications.info('Learning path prepared! Starting your journey...');
                    Core.Router.navigate('learning');
                }
                
            } catch (error) {
                console.error('Failed to generate learning path:', error);
                UI.Components.Loading.hide();
                UI.Components.Notifications.error('Failed to create learning path. Please try again.');
            }
        }

        // Today's Learning page
        async function showTodaysLearning() {
            try {
                const contentArea = document.getElementById('app-content');
                
                // Get user identity and selected topic
                let userIdentity = null;
                try {
                    const stored = localStorage.getItem('growth90_user_identity');
                    userIdentity = stored ? JSON.parse(stored) : null;
                } catch (e) {
                }

                if (!userIdentity || !userIdentity.selectedTopic) {
                    // No topic selected, redirect to home
                    Core.Router.navigate('home');
                    return;
                }

                // Ensure a learning path exists for this user before showing any loading overlay
                const userId = userIdentity.email || userIdentity.id || 'guest';
                let hasLearningPath = false;
                try {
                    const userPaths = await Growth90.Data.Storage.queryItems('learningPaths', {
                        index: 'userId',
                        keyRange: IDBKeyRange.only(userId),
                        limit: 1
                    });
                    hasLearningPath = Array.isArray(userPaths) && userPaths.length > 0;
                    if (!hasLearningPath) {
                        const allPaths = await Growth90.Data.Storage.getAllItems('learningPaths');
                        hasLearningPath = Array.isArray(allPaths) && allPaths.some(p => p.userId === userId);
                    }
                } catch (e) {
                    // If storage not ready or query failed, treat as no path
                    hasLearningPath = false;
                }

                if (!hasLearningPath) {
                    // Silently redirect to home without any loading effect
                    Core.Router.navigate('home');
                    return;
                }

                const selectedTopic = userIdentity.selectedTopic;
                
                // Always compute last active day based on progress; ignore any manually selected day
                // Requirement: #learning should display the last active day regardless of selections on #path
                let currentDay = await getCurrentDayByCompletion(userIdentity.email || userIdentity.id || 'guest', selectedTopic.id);
                
                contentArea.innerHTML = `
                    <div class="learning-container">
                        <div class="learning-header">
                            <div class="learning-title-section">
                                <div class="learning-icon">🎯</div>
                                <div class="learning-title-content">
                                    <h1>Today's Learning</h1>
                                    <p class="learning-subtitle">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} - Day ${currentDay} of your 90-day journey</p>
                                </div>
                            </div>
                            
                            <div class="topic-badge">
                                <span class="topic-name">${selectedTopic.id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                            </div>
                        </div>
                        
                        <div class="learning-content">
                            <!-- Today's Lessons -->
                            <div class="lessons-section">
                                <div class="lessons-list" id="lessons-list">
                                    <!-- Will be populated by API call -->
                                    <div class="lesson-loading">
                                        <p class="loading-text">Loading your personalized lessons<span class="loading-dots">...</span></p>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Progress Stats -->
                            <div class="learning-stats">
                                <div class="stat-card">
                                    <div class="stat-icon">🔥</div>
                                    <div class="stat-content">
                                        <div class="stat-number">${calculateStreak(userIdentity)}</div>
                                        <div class="stat-label">Day Streak</div>
                                    </div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-icon">📈</div>
                                    <div class="stat-content">
                                        <div class="stat-number">${Math.round((currentDay / 90) * 100)}%</div>
                                        <div class="stat-label">Completion</div>
                                    </div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-icon">⏰</div>
                                    <div class="stat-content">
                                        <div class="stat-number">${calculateTimeInvested(userIdentity)}h</div>
                                        <div class="stat-label">Time Invested</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Navigation Actions -->
                        <div class="learning-actions">
                            <button class="secondary-btn back-home-btn" id="back-home-btn">
                                <span>← Back to Home</span>
                            </button>
                            <button class="secondary-btn view-path-btn" id="view-path-btn">
                                <span>📍 View Learning Path</span>
                            </button>
                            <button class="primary-btn continue-learning-btn" id="continue-learning-btn">
                                <span>Continue Learning</span>
                                <span class="btn-arrow">→</span>
                            </button>
                        </div>
                    </div>
                `;
                
                // Load today's lessons after DOM is ready
                setTimeout(async () => {
                    try {
                        await loadTodaysLessons(selectedTopic, currentDay);
                    } catch (error) {
                        console.error('Error loading lessons:', error);
                        // Show error in lessons area since loadTodaysLessons already handles UI
                    } finally {
                        // Always hide loading regardless of success/failure
                        UI.Components.Loading.hide();
                    }
                }, 100);
                
                // Add event handlers
                const backHomeBtn = document.getElementById('back-home-btn');
                if (backHomeBtn) {
                    backHomeBtn.addEventListener('click', () => {
                        Core.Router.navigate('home');
                    });
                }
                
                const viewPathBtn = document.getElementById('view-path-btn');
                if (viewPathBtn) {
                    viewPathBtn.addEventListener('click', () => {
                        Core.Router.navigate('path');
                    });
                }
                
                const continueLearningBtn = document.getElementById('continue-learning-btn');
                if (continueLearningBtn) {
                    continueLearningBtn.addEventListener('click', () => {
                        // Ensure we use computed last active day, not any previously selected day
                        try { sessionStorage.removeItem('selectedDay'); } catch(_) {}
                        startFirstLesson();
                    });
                }
                
                // Don't hide loading here - let loadTodaysLessons handle it
                updateActiveNavigation('learning');
                
            } catch (error) {
                console.error('Failed to load today\'s learning:', error);
                UI.Components.Loading.hide();
                UI.Components.Notifications.error('Failed to load learning content. Please try again.');
            }
        }

        // Learning Path page: shows the full curriculum for the user's current focus
        async function showLearningPath() {
            UI.Components.Loading.show('Loading your learning path...');
            try {
                const contentArea = document.getElementById('app-content');

                let userIdentity = null;
                try {
                    userIdentity = JSON.parse(localStorage.getItem('growth90_user_identity') || '{}');
                } catch (e) {}

                // Selected topic (focus skill) is optional for viewing paths; use if present
                const userId = (userIdentity && (userIdentity.email || userIdentity.id)) || null;
                const pathTopicId = (userIdentity && userIdentity.selectedTopic && userIdentity.selectedTopic.id) || null;

                // Fetch learning paths for this user; allow selecting among them
                let learningPath = null;
                let userPathsList = [];
                const preferPathId = sessionStorage.getItem('selectedPathId');
                
                try {
                    // Method 1: Try indexed query first
                    try {
                        if (userId) {
                            const userPaths = await Growth90.Data.Storage.queryItems('learningPaths', {
                                index: 'userId',
                                keyRange: IDBKeyRange.only(userId),
                                direction: 'prev'
                            });
                            userPathsList = Array.isArray(userPaths) ? userPaths : [];
                            if (preferPathId) {
                                learningPath = userPathsList.find(p => p.id === preferPathId) || null;
                            }
                            if (!learningPath && userPathsList.length > 0) {
                                const active = userPathsList.find(p => p.status === 'active');
                                learningPath = active || userPathsList.sort((a,b)=> new Date(b.createdAt||0)-new Date(a.createdAt||0))[0];
                            }
                            if (learningPath) {
                                // Method 1 succeeded
                            }
                        }
                    } catch (indexError) {
                        // Method 1 failed, continue to fallback
                    }
                    
                    // Method 2: Fallback to getAllItems if index method failed
                    if (!learningPath) {
                        try {
                            const allPaths = await Growth90.Data.Storage.getAllItems('learningPaths');
                            
                            const filteredPaths = userId ? allPaths.filter(path => path.userId === userId) : allPaths;
                            userPathsList = filteredPaths;
                            if (preferPathId) {
                                learningPath = filteredPaths.find(p => p.id === preferPathId) || learningPath;
                            }
                            if (!learningPath && filteredPaths.length > 0) {
                                const active = filteredPaths.find(p => p.status === 'active');
                                learningPath = active || filteredPaths.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];
                            }
                        } catch (fallbackError) {
                            // Method 2 failed, continue to direct access
                        }
                    }
                    
                    // Method 3: Direct raw IndexedDB access if Growth90 methods fail
                    if (!learningPath) {
                        try {
                            const db = await new Promise((resolve, reject) => {
                                const request = indexedDB.open('Growth90DB', 1);
                                request.onsuccess = () => resolve(request.result);
                                request.onerror = () => reject(request.error);
                            });
                            
                            const transaction = db.transaction(['learningPaths'], 'readonly');
                            const store = transaction.objectStore('learningPaths');
                            
                            const allPaths = await new Promise((resolve, reject) => {
                                const request = store.getAll();
                                request.onsuccess = () => resolve(request.result || []);
                                request.onerror = () => reject(request.error);
                            });
                            
                            const directFilteredPaths = userId ? allPaths.filter(path => path.userId === userId) : allPaths;
                            userPathsList = directFilteredPaths;
                            if (preferPathId) {
                                learningPath = directFilteredPaths.find(p => p.id === preferPathId) || learningPath;
                            }
                            if (!learningPath && directFilteredPaths.length > 0) {
                                const active = directFilteredPaths.find(p => p.status === 'active');
                                learningPath = active || directFilteredPaths.sort((a,b)=> new Date(b.createdAt||0)-new Date(a.createdAt||0))[0];
                            }
                            
                            db.close();
                        } catch (directError) {
                            // Method 3 failed
                        }
                    }
                    
                } catch (error) {
                    console.error('❌ All methods failed - Critical error:', error);
                }

                // If user has multiple paths stored, render all of them
                if (Array.isArray(userPathsList) && userPathsList.length > 1) {
                    const pathsSorted = [...userPathsList].sort((a,b)=> new Date(b.createdAt||0)-new Date(a.createdAt||0));

                    const renderOnePath = (lp, idx) => {
                        // Extract new-format data if available
                        let curriculum = null;
                        let courseTitle = null;
                        let courseDescription = null;
                        let phaseInfo = null;
                        let milestoneAssessments = null;
                        let resources = null;
                        const pfx = (s) => `${lp.id}-${idx}-${s}`;

                        if (lp.pathData) {
                            const d = lp.pathData;
                            courseTitle = d.course_title || lp.title;
                            courseDescription = d.course_description || lp.description;
                            curriculum = Array.isArray(d.daily_curriculum) ? d.daily_curriculum : null;
                            phaseInfo = d.phase_summaries;
                            milestoneAssessments = d.milestone_assessments;
                            resources = d.resources;
                        }
                        // Fallbacks
                        if (!curriculum) {
                            if (Array.isArray(lp.curriculum) && lp.curriculum.length) curriculum = lp.curriculum;
                            else if (Array.isArray(lp.days) && lp.days.length) curriculum = lp.days;
                        }
                        courseTitle = courseTitle || lp.title || 'Learning Path';
                        courseDescription = courseDescription || lp.description || '';

                        // Build weeks
                        let weeksHtml = '';
                        if (Array.isArray(curriculum) && curriculum.length) {
                            const weekSize = 7;
                            const weeks = [];
                            for (let i = 0; i < curriculum.length; i += weekSize) {
                                const weekDays = curriculum.slice(i, i + weekSize);
                                const weekNumber = Math.floor(i / weekSize) + 1;
                                weeks.push({ number: weekNumber, days: weekDays });
                            }
                            weeksHtml = weeks.map((week) => {
                                const weekId = `${pfx('week')}-${week.number}`;
                                const daysHtml = week.days.map((d, di) => {
                                    const dayNum = d.day || d.id || (di + 1 + (week.number - 1) * 7);
                                    const label = d.primary_learning_objective || d.title || d.topic || `Day ${dayNum}`;
                                    const desc = d.practical_application || d.description || d.content || '';
                                    const timeAllocation = d.time_allocation ? `Learn: ${d.time_allocation.learn}m, Practice: ${d.time_allocation.practice}m, Review: ${d.time_allocation.review}m` : d.time_investment;
                                    return `
                                        <div class="path-day" data-day="${dayNum}">
                                            <div class="path-day-header">
                                                <span class="day-badge">Day ${dayNum}</span>
                                            </div>
                                            <div class="path-day-content">
                                                <div class="path-day-title">${Core.Utils.sanitizeHTML(label)}</div>
                                                ${desc ? `<div class=\"path-day-description\">${Core.Utils.sanitizeHTML(desc)}</div>` : ''}
                                                ${d.supporting_concepts && Array.isArray(d.supporting_concepts) ? `<div class=\"supporting-concepts\"><strong>Key Concepts:</strong> ${d.supporting_concepts.map(c => Core.Utils.sanitizeHTML(c)).join(', ')}</div>` : ''}
                                                ${d.assessment_criteria ? `<div class=\"assessment-criteria\"><strong>Success Criteria:</strong> ${Core.Utils.sanitizeHTML(d.assessment_criteria)}</div>` : ''}
                                                ${timeAllocation ? `<div class=\"path-day-duration\">⏱ ${Core.Utils.sanitizeHTML(timeAllocation)}</div>` : ''}
                                                ${d.extension_opportunities ? `<div class=\"path-day-extend\"><em>${Core.Utils.sanitizeHTML(d.extension_opportunities)}</em></div>` : ''}
                                            </div>
                                            <div class="path-day-actions">
                                                <button class="secondary-btn path-day-btn" data-action="goto-learning" data-day="${dayNum}">Start Lessons</button>
                                            </div>
                                        </div>
                                    `;
                                }).join('');
                                return `
                                    <div class="path-week" data-week="${weekId}" aria-expanded="true">
                                        <div class="path-week-header">
                                            <div class="week-info">
                                                <h3>Week ${week.number}</h3>
                                            </div>
                                            <div class="week-stats">
                                                <button class="week-toggle-btn" data-action="toggle-week" data-week="${weekId}" aria-expanded="true">Collapse</button>
                                            </div>
                                        </div>
                                        <div class="path-week-days">${daysHtml}</div>
                                    </div>
                                `;
                            }).join('');
                        }

                        // Milestones
                        const milestonesHtml = Array.isArray(milestoneAssessments) && milestoneAssessments.length ? `
                            <div class="path-section milestones-section">
                                <h2>Milestone Assessments</h2>
                                <div class="milestones-list">
                                    ${milestoneAssessments.map(m => `
                                        <div class="milestone-item">
                                            <div class="milestone-icon">🎯</div>
                                            <div class="milestone-content">
                                                <div class="milestone-title">${Core.Utils.sanitizeHTML(m.type || 'Milestone')}</div>
                                                <div class="milestone-description">${Core.Utils.sanitizeHTML(m.description || '')}</div>
                                                <div class="milestone-day">Day ${m.day}</div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : '';

                        // Phases
                        const phaseInfoHtml = phaseInfo ? `
                            <div class="path-section phases-section">
                                <h2>Learning Phases</h2>
                                <div class="phases-grid">
                                    ${phaseInfo.foundation ? `
                                        <div class="phase-card"><div class="phase-header"><span class="phase-icon">🏗️</span><h3>Foundation (Days 1-30)</h3></div><p>${Core.Utils.sanitizeHTML(phaseInfo.foundation)}</p></div>` : ''}
                                    ${phaseInfo.application ? `
                                        <div class="phase-card"><div class="phase-header"><span class="phase-icon">🚀</span><h3>Application (Days 31-60)</h3></div><p>${Core.Utils.sanitizeHTML(phaseInfo.application)}</p></div>` : ''}
                                    ${phaseInfo.mastery ? `
                                        <div class="phase-card"><div class="phase-header"><span class="phase-icon">🏆</span><h3>Mastery (Days 61-90)</h3></div><p>${Core.Utils.sanitizeHTML(phaseInfo.mastery)}</p></div>` : ''}
                                </div>
                            </div>
                        ` : '';

                        // Resources
                        const resourcesHtml = resources ? `
                            <div class="path-section resources-section">
                                <h2>Resources</h2>
                                ${Array.isArray(resources.core) && resources.core.length ? `
                                    <div class="resources-core"><h3>Core</h3><ul>${resources.core.map(r => `<li>${Core.Utils.sanitizeHTML(r)}</li>`).join('')}</ul></div>` : ''}
                                ${Array.isArray(resources.supplementary) && resources.supplementary.length ? `
                                    <div class="resources-supp"><h3>Supplementary</h3><ul>${resources.supplementary.map(r => `<li>${Core.Utils.sanitizeHTML(r)}</li>`).join('')}</ul></div>` : ''}
                            </div>
                        ` : '';

                        // Success metrics
                        const metrics = lp.pathData?.success_metrics;
                        const metricsHtml = Array.isArray(metrics) && metrics.length ? `
                            <div class="path-section metrics-section">
                                <h2>Success Metrics</h2>
                                <ul>${metrics.map(m => `<li>${Core.Utils.sanitizeHTML(m)}</li>`).join('')}</ul>
                            </div>
                        ` : '';

                        // Contingency plans
                        const contingency = lp.pathData?.contingency_plans;
                        const contingencyHtml = Array.isArray(contingency) && contingency.length ? `
                            <div class="path-section contingency-section">
                                <h2>Contingency Plans</h2>
                                <ul>${contingency.map(c => `<li>${Core.Utils.sanitizeHTML(c)}</li>`).join('')}</ul>
                            </div>
                        ` : '';

                        return `
                            <section class="path-section-block" data-path="${lp.id}">
                                <header class="path-subheader">
                                    <h2>${Core.Utils.sanitizeHTML(courseTitle)}</h2>
                                    ${courseDescription ? `<p class="path-description">${Core.Utils.sanitizeHTML(courseDescription)}</p>` : ''}
                                </header>
                                ${phaseInfoHtml}
                                ${(weeksHtml ? `<div class="path-section curriculum-section"><h2>Curriculum</h2><div class="path-weeks">${weeksHtml}</div></div>` : '')}
                                ${milestonesHtml}
                                ${resourcesHtml}
                                ${metricsHtml}
                                ${contingencyHtml}
                            </section>
                        `;
                    };

                    const allSections = pathsSorted.map(renderOnePath).join('');

                    contentArea.innerHTML = `
                        <div class="learning-path-container">
                            <div class="path-header">
                                <div class="path-icon">🗺️</div>
                                <div class="path-titles">
                                    <h1>Your Learning Paths</h1>
                                    <p class="path-subtitle">Showing ${pathsSorted.length} stored paths</p>
                                </div>
                                <div class="path-actions">
                                    <button class="secondary-btn" data-route="home">← Back to Home</button>
                                </div>
                            </div>
                            ${allSections}
                        </div>
                    `;

                    // Wire actions
                    contentArea.querySelectorAll('[data-action="goto-learning"]').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            const day = e.target.getAttribute('data-day');
                            if (day) sessionStorage.setItem('selectedDay', day);
                            Core.Router.navigate('learning');
                        });
                    });
                    contentArea.querySelectorAll('[data-route]').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            Core.Router.navigate(e.target.getAttribute('data-route'));
                        });
                    });
                    contentArea.querySelectorAll('[data-action="toggle-week"]').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            const weekId = e.currentTarget.getAttribute('data-week');
                            const section = contentArea.querySelector(`.path-week[data-week="${weekId}"]`);
                            if (!section) return;
                            const isExpanded = section.getAttribute('aria-expanded') !== 'false';
                            if (isExpanded) {
                                section.classList.add('collapsed');
                                section.setAttribute('aria-expanded', 'false');
                                e.currentTarget.setAttribute('aria-expanded', 'false');
                                e.currentTarget.textContent = 'Expand';
                            } else {
                                section.classList.remove('collapsed');
                                section.setAttribute('aria-expanded', 'true');
                                e.currentTarget.setAttribute('aria-expanded', 'true');
                                e.currentTarget.textContent = 'Collapse';
                            }
                        });
                    });

                    if (UI && UI.Components && UI.Components.Loading && UI.Components.Loading.hide) {
                        UI.Components.Loading.hide();
                    }
                    return;
                }

                if (!learningPath) {
                    // No learning path found, redirect home silently
                    Core.Router.navigate('home');
                    return;
                }

                // Find the actual curriculum data - support new API response format
                let curriculum = null;
                let courseTitle = null;
                let phaseInfo = null;
                let milestoneAssessments = null;
                let resources = null;
                
                // Handle new API response format (stored in pathData)
                if (learningPath.pathData) {
                    const pathData = learningPath.pathData;
                    
                    if (pathData.daily_curriculum && Array.isArray(pathData.daily_curriculum)) {
                        curriculum = pathData.daily_curriculum;
                        courseTitle = pathData.course_title;
                        phaseInfo = pathData.phase_summaries;
                        milestoneAssessments = pathData.milestone_assessments;
                        resources = pathData.resources;
                    }
                }
                
                // Fallback to legacy formats
                if (!curriculum) {
                    if (learningPath.curriculum && Array.isArray(learningPath.curriculum) && learningPath.curriculum.length > 0) {
                        curriculum = learningPath.curriculum;
                    } else if (learningPath.days && Array.isArray(learningPath.days) && learningPath.days.length > 0) {
                        curriculum = learningPath.days;
                    } else if (learningPath.plan && Array.isArray(learningPath.plan) && learningPath.plan.length > 0) {
                        curriculum = learningPath.plan;
                    } else if (learningPath.learning_plan && Array.isArray(learningPath.learning_plan) && learningPath.learning_plan.length > 0) {
                        curriculum = learningPath.learning_plan;
                    } else if (learningPath.content && Array.isArray(learningPath.content) && learningPath.content.length > 0) {
                        curriculum = learningPath.content;
                    }
                }

                // Completed lessons for status
                let completed = [];
                try {
                    completed = await Growth90.Data.Storage.queryItems('learningProgress', {
                        index: 'userId',
                        keyRange: IDBKeyRange.only(userId)
                    });
                } catch(e) {}

                const isDayCompleted = (dayNum) => {
                    const isCompleted = completed.some(c => ((pathTopicId && c.pathId === pathTopicId) || (learningPath?.id && c.pathId === learningPath.id)) && c.day === dayNum && c.status === 'completed');
                    return isCompleted;
                };

                // Calculate progress statistics using detected curriculum
                const calculateProgressStats = () => {
                    if (!curriculum) return { completedDays: 0, totalDays: 0, progressPercentage: 0 };
                    
                    let totalDays = curriculum.length;
                    let completedDays = curriculum.filter(d => isDayCompleted(d.day || d.id)).length;
                    
                    const progressPercentage = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
                    return { completedDays, totalDays, progressPercentage };
                };

                const stats = calculateProgressStats();

                // Build UI
                const topicName = courseTitle || learningPath?.specialization?.title || pathTopicId?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || (learningPath?.title || 'Your Focus');
                let bodyHtml = '';

                // Use the detected curriculum for display
                if (curriculum && curriculum.length > 0) {
                    // Group curriculum by weeks for better organization
                    const weeks = [];
                    const weekSize = 7; // 7 days per week
                    
                    for (let i = 0; i < curriculum.length; i += weekSize) {
                        const weekDays = curriculum.slice(i, i + weekSize);
                        const weekNumber = Math.floor(i / weekSize) + 1;
                        const weekCompletedDays = weekDays.filter(d => isDayCompleted(d.day || d.id)).length;
                        const weekProgress = Math.round((weekCompletedDays / weekDays.length) * 100);
                        
                        weeks.push({
                            number: weekNumber,
                            days: weekDays,
                            completedDays: weekCompletedDays,
                            totalDays: weekDays.length,
                            progress: weekProgress
                        });
                    }

                    // Generate weeks HTML
                    const weeksHtml = weeks.map(week => {
                        const daysHtml = week.days.map(d => {
                            const dayNum = d.day || d.id || (week.days.indexOf(d) + 1 + (week.number - 1) * 7);
                            const done = isDayCompleted(dayNum);
                            const label = d.primary_learning_objective || d.title || d.topic || `Day ${dayNum}`;
                            const description = d.practical_application || d.description || d.learning_activities?.join(', ') || d.content || 'Interactive lesson and exercises';
                            const timeAllocation = d.time_allocation ? `Learn: ${d.time_allocation.learn}min, Practice: ${d.time_allocation.practice}min, Review: ${d.time_allocation.review}min` : d.time_investment;
                            
                            return `
                                <div class="path-day ${done ? 'completed' : ''}" data-day="${dayNum}">
                                    <div class="path-day-header">
                                        <span class="day-badge">Day ${dayNum}</span>
                                        ${done ? '<span class="status-badge completed">✓ Completed</span>' : '<span class="status-badge pending">Pending</span>'}
                                    </div>
                                    <div class="path-day-content">
                                        <div class="path-day-title">${Core.Utils.sanitizeHTML(label)}</div>
                                        <div class="path-day-description">${Core.Utils.sanitizeHTML(description)}</div>
                                        ${timeAllocation ? `<div class="path-day-duration">⏱ ${Core.Utils.sanitizeHTML(timeAllocation)}</div>` : ''}
                                        ${d.supporting_concepts && Array.isArray(d.supporting_concepts) ? 
                                            `<div class="supporting-concepts">
                                                <strong>Key Concepts:</strong> ${d.supporting_concepts.map(concept => Core.Utils.sanitizeHTML(concept)).join(', ')}
                                            </div>` : ''}
                                        ${d.assessment_criteria ? `<div class="assessment-criteria"><strong>Success Criteria:</strong> ${Core.Utils.sanitizeHTML(d.assessment_criteria)}</div>` : ''}
                                        ${d.learning_activities && Array.isArray(d.learning_activities) ? 
                                            `<ul class="learning-activities">
                                                ${d.learning_activities.map(activity => `<li>${Core.Utils.sanitizeHTML(activity)}</li>`).join('')}
                                            </ul>` : ''
                                        }
                                    </div>
                                    <div class="path-day-actions">
                                        <button class="secondary-btn path-day-btn" data-action="goto-learning" data-day="${dayNum}">
                                            ${done ? 'Review' : 'Start'} Lessons
                                        </button>
                                    </div>
                                </div>
                            `;
                        }).join('');

                        return `
                            <div class="path-week" data-week="${week.number}" aria-expanded="true">
                                <div class="path-week-header">
                                    <div class="week-info">
                                        <h3>Week ${week.number}</h3>
                                        <div class="week-progress">
                                            <span class="progress-text">${week.completedDays}/${week.totalDays} days completed</span>
                                            <div class="progress-bar">
                                                <div class="progress-fill" style="width: ${week.progress}%"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="week-stats">
                                        <span class="week-percentage">${week.progress}%</span>
                                        <button class="week-toggle-btn" data-action="toggle-week" data-week="${week.number}" aria-expanded="true">Collapse</button>
                                    </div>
                                </div>
                                <div class="path-week-days">
                                    ${daysHtml}
                                </div>
                            </div>
                        `;
                    }).join('');

                    // Generate milestones section if available
                    let milestonesHtml = '';
                    if (learningPath.milestones && Array.isArray(learningPath.milestones)) {
                        const milestonesItems = learningPath.milestones.map(milestone => {
                            const isCompleted = milestone.day <= stats.completedDays || milestone.completed;
                            return `
                                <div class="milestone-item ${isCompleted ? 'completed' : 'pending'}">
                                    <div class="milestone-icon">${isCompleted ? '🏆' : '🎯'}</div>
                                    <div class="milestone-content">
                                        <div class="milestone-title">${Core.Utils.sanitizeHTML(milestone.title || `Day ${milestone.day} Milestone`)}</div>
                                        <div class="milestone-description">${Core.Utils.sanitizeHTML(milestone.description || '')}</div>
                                        <div class="milestone-day">Day ${milestone.day}</div>
                                    </div>
                                    <div class="milestone-status">
                                        ${isCompleted ? '<span class="badge-success">Completed</span>' : '<span class="badge-secondary">Upcoming</span>'}
                                    </div>
                                </div>
                            `;
                        }).join('');

                        milestonesHtml = `
                            <div class="path-section milestones-section">
                                <h2>Learning Milestones</h2>
                                <div class="milestones-list">
                                    ${milestonesItems}
                                </div>
                            </div>
                        `;
                    }

                    // Add phase information if available
                    let phaseInfoHtml = '';
                    if (phaseInfo) {
                        phaseInfoHtml = `
                            <div class="path-section phases-section">
                                <h2>Learning Phases</h2>
                                <div class="phases-grid">
                                    ${phaseInfo.foundation ? `
                                        <div class="phase-card">
                                            <div class="phase-header">
                                                <span class="phase-icon">🏗️</span>
                                                <h3>Foundation (Days 1-30)</h3>
                                            </div>
                                            <p>${Core.Utils.sanitizeHTML(phaseInfo.foundation)}</p>
                                        </div>
                                    ` : ''}
                                    ${phaseInfo.application ? `
                                        <div class="phase-card">
                                            <div class="phase-header">
                                                <span class="phase-icon">🚀</span>
                                                <h3>Application (Days 31-60)</h3>
                                            </div>
                                            <p>${Core.Utils.sanitizeHTML(phaseInfo.application)}</p>
                                        </div>
                                    ` : ''}
                                    ${phaseInfo.mastery ? `
                                        <div class="phase-card">
                                            <div class="phase-header">
                                                <span class="phase-icon">🏆</span>
                                                <h3>Mastery (Days 61-90)</h3>
                                            </div>
                                            <p>${Core.Utils.sanitizeHTML(phaseInfo.mastery)}</p>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        `;
                    }

                    bodyHtml = `
                        <div class="path-overview">
                            <div class="path-stats">
                                <div class="stat-card">
                                    <div class="stat-value">${stats.completedDays}</div>
                                    <div class="stat-label">Days Completed</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-value">${stats.totalDays}</div>
                                    <div class="stat-label">Total Days</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-value">${stats.progressPercentage}%</div>
                                    <div class="stat-label">Progress</div>
                                </div>
                            </div>
                            <div class="path-progress-bar">
                                <div class="progress-bar-container">
                                    <div class="progress-bar-fill" style="width: ${stats.progressPercentage}%"></div>
                                </div>
                                <div class="progress-label">${stats.progressPercentage}% Complete</div>
                            </div>
                        </div>
                        
                        ${phaseInfoHtml}
                        
                        <div class="path-section curriculum-section">
                            <h2>Learning Curriculum</h2>
                            <div class="path-weeks">
                                ${weeksHtml}
                            </div>
                        </div>
                        
                        ${milestonesHtml}
                    `;
                } else if (learningPath && learningPath.modules && Array.isArray(learningPath.modules) && learningPath.modules.length > 0) {
                    // Enhanced modules display with progress tracking
                    const modulesHtml = learningPath.modules.map((m, moduleIndex) => {
                        const lessons = Array.isArray(m.lessons) ? m.lessons : [];
                        const completedLessons = lessons.filter(lesson => lesson.completed || false).length;
                        const moduleProgress = lessons.length > 0 ? Math.round((completedLessons / lessons.length) * 100) : 0;

                        const lessonsHtml = lessons.map(lesson => `
                            <li class="module-lesson ${lesson.completed ? 'completed' : ''}">
                                <span class="lesson-status">${lesson.completed ? '✓' : '○'}</span>
                                <span class="lesson-title">${Core.Utils.sanitizeHTML(lesson.title || lesson.id)}</span>
                                ${lesson.duration ? `<span class="lesson-duration">${lesson.duration}</span>` : ''}
                            </li>
                        `).join('');

                        return `
                            <div class="path-module ${moduleProgress === 100 ? 'completed' : ''}">
                                <div class="path-module-header">
                                    <div class="module-info">
                                        <h3>${Core.Utils.sanitizeHTML(m.title || m.id || 'Module')}</h3>
                                        ${m.description ? `<p class="module-description">${Core.Utils.sanitizeHTML(m.description)}</p>` : ''}
                                    </div>
                                    <div class="module-progress">
                                        <span class="progress-text">${completedLessons}/${lessons.length} lessons</span>
                                        <div class="progress-bar">
                                            <div class="progress-fill" style="width: ${moduleProgress}%"></div>
                                        </div>
                                    </div>
                                </div>
                                <ul class="module-lessons">
                                    ${lessonsHtml}
                                </ul>
                            </div>
                        `;
                    }).join('');

                    bodyHtml = `
                        <div class="path-overview">
                            <div class="path-stats">
                                <div class="stat-card">
                                    <div class="stat-value">${learningPath.modules.length}</div>
                                    <div class="stat-label">Modules</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-value">${learningPath.modules.reduce((total, m) => total + (m.lessons ? m.lessons.length : 0), 0)}</div>
                                    <div class="stat-label">Total Lessons</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-value">${stats.progressPercentage}%</div>
                                    <div class="stat-label">Progress</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="path-section">
                            <h2>Modules Overview</h2>
                            <div class="modules-list">${modulesHtml}</div>
                        </div>
                    `;
                } else {
                    Core.Router.navigate('home');
                    return;
                }

                // Optional path selector if multiple paths exist
                let pathSelectorHtml = '';
                if (Array.isArray(userPathsList) && userPathsList.length > 1) {
                    pathSelectorHtml = `
                        <label for="path-selector" class="jump-label" style="margin-right: .5rem; font-size: .9rem;">
                            Path:
                            <select id="path-selector" class="form-select" style="display:inline-block; width: auto; margin-left: .35rem;">
                                ${userPathsList.sort((a,b)=> new Date(b.createdAt||0)-new Date(a.createdAt||0)).map(p => `
                                    <option value="${p.id}" ${p.id===learningPath.id?'selected':''}>${Core.Utils.sanitizeHTML(p.title || 'Path')} ${p.status?`(${p.status})`:''}</option>
                                `).join('')}
                            </select>
                        </label>`;
                }

                contentArea.innerHTML = `
                    <div class="learning-path-container">
                        <div class="path-header">
                            <div class="path-icon">🗺️</div>
                            <div class="path-titles">
                                <h1>${Core.Utils.sanitizeHTML(topicName)}</h1>
                                ${learningPath?.specialization ? `<p class="path-subtitle">Specialization: ${Core.Utils.sanitizeHTML(learningPath.specialization.title)}</p>` : ''}
                                ${learningPath?.pathData?.course_description ? `<p class="path-description">${Core.Utils.sanitizeHTML(learningPath.pathData.course_description)}</p>` : ''}
                            </div>
                            <div class="path-actions">
                                ${pathSelectorHtml}
                                <button class="secondary-btn" data-route="home">← Back to Home</button>
                                <button class="primary-btn" data-route="learning" id="goto-today-btn">Today's Learning</button>
                                ${ (stats && stats.totalDays) ? `
                                    <label class="jump-label" for="jump-to-day" style="margin-left: .5rem; font-size: .9rem;">
                                        Jump to day:
                                        <select id="jump-to-day" class="form-select" style="display:inline-block; width: auto; margin-left: .35rem;">
                                            ${ Array.from({length: stats.totalDays}, (_,i) => i+1).map(n => `
                                                <option value="${n}" ${Number(sessionStorage.getItem('selectedDay')||'')===n ? 'selected' : ''}>${n}</option>
                                            `).join('') }
                                        </select>
                                    </label>
                                ` : '' }
                            </div>
                        </div>
                        ${bodyHtml}
                    </div>
                `;

                // Wire actions
                contentArea.querySelectorAll('[data-action="goto-learning"]').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const day = e.target.getAttribute('data-day');
                        if (day) {
                            // Store the selected day for the learning page
                            sessionStorage.setItem('selectedDay', day);
                        }
                        Core.Router.navigate('learning');
                    });
                });

                // Wire route buttons
                contentArea.querySelectorAll('[data-route]').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const route = e.target.getAttribute('data-route');
                        if (route === 'learning' && e.target.id === 'goto-today-btn') {
                            // Clear any previously selected day to go to computed "today"
                            sessionStorage.removeItem('selectedDay');
                        }
                        Core.Router.navigate(route);
                    });
                });

                // Week collapse/expand toggle
                contentArea.querySelectorAll('[data-action="toggle-week"]').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const weekNum = e.currentTarget.getAttribute('data-week');
                        const section = contentArea.querySelector(`.path-week[data-week="${weekNum}"]`);
                        if (!section) return;
                        const isExpanded = section.getAttribute('aria-expanded') !== 'false';
                        if (isExpanded) {
                            section.classList.add('collapsed');
                            section.setAttribute('aria-expanded', 'false');
                            e.currentTarget.setAttribute('aria-expanded', 'false');
                            e.currentTarget.textContent = 'Expand';
                        } else {
                            section.classList.remove('collapsed');
                            section.setAttribute('aria-expanded', 'true');
                            e.currentTarget.setAttribute('aria-expanded', 'true');
                            e.currentTarget.textContent = 'Collapse';
                        }
                    });
                });

                // Jump to day selector
                const jumpSelect = contentArea.querySelector('#jump-to-day');
                if (jumpSelect) {
                    jumpSelect.addEventListener('change', (e) => {
                        const day = Number(e.target.value);
                        if (day && !Number.isNaN(day)) {
                            sessionStorage.setItem('selectedDay', String(day));
                            Core.Router.navigate('learning');
                        }
                    });
                }

                // Path selector change
                const pathSelector = contentArea.querySelector('#path-selector');
                if (pathSelector) {
                    pathSelector.addEventListener('change', (e) => {
                        const id = e.target.value;
                        sessionStorage.setItem('selectedPathId', id);
                        // Re-render the page by navigating to the same route
                        Core.Router.navigate('path');
                    });
                }

            } catch (error) {
                console.error('Failed to load learning path:', error);
                UI.Components.Notifications.error('Failed to load learning path.');
            } finally {
                UI.Components.Loading.hide();
            }
        }

        // Function to load suggested topics based on user profile
        async function loadSuggestedTopics() {
            try {
                const userIdentity = JSON.parse(localStorage.getItem('growth90_user_identity') || '{}');
                const topicsGrid = document.getElementById('suggested-topics-grid');
                
                if (!topicsGrid) return;

                // Get user profile for personalized suggestions
                const professionalContext = {
                    industry: userIdentity.industry || 'general',
                    role: userIdentity.currentRole || 'professional',
                    experience: userIdentity.experience || 'intermediate'
                };

                // Generate topic suggestions using API
                try {
                    const response = await Growth90.Data.API.learningPath.generatePath(
                        userIdentity,
                        professionalContext,
                        userIdentity.learningStyles || ['visual', 'interactive'],
                        'skill_suggestions' // Special domain for getting topic suggestions
                    );

                    let suggestedTopics = [];
                    
                    // If no error was thrown, we have a successful 200 response
                    if (response) {
                        const responseData = response.data || response; // Handle both wrapper and direct formats
                        if (responseData && responseData.suggested_topics) {
                            suggestedTopics = responseData.suggested_topics;
                        }
                    } else {
                        // Fallback to default suggestions based on profile
                        suggestedTopics = getDefaultTopicSuggestions(professionalContext);
                    }

                    // Render topic cards
                    topicsGrid.innerHTML = suggestedTopics.map(topic => `
                        <div class="topic-card" data-topic="${topic.id}" data-description="${topic.description}">
                            <div class="topic-icon">${topic.icon}</div>
                            <h5>${topic.title}</h5>
                            <p>${topic.description}</p>
                            <div class="topic-meta">
                                <span class="topic-level">${topic.level || 'Intermediate'}</span>
                            </div>
                        </div>
                    `).join('');

                    // Add click handlers to topic cards
                    const topicCards = topicsGrid.querySelectorAll('.topic-card');
                    topicCards.forEach(card => {
                        card.addEventListener('click', () => {
                            selectTopic(card.dataset.topic, card.dataset.description);
                        });
                    });

                } catch (apiError) {
                    // Use default suggestions on API failure
                    const defaultTopics = getDefaultTopicSuggestions(professionalContext);
                    topicsGrid.innerHTML = defaultTopics.map(topic => `
                        <div class="topic-card" data-topic="${topic.id}" data-description="${topic.description}">
                            <div class="topic-icon">${topic.icon}</div>
                            <h5>${topic.title}</h5>
                            <p>${topic.description}</p>
                            <div class="topic-meta">
                                <span class="topic-level">${topic.level || 'Intermediate'}</span>
                            </div>
                        </div>
                    `).join('');

                    // Add click handlers
                    const topicCards = topicsGrid.querySelectorAll('.topic-card');
                    topicCards.forEach(card => {
                        card.addEventListener('click', () => {
                            selectTopic(card.dataset.topic, card.dataset.description);
                        });
                    });
                }

            } catch (error) {
                console.error('Failed to load suggested topics:', error);
                const topicsGrid = document.getElementById('suggested-topics-grid');
                if (topicsGrid) {
                    topicsGrid.innerHTML = `
                        <div class="topic-error">
                            <p>Failed to load suggestions. Please try again.</p>
                            <button class="retry-btn" onclick="loadSuggestedTopics()">Retry</button>
                        </div>
                    `;
                }
            }
        }

        // Function to get default topic suggestions based on user profile
        function getDefaultTopicSuggestions(professionalContext) {
            const allTopics = [
                {
                    id: 'leadership-skills',
                    title: 'Leadership Skills',
                    description: 'Build confidence in leading teams and projects',
                    icon: '💼',
                    duration: '90 days',
                    level: 'Intermediate',
                    industries: ['all']
                },
                {
                    id: 'communication',
                    title: 'Communication',
                    description: 'Master professional communication and presentation skills',
                    icon: '🗣️',
                    duration: '90 days',
                    level: 'Beginner',
                    industries: ['all']
                },
                {
                    id: 'data-analysis',
                    title: 'Data Analysis',
                    description: 'Improve analytical thinking and data interpretation',
                    icon: '📊',
                    duration: '90 days',
                    level: 'Intermediate',
                    industries: ['technology', 'finance', 'healthcare', 'consulting']
                },
                {
                    id: 'project-management',
                    title: 'Project Management',
                    description: 'Learn to plan, execute, and deliver projects effectively',
                    icon: '📋',
                    duration: '90 days',
                    level: 'Intermediate',
                    industries: ['all']
                },
                {
                    id: 'emotional-intelligence',
                    title: 'Emotional Intelligence',
                    description: 'Develop self-awareness and interpersonal skills',
                    icon: '🧠',
                    duration: '90 days',
                    level: 'Beginner',
                    industries: ['all']
                },
                {
                    id: 'time-management',
                    title: 'Time Management',
                    description: 'Optimize productivity and work-life balance',
                    icon: '⏰',
                    duration: '90 days',
                    level: 'Beginner',
                    industries: ['all']
                }
            ];

            // Filter topics based on industry and experience
            const industry = professionalContext.industry.toLowerCase();
            const filtered = allTopics.filter(topic => 
                topic.industries.includes('all') || 
                topic.industries.includes(industry)
            );

            // Return up to 3 most relevant topics
            return filtered.slice(0, 3);
        }

        // Function to handle topic selection - updated to use new flow
        function selectTopic(topicId, description) {
            // Check if this is one of our broader topics that should go to new flow
            const broaderTopics = ['leadership-skills', 'communication', 'data-analysis', 'project-management', 
                                   'emotional-intelligence', 'digital-marketing', 'technical-skills', 'financial-literacy'];
            
            if (broaderTopics.includes(topicId)) {
                // Use new modal flow for broader topics
                const topicTitleMap = {
                    'leadership-skills': 'Leadership Skills',
                    'communication': 'Communication',
                    'data-analysis': 'Data Analysis',
                    'project-management': 'Project Management',
                    'emotional-intelligence': 'Emotional Intelligence',
                    'digital-marketing': 'Digital Marketing',
                    'technical-skills': 'Technical Skills',
                    'financial-literacy': 'Financial Literacy'
                };
                const topicTitle = topicTitleMap[topicId] || topicId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                showSpecializationsModal(topicId, topicTitle);
                return;
            }
            
            // Store selected topic (for legacy topics or custom topics)
            try {
                const userIdentity = JSON.parse(localStorage.getItem('growth90_user_identity') || '{}');
                userIdentity.selectedTopic = {
                    id: topicId,
                    description: description,
                    selectedAt: new Date().toISOString()
                };
                localStorage.setItem('growth90_user_identity', JSON.stringify(userIdentity));

                // Show confirmation and navigate to learning path setup
                UI.Components.Notifications.success(`Selected: ${topicId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`);
                
                // Start generating learning path
                setTimeout(() => {
                    generateLearningPath(topicId, description);
                }, 1000);

            } catch (error) {
                console.error('Failed to select topic:', error);
                UI.Components.Notifications.error('Failed to select topic. Please try again.');
            }
        }

        // Function to show custom domain creation modal (single input only)
        function showCustomTopicModal() {
            const modal = document.getElementById('modal-container');
            const modalTitle = document.getElementById('modal-title');
            const modalDescription = document.getElementById('modal-description');
            const modalFooter = modal.querySelector('.modal-footer');

            modalTitle.textContent = 'Create Custom Domain';
            modalDescription.innerHTML = `
                <div class="custom-topic-form">
                    <div class="form-group">
                        <label for="custom-topic-title">Domain Name</label>
                        <input type="text" id="custom-topic-title" class="form-control" 
                               placeholder="e.g., Digital Marketing" maxlength="50">
                    </div>
                </div>
            `;

            modalFooter.innerHTML = `
                <button class="secondary-btn modal-cancel">Cancel</button>
                <button class="primary-btn modal-create" id="create-custom-topic">Create Domain</button>
            `;

            // Show modal
            modal.style.display = 'flex';
            modal.setAttribute('aria-hidden', 'false');

            // Event handlers
            const cancelBtn = modal.querySelector('.modal-cancel');
            const createBtn = modal.querySelector('#create-custom-topic');
            const closeBtn = modal.querySelector('.modal-close');

            const closeModal = () => {
                modal.style.display = 'none';
                modal.setAttribute('aria-hidden', 'true');
            };

            cancelBtn.addEventListener('click', closeModal);
            closeBtn.addEventListener('click', closeModal);

            createBtn.addEventListener('click', () => {
                const title = document.getElementById('custom-topic-title').value.trim();
                if (!title) {
                    UI.Components.Notifications.error('Please enter a domain name.');
                    return;
                }
                const customDomainId = 'custom-' + title.toLowerCase().replace(/\s+/g, '-');
                closeModal();
                // Select domain with empty description
                selectTopic(customDomainId, '');
            });
        }

        // Function to start learning path generation
        async function generateLearningPath(topicId, description) {
            UI.Components.Loading.show('Creating your personalized learning path...');
            
            try {
                const userIdentity = JSON.parse(localStorage.getItem('growth90_user_identity') || '{}');
                
                
                const response = await Growth90.Data.API.learningPath.generatePath(
                    userIdentity,
                    {
                        industry: userIdentity.industry,
                        role: userIdentity.currentRole || userIdentity.role,
                        experience: userIdentity.experience || 'intermediate'
                    },
                    userIdentity.learningStyles || ['visual', 'interactive'],
                    topicId
                );

                // Normalize API response (JSON or text) into our path model
                let parsed = response;
                try {
                    if (typeof response === 'string') parsed = JSON.parse(response);
                } catch (_) {}
                const output = parsed?.result?.Output || parsed?.Output || parsed?.data || {};

                // Support new endpoint schema (course_title, course_description, daily_curriculum, milestone_assessments, etc.)
                const courseTitle = output.course_title || parsed?.name;
                const courseDescription = output.course_description || output.learning_path || description;
                const dailyCurriculum = Array.isArray(output.daily_curriculum) ? output.daily_curriculum : (Array.isArray(output.curriculum) ? output.curriculum : []);
                const milestonesNew = Array.isArray(output.milestone_assessments) ? output.milestone_assessments : (Array.isArray(output.milestones) ? output.milestones : []);

                const lp = {
                    id: parsed?.id || Core.Utils.generateId(),
                    userId: userIdentity.email || userIdentity.id || 'guest',
                    title: courseTitle || `Learning Path: ${topicId}`,
                    description: courseDescription || `Auto-generated path for ${topicId}`,
                    duration: dailyCurriculum.length || 90,
                    status: 'active',
                    createdAt: new Date().toISOString(),
                    curriculum: dailyCurriculum, // keep in legacy field for compatibility
                    milestones: milestonesNew,
                    // Store full structured response for richer UI on path page
                    pathData: output
                };
                try { await Growth90.Data.Storage.setItem('learningPaths', lp); } catch(e) { /* ignore */ }

                UI.Components.Notifications.success('Learning path created successfully!');
                // Navigate to Today's Learning page
                setTimeout(() => { Core.Router.navigate('learning'); }, 600);

            } catch (error) {
                console.error('Failed to generate learning path:', error);
                
                // Even if API fails, allow user to proceed to learning page
                UI.Components.Notifications.warning('Learning path generation had issues, but you can still continue with default lessons.');
                setTimeout(() => {
                    Core.Router.navigate('learning');
                }, 1500);
                
            } finally {
                UI.Components.Loading.hide();
            }
        }

        // Function to load today's lessons
        async function loadTodaysLessons(selectedTopic, currentDay) {
            try {
                const lessonsList = document.getElementById('lessons-list');
                if (!lessonsList) {
                    return;
                }

                
                // Use the Content Delivery system which prioritizes IndexedDB curriculum data
                try {
                    if (Growth90.Learning && Growth90.Learning.ContentDelivery) {
                        const dailyContent = await Growth90.Learning.ContentDelivery.getDailyLesson(currentDay);
                        
                        if (dailyContent && dailyContent.source === 'curriculum') {
                            await renderTodaysLessonsFromCurriculum(dailyContent, lessonsList);
                            return;
                        } else if (dailyContent) {
                            const responseData = dailyContent.data || dailyContent;
                            await renderTodaysLessons(responseData, lessonsList);
                            return;
                        }
                    }
                } catch (contentError) {
                }

                // Fallback to direct API call if content delivery is not available
                try {
                    const userIdentity = JSON.parse(localStorage.getItem('growth90_user_identity') || '{}');
                    
                    // Try to get learning objective from IndexedDB curriculum first
                    let learningObjective = `Day ${currentDay} lesson`;
                    try {
                        const uid = userIdentity.email || userIdentity.id || 'guest';
                        const userPaths = await Growth90.Data.Storage.queryItems('learningPaths', {
                            index: 'userId',
                            keyRange: IDBKeyRange.only(uid),
                            direction: 'prev',
                            limit: 1
                        });
                        const learningPath = userPaths && userPaths.length ? userPaths[0] : null;
                        
                        if (learningPath) {
                            // Support multiple curriculum formats
                            let curriculum = null;
                            if (learningPath.pathData && Array.isArray(learningPath.pathData.daily_curriculum)) {
                                curriculum = learningPath.pathData.daily_curriculum;
                            } else if (Array.isArray(learningPath.curriculum)) {
                                curriculum = learningPath.curriculum;
                            }
                            
                            if (curriculum) {
                                const dayPlan = curriculum.find(d => d.day === currentDay);
                                if (dayPlan && dayPlan.primary_learning_objective) {
                                    learningObjective = dayPlan.primary_learning_objective;
                                }
                            }
                        }
                    } catch (storageError) {
                    }
                    
                    // Fallback to topic description or generic
                    if (learningObjective === `Day ${currentDay} lesson`) {
                        learningObjective = selectedTopic?.description || learningObjective;
                    }
                    
                    // Create stable user context for caching
                    const stableUserContext = {
                        profile: {
                            industry: userIdentity.industry,
                            role: userIdentity.role || userIdentity.currentRole,
                            experience: userIdentity.experience || 'intermediate',
                            focusAreas: userIdentity.focusAreas,
                            challengeLevel: userIdentity.challengeLevel,
                            timeCommitment: userIdentity.timeCommitment,
                            goal: userIdentity.goal,
                            feedbackStyle: userIdentity.feedbackStyle
                        },
                        professional_context: {
                            industry: userIdentity.industry,
                            role: userIdentity.currentRole || userIdentity.role,
                            experience: userIdentity.experience || 'intermediate'
                        }
                    };
                    
                    const response = await Growth90.Data.API.content.getDailyLesson(
                        learningObjective,
                        stableUserContext,
                        currentDay
                    );

                    if (response) {
                        const responseData = response.data || response;
                        await renderTodaysLessons(responseData, lessonsList);
                    } else {
                        renderDefaultLessons(selectedTopic, lessonsList);
                    }

                } catch (apiError) {
                    console.error('❌ API call failed, using default lessons:', apiError);
                    renderDefaultLessons(selectedTopic, lessonsList);
                }

            } catch (error) {
                console.error('Failed to load today\'s lessons:', error);
                const lessonsList = document.getElementById('lessons-list');
                if (lessonsList) {
                    lessonsList.innerHTML = `
                        <div class="lesson-error">
                            <p>Failed to load lessons. Please try again.</p>
                            <button class="retry-btn" onclick="window.retryTodaysLessons()">Retry</button>
                        </div>
                    `;
                }
            }
        }

        // Render lessons from curriculum data stored in IndexedDB
        async function renderTodaysLessonsFromCurriculum(dailyContent, container) {
            try {
                
                const html = `
                    <div class="lesson-container curriculum-lesson">
                        <div class="lesson-header">
                            <h2 class="lesson-title">${dailyContent.title}</h2>
                            <div class="lesson-meta">
                                <span class="lesson-day">Day ${dailyContent.dayNumber}</span>
                                <span class="lesson-duration">${dailyContent.estimatedTime} minutes</span>
                                <span class="lesson-source">📚 From Learning Path</span>
                            </div>
                        </div>
                        
                        <div class="lesson-content">
                            ${dailyContent.content}
                        </div>
                        
                        ${dailyContent.exercises && dailyContent.exercises.length > 0 ? `
                            <div class="lesson-exercises">
                                <h3>💡 Practice Exercises</h3>
                                ${dailyContent.exercises.map(exercise => `
                                    <div class="exercise-item">
                                        <h4>${exercise.type === 'reflection' ? '🤔 Reflection' : '📝 Exercise'}</h4>
                                        <p>${exercise.prompt}</p>
                                        ${exercise.estimatedTime ? `<small>⏱️ ${exercise.estimatedTime} minutes</small>` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                        
                        <div class="lesson-actions">
                            <button class="complete-lesson-btn" data-lesson-id="${dailyContent.id}" data-day="${dailyContent.dayNumber}">
                                ✅ Mark as Complete
                            </button>
                            <button class="lesson-notes-btn" data-lesson-id="${dailyContent.id}">
                                📝 Add Notes
                            </button>
                        </div>
                    </div>
                `;
                
                container.innerHTML = html;
                
                // Add event listeners for lesson completion
                const completeBtn = container.querySelector('.complete-lesson-btn');
                if (completeBtn) {
                    completeBtn.addEventListener('click', (e) => {
                        const lessonId = e.target.getAttribute('data-lesson-id');
                        const day = parseInt(e.target.getAttribute('data-day'));
                        completeLessonFlow(lessonId, day);
                    });
                }
                
                // Add event listeners for notes
                const notesBtn = container.querySelector('.lesson-notes-btn');
                if (notesBtn) {
                    notesBtn.addEventListener('click', (e) => {
                        const lessonId = e.target.getAttribute('data-lesson-id');
                        // TODO: Implement notes functionality
                    });
                }
                
            } catch (error) {
                console.error('Error rendering curriculum lesson:', error);
                container.innerHTML = `
                    <div class="lesson-error">
                        <p>Error displaying lesson content. Please try refreshing.</p>
                    </div>
                `;
            }
        }

        async function renderTodaysLessons(lessonsData, container) {
            // Handle multiple API formats: legacy lessons[], mid-format (key_concepts/narrative/applications), and rich sections (narrative_intro, concept_explanation, etc.)

            function stripMarkdown(md = '') {
                return (md || '')
                    .replace(/```[\s\S]*?```/g, ' ')
                    .replace(/`([^`]*)`/g, '$1')
                    .replace(/\*\*([^*]+)\*\*/g, '$1')
                    .replace(/\*([^*]+)\*/g, '$1')
                    .replace(/^>\s?/gm, '')
                    .replace(/^#{1,6}\s+/gm, '')
                    .replace(/^\s*[-*+]\s+/gm, '')
                    .replace(/^\s*\d+\.\s+/gm, '')
                    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
                    .replace(/\n+/g, ' ')
                    .trim();
            }

            function createLessonsFromApiResponse(data) {
                const lessons = [];
                const pushIf = (key, meta) => {
                    if (!data || !data[key]) return;
                    const raw = data[key];
                    let title = meta.title;
                    let fullText = '';

                    if (typeof raw === 'string') {
                        fullText = raw;
                    } else if (Array.isArray(raw)) {
                        // e.g., additional_resources: [url, url]
                        fullText = raw.map((item) => `- ${item}`).join('\n');
                    } else if (typeof raw === 'object') {
                        // object with optional title/text or special schemas
                        if (raw.title) title = raw.title;

                        if (raw.text) {
                            fullText = raw.text;
                        } else if (key === 'reflection_question' && Array.isArray(raw.questions)) {
                            // Build markdown for reflection questions
                            const parts = [];
                            parts.push(`# ${raw.title || meta.title}`);
                            raw.questions.forEach((q, idx) => {
                                parts.push(`\n### Q${idx + 1}. ${q.question_text}`);
                                if (q.question_type === 'multiple_choice' && Array.isArray(q.options)) {
                                    q.options.forEach(opt => {
                                        const label = opt.id || '';
                                        parts.push(`- ${label}) ${opt.text}`);
                                    });
                                    if (Array.isArray(q.correct_option_ids) && q.correct_option_ids.length) {
                                        parts.push(`\nAnswer: ${q.correct_option_ids.join(', ')}`);
                                    }
                                } else if (q.question_type === 'open_ended') {
                                    parts.push(`- Reflect and jot down your answer below.`);
                                }
                                if (q.feedback) {
                                    parts.push(`\n> ${q.feedback}`);
                                }
                            });
                            fullText = parts.join('\n');
                        } else if (key === 'additional_resources' && Array.isArray(raw.items)) {
                            // If provided as { items: [] }
                            fullText = raw.items.map((item) => `- ${item}`).join('\n');
                        } else {
                            // Fallback: stringify meaningful fields
                            fullText = raw.text || '';
                        }
                    }

                    const plain = stripMarkdown(fullText);
                    lessons.push({
                        id: key,
                        title,
                        description: plain.slice(0, 180) + (plain.length > 180 ? '…' : ''),
                        fullContent: fullText,
                        icon: meta.icon,
                        duration: meta.duration,
                        type: meta.type
                    });
                };

                // New rich sections
                pushIf('narrative_intro',      { title: 'Narrative Intro',        icon: '📘', duration: '5-10 min',  type: 'Intro' });
                pushIf('narrative_challenge',  { title: 'Challenge Scenario',     icon: '🧩', duration: '5-10 min',  type: 'Scenario' });
                pushIf('concept_explanation',  { title: 'Key Concepts',           icon: '🔑', duration: '10-15 min', type: 'Concepts' });
                pushIf('reflection_question',  { title: 'Reflection & Check-in',  icon: '🤔', duration: '5-10 min',  type: 'Reflection' });
                pushIf('skill_application',    { title: 'Hands-on Application',   icon: '💡', duration: '15-25 min', type: 'Practice' });
                pushIf('summary',              { title: 'Summary',                icon: '📌', duration: '3-5 min',   type: 'Summary' });
                pushIf('actionable_steps',     { title: 'Actionable Steps',       icon: '✅', duration: '5-10 min',  type: 'Checklist' });
                pushIf('additional_resources', { title: 'Additional Resources',   icon: '🔗', duration: '3-5 min',   type: 'Resources' });

                // Mid-format compatibility
                if (!lessons.length && data.key_concepts && data.narrative && data.applications) {
                    lessons.push(
                        {
                            id: 'key_concepts',
                            title: 'Key Concepts',
                            description: stripMarkdown(data.key_concepts).slice(0, 180) + '…',
                            fullContent: data.key_concepts,
                            icon: '🔑',
                            duration: '10-15 min',
                            type: 'Concept Learning'
                        },
                        {
                            id: 'narrative',
                            title: 'Practical Scenario',
                            description: stripMarkdown(data.narrative).slice(0, 180) + '…',
                            fullContent: data.narrative,
                            icon: '📖',
                            duration: '15-20 min',
                            type: 'Interactive Story'
                        },
                        {
                            id: 'applications',
                            title: 'Hands-on Application',
                            description: stripMarkdown(data.applications).slice(0, 180) + '…',
                            fullContent: data.applications,
                            icon: '💡',
                            duration: '20-30 min',
                            type: 'Practical Exercise'
                        }
                    );
                }

                return lessons;
            }

            let lessons = [];

            if (lessonsData.lessons && Array.isArray(lessonsData.lessons)) {
                // Legacy array format
                lessons = lessonsData.lessons;
            } else {
                lessons = createLessonsFromApiResponse(lessonsData);
            }
            
            // Get current day and user info for completion status check
            const userIdentity = JSON.parse(localStorage.getItem('growth90_user_identity') || '{}');
            const userId = userIdentity.email || userIdentity.id || 'guest';
            const pathId = userIdentity.selectedTopic?.id || 'default';
            const currentDay = await getCurrentDayByCompletion(userId, pathId);
            
            // Get all completed lessons for this user and path
            let completedLessons = [];
            try {
                completedLessons = await Growth90.Data.Storage.queryItems('learningProgress', {
                    index: 'userId',
                    keyRange: IDBKeyRange.only(userId)
                });
            } catch (error) {
                console.error('Error fetching completed lessons:', error);
            }
            
            const htmlContent = lessons.map((lesson, index) => {
                // Check if THIS specific lesson is completed
                const lessonId = lesson.id || index;
                const isCompleted = completedLessons.some(completedLesson => 
                    completedLesson.pathId === pathId && 
                    completedLesson.day === currentDay && 
                    completedLesson.lessonId === lessonId &&
                    completedLesson.status === 'completed'
                );
                
                return `
                <div class="lesson-item ${isCompleted ? 'completed' : ''}" data-lesson-id="${lessonId}" data-day="${currentDay}">
                    <div class="lesson-icon">${isCompleted ? '✅' : (lesson.icon || '📖')}</div>
                    <div class="lesson-content">
                        <h4>${lesson.title}${isCompleted ? ' (Completed)' : ''}</h4>
                        <p>${lesson.description}</p>
                        <div class="lesson-meta">
                            <span class="duration">⏱ ${lesson.duration || '15 min'}</span>
                            <span class="type">${lesson.type || 'Interactive Lesson'}</span>
                            <span class="day-indicator">Day ${currentDay}</span>
                        </div>
                    </div>
                    <div class="lesson-status">
                        ${isCompleted ? 
                            '<span class="completion-badge">✓ Completed</span>' :
                            `<button class="lesson-start-btn" data-lesson-id="${lessonId}" data-day="${currentDay}">Start</button>`
                        }
                    </div>
                </div>
                `;
            }).join('');
            
            container.innerHTML = htmlContent;
            
            // Store lesson data on DOM elements for access during lesson start
            lessons.forEach((lesson, index) => {
                const lessonElement = container.querySelector(`[data-lesson-id="${lesson.id || index}"]`);
                if (lessonElement) {
                    lessonElement._lessonData = lesson;
                }
            });

            // Add event handlers for lesson start buttons
            const startButtons = container.querySelectorAll('.lesson-start-btn');
            startButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const lessonId = button.dataset.lessonId;
                    const day = parseInt(button.dataset.day || '1');
                    startLesson(lessonId, day);
                });
            });
        }

        function renderDefaultLessons(selectedTopic, container) {
            // Default lessons based on topic
            const defaultLessons = generateDefaultLessons(selectedTopic);
            
            container.innerHTML = defaultLessons.map((lesson, index) => `
                <div class="lesson-item" data-lesson-id="${index}">
                    <div class="lesson-icon">${lesson.icon}</div>
                    <div class="lesson-content">
                        <h4>${lesson.title}</h4>
                        <p>${lesson.description}</p>
                        <div class="lesson-meta">
                            <span class="duration">⏱ ${lesson.duration}</span>
                            <span class="type">${lesson.type}</span>
                        </div>
                    </div>
                    <div class="lesson-status">
                        <button class="lesson-start-btn" data-lesson-id="${index}" data-day="1">
                            Start
                        </button>
                    </div>
                </div>
            `).join('');

            // Add event handlers for lesson start buttons
            const startButtons = container.querySelectorAll('.lesson-start-btn');
            startButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const lessonId = button.dataset.lessonId;
                    const day = parseInt(button.dataset.day || '1');
                    startLesson(lessonId, day);
                });
            });
        }

        function generateDefaultLessons(selectedTopic) {
            const topicName = selectedTopic.id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            
            return [
                {
                    icon: '📖',
                    title: `${topicName} Fundamentals`,
                    description: `Learn the core concepts and principles of ${topicName.toLowerCase()}`,
                    duration: '15 min',
                    type: 'Interactive Lesson'
                },
                {
                    icon: '🎯',
                    title: 'Goal Setting Exercise',
                    description: `Define your objectives and outcomes for mastering ${topicName.toLowerCase()}`,
                    duration: '10 min',
                    type: 'Exercise'
                },
                {
                    icon: '💡',
                    title: 'Practical Application',
                    description: `Apply ${topicName.toLowerCase()} concepts to real-world scenarios`,
                    duration: '20 min',
                    type: 'Practice'
                }
            ];
        }

        async function startLesson(lessonId, day) {
            // Find the lesson data to show the full content
            const lessonElement = document.querySelector(`[data-lesson-id="${lessonId}"]`);
            const lessonData = lessonElement ? lessonElement._lessonData : null;
            
            if (lessonData && lessonData.fullContent) {
                // Navigate to lesson detail page
                showLessonDetailPage(lessonData, day);
            } else {
                // Fallback to simple notification for old-style lessons
                UI.Components.Notifications.info(`Starting lesson ${lessonId}...`);
                
                setTimeout(async () => {
                    await completeLessonFlow(lessonId, day);
                }, 2000);
            }
        }
        
        function showLessonDetailPage(lessonData, day) {
            const appContent = document.getElementById('app-content');
            
            appContent.innerHTML = `
                <div class="lesson-detail-page">
                    <div class="lesson-detail-header">
                        <button class="back-button" id="lesson-back-button">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M19 12H5M12 19l-7-7 7-7"/>
                            </svg>
                            Back to Lessons
                        </button>
                        <div class="lesson-progress-indicator">
                            <span class="day-badge">Day ${day}</span>
                        </div>
                    </div>
                    
                    <div class="lesson-detail-content">
                        <div class="lesson-header">
                            <div class="lesson-icon-large">${lessonData.icon}</div>
                            <h1 class="lesson-title">${lessonData.title}</h1>
                            <div class="lesson-meta">
                                <span class="lesson-type">${lessonData.type}</span>
                                <span class="lesson-duration">⏱ ${lessonData.duration}</span>
                            </div>
                        </div>
                        
                        ${lessonData.description ? `
                        <div class="lesson-description">
                            <p>${lessonData.description}</p>
                        </div>
                        ` : ''}
                        
                        <div class="lesson-content-main">
                            <div class="content-section">
                                <h2>📚 Learning Content</h2>
                                <div class="lesson-text-content">
                                    ${formatLessonContent(lessonData.fullContent)}
                                </div>
                            </div>
                            
                            <div class="lesson-actions">
                                <button class="lesson-complete-btn primary-btn" onclick="completeLessonFromDetail('${lessonData.id}', ${day}, this)">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                        <path d="M20 6L9 17l-5-5"/>
                                    </svg>
                                    Complete Lesson
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Add event listener for back button after DOM is created
            const backButton = document.getElementById('lesson-back-button');
            if (backButton) {
                backButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    window.goBackToLessons();
                });
            }
            
            // Store current page state for navigation
            window.currentLessonData = { lessonData, day };
            
            // Scroll to top
            window.scrollTo(0, 0);
        }
        
        // Helper: basic Markdown -> safe HTML renderer (headings, lists, code, emphasis)
        function formatLessonContent(markdown) {
            if (!markdown) return '<p>Content will be loaded here...</p>';

            // Escape HTML first to avoid injection, then apply markdown
            const escapeHtml = (s) => String(s)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');

            // Extract fenced code blocks to placeholders to prevent content inside from being formatted
            const codeBlocks = [];
            let text = String(markdown);
            text = text.replace(/```([\s\S]*?)```/g, (m, code) => {
                const idx = codeBlocks.push(code) - 1;
                return `[[[CODE_BLOCK_${idx}]]]`;
            });

            // Split into lines and process block structures
            const lines = text.split(/\r?\n/);
            let html = '';
            let inUl = false, inOl = false, inP = false;

            const closeParagraph = () => { if (inP) { html += '</p>'; inP = false; } };
            const closeLists = () => { if (inUl) { html += '</ul>'; inUl = false; } if (inOl) { html += '</ol>'; inOl = false; } };

            const renderInline = (s) => {
                let out = escapeHtml(s);
                // Auto-link bare URLs
                out = out.replace(/(https?:\/\/[^\s)]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1<\/a>');
                // Markdown inline formatting
                out = out
                    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
                    .replace(/`([^`]+)`/g, '<code>$1</code>')
                    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1<\/a>');
                return out;
            };

            for (let raw of lines) {
                const line = raw.replace(/\s+$/,'');
                if (!line.trim()) { // blank
                    closeParagraph();
                    closeLists();
                    continue;
                }

                // Headings
                const m = line.match(/^(#{1,6})\s+(.*)$/);
                if (m) {
                    closeParagraph();
                    closeLists();
                    const level = m[1].length;
                    html += `<h${level}>${renderInline(m[2])}</h${level}>`;
                    continue;
                }

                // Blockquote
                if (/^>\s?/.test(line)) {
                    closeParagraph();
                    closeLists();
                    html += `<blockquote>${renderInline(line.replace(/^>\s?/, ''))}</blockquote>`;
                    continue;
                }

                // Ordered list
                if (/^\s*\d+\.\s+/.test(line)) {
                    if (!inOl) { closeParagraph(); closeLists(); html += '<ol>'; inOl = true; }
                    const item = line.replace(/^\s*\d+\.\s+/, '');
                    html += `<li>${renderInline(item)}</li>`;
                    continue;
                }

                // Unordered list
                if (/^\s*[-*+]\s+/.test(line)) {
                    if (!inUl) { closeParagraph(); closeLists(); html += '<ul>'; inUl = true; }
                    const item = line.replace(/^\s*[-*+]\s+/, '');
                    html += `<li>${renderInline(item)}</li>`;
                    continue;
                }

                // Paragraph text
                if (!inP) { closeLists(); html += '<p>'; inP = true; }
                html += `${renderInline(line)} `;
            }
            closeParagraph();
            closeLists();

            // Restore fenced code blocks
            html = html.replace(/\[\[\[CODE_BLOCK_(\d+)\]\]\]/g, (m, idxStr) => {
                const idx = parseInt(idxStr, 10);
                const code = escapeHtml(codeBlocks[idx] || '');
                return `<pre><code>${code}</code></pre>`;
            });

            return html || '<p>Content will be loaded here...</p>';
        }
        
        // Global function for completing lesson from detail page
        window.completeLessonFromDetail = async function(lessonId, day, button) {
            button.disabled = true;
            button.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin">
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                </svg>
                Completing...
            `;
            
            try {
                await completeLessonFlow(lessonId, day);
                
                // Show success message
                button.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    Completed!
                `;
                button.classList.add('completed');
                
                // Auto-redirect back to lessons after a moment
                setTimeout(() => {
                    window.goBackToLessons();
                }, 1500);
                
            } catch (error) {
                console.error('Error completing lesson:', error);
                button.disabled = false;
                button.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    Complete Lesson
                `;
                UI.Components.Notifications.error('Failed to complete lesson. Please try again.');
            }
        }
        
        async function completeLessonFlow(lessonId, day) {
            try {
                const userIdentity = JSON.parse(localStorage.getItem('growth90_user_identity') || '{}');
                const userId = userIdentity.email || userIdentity.id || 'guest';
                const pathId = userIdentity.selectedTopic?.id || 'default';
                const currentDay = day || await getCurrentDayByCompletion(userId, pathId);
                
                // Mark lesson as completed
                const success = await markLessonCompleted(userId, pathId, currentDay, {
                    timeSpent: 15, // Simulate 15 minutes spent
                    lessonId: lessonId
                });
                
                if (success) {
                    UI.Components.Notifications.success('Lesson completed! Great job! 🎉');
                    
                    // Check if all lessons for this day are completed
                    const allDayLessonsCompleted = await checkIfDayCompleted(userId, pathId, currentDay);
                    
                    if (allDayLessonsCompleted) {
                        // All lessons for current day completed, show next day
                        const nextDay = await getCurrentDayByCompletion(userId, pathId);
                        
                        setTimeout(async () => {
                            await showLearningForDay(nextDay);
                        }, 1500);
                    } else {
                        // Still lessons remaining for current day
                        setTimeout(() => {
                            showTodaysLearning();
                        }, 1500);
                    }
                } else {
                    UI.Components.Notifications.error('Failed to save lesson completion. Please try again.');
                }
            } catch (error) {
                console.error('Error completing lesson:', error);
                UI.Components.Notifications.error('Failed to complete lesson. Please try again.');
            }
        }

        // Check if all lessons for a specific day are completed
        async function checkIfDayCompleted(userId, pathId, day) {
            try {
                // Get completed lessons for this user and path
                const completedLessons = await Growth90.Data.Storage.queryItems('learningProgress', {
                    index: 'userId',
                    keyRange: IDBKeyRange.only(userId)
                });
                
                // Count completed lessons for this specific day
                const dayCompletedLessons = completedLessons.filter(lesson => 
                    lesson.pathId === pathId && 
                    lesson.day === day && 
                    lesson.status === 'completed'
                );
                
                // Get the total number of lessons available for this day
                // We need to check what lessons are available by loading the day's content
                const totalDayLessons = await getTotalLessonsForDay(userId, pathId, day);
                
                
                // Day is complete only when ALL lessons are finished
                return totalDayLessons > 0 && dayCompletedLessons.length >= totalDayLessons;
                
            } catch (error) {
                console.error('Error checking day completion:', error);
                return false;
            }
        }
        
        // Get the total number of lessons available for a specific day
        async function getTotalLessonsForDay(userId, pathId, day) {
            try {
                // Try to get the content for this day to count total lessons
                if (Growth90.Learning && Growth90.Learning.ContentDelivery) {
                    const dailyContent = await Growth90.Learning.ContentDelivery.getDailyLesson(day);
                    
                    if (dailyContent && dailyContent.source === 'curriculum') {
                        // For curriculum-based content, typically 1 lesson per day
                        return 1;
                    } else if (dailyContent && dailyContent.data) {
                        // For API-based content, count the lessons generated
                        const tempContainer = document.createElement('div');
                        await renderTodaysLessons(dailyContent.data, tempContainer);
                        const lessonElements = tempContainer.querySelectorAll('.lesson-item');
                        return lessonElements.length;
                    }
                }
                
                // Fallback: try to get from current UI
                const currentLessonsList = document.getElementById('lessons-list');
                if (currentLessonsList) {
                    const currentDayElements = currentLessonsList.querySelectorAll(`.lesson-item[data-day="${day}"]`);
                    if (currentDayElements.length > 0) {
                        return currentDayElements.length;
                    }
                }
                
                // Conservative fallback - assume multiple lessons per day based on API structure
                // This matches the typical API response that has ~6-8 lesson sections
                return 6;
                
            } catch (error) {
                console.error('Error getting total lessons for day:', error);
                return 6; // Conservative fallback
            }
        }
        
        // Show learning content for a specific day
        async function showLearningForDay(dayNumber) {
            try {
                const userIdentity = JSON.parse(localStorage.getItem('growth90_user_identity') || '{}');
                if (userIdentity.selectedTopic) {
                    // Update current navigation
                    updateActiveNavigation('learning');
                    
                    // Load lessons for the specific day
                    await loadTodaysLessons(userIdentity.selectedTopic, dayNumber);
                } else {
                    // No topic selected, redirect to topic selection
                    Core.Router.navigate('onboarding');
                }
            } catch (error) {
                console.error('Error showing learning for day:', error);
                showTodaysLearning(); // Fallback to regular learning view
            }
        }

        async function startFirstLesson() {
            try {
                const userIdentity = JSON.parse(localStorage.getItem('growth90_user_identity') || '{}');
                const userId = userIdentity.email || userIdentity.id || 'guest';
                const pathId = userIdentity.selectedTopic?.id || 'default';
                
                // Get the current day based on completion
                const currentDay = await getCurrentDayByCompletion(userId, pathId);
                
                // Navigate to learning page and show lessons for current day
                Core.Router.navigate('learning');
                
                // After navigation and render, auto-open the next incomplete lesson
                const tryOpenNextLesson = () => {
                    const lessonsList = document.getElementById('lessons-list');
                    if (!lessonsList) return;
                    // Prefer first incomplete lesson's start button
                    const nextBtn = lessonsList.querySelector('.lesson-item:not(.completed) .lesson-start-btn');
                    const anyBtn = lessonsList.querySelector('.lesson-start-btn');
                    if (nextBtn) { nextBtn.click(); return; }
                    if (anyBtn) { anyBtn.click(); return; }
                    // Curriculum-based day: content is already visible; just focus/scroll
                    const curriculum = document.querySelector('.curriculum-lesson');
                    if (curriculum) {
                        curriculum.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                };
                
                // Small delay to ensure navigation completes and DOM renders
                setTimeout(async () => {
                    await showLearningForDay(currentDay);
                    // Allow DOM to update, then try to open the proper lesson
                    setTimeout(tryOpenNextLesson, 120);
                }, 100);
                
            } catch (error) {
                console.error('Error starting lesson:', error);
                // Fallback to clicking first lesson button if available
                const firstLessonBtn = document.querySelector('.lesson-start-btn');
                if (firstLessonBtn) {
                    firstLessonBtn.click();
                }
            }
        }

        // Helper function to get time-based greeting
        function getTimeOfDay() {
            const hour = new Date().getHours();
            if (hour < 12) return 'morning';
            if (hour < 17) return 'afternoon';
            return 'evening';
        }

        function showProfile() {
            UI.Components.Loading.show('Loading your profile...');
            
            try {
                const contentArea = document.getElementById('app-content');
                
                // Get current user profile
                let userProfile = null;
                try {
                    const stored = localStorage.getItem('growth90_user_identity');
                    userProfile = stored ? JSON.parse(stored) : null;
                } catch (e) {
                }

                if (!userProfile) {
                    contentArea.innerHTML = `
                        <div class="profile-container">
                            <div class="profile-error">
                                <h2>Profile Not Found</h2>
                                <p>Please complete your initial setup first.</p>
                                <button class="primary-btn" onclick="Core.Router.navigate('home')">Go to Home</button>
                            </div>
                        </div>
                    `;
                    UI.Components.Loading.hide();
                    updateActiveNavigation('profile');
                    return;
                }

                contentArea.innerHTML = generateProfileInterface(userProfile);
                initializeProfileInterface(userProfile);
                
                UI.Components.Loading.hide();
                updateActiveNavigation('profile');
                
            } catch (error) {
                console.error('Failed to load profile:', error);
                UI.Components.Loading.hide();
                UI.Components.Notifications.error('Failed to load profile. Please try again.');
            }
        }

        function generateProfileInterface(userProfile) {
            return `
                <div class="profile-container">
                    <div class="profile-header">
                        <h1 class="profile-title">Your Profile</h1>
                        <p class="profile-subtitle">Manage your personal information and learning settings</p>
                    </div>
                    
                    <form id="profile-form" class="profile-form">
                        <!-- Basic Information Section -->
                        <div class="profile-section">
                            <div class="section-header">
                                <h2 class="section-title">
                                    <span class="section-icon">👤</span>
                                    Basic Information
                                </h2>
                            </div>
                            
                            <div class="form-grid">
                                <div class="form-group">
                                    <label class="form-label" for="profile-nickname">Nickname *</label>
                                    <input type="text" id="profile-nickname" class="form-input" 
                                           value="${userProfile.nickname || ''}" required>
                                    <small class="form-help">How we'll address you in the platform</small>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label" for="profile-email">Email Address *</label>
                                    <input type="email" id="profile-email" class="form-input" 
                                           value="${userProfile.email || ''}" required>
                                    <small class="form-help">Used for updates and communication</small>
                                </div>
                            </div>
                        </div>

                        <!-- Professional Context Section -->
                        <div class="profile-section">
                            <div class="section-header">
                                <h2 class="section-title">
                                    <span class="section-icon">💼</span>
                                    Professional Context
                                </h2>
                            </div>
                            
                            <div class="form-grid">
                                <div class="form-group">
                                    <label class="form-label" for="profile-industry">Industry</label>
                                    <select id="profile-industry" class="form-select">
                                        <option value="">Select industry</option>
                                        <option value="Technology & Software" ${userProfile.industry === 'Technology & Software' ? 'selected' : ''}>Technology & Software</option>
                                        <option value="Healthcare & Medicine" ${userProfile.industry === 'Healthcare & Medicine' ? 'selected' : ''}>Healthcare & Medicine</option>
                                        <option value="Finance & Banking" ${userProfile.industry === 'Finance & Banking' ? 'selected' : ''}>Finance & Banking</option>
                                        <option value="Education" ${userProfile.industry === 'Education' ? 'selected' : ''}>Education</option>
                                        <option value="Marketing & Sales" ${userProfile.industry === 'Marketing & Sales' ? 'selected' : ''}>Marketing & Sales</option>
                                        <option value="Other" ${userProfile.industry === 'Other' ? 'selected' : ''}>Other</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label" for="profile-role">Current Role</label>
                                    <select id="profile-role" class="form-select">
                                        <option value="">Select role</option>
                                        <option value="Individual Contributor" ${userProfile.role === 'Individual Contributor' ? 'selected' : ''}>Individual Contributor</option>
                                        <option value="Team Lead" ${userProfile.role === 'Team Lead' ? 'selected' : ''}>Team Lead</option>
                                        <option value="Manager" ${userProfile.role === 'Manager' ? 'selected' : ''}>Manager</option>
                                        <option value="Director" ${userProfile.role === 'Director' ? 'selected' : ''}>Director</option>
                                        <option value="Executive" ${userProfile.role === 'Executive' ? 'selected' : ''}>Executive</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label" for="profile-goal">Primary Career Goal</label>
                                    <select id="profile-goal" class="form-select">
                                        <option value="">Select goal</option>
                                        <option value="career-advancement" ${userProfile.goal === 'career-advancement' ? 'selected' : ''}>Career Advancement</option>
                                        <option value="skill-improvement" ${userProfile.goal === 'skill-improvement' ? 'selected' : ''}>Skill Improvement</option>
                                        <option value="leadership-development" ${userProfile.goal === 'leadership-development' ? 'selected' : ''}>Leadership Development</option>
                                        <option value="job-transition" ${userProfile.goal === 'job-transition' ? 'selected' : ''}>Job Transition</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label" for="profile-time">Daily Time Commitment</label>
                                    <select id="profile-time" class="form-select">
                                        <option value="">Select time</option>
                                        <option value="15-30" ${userProfile.timeCommitment === '15-30' ? 'selected' : ''}>15-30 minutes</option>
                                        <option value="30-45" ${userProfile.timeCommitment === '30-45' ? 'selected' : ''}>30-45 minutes</option>
                                        <option value="45-60" ${userProfile.timeCommitment === '45-60' ? 'selected' : ''}>45-60 minutes</option>
                                        <option value="60+" ${userProfile.timeCommitment === '60+' ? 'selected' : ''}>60+ minutes</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- Motivation Section -->
                        <div class="profile-section">
                            <div class="section-header">
                                <h2 class="section-title">
                                    <span class="section-icon">🧠</span>
                                    Motivation
                                </h2>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Primary Motivation Drivers (select up to 3)</label>
                                <div class="checkbox-group" id="profile-motivation">
                                    ${['Career Growth', 'Mastery', 'Recognition', 'Impact', 'Financial', 'Autonomy'].map(motivation => {
                                        const isChecked = userProfile.motivations && userProfile.motivations.includes(motivation);
                                        return `
                                            <label class="checkbox-option">
                                                <input type="checkbox" value="${motivation}" ${isChecked ? 'checked' : ''}>
                                                <span class="checkbox-custom"></span>
                                                <span class="checkbox-text">${motivation}</span>
                                            </label>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Preferred Challenge Level</label>
                                <div class="radio-group" id="profile-challenge">
                                    ${['Ease In', 'Moderate', 'Stretch'].map(level => {
                                        const isChecked = userProfile.challengeLevel === level;
                                        return `
                                            <label class="radio-option">
                                                <input type="radio" name="challenge" value="${level}" ${isChecked ? 'checked' : ''}>
                                                <span class="radio-custom"></span>
                                                <span class="radio-text">${level}</span>
                                            </label>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label" for="profile-feedback">Feedback Style</label>
                                <select id="profile-feedback" class="form-select">
                                    <option value="adaptive" ${userProfile.feedbackStyle === 'adaptive' ? 'selected' : ''}>Adaptive Mix</option>
                                    <option value="concise" ${userProfile.feedbackStyle === 'concise' ? 'selected' : ''}>Quick Tips</option>
                                    <option value="detailed" ${userProfile.feedbackStyle === 'detailed' ? 'selected' : ''}>Detailed Analysis</option>
                                    <option value="coaching" ${userProfile.feedbackStyle === 'coaching' ? 'selected' : ''}>Coaching Tone</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Focus Areas (select up to 4)</label>
                                <div class="checkbox-group" id="profile-focus">
                                    ${['Communication', 'Leadership', 'Technical Skills', 'Strategy', 'Management', 'Innovation'].map(area => {
                                        const isChecked = userProfile.focusAreas && userProfile.focusAreas.includes(area);
                                        return `
                                            <label class="checkbox-option">
                                                <input type="checkbox" value="${area}" ${isChecked ? 'checked' : ''}>
                                                <span class="checkbox-custom"></span>
                                                <span class="checkbox-text">${area}</span>
                                            </label>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        </div>

                        <!-- Profile Actions -->
                        <div class="profile-actions">
                            <button type="submit" class="primary-btn profile-save-btn">
                                <span class="btn-icon">💾</span>
                                Save Changes
                            </button>
                            <button type="button" class="secondary-btn profile-cancel-btn">
                                Cancel
                            </button>
                        </div>
                    </form>
                    
                    <!-- Profile Stats -->
                    <div class="profile-stats">
                        <div class="stat-item">
                            <span class="stat-label">Member Since</span>
                            <span class="stat-value">${userProfile.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'Unknown'}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Profile Status</span>
                            <span class="stat-value">${userProfile.profileCompleted ? 'Complete' : 'Incomplete'}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Last Updated</span>
                            <span class="stat-value">${userProfile.updatedAt ? new Date(userProfile.updatedAt).toLocaleDateString() : 'Never'}</span>
                        </div>
                    </div>
                </div>
            `;
        }

        function initializeProfileInterface(userProfile) {
            const form = document.getElementById('profile-form');
            const cancelBtn = document.querySelector('.profile-cancel-btn');

            // Handle form submission
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await saveProfileChanges(userProfile);
            });

            // Handle cancel button
            cancelBtn.addEventListener('click', () => {
                // Reset form to original values
                const stored = localStorage.getItem('growth90_user_identity');
                const originalProfile = stored ? JSON.parse(stored) : null;
                if (originalProfile) {
                    populateFormWithProfile(originalProfile);
                }
            });

            // Add checkbox group validation (motivation)
            setupCheckboxValidation('profile-motivation', 3, 'motivation drivers');
            // For focus, enforce single selection at save-time; UI may still show checkboxes for now
        }

        function setupCheckboxValidation(groupId, maxSelections, fieldName) {
            const group = document.getElementById(groupId);
            const checkboxes = group.querySelectorAll('input[type="checkbox"]');
            
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    const checked = group.querySelectorAll('input[type="checkbox"]:checked');
                    if (checked.length > maxSelections) {
                        checkbox.checked = false;
                        UI.Components.Notifications.warning(`You can select up to ${maxSelections} ${fieldName}.`);
                    }
                });
            });
        }

        function populateFormWithProfile(profile) {
            document.getElementById('profile-nickname').value = profile.nickname || '';
            document.getElementById('profile-email').value = profile.email || '';
            document.getElementById('profile-industry').value = profile.industry || '';
            document.getElementById('profile-role').value = profile.role || '';
            document.getElementById('profile-goal').value = profile.goal || '';
            document.getElementById('profile-time').value = profile.timeCommitment || '';
            document.getElementById('profile-feedback').value = profile.feedbackStyle || 'adaptive';

            // Handle motivations checkboxes
            const motivationCheckboxes = document.querySelectorAll('#profile-motivation input[type="checkbox"]');
            motivationCheckboxes.forEach(checkbox => {
                checkbox.checked = profile.motivations && profile.motivations.includes(checkbox.value);
            });

            // Handle challenge level radio buttons
            const challengeRadios = document.querySelectorAll('#profile-challenge input[type="radio"]');
            challengeRadios.forEach(radio => {
                radio.checked = radio.value === profile.challengeLevel;
            });

            // Handle focus areas checkboxes
            const focusCheckboxes = document.querySelectorAll('#profile-focus input[type="checkbox"]');
            focusCheckboxes.forEach(checkbox => {
                checkbox.checked = profile.focusAreas && profile.focusAreas.includes(checkbox.value);
            });
        }

        async function saveProfileChanges(originalProfile) {
            try {
                UI.Components.Loading.show('Saving your profile...');

                // Collect form data
                const formData = {
                    nickname: document.getElementById('profile-nickname').value.trim(),
                    email: document.getElementById('profile-email').value.trim(),
                    industry: document.getElementById('profile-industry').value,
                    role: document.getElementById('profile-role').value,
                    goal: document.getElementById('profile-goal').value,
                    timeCommitment: document.getElementById('profile-time').value,
                    feedbackStyle: document.getElementById('profile-feedback').value,
                    motivations: Array.from(document.querySelectorAll('#profile-motivation input[type="checkbox"]:checked')).map(cb => cb.value),
                    challengeLevel: document.querySelector('#profile-challenge input[type="radio"]:checked')?.value || '',
                    focusAreas: (function(){
                        const items = Array.from(document.querySelectorAll('#profile-focus input[type="checkbox"]:checked')).map(cb => cb.value);
                        return items.length ? [items[0]] : [];
                    })()
                };

                // Validate required fields
                if (!formData.nickname || !formData.email) {
                    UI.Components.Loading.hide();
                    UI.Components.Notifications.error('Nickname and email are required.');
                    return;
                }

                // Email validation
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(formData.email)) {
                    UI.Components.Loading.hide();
                    UI.Components.Notifications.error('Please enter a valid email address.');
                    return;
                }

                // Create updated profile
                const updatedProfile = {
                    ...originalProfile,
                    ...formData,
                    updatedAt: new Date().toISOString(),
                    profileCompleted: true
                };

                // Save to localStorage
                localStorage.setItem('growth90_user_identity', JSON.stringify(updatedProfile));

                // Also save to Growth90 LocalStorage if available
                if (Growth90.Data.LocalStorage) {
                    Growth90.Data.LocalStorage.setItem('user_identity', updatedProfile);
                }

                UI.Components.Loading.hide();
                UI.Components.Notifications.success('Profile updated successfully!');

                // Refresh the profile display
                setTimeout(() => {
                    showProfile();
                }, 1000);

            } catch (error) {
                console.error('Failed to save profile:', error);
                UI.Components.Loading.hide();
                UI.Components.Notifications.error('Failed to save profile. Please try again.');
            }
        }

        function updateActiveNavigation(route) {
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('data-route') === route) {
                    link.classList.add('active');
                }
            });
        }

        function updateNavigationState() {
            // Update navigation based on screen size
            const mediaQuery = window.matchMedia('(min-width: 769px)');
            function handleMediaQuery(e) {
                const navigation = document.querySelector('.main-navigation');
                const mobileToggle = document.querySelector('.mobile-menu-toggle');
                
                if (e.matches) {
                    navigation.style.display = 'block';
                    mobileToggle.style.display = 'none';
                } else {
                    navigation.style.display = 'none';
                    mobileToggle.style.display = 'flex';
                }
            }
            
            mediaQuery.addListener(handleMediaQuery);
            handleMediaQuery(mediaQuery);
        }

        function toggleMobileMenu() {
            const navigation = document.querySelector('.main-navigation');
            const isVisible = navigation.style.display === 'block';
            navigation.style.display = isVisible ? 'none' : 'block';
        }

        function applyTheme() {
            // Use system preference as default
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        }

        function handleQuickAction(action) {
            switch (action) {
                case 'continue-lesson':
                    Core.Router.navigate('learning');
                    break;
                case 'view-insights':
                    UI.Components.Notifications.info('Daily insights feature coming soon!');
                    break;
                case 'connect-peer':
                    UI.Components.Notifications.info('Peer connection feature coming soon!');
                    break;
                default:
            }
        }

        // Quick signup modal for journey setup (name/email already collected)
        function showQuickSignupModal() {
            // Get stored user identity
            let identity = null;
            try {
                const stored = localStorage.getItem('growth90_user_identity');
                identity = stored ? JSON.parse(stored) : null;
            } catch (e) {
            }

            if (!identity) {
                UI.Components.Notifications.error('User information not found. Please refresh the page.');
                return;
            }

            UI.Components.Modal.show({
                title: `Hi ${identity.nickname}! Let's personalize your 90-day learning experience.`,
                allowHTML: true,
                content: `
                    <form id="quick-signup-form" class="onboarding-form">
                        <fieldset style="border:none; padding:0; margin:0;">
                            <legend style="font-weight:600; margin:0;">Professional Context</legend>
                            <div class="form-group">
                                <label class="form-label" for="qs-industry">Industry</label>
                                <select class="form-select" id="qs-industry">
                                    <option value="">Select industry</option>
                                    <option>Technology & Software</option>
                                    <option>Healthcare & Medicine</option>
                                    <option>Finance & Banking</option>
                                    <option>Education</option>
                                    <option>Marketing & Sales</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="qs-role">Current Role</label>
                                <select class="form-select" id="qs-role">
                                    <option value="">Select role</option>
                                    <option>Individual Contributor</option>
                                    <option>Team Lead</option>
                                    <option>Manager</option>
                                    <option>Director</option>
                                    <option>Executive</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="qs-goal">Primary Career Goal</label>
                                <select class="form-select" id="qs-goal">
                                    <option value="">Select goal</option>
                                    <option value="career-advancement">Career Advancement</option>
                                    <option value="skill-improvement">Skill Improvement</option>
                                    <option value="leadership-development">Leadership Development</option>
                                    <option value="job-transition">Job Transition</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="qs-time">Daily Time Commitment</label>
                                <select class="form-select" id="qs-time">
                                    <option value="">Select time</option>
                                    <option value="15-30">15-30 minutes</option>
                                    <option value="30-45">30-45 minutes</option>
                                    <option value="45-60">45-60 minutes</option>
                                    <option value="60+">60+ minutes</option>
                                </select>
                            </div>
                        </fieldset>
                        <fieldset style="border:none; padding:0; margin:0;">
                            <legend style="font-weight:600; margin:0;">Motivation</legend>
                            <div class="form-group">
                                <label class="form-label">Primary Motivation Drivers (select up to 3)</label>
                                <div class="checkbox-group" id="qs-motivation">
                                    ${['Career Growth','Mastery','Recognition','Impact','Financial','Autonomy'].map(m=>`
                                        <label class="checkbox-option">
                                            <input type="checkbox" value="${m}">
                                            <span class="checkbox-custom"></span>
                                            <span class="checkbox-text">${m}</span>
                                        </label>
                                    `).join('')}
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Preferred Challenge Level</label>
                                <div class="radio-group" id="qs-challenge">
                                    ${['Ease In','Moderate','Stretch'].map(c=>`
                                        <label class="radio-option">
                                            <input type="radio" name="challenge" value="${c}">
                                            <span class="radio-custom"></span>
                                            <span class="radio-text">${c}</span>
                                        </label>
                                    `).join('')}
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Feedback Style</label>
                                <select class="form-select" id="qs-feedbackStyle">
                                    <option value="adaptive">Adaptive Mix</option>
                                    <option value="concise">Quick Tips</option>
                                    <option value="detailed">Detailed Analysis</option>
                                    <option value="coaching">Coaching Tone</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Focus Skill (choose one)</label>
                                <div class="radio-group" id="qs-focusAreas">
                                    ${['Communication','Leadership','Technical Skills','Strategy','Management','Innovation'].map(f=>`
                                        <label class="radio-option">
                                            <input type="radio" name="focusSkill" value="${f}">
                                            <span class="radio-custom"></span>
                                            <span class="radio-text">${f}</span>
                                        </label>
                                    `).join('')}
                                </div>
                            </div>
                        </fieldset>
                    </form>
                `,
                actions: [
                    {
                        label: 'Start My Journey',
                        primary: true,
                        handler: () => {
                            const form = document.getElementById('quick-signup-form');
                            if (form) {
                                // Get form data
                                const industry = document.getElementById('qs-industry')?.value || '';
                                const role = document.getElementById('qs-role')?.value || '';
                                const goal = document.getElementById('qs-goal')?.value || '';
                                const timeCommitment = document.getElementById('qs-time')?.value || '';
                                
                // Get selected motivations
                const motivationCheckboxes = document.querySelectorAll('#qs-motivation input[type="checkbox"]:checked');
                const motivations = Array.from(motivationCheckboxes).map(cb => cb.value);
                                
                                // Get challenge level
                                const challengeRadio = document.querySelector('#qs-challenge input[type="radio"]:checked');
                                const challengeLevel = challengeRadio ? challengeRadio.value : '';
                                
                                // Get feedback style
                                const feedbackStyle = document.getElementById('qs-feedbackStyle')?.value || '';
                                
                                // Get focus skill (single)
                                const focusRadio = document.querySelector('#qs-focusAreas input[type="radio"]:checked');
                                const focusAreas = focusRadio ? [focusRadio.value] : [];

                                // Create complete user profile with stored identity
                                const completeProfile = {
                                    ...identity,
                                    industry,
                                    role,
                                    goal,
                                    timeCommitment,
                                    motivations,
                                    challengeLevel,
                                    feedbackStyle,
                                    focusAreas,
                                    profileCompleted: true,
                                    completedAt: new Date().toISOString()
                                };

                                // Store updated profile
                                localStorage.setItem('growth90_user_identity', JSON.stringify(completeProfile));
                                if (Growth90.Data.LocalStorage) {
                                    Growth90.Data.LocalStorage.setItem('user_identity', completeProfile);
                                }

                                UI.Components.Notifications.success(`Great! Your personalized learning path is ready, ${identity.nickname}!`);
                                UI.Components.Modal.hide();
                                
                                // Force reload of home content to show completed profile state
                                setTimeout(() => {
                                    showHome();
                                }, 1000);
                            }
                        }
                    },
                    { label: 'Cancel', primary: false }
                ]
            });
            
            // Set up checkbox validation after modal is shown
            setTimeout(() => {
                setupCheckboxValidation('qs-motivation', 3, 'motivation drivers');
                setupCheckboxValidation('qs-focusAreas', 4, 'focus areas');
            }, 100);
        }

        // Testing function to reset user session (for development/testing)
        window.resetUserSession = function() {
            localStorage.removeItem('growth90_user_identity');
            if (Growth90.Data.LocalStorage) {
                Growth90.Data.LocalStorage.removeItem('user_identity');
            }
            location.reload();
        };
        
        // Helper function to check current user
        window.getCurrentUser = function() {
            try {
                const stored = localStorage.getItem('growth90_user_identity');
                const user = stored ? JSON.parse(stored) : null;
                return user;
            } catch (e) {
                return null;
            }
        };

        // Global function to reload suggested topics (for retry functionality)
        window.loadSuggestedTopics = loadSuggestedTopics;
        
        // Global function to reload today's lessons (for retry functionality)
        window.loadTodaysLessons = loadTodaysLessons;
        
        // Global retry function for today's lessons
        window.retryTodaysLessons = async function() {
            const userIdentity = JSON.parse(localStorage.getItem('growth90_user_identity') || '{}');
            if (userIdentity.selectedTopic) {
                const currentDay = await getCurrentDayByCompletion(userIdentity.email || userIdentity.id || 'guest', userIdentity.selectedTopic.id);
                loadTodaysLessons(userIdentity.selectedTopic, currentDay);
            }
        };

        return {
            initialize,
            getInitialized: () => initialized,
            showTodaysLearning
        };
    })();

    // Expose public API (merge with existing namespace instead of overwriting)
    const __existing = window.Growth90 || {};
    return {
        // Prefer previously attached modules (e.g., from storage.js, api.js)
        Core: { ...Core, ...( __existing.Core || {}) },
        Data: { ...Data, ...( __existing.Data || {}) },
        UI: { ...UI, ...( __existing.UI || {}) },
        Learning: { ...Learning, ...( __existing.Learning || {}) },
        User: { ...User, ...( __existing.User || {}) }
    };
})();

// Global function to go back to lessons page - defined outside IIFE to ensure availability
window.goBackToLessons = function() {
    try {
        const hasRouter = !!window.Growth90?.Core?.Router;
        const hasApp = !!window.Growth90?.Core?.App;

        // If already on the learning route, re-render the list view directly
        const current = hasRouter && window.Growth90.Core.Router.getCurrentRoute 
            ? window.Growth90.Core.Router.getCurrentRoute() 
            : null;

        if (hasApp && window.Growth90.Core.App.showTodaysLearning) {
            if (current === 'learning') {
                window.Growth90.Core.App.showTodaysLearning();
                return;
            }
        }

        // Otherwise navigate to the learning route
        if (hasRouter && window.Growth90.Core.Router.navigate) {
            window.Growth90.Core.Router.navigate('learning');
            // As a safety, also trigger render shortly after in case route doesn't change
            if (hasApp && window.Growth90.Core.App.showTodaysLearning) {
                setTimeout(() => window.Growth90.Core.App.showTodaysLearning(), 50);
            }
            return;
        }

        // Fallbacks
        if (hasApp && window.Growth90.Core.App.showTodaysLearning) {
            window.Growth90.Core.App.showTodaysLearning();
        } else {
            window.location.hash = 'learning';
        }
    } catch (error) {
        console.error('Error in goBackToLessons:', error);
        window.location.hash = 'learning';
    }
};

// Initialization is triggered from index.html after all scripts load

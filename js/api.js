/**
 * Growth90 API Integration Layer
 * Stateless API communication with context-rich requests
 */

(function(Growth90) {
    'use strict';

    // API Configuration
    const API_CONFIG = {
        baseURL: 'https://cmecp50gmck7l66evnyeuwawz.agent.a.smyth.ai',
        proxyURL: './api-proxy.php', // Use PHP proxy to avoid CORS
        timeout: 300000, // 5 minutes
        retryAttempts: 3,
        retryDelay: 1000,
        endpoints: {
            // User Management
            userProfile: {
                initialize: '/api/initialize_user_profile',
                update: '/api/update_user_preferences',
                dashboard: '/api/dashboard_summary'
            },
            // Learning Path Management
            learningPaths: {
                generate: '/api/generate_learning_path',
                update: '/api/update_progress_metrics',
                progress: '/api/update_progress_metrics'
            },
            // Content Delivery
            content: {
                dailyLesson: '/api/get_daily_lesson',
                supplementaryInsights: '/api/get_supplementary_insights',
                specializations: '/api/get_specializations',
                resources: '/api/get_supplementary_insights'
            },
            // Assessment System
            assessments: {
                generateQuestions: '/api/generate_assessment_questions',
                evaluateResponse: '/api/evaluate_learner_response',
                getResults: '/api/evaluate_learner_response'
            },
            // Interactive Learning
            chat: {
                contextualQuery: '/api/contextual_query',
                learningAssistant: '/api/learning_assistant'
            },
            // Progress Analytics
            progress: {
                updateMetrics: '/api/update_progress_metrics',
                getAnalytics: '/api/dashboard_summary',
                getSummary: '/api/dashboard_summary'
            }
        }
    };

    // Request context builder for stateless APIs
    function buildRequestContext(additionalContext = {}) {
        const userState = Growth90.Data.Models.AppState.getState();
        const userAgent = navigator.userAgent;
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const language = navigator.language || 'en-US';
        
        return {
            // User context
            user: {
                id: userState.user?.id,
                profile: userState.user ? {
                    firstName: userState.user.firstName,
                    lastName: userState.user.lastName,
                    industry: userState.user.industry,
                    currentRole: userState.user.currentRole,
                    experience: userState.user.experience,
                    learningStyles: userState.user.learningStyles,
                    dailyTimeCommitment: userState.user.dailyTimeCommitment,
                    primaryGoal: userState.user.primaryGoal,
                    timezone: userState.user.timezone || timezone
                } : null
            },
            
            // Session context
            session: {
                timestamp: new Date().toISOString(),
                timezone: timezone,
                language: language,
                userAgent: userAgent,
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                }
            },
            
            // Learning context
            learning: {
                currentPath: userState.currentLearningPath,
                dailyProgress: userState.dailyProgress,
                lastActivity: userState.lastActivity,
                competencyLevels: userState.competencyLevels
            },
            
            // Device context
            device: {
                type: getDeviceType(),
                online: navigator.onLine,
                connection: getConnectionInfo()
            },
            
            // Additional context
            ...additionalContext
        };
    }

    function getDeviceType() {
        const width = window.innerWidth;
        if (width < 768) return 'mobile';
        if (width < 1024) return 'tablet';
        return 'desktop';
    }

    function getConnectionInfo() {
        if ('connection' in navigator) {
            const conn = navigator.connection;
            return {
                effectiveType: conn.effectiveType,
                downlink: conn.downlink,
                rtt: conn.rtt,
                saveData: conn.saveData
            };
        }
        return null;
    }

    // Payload hash generation utility with deep stable serialization
    async function generatePayloadHash(payload) {
        try {
            // Create a deeply stable string representation
            const stableString = createStableString(payload);
            
            // Use Web Crypto API to generate SHA-256 hash
            const encoder = new TextEncoder();
            const data = encoder.encode(stableString);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            
            // Convert to hex string
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            
            return hashHex;
        } catch (error) {
            // Fallback to simple hash
            const str = createStableString(payload);
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32bit integer
            }
            return Math.abs(hash).toString(16);
        }
    }

    // Create a stable string representation that's consistent across identical data
    function createStableString(obj) {
        if (obj === null || obj === undefined) return 'null';
        if (typeof obj === 'string') return `"${obj}"`;
        if (typeof obj === 'number' || typeof obj === 'boolean') return obj.toString();
        
        if (Array.isArray(obj)) {
            return '[' + obj.map(createStableString).join(',') + ']';
        }
        
        if (typeof obj === 'object') {
            // Sort keys to ensure consistent ordering
            const sortedKeys = Object.keys(obj).sort();
            const pairs = sortedKeys.map(key => {
                // Skip undefined values and functions
                if (obj[key] === undefined || typeof obj[key] === 'function') {
                    return '';
                }
                return `"${key}":${createStableString(obj[key])}`;
            }).filter(Boolean);
            return '{' + pairs.join(',') + '}';
        }
        
        return obj.toString();
    }

    // Cache management utilities
    const ApiCache = {
        // Default cache durations in milliseconds
        CACHE_DURATIONS: {
            '/api/generate_learning_path': 7 * 24 * 60 * 60 * 1000, // 7 days - very stable
            '/api/get_daily_lesson': 24 * 60 * 60 * 1000, // 1 day - daily content
            '/api/dashboard_summary': 60 * 60 * 1000, // 1 hour - summary data
            '/api/get_supplementary_insights': 6 * 60 * 60 * 1000, // 6 hours - insights
            'default': 30 * 60 * 1000 // 30 minutes - default
        },

        async getCacheKey(endpoint, payload) {
            // Simple, bulletproof cache key generation for your exact payload
            const businessKey = this.extractBusinessKey(endpoint, payload);
            const hash = await generatePayloadHash(businessKey);
            const cacheKey = `api_cache_${endpoint.replace(/\//g, '_')}_${hash}`;
            return cacheKey;
        },

        extractBusinessKey(endpoint, payload) {
            const method = payload.method || 'GET';

            // Extract ONLY essential business data for /api/get_daily_lesson
            if (endpoint === '/api/get_daily_lesson' && payload.data) {
                const data = payload.data;
                const userContext = data.user_context || {};
                const profile = userContext.profile || {};
                const professionalContext = userContext.professional_context || {};
                
                // Create the most stable cache key possible using only business-critical data
                const businessKey = {
                    endpoint: endpoint,
                    method: payload.method || 'POST',
                    learning_objective: data.learning_objective,
                    day_number: data.day_number
                };

                // Add stable user profile data (prefer profile over professional_context)
                if (profile.industry || professionalContext.industry) {
                    businessKey.industry = profile.industry || professionalContext.industry;
                }
                if (profile.role || professionalContext.role) {
                    businessKey.role = profile.role || professionalContext.role;
                }
                if (profile.experience || professionalContext.experience) {
                    businessKey.experience = profile.experience || professionalContext.experience;
                }

                // Optional stable properties
                if (profile.focusAreas) {
                    businessKey.focusAreas = [...profile.focusAreas].sort();
                }
                if (profile.challengeLevel) {
                    businessKey.challengeLevel = profile.challengeLevel;
                }
                if (profile.timeCommitment) {
                    businessKey.timeCommitment = profile.timeCommitment;
                }
                if (profile.goal) {
                    businessKey.goal = profile.goal;
                }
                if (profile.feedbackStyle) {
                    businessKey.feedbackStyle = profile.feedbackStyle;
                }

                return businessKey;
            }

            // Learning path generation
            if (endpoint === '/api/generate_learning_path' && payload.data) {
                const d = payload.data;
                return {
                    endpoint,
                    method,
                    skill_domain: d.skill_domain,
                    user_profile: this.normalizeProfile(d.user_profile),
                    professional_context: this.normalizeProfessionalContext(d.professional_context),
                    learning_preferences: this.normalizeLearningPreferences(d.learning_preferences)
                };
            }

            // Supplementary insights
            if (endpoint === '/api/get_supplementary_insights' && payload.data) {
                const d = payload.data;
                return {
                    endpoint,
                    method,
                    topic: typeof d.topic === 'string' ? d.topic.trim() : d.topic,
                    industry_context: this.deepFilterDynamic(d.industry_context || {}),
                    user_profile: this.normalizeProfile(d.user_profile)
                };
            }

            // Assessment question generation
            if (endpoint === '/api/generate_assessment_questions' && payload.data) {
                const d = payload.data;
                return {
                    endpoint,
                    method,
                    learning_objectives: Array.isArray(d.learning_objectives) ? d.learning_objectives.slice() : d.learning_objectives,
                    difficulty_level: d.difficulty_level,
                    question_types: Array.isArray(d.question_types) ? d.question_types.slice() : d.question_types,
                    user_context: this.normalizeUserContext(d.user_context || {})
                };
            }

            // Assessment evaluation
            if (endpoint === '/api/evaluate_learner_response' && payload.data) {
                const d = payload.data;
                const questionKey = d.question?.id ?? this.deepFilterDynamic(d.question);
                return {
                    endpoint,
                    method,
                    question: questionKey,
                    learner_response: this.deepFilterDynamic(d.learner_response),
                    evaluation_criteria: this.deepFilterDynamic(d.evaluation_criteria),
                    user_context: this.normalizeUserContext(d.user_context || {})
                };
            }

            // Chat: contextual query
            if (endpoint === '/api/contextual_query' && payload.data) {
                const d = payload.data;
                return {
                    endpoint,
                    method,
                    query: typeof d.query === 'string' ? d.query.trim() : d.query,
                    learning_context: this.deepFilterDynamic(d.learning_context),
                    user_profile: this.normalizeProfile(d.user_profile),
                    current_lesson: this.deepFilterDynamic(d.current_lesson)
                };
            }

            // Chat: learning assistant
            if (endpoint === '/api/learning_assistant' && payload.data) {
                const d = payload.data;
                return {
                    endpoint,
                    method,
                    request: typeof d.request === 'string' ? d.request.trim() : d.request,
                    user_context: this.normalizeUserContext(d.user_context || {}),
                    learning_history: this.deepFilterDynamic(d.learning_history),
                    goals: Array.isArray(d.goals) ? [...d.goals].sort() : d.goals
                };
            }

            // Dashboard summary (GET)
            if (endpoint === '/api/dashboard_summary' && payload.params) {
                return {
                    endpoint,
                    method: 'GET',
                    user_id: payload.params.user_id
                };
            }

            // For other endpoints, use the enhanced method
            return this.createCachePayload(endpoint, payload);
        },

        createCachePayload(endpoint, payload) {
            // Extract ONLY the most essential business logic for cache key
            const cachePayload = {
                endpoint: endpoint,
                method: payload.method || 'GET'
            };

            // Only include the actual business data, not any metadata
            if (payload.data) {
                cachePayload.data = this.extractBusinessData(payload.data);
            }

            if (payload.params) {
                cachePayload.params = payload.params;
            }

            return cachePayload;
        },

        extractBusinessData(data) {
            // For get_daily_lesson specifically, only include these core business fields
            if (data.learning_objective !== undefined && data.user_context && data.day_number !== undefined) {
                return {
                    learning_objective: data.learning_objective,
                    user_context: this.normalizeUserContext(data.user_context),
                    day_number: data.day_number
                };
            }

            // For other endpoints, return the data filtered recursively to drop dynamic fields
            return this.deepFilterDynamic(data);
        },

        // Normalize standalone profile object used by several endpoints
        normalizeProfile(profile) {
            if (!profile || typeof profile !== 'object') return profile;
            return {
                industry: profile.industry,
                role: profile.role,
                experience: profile.experience,
                focusAreas: Array.isArray(profile.focusAreas) ? [...profile.focusAreas].sort() : undefined,
                challengeLevel: profile.challengeLevel,
                timeCommitment: profile.timeCommitment,
                goal: profile.goal,
                feedbackStyle: profile.feedbackStyle
            };
        },

        normalizeProfessionalContext(ctx) {
            if (!ctx || typeof ctx !== 'object') return ctx;
            return {
                industry: ctx.industry,
                role: ctx.role,
                experience: ctx.experience
            };
        },

        normalizeLearningPreferences(prefs) {
            if (!prefs || typeof prefs !== 'object') return prefs;
            const out = {};
            for (const [k, v] of Object.entries(prefs)) {
                if (!this.isDynamicField(k)) out[k] = v;
            }
            return out;
        },

        normalizeUserContext(userContext) {
            // Only keep stable user properties for cache key
            const normalized = {};
            
            if (userContext.profile) {
                normalized.profile = {
                    industry: userContext.profile.industry,
                    role: userContext.profile.role,
                    experience: userContext.profile.experience,
                    focusAreas: userContext.profile.focusAreas ? [...userContext.profile.focusAreas].sort() : undefined,
                    challengeLevel: userContext.profile.challengeLevel,
                    timeCommitment: userContext.profile.timeCommitment,
                    goal: userContext.profile.goal,
                    feedbackStyle: userContext.profile.feedbackStyle
                };
            }

            if (userContext.professional_context) {
                normalized.professional_context = {
                    industry: userContext.professional_context.industry,
                    role: userContext.professional_context.role,
                    experience: userContext.professional_context.experience
                };
            }

            return normalized;
        },

        isDynamicField(fieldName) {
            // List of field names that should not affect cache keys
            const dynamicFields = [
                'timestamp', 'time', 'created_at', 'updated_at', 'last_login',
                'session_id', 'request_id', 'user_agent', 'ip_address', 'device_id',
                'browser_version', 'screen_resolution', 'connection_speed', 'current_time',
                'random_value', 'viewport', 'device', 'session', 'metadata'
            ];
            
            const lowerField = fieldName.toLowerCase();
            return dynamicFields.some(dynamic => lowerField.includes(dynamic));
        },

        // Recursively remove dynamic/transient fields anywhere in the structure
        deepFilterDynamic(value) {
            if (Array.isArray(value)) {
                return value.map(v => this.deepFilterDynamic(v));
            }
            if (value && typeof value === 'object') {
                const out = {};
                for (const key of Object.keys(value)) {
                    if (this.isDynamicField(key)) continue;
                    const v = this.deepFilterDynamic(value[key]);
                    if (v !== undefined) out[key] = v;
                }
                return out;
            }
            return value;
        },

        async get(cacheKey) {
            try {
                // Ensure storage is initialized
                if (!Growth90.Data.Storage.isInitialized()) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
                const cached = await Growth90.Data.Storage.getItem('contentCache', cacheKey);
                
                if (cached) {
                    // Ensure we're comparing numbers properly
                    const now = Date.now();
                    const expiresAt = typeof cached.expiresAt === 'string' ? parseInt(cached.expiresAt) : cached.expiresAt;
                    const cachedAt = typeof cached.cachedAt === 'string' ? parseInt(cached.cachedAt) : cached.cachedAt;
                    
                    if (expiresAt && now < expiresAt) {
                        return cached.response;
                    } else {
                        // Clean up expired cache
                        await Growth90.Data.Storage.deleteItem('contentCache', cacheKey);
                    }
                }
                return null;
            } catch (error) {
                console.warn(`⚠️ Cache get error:`, error);
                return null;
            }
        },

        async set(cacheKey, response, endpoint) {
            try {
                // Ensure storage is initialized
                if (!Growth90.Data.Storage.isInitialized()) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
                const duration = this.CACHE_DURATIONS[endpoint] || this.CACHE_DURATIONS.default;
                const now = Date.now();
                const cacheEntry = {
                    id: cacheKey,
                    type: 'api_response',
                    endpoint: endpoint,
                    response: response,
                    cachedAt: now,
                    expiresAt: now + duration
                };
                
                await Growth90.Data.Storage.setItem('contentCache', cacheEntry);
                
                // Verify storage worked by immediately retrieving
                const verification = await Growth90.Data.Storage.getItem('contentCache', cacheKey);
                if (!verification) {
                    console.warn(`⚠️ Cache storage verification failed`);
                }
                
                return true;
            } catch (error) {
                console.error(`❌ Cache set error:`, error);
                return false;
            }
        },

        async cleanup() {
            try {
                const now = Date.now();
                const allCached = await Growth90.Data.Storage.queryItems('contentCache', {
                    index: 'type',
                    keyRange: IDBKeyRange.only('api_response')
                });

                let cleanedCount = 0;
                for (const entry of allCached) {
                    if (entry.expiresAt <= now) {
                        await Growth90.Data.Storage.deleteItem('contentCache', entry.id);
                        cleanedCount++;
                    }
                }

                if (cleanedCount > 0) {
                }
            } catch (error) {
            }
        }
    };

    // Attach API to Growth90 namespace immediately
    if (!Growth90.Data) Growth90.Data = {};
    Growth90.Data.API = (() => {
        let requestId = 0;

        async function makeRequest(endpoint, options = {}) {
            const currentRequestId = ++requestId;
            const {
                method = 'GET',
                data = null,
                headers = {},
                params = null,
                timeout = API_CONFIG.timeout,
                retry = true,
                cache = true, // Enable caching by default for expensive API calls
                skipCache = false // Option to bypass cache
            } = options;


            // Create payload for cache key generation (BEFORE adding dynamic headers)
            const rawPayload = {
                endpoint: endpoint,
                method: method,
                ...(data && { data: data }),
                ...(params && { params: params })
            };
            
            // Check cache first (for all cacheable requests, not just GET)
            let cacheKey = null;
            if (cache && !skipCache) {
                try {
                    cacheKey = await ApiCache.getCacheKey(endpoint, rawPayload);
                    const cachedResponse = await ApiCache.get(cacheKey);
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                } catch (cacheError) {
                    console.warn(`⚠️ Cache check failed for ${endpoint}:`, cacheError);
                    // Continue with API request if cache fails
                }
            }

            // Prepare request for PHP proxy
            const proxyPayload = {
                endpoint: endpoint,
                method: method,
                headers: {
                    'X-Request-ID': currentRequestId.toString(),
                    'X-Timestamp': new Date().toISOString(),
                    ...headers
                }
            };

            // Add data for non-GET requests
            if (data && method !== 'GET') {
                proxyPayload.data = data;
            }

            // Add query params for GET requests
            if (method === 'GET' && params && typeof params === 'object') {
                proxyPayload.params = params;
            }

            // Build timeout-capable signal with fallback when AbortSignal.timeout is unavailable
            function buildTimeoutSignal(ms) {
                try {
                    if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
                        return { signal: AbortSignal.timeout(ms), cancel: null };
                    }
                } catch (_) {}
                const controller = new AbortController();
                const timer = setTimeout(() => { try { controller.abort(); } catch(_){} }, ms);
                return { signal: controller.signal, cancel: () => clearTimeout(timer) };
            }

            const requestOptions = {
                method: 'POST', // Always POST to proxy
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(proxyPayload)
            };

            let lastError;
            const maxAttempts = retry ? API_CONFIG.retryAttempts : 1;

            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                try {
                    const { signal, cancel } = buildTimeoutSignal(timeout);
                    requestOptions.signal = signal;
                    
                    const response = await fetch(API_CONFIG.proxyURL, requestOptions);
                    if (cancel) cancel();
                    const responseData = await handleProxyResponse(response, currentRequestId);

                    // Cache successful responses (all methods, not just GET)
                    // Use HTTP status code instead of response data structure for reliability
                    const isSuccessStatus = response.status >= 200 && response.status < 300;
                    
                    if (cache && isSuccessStatus && cacheKey) {
                        try {
                            await ApiCache.set(cacheKey, responseData, endpoint);
                        } catch (cacheError) {
                            console.warn(`⚠️ Failed to cache response for ${endpoint}:`, cacheError);
                            // Don't fail the request if caching fails
                        }
                    }

                    return responseData;

                } catch (error) {
                    lastError = error;

                    // Don't retry on certain error types
                    if (error.name === 'AbortError' || 
                        error.status === 401 || 
                        error.status === 403 || 
                        error.status === 422 ||
                        error.status === 429) { // Rate limit
                        break;
                    }

                    // Wait before retrying (exponential backoff)
                    if (attempt < maxAttempts) {
                        const delay = API_CONFIG.retryDelay * Math.pow(2, attempt - 1);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }

            console.error(`❌ API Failed [${currentRequestId}]: ${method} ${endpoint}`, lastError);
            throw lastError;
        }

        async function handleProxyResponse(response, requestId) {
            const contentType = response.headers.get('content-type');
            
            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                let errorDetails = null;

                try {
                    if (contentType && contentType.includes('application/json')) {
                        errorDetails = await response.json();
                        errorMessage = errorDetails.error || errorDetails.message || errorMessage;
                    } else {
                        errorDetails = await response.text();
                    }
                } catch (parseError) {
                }

                const error = new Error(errorMessage);
                error.status = response.status;
                error.details = errorDetails;
                error.requestId = requestId;
                throw error;
            }

            if (contentType && contentType.includes('application/json')) {
                const result = await response.json();
                
                // Handle proxy response format
                if (result.success === false) {
                    const error = new Error(result.error || 'API request failed');
                    error.details = result;
                    error.requestId = requestId;
                    throw error;
                }
                
                // Return the full proxy response (which includes success property for caching)
                return result;
            }
            
            return await response.text();
        }

        // API endpoint methods
        const userAPI = {
            async initializeProfile(userInfo, professionalData, learningPreferences, goals) {
                return await makeRequest(API_CONFIG.endpoints.userProfile.initialize, {
                    method: 'POST',
                    data: {
                        user_info: userInfo,
                        professional_data: professionalData,
                        learning_preferences: learningPreferences,
                        goals: goals
                    }
                });
            },

            async updatePreferences(userId, preferenceUpdates, contextChanges) {
                return await makeRequest(API_CONFIG.endpoints.userProfile.update, {
                    method: 'POST',
                    data: {
                        user_id: userId,
                        preference_updates: preferenceUpdates,
                        context_changes: contextChanges
                    }
                });
            },

            async getDashboardSummary(userId) {
                return await makeRequest(API_CONFIG.endpoints.userProfile.dashboard, {
                    method: 'GET',
                    params: { user_id: userId },
                    cache: true
                });
            }
        };

        const learningPathAPI = {
            async generatePath(userProfile, professionalContext, learningPreferences, skillDomain) {
                // Handle special case for topic suggestions
                if (skillDomain === 'skill_suggestions') {
                    return await this.getTopicSuggestions(userProfile, professionalContext, learningPreferences);
                }
                
                return await makeRequest(API_CONFIG.endpoints.learningPaths.generate, {
                    method: 'POST',
                    data: {
                        user_profile: userProfile,
                        skill_domain: skillDomain,
                        professional_context: professionalContext,
                        learning_preferences: learningPreferences
                    },
                    timeout: 600000
                });
            },

            async getTopicSuggestions(userProfile, professionalContext, learningPreferences) {
                try {
                    // Use the learning assistant endpoint to get personalized topic suggestions
                    const response = await makeRequest(API_CONFIG.endpoints.chat.learningAssistant, {
                        method: 'POST',
                        data: {
                            request: `Based on my professional profile, suggest 3-4 learning topics that would be most beneficial for my career growth. Focus on skills that are in demand in ${professionalContext.industry} industry for someone in a ${professionalContext.role} role with ${professionalContext.experience} experience level.`,
                            user_context: {
                                profile: userProfile,
                                professional_context: professionalContext,
                                learning_preferences: learningPreferences
                            },
                            learning_history: [],
                            goals: ["career_advancement", "skill_development", "professional_growth"]
                        }
                    });

                    if (response.success && response.data) {
                        // Parse the AI response to extract structured topic suggestions
                        const suggestions = this.parseTopicSuggestions(response.data.response, professionalContext);
                        return {
                            success: true,
                            data: {
                                suggested_topics: suggestions
                            }
                        };
                    }
                } catch (error) {
                }

                // Fallback to predefined suggestions
                return {
                    success: true,
                    data: {
                        suggested_topics: this.getDefaultTopicSuggestions(professionalContext)
                    }
                };
            },

            parseTopicSuggestions(aiResponse, professionalContext) {
                // Simple parsing logic - in a real implementation, this would be more sophisticated
                const suggestions = [];
                const lines = aiResponse.split('\n').filter(line => line.trim());
                
                lines.forEach((line, index) => {
                    if (line.includes('1.') || line.includes('2.') || line.includes('3.') || line.includes('4.')) {
                        const topic = line.replace(/^\d+\.\s*/, '').trim();
                        const topicData = this.extractTopicInfo(topic, professionalContext);
                        if (topicData) {
                            suggestions.push(topicData);
                        }
                    }
                });

                // If parsing failed, return default suggestions
                if (suggestions.length === 0) {
                    return this.getDefaultTopicSuggestions(professionalContext);
                }

                return suggestions;
            },

            extractTopicInfo(topicText, professionalContext) {
                const topicMap = {
                    'leadership': { id: 'leadership-skills', icon: '💼', level: 'Intermediate' },
                    'communication': { id: 'communication', icon: '🗣️', level: 'Beginner' },
                    'data': { id: 'data-analysis', icon: '📊', level: 'Intermediate' },
                    'project': { id: 'project-management', icon: '📋', level: 'Intermediate' },
                    'emotional': { id: 'emotional-intelligence', icon: '🧠', level: 'Beginner' },
                    'time': { id: 'time-management', icon: '⏰', level: 'Beginner' },
                    'marketing': { id: 'digital-marketing', icon: '📱', level: 'Intermediate' },
                    'sales': { id: 'sales-skills', icon: '🎯', level: 'Intermediate' },
                    'technical': { id: 'technical-skills', icon: '💻', level: 'Advanced' },
                    'finance': { id: 'financial-literacy', icon: '💰', level: 'Intermediate' }
                };

                const lowerTopic = topicText.toLowerCase();
                
                for (const [keyword, data] of Object.entries(topicMap)) {
                    if (lowerTopic.includes(keyword)) {
                        return {
                            id: data.id,
                            title: topicText.split(':')[0].trim(),
                            description: topicText.includes(':') ? topicText.split(':')[1].trim() : `Develop ${keyword} skills for professional growth`,
                            icon: data.icon,
                            duration: '90 days',
                            level: data.level
                        };
                    }
                }

                // Default mapping if no keyword matches
                return {
                    id: 'custom-' + topicText.replace(/\s+/g, '-').toLowerCase(),
                    title: topicText.split(':')[0].trim(),
                    description: topicText.includes(':') ? topicText.split(':')[1].trim() : 'Personalized learning topic',
                    icon: '📚',
                    duration: '90 days',
                    level: 'Intermediate'
                };
            },

            getDefaultTopicSuggestions(professionalContext) {
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
                        id: 'digital-marketing',
                        title: 'Digital Marketing',
                        description: 'Master modern marketing strategies and tools',
                        icon: '📱',
                        duration: '90 days',
                        level: 'Intermediate',
                        industries: ['marketing', 'retail', 'technology']
                    }
                ];

                // Filter topics based on industry and experience
                const industry = professionalContext.industry?.toLowerCase() || 'general';
                const filtered = allTopics.filter(topic => 
                    topic.industries.includes('all') || 
                    topic.industries.includes(industry)
                );

                // Return up to 3 most relevant topics
                return filtered.slice(0, 3);
            },

            async updateProgress(userId, progressData, competencyScores, engagementMetrics) {
                return await makeRequest(API_CONFIG.endpoints.learningPaths.progress, {
                    method: 'POST',
                    data: {
                        user_id: userId,
                        progress_data: progressData,
                        competency_scores: competencyScores,
                        engagement_metrics: engagementMetrics
                    }
                });
            }
        };

        const contentAPI = {
            async getDailyLesson(learningObjective, userContext, dayNumber) {
                return await makeRequest(API_CONFIG.endpoints.content.dailyLesson, {
                    method: 'POST',
                    data: {
                        learning_objective: learningObjective,
                        user_context: userContext,
                        day_number: dayNumber
                    },
                    cache: true
                });
            },

            async getSupplementaryInsights(topic, industryContext, userProfile) {
                return await makeRequest(API_CONFIG.endpoints.content.supplementaryInsights, {
                    method: 'POST',
                    data: {
                        topic: topic,
                        industry_context: industryContext,
                        user_profile: userProfile
                    },
                    cache: true
                });
            },

            async getSpecializations(domain, industryContext, userProfile) {
                return await makeRequest(API_CONFIG.endpoints.content.specializations, {
                    method: 'POST',
                    data: {
                        domain: domain,
                        industry_context: industryContext,
                        user_profile: userProfile
                    },
                    cache: true
                });
            },

            async getResources(query, filters = {}) {
                // No dedicated resources endpoint in spec; reuse insights with query as topic
                const user = Growth90.Data.Models.AppState.getState().user || {};
                const industry = filters.industry || user.industry || 'general';
                return await makeRequest(API_CONFIG.endpoints.content.supplementaryInsights, {
                    method: 'POST',
                    data: {
                        topic: query,
                        industry_context: { industry, ...filters },
                        user_profile: user
                    }
                });
            }
        };

        const assessmentAPI = {
            async generateQuestions(learningObjectives, difficultyLevel, questionTypes, userContext) {
                return await makeRequest(API_CONFIG.endpoints.assessments.generateQuestions, {
                    method: 'POST',
                    data: {
                        learning_objectives: learningObjectives,
                        difficulty_level: difficultyLevel,
                        question_types: questionTypes,
                        user_context: userContext
                    }
                });
            },

            async evaluateResponse(question, learnerResponse, evaluationCriteria, userContext) {
                return await makeRequest(API_CONFIG.endpoints.assessments.evaluateResponse, {
                    method: 'POST',
                    data: {
                        question: question,
                        learner_response: learnerResponse,
                        evaluation_criteria: evaluationCriteria,
                        user_context: userContext
                    }
                });
            },
            // No explicit results endpoint in spec
        };

        const chatAPI = {
            async askQuestion(query, learningContext, userProfile, currentLesson) {
                return await makeRequest(API_CONFIG.endpoints.chat.contextualQuery, {
                    method: 'POST',
                    data: {
                        query: query,
                        learning_context: learningContext,
                        user_profile: userProfile,
                        current_lesson: currentLesson
                    }
                });
            },

            async getLearningAssistance(request, userContext, learningHistory, goals) {
                return await makeRequest(API_CONFIG.endpoints.chat.learningAssistant, {
                    method: 'POST',
                    data: {
                        request: request,
                        user_context: userContext,
                        learning_history: learningHistory,
                        goals: goals
                    }
                });
            }
        };

        const progressAPI = {
            async updateMetrics(metricsData) {
                return await makeRequest(API_CONFIG.endpoints.progress.updateMetrics, {
                    method: 'POST',
                    data: metricsData
                });
            },

            async getAnalytics(timeRange = '30d') {
                return await makeRequest(API_CONFIG.endpoints.progress.getAnalytics, {
                    method: 'GET',
                    cache: true
                });
            },

            async getSummary(period = 'week') {
                return await makeRequest(API_CONFIG.endpoints.progress.getSummary, {
                    method: 'GET',
                    cache: true
                });
            }
        };

        // Connection monitoring
        function initializeConnectionMonitoring() {
            window.addEventListener('online', () => {
                Growth90.Core.EventBus.emit('api:connection:restored');
                syncOfflineData();
            });

            window.addEventListener('offline', () => {
                Growth90.Core.EventBus.emit('api:connection:lost');
            });

            // Monitor connection quality
            if ('connection' in navigator) {
                navigator.connection.addEventListener('change', () => {
                    const connection = navigator.connection;
                    Growth90.Core.EventBus.emit('api:connection:changed', {
                        effectiveType: connection.effectiveType,
                        downlink: connection.downlink,
                        rtt: connection.rtt
                    });
                });
            }
        }

        // Sync data when connection is restored
        async function syncOfflineData() {
            try {
                
                // Get pending sync data from storage
                const pendingProgress = await Growth90.Data.Storage.queryItems('analytics', {
                    index: 'event',
                    keyRange: IDBKeyRange.only('pending_sync')
                });

                for (const item of pendingProgress) {
                    try {
                        await progressAPI.updateMetrics(item.data);
                        await Growth90.Data.Storage.deleteItem('analytics', item.id);
                    } catch (error) {
                    }
                }

                Growth90.Core.EventBus.emit('api:sync:completed');
                
            } catch (error) {
                console.error('❌ Offline sync failed:', error);
                Growth90.Core.EventBus.emit('api:sync:failed', error);
            }
        }

        // Store data for offline sync
        async function storeForOfflineSync(type, data) {
            try {
                await Growth90.Data.Storage.setItem('analytics', {
                    id: Growth90.Core.Utils.generateId(),
                    event: 'pending_sync',
                    type: type,
                    data: data,
                    timestamp: new Date().toISOString(),
                    userId: Growth90.Data.Models.AppState.getState().user?.id
                });
            } catch (error) {
                console.error('❌ Failed to store for offline sync:', error);
            }
        }

        // Mock API responses for development/testing
        const mockResponses = {
            [API_CONFIG.endpoints.learningPaths.generate]: {
                id: 'mock_path_123',
                title: 'Your Personalized Learning Journey',
                description: 'A comprehensive 90-day program tailored to your goals',
                duration: 90,
                modules: [
                    {
                        id: 'foundation',
                        title: 'Foundation Skills',
                        lessons: [
                            { id: 'lesson_1', title: 'Communication Fundamentals' },
                            { id: 'lesson_2', title: 'Time Management' }
                        ]
                    }
                ],
                milestones: [
                    { day: 30, title: 'First Assessment' },
                    { day: 60, title: 'Mid-Program Review' },
                    { day: 90, title: 'Final Evaluation' }
                ]
            },
            [API_CONFIG.endpoints.content.dailyLesson]: {
                id: 'lesson_daily_1',
                title: 'Effective Communication in Professional Settings',
                content: 'Today we explore the fundamentals of professional communication...',
                exercises: [
                    {
                        type: 'reflection',
                        prompt: 'Think about a recent professional conversation...'
                    }
                ],
                estimatedTime: 25,
                objectives: [
                    'Understand key communication principles',
                    'Practice active listening techniques'
                ]
            },
            [API_CONFIG.endpoints.chat.learningAssistant]: {
                success: true,
                data: {
                    response: `Based on your professional profile, here are personalized learning topics:

1. Leadership Skills: Build confidence in leading teams and projects
2. Data Analysis: Improve analytical thinking and data interpretation  
3. Communication: Master professional communication and presentation skills
4. Project Management: Learn to plan, execute, and deliver projects effectively`
                }
            }
        };

        // Enable mock mode for development
        let mockMode = false;

        function enableMockMode() {
            mockMode = true;
        }

        function disableMockMode() {
            mockMode = false;
        }

        // Override makeRequest for mock mode
        const originalMakeRequest = makeRequest;
        
        // Important: Redefine makeRequest to ensure proxy usage
        makeRequest = async function(endpoint, options = {}) {
            if (mockMode && mockResponses[endpoint]) {
                await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
                return mockResponses[endpoint];
            }
            // Always use proxy for real API calls
            return originalMakeRequest(endpoint, options);
        };

        // Initialize API system
        function initialize() {
            initializeConnectionMonitoring();
            
            // Set up error handling
            if (Growth90.Core?.EventBus?.on) {
                Growth90.Core.EventBus.on('api:error', (error) => {
                    if (Growth90.UI?.Components?.Notifications?.error) {
                        Growth90.UI.Components.Notifications.error(`API Error: ${error.message}`);
                    }
                });
            }
            
            // Initialize cache cleanup
            initializeCacheManagement();
            
        }

        // Cache management initialization
        async function initializeCacheManagement() {
            // Run initial cleanup
            await ApiCache.cleanup();
            
            // Show cache statistics
            try {
                const allCached = await Growth90.Data.Storage.queryItems('contentCache', {
                    index: 'type',
                    keyRange: IDBKeyRange.only('api_response')
                });
            } catch (error) {
            }
            
            // Set up periodic cleanup (every hour)
            setInterval(() => {
                ApiCache.cleanup();
            }, 60 * 60 * 1000);
            
            // Clean up on page visibility change (when user returns)
            if (typeof document !== 'undefined') {
                document.addEventListener('visibilitychange', () => {
                    if (!document.hidden) {
                        ApiCache.cleanup();
                    }
                });
            }
            
        }

        // Public API
        return {
            // Core request method
            request: makeRequest,
            
            // Domain-specific APIs
            user: userAPI,
            learningPath: learningPathAPI,
            content: contentAPI,
            assessment: assessmentAPI,
            chat: chatAPI,
            progress: progressAPI,
            
            // Utility methods
            initialize,
            enableMockMode,
            disableMockMode,
            storeForOfflineSync,
            
            // Cache management
            cache: {
                cleanup: () => ApiCache.cleanup(),
                getCacheKey: (endpoint, payload) => ApiCache.getCacheKey(endpoint, payload),
                extractBusinessKey: (endpoint, payload) => ApiCache.extractBusinessKey(endpoint, payload),
                get: (cacheKey) => ApiCache.get(cacheKey),
                set: (cacheKey, response, endpoint) => ApiCache.set(cacheKey, response, endpoint),
                clear: async () => {
                    try {
                        const allCached = await Growth90.Data.Storage.queryItems('contentCache', {
                            index: 'type',
                            keyRange: IDBKeyRange.only('api_response')
                        });
                        
                        let clearedCount = 0;
                        for (const entry of allCached) {
                            await Growth90.Data.Storage.deleteItem('contentCache', entry.id);
                            clearedCount++;
                        }
                        
                        return clearedCount;
                    } catch (error) {
                        return 0;
                    }
                },
                stats: async () => {
                    try {
                        const allCached = await Growth90.Data.Storage.queryItems('contentCache', {
                            index: 'type',
                            keyRange: IDBKeyRange.only('api_response')
                        });
                        
                        const now = Date.now();
                        const stats = {
                            total: allCached.length,
                            expired: 0,
                            valid: 0,
                            totalSize: 0,
                            endpoints: {}
                        };
                        
                        allCached.forEach(entry => {
                            const size = JSON.stringify(entry.response).length;
                            stats.totalSize += size;
                            
                            if (entry.expiresAt <= now) {
                                stats.expired++;
                            } else {
                                stats.valid++;
                            }
                            
                            if (!stats.endpoints[entry.endpoint]) {
                                stats.endpoints[entry.endpoint] = { count: 0, size: 0 };
                            }
                            stats.endpoints[entry.endpoint].count++;
                            stats.endpoints[entry.endpoint].size += size;
                        });
                        
                        return stats;
                    } catch (error) {
                        return null;
                    }
                },
                debug: async () => {
                    
                    // Test 1: Basic cache operations
                    const testKey = 'test_cache_key_123';
                    const testData = { test: true, timestamp: Date.now() };
                    
                    
                    // Store test data
                    const stored = await ApiCache.set(testKey, testData, '/api/test');
                    
                    // Retrieve test data
                    const retrieved = await ApiCache.get(testKey);
                    
                    // Test 2: Full cache key generation
                    const testPayload = {
                        endpoint: '/api/get_daily_lesson',
                        method: 'POST',
                        data: {
                            learning_objective: 'Test objective',
                            user_context: { test: true },
                            day_number: 1
                        }
                    };
                    
                    const cacheKey1 = await ApiCache.getCacheKey('/api/get_daily_lesson', testPayload);
                    const cacheKey2 = await ApiCache.getCacheKey('/api/get_daily_lesson', testPayload);
                    
                    return {
                        basicCache: { stored, retrieved },
                        keyGeneration: { key1: cacheKey1, key2: cacheKey2, consistent: cacheKey1 === cacheKey2 }
                    };
                },
                test: async (endpoint = '/api/get_daily_lesson') => {
                    const testPayload = {
                        learning_objective: "Set up Python and analytics workspace",
                        user_context: { 
                            profile: { nickname: "TestUser" },
                            professional_context: { industry: "Technology" }
                        },
                        day_number: 1
                    };
                    
                    
                    // First call - should miss cache
                    console.time('First call (cache miss)');
                    try {
                        const response1 = await makeRequest(endpoint, {
                            method: 'POST',
                            data: testPayload,
                            cache: true
                        });
                        console.timeEnd('First call (cache miss)');
                        
                        // Wait a moment
                        await new Promise(resolve => setTimeout(resolve, 100));
                        
                        // Second call - should hit cache
                        console.time('Second call (cache hit)');
                        const response2 = await makeRequest(endpoint, {
                            method: 'POST',
                            data: testPayload,
                            cache: true
                        });
                        console.timeEnd('Second call (cache hit)');
                        
                        const isCached = JSON.stringify(response1) === JSON.stringify(response2);
                        return { response1, response2, cached: isCached };
                    } catch (error) {
                        console.error('Cache test failed:', error);
                        return { error: error.message };
                    }
                }
            },
            
            // Configuration
            config: API_CONFIG
        };
    })();

    // Initialize API system immediately
    Growth90.Data.API.initialize();
    
    // Also initialize when app starts for additional setup
    if (Growth90.Core?.EventBus?.on) {
        Growth90.Core.EventBus.on('app:initialized', () => {
            // Disable automatic mock mode - use proxy for real API calls
            // Uncomment below to enable mock mode manually for testing:
            // Growth90.Data.API.enableMockMode();
        });
    }

})(window.Growth90 = window.Growth90 || {
    Core: { EventBus: { on: () => {}, emit: () => {} } },
    Data: {}, UI: {}, Learning: {}, User: {}
});

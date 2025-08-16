/**
 * Growth90 Content Delivery System
 * Handles daily lessons, interactive content, and personalized learning experiences
 */

(function(Growth90) {
    'use strict';

    // Content delivery configuration
    const CONTENT_CONFIG = {
        contentTypes: {
            'lesson': { icon: '📚', color: 'var(--primary-blue)' },
            'exercise': { icon: '💪', color: 'var(--accent-teal)' },
            'reflection': { icon: '🤔', color: 'var(--primary-gold)' },
            'assessment': { icon: '✅', color: 'var(--success)' },
            'insight': { icon: '💡', color: 'var(--warning)' },
            'application': { icon: '🎯', color: 'var(--info)' }
        },
        difficultyLevels: {
            1: { label: 'Beginner', color: '#10B981' },
            2: { label: 'Developing', color: '#3B82F6' },
            3: { label: 'Intermediate', color: '#F59E0B' },
            4: { label: 'Advanced', color: '#EF4444' },
            5: { label: 'Expert', color: '#8B5CF6' }
        },
        estimatedTimeRanges: {
            'short': { min: 5, max: 15, label: '5-15 min' },
            'medium': { min: 15, max: 30, label: '15-30 min' },
            'long': { min: 30, max: 60, label: '30-60 min' },
            'extended': { min: 60, max: 120, label: '1-2 hours' }
        }
    };

    // Content Management System
    Growth90.Learning.ContentManager = (() => {
        let currentContent = null;
        let contentCache = new Map();
        let isInitialized = false;

        // Initialize content delivery system
        async function initialize() {
            
            try {
                // Set up content caching
                setupContentCaching();
                
                // Set up content personalization
                setupPersonalization();
                
                // Set up progress tracking
                setupProgressTracking();
                
                isInitialized = true;
                Growth90.Core.EventBus.emit('content:initialized');
                
                
            } catch (error) {
                console.error('❌ Failed to initialize content delivery:', error);
            }
        }

        // Get daily lesson content
        async function getDailyLesson(dayNumber, forceRefresh = false) {
            try {
                let activePath = Growth90.Learning.PathManager.getActiveLearningPath();
                if (!activePath) {
                    const allPaths = await Growth90.Data.Storage.getAllItems('learningPaths');
                    if (Array.isArray(allPaths) && allPaths.length) {
                        activePath = allPaths.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
                    }
                }
                if (!activePath) throw new Error('No active learning path found');

                // Check cache first
                const cacheKey = `daily_lesson_${activePath.id}_${dayNumber}`;
                if (!forceRefresh && contentCache.has(cacheKey)) {
                    return contentCache.get(cacheKey);
                }

                Growth90.UI.Components.Loading.show('Loading your daily lesson...');

                // If curriculum exists, map to content; otherwise fall back to API
                let dailyContent = null;
                if (Array.isArray(activePath.curriculum) && activePath.curriculum.length) {
                    const dayPlan = activePath.curriculum.find(d => d.day === Number(dayNumber));
                    if (dayPlan) {
                        dailyContent = mapCurriculumDayToContent(dayPlan, activePath);
                    }
                }
                if (!dailyContent) {
                    const preferences = Growth90.User.Preferences.getAllPreferences();
                    const userContext = getUserContext();
                    const learningObjective = activePath?.title || `Day ${dayNumber} lesson`;
                    dailyContent = await Growth90.Data.API.content.getDailyLesson(learningObjective, userContext, dayNumber);
                }

                // Enhance and personalize content
                const preferences = Growth90.User.Preferences.getAllPreferences();
                const userContext = getUserContext();
                const enhancedContent = enhanceContent(dailyContent, userContext, preferences);

                // Cache the content
                contentCache.set(cacheKey, enhancedContent);

                // Store in local storage for offline access
                await storeContentOffline(enhancedContent);

                Growth90.UI.Components.Loading.hide();
                currentContent = enhancedContent;

                Growth90.Core.EventBus.emit('content:loaded', enhancedContent);

                return enhancedContent;

            } catch (error) {
                console.error('❌ Failed to load daily lesson:', error);
                Growth90.UI.Components.Loading.hide();
                
                // Try to load offline content
                const offlineContent = await getOfflineContent(dayNumber);
                if (offlineContent) {
                    Growth90.UI.Components.Notifications.warning('Loaded offline content. Some features may be limited.');
                    return offlineContent;
                }
                
                Growth90.UI.Components.Notifications.error('Failed to load daily lesson. Please check your connection.');
                throw error;
            }
        }

        // Get supplementary insights
        async function getSupplementaryInsights(topic, context = {}) {
            try {
                const userProfile = Growth90.Data.Models.AppState.getState().user;
                const industry = userProfile?.industry || 'general';


                const insights = await Growth90.Data.API.content.getSupplementaryInsights(topic, industry, userProfile);
                const enhancedInsights = enhanceInsights(insights, context);

                Growth90.Core.EventBus.emit('insights:loaded', enhancedInsights);
                return enhancedInsights;

            } catch (error) {
                console.error('❌ Failed to load insights:', error);
                // Return cached insights if available
                return getCachedInsights(topic) || generateFallbackInsights(topic);
            }
        }

        // Get content resources
        async function getContentResources(query, filters = {}) {
            try {

                const resources = await Growth90.Data.API.content.getResources(query, filters);
                const categorizedResources = categorizeResources(resources);

                return categorizedResources;

            } catch (error) {
                console.error('❌ Failed to load resources:', error);
                return { articles: [], videos: [], tools: [], references: [] };
            }
        }

        // Enhance content with personalization
        function enhanceContent(content, userContext, preferences) {
            return {
                ...content,
                id: content.id || Growth90.Core.Utils.generateId(),
                enhancedAt: new Date().toISOString(),
                
                // Personalized metadata
                metadata: {
                    ...content.metadata,
                    personalizedFor: userContext.userId,
                    adaptations: getContentAdaptations(content, userContext, preferences),
                    estimatedTime: calculatePersonalizedTime(content, preferences),
                    difficulty: adaptDifficulty(content.difficulty, userContext, preferences)
                },
                
                // Enhanced content structure
                structure: enhanceContentStructure(content, preferences),
                
                // Interactive elements
                interactiveElements: generateInteractiveElements(content, preferences),
                
                // Personalized examples
                examples: personalizeExamples(content.examples, userContext),
                
                // Progress tracking
                progressTracking: setupContentProgressTracking(content)
            };
        }

        // Map a curriculum day object to a daily content structure
        function mapCurriculumDayToContent(dayPlan, activePath) {
            const title = dayPlan.primary_learning_objective || `Day ${dayPlan.day}`;
            const objectives = Array.isArray(dayPlan.supporting_concepts) ? dayPlan.supporting_concepts : [];
            const time = dayPlan.time_allocation || {};
            const minutes = (time.learn || 0) + (time.practice || 0) + (time.review || 0);
            const contentHtml = `
                <section>
                    <h2>Practical Application</h2>
                    <p>${dayPlan.practical_application || ''}</p>
                    ${dayPlan.assessment_criteria ? `<h3>Assessment Criteria</h3><p>${dayPlan.assessment_criteria}</p>` : ''}
                    ${dayPlan.extension_opportunities ? `<h3>Extensions</h3><p>${dayPlan.extension_opportunities}</p>` : ''}
                    ${dayPlan.prerequisites ? `<h3>Prerequisites</h3><p>${dayPlan.prerequisites}</p>` : ''}
                </section>
            `;
            return {
                id: `curriculum_day_${dayPlan.day}`,
                title,
                description: activePath.description || '',
                objectives,
                estimatedTime: minutes || 30,
                content: contentHtml,
                exercises: []
            };
        }

        // Get user context for personalization
        function getUserContext() {
            const userState = Growth90.Data.Models.AppState.getState();
            const user = userState.user || {};
            const progress = Growth90.Learning.PathManager.getDailyProgress();
            
            return {
                userId: user.id,
                industry: user.industry,
                role: user.currentRole,
                experience: user.experience,
                competencyLevels: user.competencyLevels || {},
                learningHistory: progress?.completedLessons || [],
                currentStreak: calculateLearningStreak(progress),
                preferredTime: user.preferredTime,
                timezone: user.timezone
            };
        }

        // Calculate personalized time estimate
        function calculatePersonalizedTime(content, preferences) {
            let baseTime = content.estimatedTime || 30;
            
            // Adjust based on learning pace preference
            const pace = preferences.learning?.pace || 3;
            const paceMultiplier = {
                1: 1.5,  // Very slow
                2: 1.2,  // Slow  
                3: 1.0,  // Moderate
                4: 0.8,  // Fast
                5: 0.6   // Very fast
            };
            
            baseTime *= paceMultiplier[pace];
            
            // Adjust based on content complexity preference
            const complexity = preferences.content?.complexity || 'intermediate';
            const complexityMultiplier = {
                'beginner': 0.8,
                'intermediate': 1.0,
                'advanced': 1.3,
                'expert': 1.5
            };
            
            baseTime *= complexityMultiplier[complexity];
            
            return Math.round(baseTime);
        }

        // Adapt content difficulty
        function adaptDifficulty(baseDifficulty, userContext, preferences) {
            const targetDifficulty = preferences.learning?.difficulty || 'adaptive';
            
            if (targetDifficulty === 'adaptive') {
                // Use user's competency levels to determine appropriate difficulty
                const relevantCompetencies = Object.values(userContext.competencyLevels || {});
                const avgCompetency = relevantCompetencies.length > 0 
                    ? relevantCompetencies.reduce((sum, comp) => sum + comp.current, 0) / relevantCompetencies.length
                    : 3;
                
                return Math.min(5, Math.max(1, Math.round(avgCompetency + 0.5)));
            }
            
            const difficultyMap = {
                'gradual': Math.max(1, baseDifficulty - 1),
                'moderate': baseDifficulty,
                'intensive': Math.min(5, baseDifficulty + 1)
            };
            
            return difficultyMap[targetDifficulty] || baseDifficulty;
        }

        // Enhance content structure based on preferences
        function enhanceContentStructure(content, preferences) {
            const learningStyles = preferences.learning?.styles || ['visual', 'reading'];
            const narrativeStyle = preferences.content?.narrative || 'case-study';
            
            return {
                format: determineOptimalFormat(learningStyles),
                narrative: adaptNarrativeStyle(content, narrativeStyle),
                sections: structureContentSections(content, learningStyles),
                navigation: createContentNavigation(content),
                summary: generateContentSummary(content)
            };
        }

        // Generate interactive elements
        function generateInteractiveElements(content, preferences) {
            const interactivityLevel = preferences.learning?.interactivity || 4;
            const elements = [];
            
            if (interactivityLevel >= 2) {
                elements.push({
                    type: 'knowledge-check',
                    position: 'mid-content',
                    content: generateKnowledgeCheck(content)
                });
            }
            
            if (interactivityLevel >= 3) {
                elements.push({
                    type: 'reflection-prompt',
                    position: 'end',
                    content: generateReflectionPrompt(content)
                });
            }
            
            if (interactivityLevel >= 4) {
                elements.push({
                    type: 'practical-exercise',
                    position: 'application',
                    content: generatePracticalExercise(content)
                });
            }
            
            if (interactivityLevel >= 5) {
                elements.push({
                    type: 'collaborative-activity',
                    position: 'extension',
                    content: generateCollaborativeActivity(content)
                });
            }
            
            return elements;
        }

        // Personalize examples
        function personalizeExamples(examples, userContext) {
            if (!examples || !userContext.industry) return examples;
            
            return examples.map(example => ({
                ...example,
                context: adaptExampleToIndustry(example, userContext.industry, userContext.role),
                relevance: calculateExampleRelevance(example, userContext)
            }));
        }

        // Store content for offline access
        async function storeContentOffline(content) {
            try {
                const offlineContent = {
                    id: `offline_${content.id}`,
                    type: 'daily-lesson',
                    content: content,
                    cachedAt: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
                };
                
                await Growth90.Data.Storage.setItem('contentCache', offlineContent);
                
            } catch (error) {
            }
        }

        // Get offline content
        async function getOfflineContent(dayNumber) {
            try {
                const activePath = Growth90.Learning.PathManager.getActiveLearningPath();
                if (!activePath) return null;
                
                const cacheItems = await Growth90.Data.Storage.queryItems('contentCache', {
                    index: 'type',
                    keyRange: IDBKeyRange.only('daily-lesson')
                });
                
                const relevantContent = cacheItems.find(item => 
                    item.content.dayNumber === dayNumber && 
                    item.content.pathId === activePath.id &&
                    new Date(item.expiresAt) > new Date()
                );
                
                return relevantContent ? relevantContent.content : null;
                
            } catch (error) {
                return null;
            }
        }

        // Content rendering system
        function renderContent(content, container) {
            if (!content || !container) return;
            
            // Clear container
            container.innerHTML = '';
            
            // Create content structure
            const contentElement = createContentElement(content);
            container.appendChild(contentElement);
            
            // Initialize interactive elements
            initializeInteractiveElements(contentElement, content);
            
            // Set up progress tracking
            setupContentProgressTracking(content);
            
            // Emit content rendered event
            Growth90.Core.EventBus.emit('content:rendered', { content, container });
        }

        // Create content element
        function createContentElement(content) {
            const article = document.createElement('article');
            article.className = 'learning-content';
            article.setAttribute('data-content-id', content.id);
            
            // Content header
            const header = createContentHeader(content);
            article.appendChild(header);
            
            // Content body
            const body = createContentBody(content);
            article.appendChild(body);
            
            // Interactive elements
            const interactives = createInteractiveSection(content);
            if (interactives) {
                article.appendChild(interactives);
            }
            
            // Content footer
            const footer = createContentFooter(content);
            article.appendChild(footer);
            
            return article;
        }

        // Create content header
        function createContentHeader(content) {
            const header = document.createElement('header');
            header.className = 'content-header';
            
            const typeInfo = CONTENT_CONFIG.contentTypes[content.type] || CONTENT_CONFIG.contentTypes.lesson;
            const difficultyInfo = CONTENT_CONFIG.difficultyLevels[content.metadata?.difficulty || 3];
            
            header.innerHTML = `
                <div class="content-meta">
                    <div class="content-type" style="color: ${typeInfo.color}">
                        <span class="type-icon">${typeInfo.icon}</span>
                        <span class="type-label">${content.type.charAt(0).toUpperCase() + content.type.slice(1)}</span>
                    </div>
                    <div class="content-difficulty" style="color: ${difficultyInfo.color}">
                        <span class="difficulty-label">${difficultyInfo.label}</span>
                    </div>
                    <div class="content-time">
                        <span class="time-icon">⏱️</span>
                        <span class="time-estimate">${content.metadata?.estimatedTime || 30} min</span>
                    </div>
                </div>
                
                <h1 class="content-title">${content.title}</h1>
                
                ${content.description ? `<p class="content-description">${content.description}</p>` : ''}
                
                <div class="content-objectives">
                    <h3>Learning Objectives</h3>
                    <ul>
                        ${(content.objectives || []).map(obj => `<li>${obj}</li>`).join('')}
                    </ul>
                </div>
            `;
            
            return header;
        }

        // Create content body
        function createContentBody(content) {
            const body = document.createElement('div');
            body.className = 'content-body';
            
            // Process content based on format
            if (content.content) {
                body.innerHTML = processContentHTML(content.content);
            }
            
            // Add examples
            if (content.examples && content.examples.length > 0) {
                const examplesSection = createExamplesSection(content.examples);
                body.appendChild(examplesSection);
            }
            
            return body;
        }

        // Process content HTML for safety and enhancement
        function processContentHTML(htmlContent) {
            // Create a temporary container to safely process HTML
            const temp = document.createElement('div');
            temp.innerHTML = htmlContent;
            
            // Enhance with interactive elements
            enhanceContentElements(temp);
            
            return temp.innerHTML;
        }

        // Setup content caching
        function setupContentCaching() {
            // Set up cache cleanup
            setInterval(cleanupCache, 60 * 60 * 1000); // Every hour
            
            // Listen for cache events
            Growth90.Core.EventBus.on('content:cache:clear', () => {
                contentCache.clear();
            });
        }

        // Periodically clean up expired or stale items from the in-memory cache
        function cleanupCache() {
            try {
                const now = new Date();
                for (const [key, value] of contentCache.entries()) {
                    const expiresAt = value?.metadata?.expiresAt ? new Date(value.metadata.expiresAt) : null;
                    if (expiresAt && expiresAt <= now) {
                        contentCache.delete(key);
                    }
                }
            } catch (e) {
                // Silently ignore cleanup errors
            }
        }

        // Setup personalization
        function setupPersonalization() {
            // Listen for preference changes that affect content
            Growth90.Core.EventBus.on('preference:changed', (change) => {
                if (change.category === 'learning' || change.category === 'content') {
                    // Clear cache to force re-personalization
                    contentCache.clear();
                }
            });
        }

        // Setup progress tracking
        function setupProgressTracking() {
            // Track content interaction events
            document.addEventListener('click', trackContentInteraction);
            document.addEventListener('scroll', Growth90.Core.Utils.throttle(trackScrollProgress, 1000));
            
            // Track time spent on content
            let contentStartTime = null;
            
            Growth90.Core.EventBus.on('content:rendered', () => {
                contentStartTime = Date.now();
            });
            
            Growth90.Core.EventBus.on('content:completed', () => {
                if (contentStartTime && currentContent) {
                    const timeSpent = Math.round((Date.now() - contentStartTime) / 1000 / 60); // minutes
                    recordContentCompletion(currentContent, timeSpent);
                }
            });
        }

        function trackScrollProgress() {
            // Basic stub to avoid reference errors; can be extended
            try {
                const scrolled = (window.scrollY || 0);
                const height = Math.max(document.body.scrollHeight - window.innerHeight, 1);
                const percent = Math.min(100, Math.round((scrolled / height) * 100));
                // Emit event if needed
                Growth90.Core.EventBus.emit('content:scroll', { percent });
            } catch (e) { /* ignore */ }
        }

        // Track content interaction
        function trackContentInteraction(event) {
            if (!currentContent) return;
            
            const target = event.target;
            const interactionType = getInteractionType(target);
            
            if (interactionType) {
                recordInteraction(currentContent.id, interactionType, target);
            }
        }

        // Record content completion
        async function recordContentCompletion(content, timeSpent) {
            try {
                const completionData = {
                    contentId: content.id,
                    userId: getUserContext().userId,
                    completedAt: new Date().toISOString(),
                    timeSpent: timeSpent,
                    type: content.type,
                    difficulty: content.metadata?.difficulty,
                    engagement: calculateEngagement(content, timeSpent)
                };
                
                // Update learning path progress
                await Growth90.Learning.PathManager.updateProgress({
                    lastContentCompleted: completionData
                });
                
                // Emit completion event
                Growth90.Core.EventBus.emit('lesson:completed', completionData);
                
                
            } catch (error) {
                console.error('❌ Failed to record content completion:', error);
            }
        }

        // Calculate engagement score
        function calculateEngagement(content, timeSpent) {
            const expectedTime = content.metadata?.estimatedTime || 30;
            const timeRatio = timeSpent / expectedTime;
            
            // Optimal engagement is spending 80-120% of expected time
            if (timeRatio >= 0.8 && timeRatio <= 1.2) {
                return 1.0; // Excellent engagement
            } else if (timeRatio >= 0.5 && timeRatio <= 1.5) {
                return 0.8; // Good engagement
            } else if (timeRatio >= 0.3 && timeRatio <= 2.0) {
                return 0.6; // Moderate engagement
            } else {
                return 0.3; // Low engagement
            }
        }

        // Public API
        return {
            initialize,
            getDailyLesson,
            getSupplementaryInsights,
            getContentResources,
            renderContent,
            getCurrentContent: () => currentContent,
            isInitialized: () => isInitialized
        };
    })();

    // Initialize when app starts
    Growth90.Core.EventBus.on('app:initialized', () => {
        Growth90.Learning.ContentManager.initialize();
    });

})(window.Growth90 = window.Growth90 || {
    Core: { EventBus: { on: () => {}, emit: () => {} } },
    Data: {}, UI: {}, Learning: {}, User: {}
});

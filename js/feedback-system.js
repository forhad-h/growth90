/**
 * Growth90 Intelligent Feedback System
 * AI-powered feedback generation with personalized insights and recommendations
 */

(function(Growth90) {
    'use strict';

    // Feedback system configuration
    const FEEDBACK_CONFIG = {
        feedbackTypes: {
            'immediate': { 
                icon: '⚡', 
                timing: 'real-time',
                priority: 'high',
                personalizedLevel: 0.8 
            },
            'reflection': { 
                icon: '💭', 
                timing: 'post-activity',
                priority: 'medium',
                personalizedLevel: 0.9 
            },
            'strategic': { 
                icon: '🎯', 
                timing: 'milestone',
                priority: 'high',
                personalizedLevel: 1.0 
            },
            'encouragement': { 
                icon: '🌟', 
                timing: 'adaptive',
                priority: 'medium',
                personalizedLevel: 0.7 
            },
            'corrective': { 
                icon: '🔧', 
                timing: 'immediate',
                priority: 'high',
                personalizedLevel: 0.9 
            }
        },
        insightCategories: {
            'strength-recognition': { 
                weight: 1.2, 
                impact: 'motivational',
                frequency: 'high' 
            },
            'growth-opportunity': { 
                weight: 1.5, 
                impact: 'developmental',
                frequency: 'moderate' 
            },
            'skill-connection': { 
                weight: 1.0, 
                impact: 'cognitive',
                frequency: 'high' 
            },
            'progress-celebration': { 
                weight: 0.8, 
                impact: 'motivational',
                frequency: 'adaptive' 
            },
            'challenge-support': { 
                weight: 1.3, 
                impact: 'supportive',
                frequency: 'as-needed' 
            }
        },
        personalizationFactors: {
            'learning-style': { weight: 1.2, adaptability: 'high' },
            'motivation-profile': { weight: 1.5, adaptability: 'high' },
            'competency-level': { weight: 1.3, adaptability: 'medium' },
            'progress-pattern': { weight: 1.1, adaptability: 'high' },
            'engagement-style': { weight: 1.0, adaptability: 'medium' },
            'feedback-preference': { weight: 1.4, adaptability: 'high' }
        }
    };

    // Intelligent Feedback System
    Growth90.Learning.FeedbackSystem = (() => {
        let feedbackHistory = [];
        let userFeedbackProfile = null;
        let adaptiveFeedbackModel = null;
        let isInitialized = false;

        // Initialize feedback system
        async function initialize() {
            
            
            try {
                // Load user feedback profile
                await loadUserFeedbackProfile();
                
                // Initialize adaptive model
                await initializeAdaptiveFeedbackModel();
                
                // Load feedback history
                await loadFeedbackHistory();
                
                // Set up event listeners
                setupFeedbackEventListeners();
                
                isInitialized = true;
                Growth90.Core.EventBus.emit('feedback-system:initialized');
                
                
                
            } catch (error) {
                console.error('Failed to initialize feedback system:', error);
            }
        }

        // Initialize adaptive feedback model (placeholder)
        async function initializeAdaptiveFeedbackModel() {
            adaptiveFeedbackModel = {
                version: '1.0',
                parameters: {
                    personalizationWeight: 1.0,
                    recencyBias: 0.7,
                    diversityFactor: 0.3
                }
            };
            return adaptiveFeedbackModel;
        }

        // Generate personalized feedback
        async function generateFeedback(context) {
            try {
                
                const {
                    trigger,
                    data,
                    userId,
                    competency,
                    activityType,
                    performanceMetrics
                } = context;

                // Analyze user context and performance
                const userContext = await analyzeUserContext(userId);
                const performanceAnalysis = analyzePerformance(data, performanceMetrics);
                const historicalPatterns = analyzeHistoricalPatterns(userId, competency);

                // Generate multi-dimensional feedback
                const feedbackBundle = await generateMultiDimensionalFeedback({
                    trigger,
                    userContext,
                    performanceAnalysis,
                    historicalPatterns,
                    competency,
                    activityType
                });

                // Personalize feedback delivery
                const personalizedFeedback = personalizeFeedbackDelivery(feedbackBundle, userContext);

                // Store feedback for learning
                await storeFeedbackInstance(personalizedFeedback, context);

                // Update adaptive model
                updateAdaptiveFeedbackModel(personalizedFeedback, userContext);

                return personalizedFeedback;

            } catch (error) {
                console.error('❌ Failed to generate feedback:', error);
                return generateFallbackFeedback(context);
            }
        }

        // Generate immediate post-assessment feedback
        async function generateAssessmentFeedback(assessmentResult) {
            try {

                const { scores, analysis, competencyProfile, userId } = assessmentResult;
                const userContext = await analyzeUserContext(userId);

                // Generate comprehensive feedback categories
                const feedbackCategories = {
                    strengths: await generateStrengthsFeedback(scores, userContext),
                    improvements: await generateImprovementFeedback(scores, analysis, userContext),
                    insights: await generateInsightsFeedback(competencyProfile, userContext),
                    recommendations: await generateRecommendationsFeedback(analysis, userContext),
                    motivation: await generateMotivationalFeedback(scores, userContext)
                };

                // Create structured feedback response
                const assessmentFeedback = {
                    id: Growth90.Core.Utils.generateId(),
                    type: 'assessment-feedback',
                    userId: userId,
                    assessmentId: assessmentResult.assessmentId,
                    generatedAt: new Date().toISOString(),
                    categories: feedbackCategories,
                    overall: await generateOverallFeedback(feedbackCategories, userContext),
                    actionPlan: await generateActionPlan(feedbackCategories, userContext),
                    nextSteps: await generateNextSteps(assessmentResult, userContext)
                };

                // Store and emit feedback
                await storeFeedbackInstance(assessmentFeedback, { trigger: 'assessment-completion' });
                Growth90.Core.EventBus.emit('feedback:assessment-generated', assessmentFeedback);

                return assessmentFeedback;

            } catch (error) {
                console.error('❌ Failed to generate assessment feedback:', error);
                return generateBasicAssessmentFeedback(assessmentResult);
            }
        }

        // Generate learning progress feedback
        async function generateProgressFeedback(progressData) {
            try {

                const { userId, milestoneReached, competencyUpdates, timeMetrics } = progressData;
                const userContext = await analyzeUserContext(userId);
                const progressPatterns = analyzeProgressPatterns(progressData, userContext);

                const progressFeedback = {
                    id: Growth90.Core.Utils.generateId(),
                    type: 'progress-feedback',
                    userId: userId,
                    generatedAt: new Date().toISOString(),
                    
                    // Milestone feedback
                    milestone: milestoneReached ? {
                        celebration: generateMilestoneCelebration(milestoneReached, userContext),
                        achievement: analyzeAchievementSignificance(milestoneReached, userContext),
                        reflection: generateMilestoneReflection(milestoneReached, progressPatterns)
                    } : null,

                    // Competency progress
                    competencies: generateCompetencyProgressFeedback(competencyUpdates, userContext),

                    // Learning velocity and patterns
                    patterns: {
                        velocity: analyzeLearningVelocity(timeMetrics, userContext),
                        consistency: analyzeLearningConsistency(progressData, userContext),
                        engagement: analyzeEngagementPatterns(progressData, userContext)
                    },

                    // Adaptive recommendations
                    adaptations: generateAdaptiveRecommendations(progressPatterns, userContext)
                };

                await storeFeedbackInstance(progressFeedback, { trigger: 'progress-update' });
                Growth90.Core.EventBus.emit('feedback:progress-generated', progressFeedback);

                return progressFeedback;

            } catch (error) {
                console.error('❌ Failed to generate progress feedback:', error);
                return null;
            }
        }

        // Generate real-time learning feedback
        async function generateLearningFeedback(learningContext) {
            try {
                const {
                    contentId,
                    userId,
                    interactionData,
                    comprehensionIndicators,
                    engagementMetrics
                } = learningContext;

                const userContext = await analyzeUserContext(userId);
                const realTimeAnalysis = analyzeRealTimePerformance(interactionData, comprehensionIndicators);

                const learningFeedback = {
                    id: Growth90.Core.Utils.generateId(),
                    type: 'learning-feedback',
                    timing: 'real-time',
                    userId: userId,
                    contentId: contentId,
                    generatedAt: new Date().toISOString(),

                    // Immediate comprehension feedback
                    comprehension: {
                        level: realTimeAnalysis.comprehensionLevel,
                        confidence: realTimeAnalysis.confidenceScore,
                        suggestions: generateComprehensionSuggestions(realTimeAnalysis, userContext)
                    },

                    // Engagement optimization
                    engagement: {
                        current: engagementMetrics.currentLevel,
                        optimal: engagementMetrics.optimalLevel,
                        adjustments: generateEngagementAdjustments(engagementMetrics, userContext)
                    },

                    // Learning strategy adaptations
                    adaptations: generateRealTimeAdaptations(realTimeAnalysis, userContext)
                };

                // Emit for immediate delivery
                Growth90.Core.EventBus.emit('feedback:learning-realtime', learningFeedback);

                return learningFeedback;

            } catch (error) {
                console.error('❌ Failed to generate learning feedback:', error);
                return null;
            }
        }

        // Analyze user context for personalization
        async function analyzeUserContext(userId) {
            try {
                const userState = Growth90.Data.Models.AppState.getState();
                const userProfile = userState.user;
                const preferences = Growth90.User.Preferences.getAllPreferences();
                const learningPath = Growth90.Learning.PathManager.getActiveLearningPath();
                const progressData = Growth90.Learning.PathManager.getDailyProgress();

                return {
                    profile: userProfile,
                    preferences: preferences,
                    learningStyle: preferences.learning?.styles || ['visual', 'reading'],
                    motivationProfile: analyzeMotivationProfile(userProfile, preferences),
                    competencyLevels: userProfile?.competencyLevels || {},
                    progressHistory: progressData,
                    feedbackPreferences: preferences.feedback || {},
                    contextualFactors: {
                        industry: userProfile?.industry,
                        role: userProfile?.currentRole,
                        experience: userProfile?.experience,
                        timeZone: preferences.interface?.timezone,
                        culturalContext: preferences.content?.cultural || 'global'
                    }
                };

            } catch (error) {
                console.error('Failed to analyze user context:', error);
                return getDefaultUserContext();
            }
        }

        // Generate strengths feedback
        async function generateStrengthsFeedback(scores, userContext) {
            const strengths = identifyKeyStrengths(scores);
            const feedback = [];

            for (const strength of strengths) {
                const personalizedMessage = await personalizeStrengthMessage(strength, userContext);
                const reinforcementStrategy = generateStrengthReinforcementStrategy(strength, userContext);
                const applicationOpportunities = identifyStrengthApplications(strength, userContext);

                feedback.push({
                    competency: strength.competency,
                    level: strength.level,
                    percentile: strength.percentile,
                    message: personalizedMessage,
                    reinforcement: reinforcementStrategy,
                    applications: applicationOpportunities,
                    evidenceBased: true
                });
            }

            return feedback;
        }

        // Generate improvement feedback
        async function generateImprovementFeedback(scores, analysis, userContext) {
            const developmentAreas = analysis.developmentAreas || [];
            const feedback = [];

            for (const area of developmentAreas) {
                const growthPotential = calculateGrowthPotential(area, userContext);
                const learningPath = generateImprovementPath(area, userContext);
                const supportResources = identifyDevelopmentResources(area, userContext);
                const timelineEstimate = estimateDevelopmentTimeline(area, userContext);

                const personalizedMessage = await personalizeImprovementMessage(area, userContext);

                feedback.push({
                    competency: area.skill,
                    currentLevel: area.level,
                    targetLevel: area.level + 1.5,
                    priority: area.priority,
                    message: personalizedMessage,
                    growthPotential: growthPotential,
                    learningPath: learningPath,
                    resources: supportResources,
                    timeline: timelineEstimate,
                    motivationalFrame: generateMotivationalFrame(area, userContext)
                });
            }

            return feedback;
        }

        // Generate insights feedback
        async function generateInsightsFeedback(competencyProfile, userContext) {
            const insights = [];

            // Pattern insights
            const patterns = analyzeCompetencyPatterns(competencyProfile);
            if (patterns.length > 0) {
                insights.push({
                    type: 'pattern-recognition',
                    title: 'Your Learning Patterns',
                    insight: generatePatternInsight(patterns, userContext),
                    implications: analyzePatternImplications(patterns, userContext),
                    actionable: true
                });
            }

            // Competency relationships
            const relationships = analyzeCompetencyRelationships(competencyProfile);
            if (relationships.length > 0) {
                insights.push({
                    type: 'skill-synergy',
                    title: 'Skill Synergies',
                    insight: generateSynergyInsight(relationships, userContext),
                    leverage: generateSynergyLeverageStrategy(relationships, userContext),
                    actionable: true
                });
            }

            // Industry-specific insights
            if (userContext.contextualFactors.industry) {
                const industryInsights = generateIndustrySpecificInsights(competencyProfile, userContext);
                insights.push(...industryInsights);
            }

            return insights;
        }

        // Generate motivational feedback
        async function generateMotivationalFeedback(scores, userContext) {
            const motivationProfile = userContext.motivationProfile;
            const achievements = identifyRecentAchievements(scores, userContext);
            
            return {
                celebration: generateAchievementCelebration(achievements, motivationProfile),
                progress: generateProgressMotivation(scores, userContext),
                future: generateFutureMotivation(scores, userContext),
                personalTouch: generatePersonalMotivationalMessage(userContext),
                culturalResonance: generateCulturallyResonantMessage(userContext)
            };
        }

        // Personalize feedback delivery
        function personalizeFeedbackDelivery(feedbackBundle, userContext) {
            const preferences = userContext.feedbackPreferences;
            const personalizedBundle = { ...feedbackBundle };

            // Adjust tone based on preferences
            personalizedBundle.tone = preferences.tone || 'encouraging';
            
            // Adjust detail level
            personalizedBundle.detailLevel = preferences.detailLevel || 'balanced';
            
            // Apply cultural adaptations
            personalizedBundle.cultural = applyCulturalAdaptations(feedbackBundle, userContext);
            
            // Add personalization metadata
            personalizedBundle.personalization = {
                adaptedFor: userContext.profile.id,
                adaptationFactors: Object.keys(FEEDBACK_CONFIG.personalizationFactors),
                confidenceLevel: calculatePersonalizationConfidence(userContext),
                generatedAt: new Date().toISOString()
            };

            return personalizedBundle;
        }

        // Store feedback instance for learning
        async function storeFeedbackInstance(feedback, context) {
            try {
                const feedbackRecord = {
                    ...feedback,
                    context: context,
                    storedAt: new Date().toISOString()
                };

                await Growth90.Data.Storage.setItem('feedbackHistory', feedbackRecord);
                feedbackHistory.push(feedbackRecord);

                // Update feedback analytics
                updateFeedbackAnalytics(feedbackRecord);


            } catch (error) {
                console.error('❌ Failed to store feedback:', error);
            }
        }

        // Load user feedback profile
        async function loadUserFeedbackProfile() {
            try {
                const userState = Growth90.Data.Models.AppState.getState();
                const userId = userState.user?.id;

                if (!userId) {
                    userFeedbackProfile = createDefaultFeedbackProfile();
                    return;
                }

                const profile = await Growth90.Data.Storage.getItem('userFeedbackProfile', userId);
                userFeedbackProfile = profile || createDefaultFeedbackProfile();


            } catch (error) {
                userFeedbackProfile = createDefaultFeedbackProfile();
            }
        }

        // Create default feedback profile
        function createDefaultFeedbackProfile() {
            return {
                id: Growth90.Core.Utils.generateId(),
                preferences: {
                    tone: 'encouraging',
                    detailLevel: 'balanced',
                    frequency: 'adaptive',
                    timing: 'immediate',
                    format: 'conversational'
                },
                responsiveness: {
                    feedbackEffectiveness: 0.7,
                    engagementWithFeedback: 0.8,
                    improvementAfterFeedback: 0.6
                },
                history: {
                    totalFeedbackReceived: 0,
                    averageRating: 0,
                    preferredCategories: []
                },
                adaptations: {
                    personalityFactors: 'growth-oriented',
                    learningStyleAlignment: 0.8,
                    motivationalResonance: 0.7
                }
            };
        }

        // Setup feedback event listeners
        function setupFeedbackEventListeners() {
            // Assessment completion feedback
            Growth90.Core.EventBus.on('assessment:completed', async (assessmentResult) => {
                const feedback = await generateAssessmentFeedback(assessmentResult);
                if (feedback) {
                    Growth90.Core.EventBus.emit('feedback:display', feedback);
                }
            });

            // Learning progress feedback
            Growth90.Core.EventBus.on('learning-progress:updated', async (progressData) => {
                const feedback = await generateProgressFeedback(progressData);
                if (feedback) {
                    Growth90.Core.EventBus.emit('feedback:display', feedback);
                }
            });

            // Lesson completion feedback
            Growth90.Core.EventBus.on('lesson:completed', async (lessonData) => {
                const learningContext = {
                    contentId: lessonData.contentId,
                    userId: lessonData.userId,
                    interactionData: lessonData.interactions || {},
                    comprehensionIndicators: lessonData.comprehension || {},
                    engagementMetrics: lessonData.engagement || {}
                };

                const feedback = await generateLearningFeedback(learningContext);
                if (feedback) {
                    Growth90.Core.EventBus.emit('feedback:display', feedback);
                }
            });

            // Milestone reached feedback
            Growth90.Core.EventBus.on('milestone:reached', async (milestoneData) => {
                const progressData = {
                    userId: milestoneData.userId,
                    milestoneReached: milestoneData,
                    competencyUpdates: milestoneData.competencyUpdates || {},
                    timeMetrics: milestoneData.timeMetrics || {}
                };

                const feedback = await generateProgressFeedback(progressData);
                if (feedback) {
                    Growth90.Core.EventBus.emit('feedback:display', feedback);
                }
            });
        }

        // Public API
        return {
            initialize,
            generateFeedback,
            generateAssessmentFeedback,
            generateProgressFeedback,
            generateLearningFeedback,
            getFeedbackHistory: () => feedbackHistory,
            getUserFeedbackProfile: () => userFeedbackProfile,
            isInitialized: () => isInitialized
        };
    })();

    // Initialize when app starts
    Growth90.Core.EventBus.on('app:initialized', () => {
        Growth90.Learning.FeedbackSystem.initialize();
    });

})(window.Growth90 = window.Growth90 || {
    Core: { EventBus: { on: () => {}, emit: () => {} } },
    Data: {}, UI: {}, Learning: {}, User: {}
});
        async function loadFeedbackHistory() {
            try {
                const items = await Growth90.Data.Storage.getAllItems('feedbackHistory');
                feedbackHistory = Array.isArray(items) ? items : [];
            } catch (e) {
                feedbackHistory = [];
            }
        }

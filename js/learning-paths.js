/**
 * Growth90 Learning Path Management System
 * Handles learning path generation, progress tracking, and content delivery
 */

(function(Growth90) {
    'use strict';

    // Learning path configuration and templates
    const LEARNING_PATH_CONFIG = {
        defaultDuration: 90, // days
        dailyTimeCommitments: {
            '15-30': { min: 15, max: 30, lessonsPerDay: 1 },
            '30-45': { min: 30, max: 45, lessonsPerDay: 1 },
            '45-60': { min: 45, max: 60, lessonsPerDay: 2 },
            '60-90': { min: 60, max: 90, lessonsPerDay: 2 },
            '90+': { min: 90, max: 120, lessonsPerDay: 3 }
        },
        difficultyProgression: {
            'gradual': { initial: 1, increment: 0.5, max: 4 },
            'moderate': { initial: 2, increment: 0.3, max: 4 },
            'intensive': { initial: 3, increment: 0.2, max: 5 },
            'adaptive': { initial: 2, increment: 'dynamic', max: 5 }
        },
        milestoneFrequency: {
            'weekly': 7,
            'biweekly': 14,
            'monthly': 30
        }
    };

    // Learning path templates by industry and role
    const LEARNING_TEMPLATES = {
        'Technology & Software': {
            'Individual Contributor': {
                focusAreas: ['technical-skills', 'problem-solving', 'communication', 'continuous-learning'],
                coreCompetencies: ['coding-proficiency', 'system-design', 'debugging', 'collaboration'],
                assessmentTypes: ['code-review', 'technical-challenges', 'peer-feedback']
            },
            'Team Lead': {
                focusAreas: ['leadership', 'technical-mentoring', 'project-management', 'team-building'],
                coreCompetencies: ['technical-leadership', 'mentoring', 'agile-methodologies', 'conflict-resolution'],
                assessmentTypes: ['leadership-scenarios', 'team-simulations', 'technical-decisions']
            },
            'Manager': {
                focusAreas: ['strategic-thinking', 'people-management', 'resource-planning', 'stakeholder-communication'],
                coreCompetencies: ['strategic-planning', 'performance-management', 'budget-planning', 'cross-team-coordination'],
                assessmentTypes: ['strategic-simulations', 'management-cases', 'stakeholder-scenarios']
            }
        },
        'Healthcare & Medicine': {
            'Individual Contributor': {
                focusAreas: ['patient-care', 'clinical-skills', 'medical-communication', 'evidence-based-practice'],
                coreCompetencies: ['clinical-assessment', 'patient-interaction', 'medical-documentation', 'safety-protocols'],
                assessmentTypes: ['patient-scenarios', 'clinical-cases', 'communication-assessment']
            },
            'Team Lead': {
                focusAreas: ['clinical-leadership', 'quality-improvement', 'staff-development', 'patient-outcomes'],
                coreCompetencies: ['clinical-supervision', 'quality-metrics', 'staff-training', 'process-improvement'],
                assessmentTypes: ['leadership-scenarios', 'quality-projects', 'team-coordination']
            }
        },
        'Finance & Banking': {
            'Individual Contributor': {
                focusAreas: ['financial-analysis', 'risk-assessment', 'regulatory-compliance', 'client-service'],
                coreCompetencies: ['financial-modeling', 'risk-management', 'compliance-knowledge', 'client-communication'],
                assessmentTypes: ['financial-cases', 'risk-scenarios', 'compliance-tests']
            },
            'Manager': {
                focusAreas: ['strategic-finance', 'team-leadership', 'regulatory-oversight', 'stakeholder-management'],
                coreCompetencies: ['strategic-planning', 'regulatory-compliance', 'team-management', 'stakeholder-communication'],
                assessmentTypes: ['strategic-simulations', 'regulatory-scenarios', 'leadership-cases']
            }
        }
    };

    // Learning Path Management System
    Growth90.Learning.PathManager = (() => {
        let activeLearningPath = null;
        let dailyProgress = {};
        let milestones = [];
        let isInitialized = false;

        // Initialize learning path system
        async function initialize() {
            
            try {
                // Load existing learning path
                await loadActiveLearningPath();
                
                // Load progress data
                await loadProgressData();
                
                // Set up progress monitoring
                setupProgressMonitoring();
                
                isInitialized = true;
                Growth90.Core.EventBus.emit('learning-paths:initialized');
                
                
            } catch (error) {
                console.error('❌ Failed to initialize learning path system:', error);
            }
        }

        // Generate personalized learning path
        async function generateLearningPath(userProfile, assessmentResults, preferences = {}) {
            try {
                Growth90.UI.Components.Loading.show('Creating your personalized learning journey...');

                // Prepare comprehensive context for API
                const context = {
                    userProfile: {
                        ...userProfile,
                        competencyLevels: calculateCompetencyLevels(assessmentResults),
                        learningProfile: createLearningProfile(userProfile, preferences)
                    },
                    assessmentResults: {
                        ...assessmentResults,
                        overallScore: calculateOverallScore(assessmentResults),
                        strengthAreas: identifyStrengths(assessmentResults),
                        developmentAreas: identifyDevelopmentAreas(assessmentResults)
                    },
                    preferences: {
                        ...preferences,
                        learningPath: getPathPreferences(preferences)
                    },
                    contextualFactors: {
                        industry: userProfile.industry,
                        role: userProfile.currentRole,
                        experience: userProfile.experience,
                        timeConstraints: userProfile.dailyTimeCommitment,
                        goals: userProfile.primaryGoal
                    }
                };

                // Build inputs per OpenAPI spec
                const userProfileInput = context.userProfile;
                const professionalContext = {
                    industry: userProfile.industry,
                    role: userProfile.currentRole,
                    experience: userProfile.experience,
                    timeConstraints: userProfile.dailyTimeCommitment,
                    goals: userProfile.primaryGoal
                };
                const learningPreferences = preferences || {};
                const skillDomain = userProfile.primaryGoal || 'professional-development';

                // Call API to generate learning path
                const generatedPath = await Growth90.Data.API.learningPath.generatePath(
                    userProfileInput,
                    professionalContext,
                    learningPreferences,
                    skillDomain
                );

                // Process and enhance the generated path
                const enhancedPath = enhanceLearningPath(generatedPath, context);

                // Save the learning path
                await saveLearningPath(enhancedPath);

                // Set as active path
                activeLearningPath = enhancedPath;

                // Initialize progress tracking
                await initializeProgressTracking(enhancedPath);

                Growth90.UI.Components.Loading.hide();
                Growth90.Core.EventBus.emit('learning-path:generated', enhancedPath);

                return enhancedPath;

            } catch (error) {
                console.error('❌ Failed to generate learning path:', error);
                Growth90.UI.Components.Loading.hide();
                Growth90.UI.Components.Notifications.error('Failed to generate learning path. Please try again.');
                throw error;
            }
        }

        // Calculate competency levels from assessment
        function calculateCompetencyLevels(assessmentResults) {
            const competencies = {};
            
            Object.entries(assessmentResults).forEach(([skill, data]) => {
                if (data.average) {
                    competencies[skill] = {
                        current: Math.round(data.average),
                        target: Math.min(5, Math.round(data.average) + 2),
                        confidence: calculateConfidence(data.scores)
                    };
                }
            });
            
            return competencies;
        }

        function calculateConfidence(scores) {
            if (!scores || scores.length === 0) return 0;
            const variance = scores.reduce((acc, score) => acc + Math.pow(score - (scores.reduce((a, b) => a + b) / scores.length), 2), 0) / scores.length;
            return Math.max(0, 1 - (variance / 4)); // Normalize to 0-1 range
        }

        // Create learning profile
        function createLearningProfile(userProfile, preferences) {
            return {
                preferredStyles: preferences.learningStyles || ['visual', 'reading'],
                pace: preferences.difficultyPreference || 'adaptive',
                interactivity: preferences.interactivityLevel || 4,
                timeAvailability: {
                    daily: userProfile.dailyTimeCommitment,
                    preferredTime: preferences.preferredTime,
                    flexibility: preferences.scheduleFlexibility || 'moderate'
                },
                motivationalFactors: preferences.motivationFactors || [],
                supportSystems: userProfile.supportSystems || []
            };
        }

        // Calculate overall assessment score
        function calculateOverallScore(assessmentResults) {
            const allScores = [];
            Object.values(assessmentResults).forEach(skillData => {
                if (skillData.scores) {
                    allScores.push(...skillData.scores);
                }
            });
            
            return allScores.length > 0 
                ? allScores.reduce((sum, score) => sum + score, 0) / allScores.length
                : 3; // Default to middle score
        }

        // Identify strength areas
        function identifyStrengths(assessmentResults) {
            return Object.entries(assessmentResults)
                .filter(([_, data]) => data.average && data.average >= 4)
                .map(([skill, data]) => ({
                    skill,
                    level: data.average,
                    confidence: calculateConfidence(data.scores)
                }))
                .sort((a, b) => b.level - a.level);
        }

        // Identify development areas
        function identifyDevelopmentAreas(assessmentResults) {
            return Object.entries(assessmentResults)
                .filter(([_, data]) => data.average && data.average <= 3)
                .map(([skill, data]) => ({
                    skill,
                    level: data.average,
                    priority: 4 - data.average, // Higher priority for lower scores
                    confidence: calculateConfidence(data.scores)
                }))
                .sort((a, b) => b.priority - a.priority);
        }

        // Get path-specific preferences
        function getPathPreferences(preferences) {
            return {
                structure: preferences.pathStructure || 'balanced',
                progression: preferences.difficultyPreference || 'adaptive',
                assessmentFrequency: preferences.assessmentFrequency || 'weekly',
                feedbackStyle: preferences.feedbackStyle || 'constructive',
                collaborationLevel: preferences.collaborationPreference || 'moderate'
            };
        }

        // Enhance generated learning path
        function enhanceLearningPath(generatedPath, context) {
            const enhanced = {
                ...generatedPath,
                id: generatedPath.id || Growth90.Core.Utils.generateId(),
                userId: context.userProfile.id,
                createdAt: new Date().toISOString(),
                
                // Add detailed metadata
                metadata: {
                    generationContext: context,
                    template: getApplicableTemplate(context),
                    customizations: [],
                    version: '1.0.0'
                },
                
                // Enhanced structure
                structure: enhancePathStructure(generatedPath, context),
                
                // Personalized milestones
                milestones: generateMilestones(generatedPath, context),
                
                // Progress tracking setup
                progressTracking: initializeProgressTrackingConfig(context),
                
                // Adaptive elements
                adaptiveElements: setupAdaptiveElements(context)
            };
            
            return enhanced;
        }

        // Get applicable learning template
        function getApplicableTemplate(context) {
            const industry = context.userProfile.industry;
            const role = context.userProfile.currentRole;
            
            if (LEARNING_TEMPLATES[industry] && LEARNING_TEMPLATES[industry][role]) {
                return LEARNING_TEMPLATES[industry][role];
            }
            
            // Fallback to generic template based on role
            return getGenericTemplate(role);
        }

        function getGenericTemplate(role) {
            const genericTemplates = {
                'Individual Contributor': {
                    focusAreas: ['skill-development', 'productivity', 'communication', 'professional-growth'],
                    coreCompetencies: ['core-skills', 'collaboration', 'problem-solving', 'adaptability'],
                    assessmentTypes: ['skill-assessments', 'practical-exercises', 'peer-feedback']
                },
                'Team Lead': {
                    focusAreas: ['leadership', 'team-management', 'communication', 'decision-making'],
                    coreCompetencies: ['team-leadership', 'delegation', 'performance-management', 'conflict-resolution'],
                    assessmentTypes: ['leadership-scenarios', 'team-simulations', 'feedback-sessions']
                },
                'Manager': {
                    focusAreas: ['strategic-thinking', 'people-management', 'business-operations', 'stakeholder-relations'],
                    coreCompetencies: ['strategic-planning', 'team-development', 'resource-management', 'communication'],
                    assessmentTypes: ['strategic-simulations', 'management-cases', 'stakeholder-exercises']
                }
            };
            
            return genericTemplates[role] || genericTemplates['Individual Contributor'];
        }

        // Enhance path structure
        function enhancePathStructure(path, context) {
            return {
                phases: generateLearningPhases(path, context),
                weekly_themes: generateWeeklyThemes(path, context),
                skill_progression: mapSkillProgression(path, context),
                checkpoint_schedule: generateCheckpointSchedule(path, context)
            };
        }

        // Generate learning phases
        function generateLearningPhases(path, context) {
            const totalDays = path.duration || 90;
            const phases = [
                {
                    name: 'Foundation Building',
                    duration: Math.floor(totalDays * 0.3),
                    focus: 'Core skill development and knowledge building',
                    objectives: ['Establish baseline competencies', 'Build fundamental understanding', 'Develop learning habits']
                },
                {
                    name: 'Skill Application',
                    duration: Math.floor(totalDays * 0.4),
                    focus: 'Practical application and integration',
                    objectives: ['Apply skills in realistic scenarios', 'Integrate multiple competencies', 'Build confidence']
                },
                {
                    name: 'Mastery & Integration',
                    duration: Math.floor(totalDays * 0.3),
                    focus: 'Advanced application and mastery',
                    objectives: ['Demonstrate mastery', 'Lead and teach others', 'Plan continued development']
                }
            ];
            
            return phases;
        }

        // Generate milestones
        function generateMilestones(path, context) {
            const milestones = [];
            const totalDays = path.duration || 90;
            const milestoneInterval = 14; // Every 2 weeks
            
            for (let day = milestoneInterval; day <= totalDays; day += milestoneInterval) {
                const milestone = {
                    id: Growth90.Core.Utils.generateId(),
                    day: day,
                    title: getMilestoneTitle(day, totalDays),
                    description: getMilestoneDescription(day, totalDays, context),
                    type: getMilestoneType(day, totalDays),
                    competencies: getMilestoneCompetencies(day, context),
                    assessments: getMilestoneAssessments(day, context),
                    completed: false
                };
                
                milestones.push(milestone);
            }
            
            return milestones;
        }

        function getMilestoneTitle(day, totalDays) {
            const progress = day / totalDays;
            
            if (progress <= 0.33) return `Foundation Checkpoint - Day ${day}`;
            if (progress <= 0.66) return `Application Milestone - Day ${day}`;
            return `Mastery Assessment - Day ${day}`;
        }

        function getMilestoneDescription(day, totalDays, context) {
            const progress = day / totalDays;
            const focusAreas = context.userProfile.competencyLevels ? 
                Object.keys(context.userProfile.competencyLevels).slice(0, 3).join(', ') :
                'core professional skills';
            
            if (progress <= 0.33) {
                return `Evaluate your foundational progress in ${focusAreas} and adjust your learning approach as needed.`;
            }
            if (progress <= 0.66) {
                return `Demonstrate practical application of ${focusAreas} through real-world scenarios and receive targeted feedback.`;
            }
            return `Showcase mastery of ${focusAreas} and develop your continued learning plan.`;
        }

        function getMilestoneType(day, totalDays) {
            const progress = day / totalDays;
            
            if (progress <= 0.33) return 'checkpoint';
            if (progress <= 0.66) return 'application';
            return 'mastery';
        }

        // Load active learning path
        async function loadActiveLearningPath() {
            try {
                const userState = Growth90.Data.Models.AppState.getState();
                const userId = userState.user?.id;
                
                if (!userId) return;
                
                const paths = await Growth90.Data.Storage.queryItems('learningPaths', {
                    index: 'userId',
                    keyRange: IDBKeyRange.only(userId)
                });
                
                const activePath = paths.find(path => path.status === 'active');
                if (activePath) {
                    activeLearningPath = activePath;
                }
                
            } catch (error) {
            }
        }

        // Save learning path
        async function saveLearningPath(learningPath) {
            try {
                await Growth90.Data.Storage.setItem('learningPaths', learningPath);
                
            } catch (error) {
                console.error('❌ Failed to save learning path:', error);
                throw error;
            }
        }

        // Initialize progress tracking
        async function initializeProgressTracking(learningPath) {
            try {
                const progressData = {
                    id: Growth90.Core.Utils.generateId(),
                    pathId: learningPath.id,
                    userId: learningPath.userId,
                    startDate: new Date().toISOString(),
                    currentDay: 1,
                    completedLessons: [],
                    milestoneProgress: {},
                    competencyProgress: {},
                    dailyMetrics: {},
                    overallProgress: 0
                };
                
                await Growth90.Data.Storage.setItem('learningProgress', progressData);
                dailyProgress = progressData;
                
                
            } catch (error) {
                console.error('❌ Failed to initialize progress tracking:', error);
            }
        }

        // Load progress data
        async function loadProgressData() {
            try {
                if (!activeLearningPath) return;
                
                const progressItems = await Growth90.Data.Storage.queryItems('learningProgress', {
                    index: 'pathId',
                    keyRange: IDBKeyRange.only(activeLearningPath.id)
                });
                
                if (progressItems.length > 0) {
                    dailyProgress = progressItems[0];
                }
                
            } catch (error) {
            }
        }

        // Update progress
        async function updateProgress(progressUpdate) {
            try {
                if (!dailyProgress.id) {
                    return;
                }
                
                // Merge progress update
                Object.assign(dailyProgress, progressUpdate);
                dailyProgress.lastUpdated = new Date().toISOString();
                
                // Recalculate overall progress
                dailyProgress.overallProgress = calculateOverallProgress();
                
                // Save updated progress
                await Growth90.Data.Storage.setItem('learningProgress', dailyProgress);
                
                // Emit progress update event
                Growth90.Core.EventBus.emit('learning-progress:updated', dailyProgress);
                
                // Update app state
                Growth90.Data.Models.AppState.setState({
                    dailyProgress: {
                        lessonsCompleted: dailyProgress.completedLessons.length,
                        totalLessons: getTotalLessons(),
                        timeInvested: getTotalTimeInvested(),
                        completionPercentage: Math.round(dailyProgress.overallProgress)
                    }
                });
                
                
            } catch (error) {
                console.error('❌ Failed to update progress:', error);
            }
        }

        // Calculate overall progress
        function calculateOverallProgress() {
            if (!activeLearningPath || !dailyProgress) return 0;
            
            const totalLessons = getTotalLessons();
            const completedLessons = dailyProgress.completedLessons.length;
            
            return totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
        }

        function getTotalLessons() {
            if (!activeLearningPath || !activeLearningPath.modules) return 0;
            
            return activeLearningPath.modules.reduce((total, module) => {
                return total + (module.lessons ? module.lessons.length : 0);
            }, 0);
        }

        function getTotalTimeInvested() {
            if (!dailyProgress.dailyMetrics) return 0;
            
            return Object.values(dailyProgress.dailyMetrics)
                .reduce((total, metrics) => total + (metrics.timeSpent || 0), 0);
        }

        // Setup progress monitoring
        function setupProgressMonitoring() {
            // Monitor daily activity
            setInterval(checkDailyActivity, 60000); // Check every minute
            
            // Monitor milestone progress
            Growth90.Core.EventBus.on('lesson:completed', handleLessonCompletion);
            Growth90.Core.EventBus.on('assessment:completed', handleAssessmentCompletion);
        }

        function checkDailyActivity() {
            const today = new Date().toISOString().split('T')[0];
            
            if (!dailyProgress.dailyMetrics[today]) {
                dailyProgress.dailyMetrics[today] = {
                    date: today,
                    timeSpent: 0,
                    lessonsCompleted: 0,
                    assessmentsCompleted: 0,
                    engagement: 0
                };
            }
        }

        function handleLessonCompletion(lessonData) {
            if (!dailyProgress.completedLessons.includes(lessonData.id)) {
                dailyProgress.completedLessons.push(lessonData.id);
                
                const today = new Date().toISOString().split('T')[0];
                if (dailyProgress.dailyMetrics[today]) {
                    dailyProgress.dailyMetrics[today].lessonsCompleted++;
                    dailyProgress.dailyMetrics[today].timeSpent += lessonData.timeSpent || 0;
                }
                
                updateProgress({});
            }
        }

        function handleAssessmentCompletion(assessmentData) {
            const today = new Date().toISOString().split('T')[0];
            if (dailyProgress.dailyMetrics[today]) {
                dailyProgress.dailyMetrics[today].assessmentsCompleted++;
            }
            
            updateProgress({});
        }

        // Public API
        return {
            initialize,
            generateLearningPath,
            updateProgress,
            getActiveLearningPath: () => activeLearningPath,
            getDailyProgress: () => dailyProgress,
            getMilestones: () => milestones,
            isInitialized: () => isInitialized
        };
    })();

    // Initialize when app starts
    Growth90.Core.EventBus.on('app:initialized', () => {
        Growth90.Learning.PathManager.initialize();
    });

})(window.Growth90 = window.Growth90 || {
    Core: { EventBus: { on: () => {}, emit: () => {} } },
    Data: {}, UI: {}, Learning: {}, User: {}
});

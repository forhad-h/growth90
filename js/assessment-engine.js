/**
 * Growth90 Advanced Assessment Engine
 * Sophisticated assessment system with adaptive questioning and multi-dimensional evaluation
 */

(function(Growth90) {
    'use strict';

    // Assessment engine configuration
    const ASSESSMENT_CONFIG = {
        questionTypes: {
            'rating': { icon: '📊', weight: 1.0, reliability: 0.8 },
            'multiple-choice': { icon: '✅', weight: 1.2, reliability: 0.9 },
            'scenario-response': { icon: '🎭', weight: 1.5, reliability: 0.95 },
            'behavioral-indicator': { icon: '🎯', weight: 1.3, reliability: 0.85 },
            'practical-demonstration': { icon: '💪', weight: 2.0, reliability: 0.98 },
            'peer-evaluation': { icon: '👥', weight: 1.1, reliability: 0.75 }
        },
        competencyDimensions: {
            'technical': { 
                weight: 1.0, 
                categories: ['domain-knowledge', 'problem-solving', 'innovation', 'continuous-learning'] 
            },
            'behavioral': { 
                weight: 1.2, 
                categories: ['communication', 'collaboration', 'adaptability', 'emotional-intelligence'] 
            },
            'leadership': { 
                weight: 1.3, 
                categories: ['decision-making', 'team-building', 'strategic-thinking', 'influence'] 
            },
            'cultural': { 
                weight: 1.1, 
                categories: ['integrity', 'respect', 'accountability', 'growth-mindset'] 
            }
        },
        adaptiveThresholds: {
            confidence: 0.8,        // Minimum confidence to stop asking
            precision: 0.1,         // Acceptable margin of error
            maxQuestions: 15,       // Maximum questions per competency
            minQuestions: 3         // Minimum questions per competency
        },
        scoringMethods: {
            'irt': 'Item Response Theory',      // Most sophisticated
            'cat': 'Computer Adaptive Testing', // Adaptive questioning
            'weighted': 'Weighted Average',     // Simple but reliable
            'bayesian': 'Bayesian Inference'   // Uncertainty handling
        }
    };

    // Advanced Assessment Engine
    Growth90.Assessment = Growth90.Assessment || {};
    Growth90.Assessment.Engine = (() => {
        let assessmentHistory = [];
        let currentAssessment = null;
        let questionBank = new Map();
        let adaptiveModel = null;
        let isInitialized = false;

        // Initialize assessment engine
        async function initialize() {
            
            try {
                // Load question banks
                await loadQuestionBanks();
                
                // Initialize adaptive model
                await initializeAdaptiveModel();
                
                // Load assessment history
                await loadAssessmentHistory();
                
                // Set up event listeners
                setupEventListeners();
                
                isInitialized = true;
                Growth90.Core.EventBus.emit('assessment-engine:initialized');
                
                
            } catch (error) {
                console.error('❌ Failed to initialize assessment engine:', error);
            }
        }

        async function loadAssessmentHistory() {
            try {
                const items = await Growth90.Data.Storage.getAllItems('assessmentResults');
                assessmentHistory = Array.isArray(items) ? items : [];
            } catch (e) {
                assessmentHistory = [];
            }
        }

        // Create comprehensive assessment
        async function createAssessment(config = {}) {
            try {
                
                const userProfile = Growth90.Data.Models.AppState.getState().user;
                const learningPath = Growth90.Learning.PathManager.getActiveLearningPath();
                
                const assessmentConfig = {
                    id: Growth90.Core.Utils.generateId(),
                    userId: userProfile?.id,
                    pathId: learningPath?.id,
                    type: config.type || 'comprehensive',
                    purpose: config.purpose || 'progress-evaluation',
                    targetCompetencies: config.competencies || getAllRelevantCompetencies(userProfile, learningPath),
                    adaptiveSettings: {
                        enabled: config.adaptive !== false,
                        confidenceThreshold: config.confidenceThreshold || ASSESSMENT_CONFIG.adaptiveThresholds.confidence,
                        maxQuestions: config.maxQuestions || ASSESSMENT_CONFIG.adaptiveThresholds.maxQuestions
                    },
                    scoringMethod: config.scoringMethod || 'cat',
                    contextualFactors: {
                        industry: userProfile?.industry,
                        role: userProfile?.currentRole,
                        experience: userProfile?.experience,
                        previousAssessments: getRelevantAssessmentHistory(userProfile?.id)
                    },
                    createdAt: new Date().toISOString()
                };

                // Generate question sequence
                const questionSequence = await generateAdaptiveQuestionSequence(assessmentConfig);
                
                currentAssessment = {
                    ...assessmentConfig,
                    questions: questionSequence,
                    responses: [],
                    currentQuestionIndex: 0,
                    competencyEstimates: initializeCompetencyEstimates(assessmentConfig.targetCompetencies),
                    confidenceLevels: {},
                    startTime: new Date().toISOString(),
                    status: 'in-progress'
                };

                // Emit assessment created event
                Growth90.Core.EventBus.emit('assessment:created', currentAssessment);
                
                return currentAssessment;

            } catch (error) {
                console.error('❌ Failed to create assessment:', error);
                throw error;
            }
        }

        // Get next adaptive question
        async function getNextQuestion() {
            if (!currentAssessment || currentAssessment.status !== 'in-progress') {
                throw new Error('No active assessment found');
            }

            const { currentQuestionIndex, questions, responses, competencyEstimates, adaptiveSettings } = currentAssessment;

            // Check if assessment should be completed
            if (shouldCompleteAssessment(currentAssessment)) {
                return await completeAssessment();
            }

            // Get current question
            const currentQuestion = questions[currentQuestionIndex];
            if (!currentQuestion) {
                return await completeAssessment();
            }

            // Enhance question with adaptive context
            const enhancedQuestion = await enhanceQuestionWithContext(currentQuestion, currentAssessment);

            // Log question delivery

            return enhancedQuestion;
        }

        // Process question response
        async function processResponse(questionId, response) {
            try {
                if (!currentAssessment) {
                    throw new Error('No active assessment found');
                }


                // Validate response
                const question = currentAssessment.questions.find(q => q.id === questionId);
                if (!question) {
                    throw new Error('Question not found in current assessment');
                }

                const validatedResponse = validateResponse(question, response);

                // Store response
                const responseData = {
                    questionId: questionId,
                    response: validatedResponse,
                    timestamp: new Date().toISOString(),
                    responseTime: calculateResponseTime(questionId),
                    confidence: response.confidence || null
                };

                currentAssessment.responses.push(responseData);

                // Update competency estimates using adaptive algorithm
                await updateCompetencyEstimates(question, validatedResponse);

                // Update question sequence if needed (adaptive)
                if (currentAssessment.adaptiveSettings.enabled) {
                    await updateAdaptiveSequence();
                }

                // Move to next question
                currentAssessment.currentQuestionIndex++;

                // Emit response processed event
                Growth90.Core.EventBus.emit('assessment:response-processed', {
                    assessmentId: currentAssessment.id,
                    questionId: questionId,
                    response: responseData,
                    progress: (currentAssessment.currentQuestionIndex / currentAssessment.questions.length) * 100
                });

                return {
                    processed: true,
                    progress: (currentAssessment.currentQuestionIndex / currentAssessment.questions.length) * 100,
                    competencyUpdates: getCurrentCompetencyEstimates()
                };

            } catch (error) {
                console.error('❌ Failed to process response:', error);
                throw error;
            }
        }

        // Complete current assessment
        async function completeAssessment() {
            try {
                if (!currentAssessment) {
                    throw new Error('No active assessment to complete');
                }


                // Calculate final scores
                const finalScores = await calculateFinalScores(currentAssessment);

                // Generate comprehensive analysis
                const analysis = await generateAssessmentAnalysis(currentAssessment, finalScores);

                // Create assessment result
                const assessmentResult = {
                    id: Growth90.Core.Utils.generateId(),
                    assessmentId: currentAssessment.id,
                    userId: currentAssessment.userId,
                    completedAt: new Date().toISOString(),
                    totalTime: calculateTotalTime(currentAssessment),
                    questionsAnswered: currentAssessment.responses.length,
                    scores: finalScores,
                    analysis: analysis,
                    competencyProfile: generateCompetencyProfile(finalScores),
                    recommendations: await generateRecommendations(finalScores, analysis),
                    reliability: calculateAssessmentReliability(currentAssessment),
                    validity: calculateAssessmentValidity(currentAssessment)
                };

                // Update assessment status
                currentAssessment.status = 'completed';
                currentAssessment.completedAt = new Date().toISOString();
                currentAssessment.result = assessmentResult;

                // Save to history
                assessmentHistory.push(currentAssessment);
                await saveAssessmentResult(assessmentResult);

                // Update user profile with new competency data
                await updateUserCompetencyProfile(assessmentResult);

                // Update learning path based on results
                await updateLearningPathProgress(assessmentResult);

                // Emit completion event
                Growth90.Core.EventBus.emit('assessment:completed', assessmentResult);

                
                // Clear current assessment
                const completedAssessment = currentAssessment;
                currentAssessment = null;

                return assessmentResult;

            } catch (error) {
                console.error('❌ Failed to complete assessment:', error);
                throw error;
            }
        }

        // Generate adaptive question sequence
        async function generateAdaptiveQuestionSequence(assessmentConfig) {
            const { targetCompetencies, contextualFactors, adaptiveSettings } = assessmentConfig;
            const sequence = [];

            for (const competency of targetCompetencies) {
                // Get competency-specific questions
                const competencyQuestions = await getCompetencyQuestions(competency, contextualFactors);
                
                // Select initial questions using adaptive algorithm
                const initialQuestions = selectInitialQuestions(competencyQuestions, competency, adaptiveSettings);
                
                sequence.push(...initialQuestions);
            }

            // Sort by difficulty and strategic ordering
            return optimizeQuestionSequence(sequence, assessmentConfig);
        }

        // Get competency-specific questions
        async function getCompetencyQuestions(competency, contextualFactors) {
            const questions = [];
            
            // Get base questions for competency
            const baseQuestions = questionBank.get(competency) || [];
            
            // Filter by contextual relevance
            const contextualQuestions = baseQuestions.filter(question => 
                isQuestionRelevant(question, contextualFactors)
            );

            // Add scenario-based questions if available
            const scenarioQuestions = await generateScenarioQuestions(competency, contextualFactors);
            
            return [...contextualQuestions, ...scenarioQuestions];
        }

        // Generate scenario-based questions
        async function generateScenarioQuestions(competency, contextualFactors) {
            const scenarios = [];
            const { industry, role, experience } = contextualFactors;

            // Industry-specific scenarios
            if (industry && SCENARIO_TEMPLATES[industry]) {
                const industryScenarios = SCENARIO_TEMPLATES[industry][competency] || [];
                scenarios.push(...industryScenarios);
            }

            // Role-specific scenarios
            if (role && ROLE_SCENARIOS[role]) {
                const roleScenarios = ROLE_SCENARIOS[role][competency] || [];
                scenarios.push(...roleScenarios);
            }

            // Experience-level appropriate scenarios
            const experienceScenarios = scenarios.filter(scenario => 
                isAppropriateForExperience(scenario, experience)
            );

            return experienceScenarios.map(scenario => ({
                ...scenario,
                id: Growth90.Core.Utils.generateId(),
                type: 'scenario-response',
                competency: competency,
                generatedAt: new Date().toISOString()
            }));
        }

        // Update competency estimates using Item Response Theory
        async function updateCompetencyEstimates(question, response) {
            const competency = question.competency;
            const currentEstimate = currentAssessment.competencyEstimates[competency];

            // Apply IRT model
            const newEstimate = applyIRTModel(currentEstimate, question, response);
            
            // Update confidence level
            const confidence = calculateConfidence(newEstimate, question.difficulty);
            
            currentAssessment.competencyEstimates[competency] = newEstimate;
            currentAssessment.confidenceLevels[competency] = confidence;

        }

        // Apply Item Response Theory model
        function applyIRTModel(currentEstimate, question, response) {
            const { ability, standardError } = currentEstimate;
            const { difficulty, discrimination, guessing } = question.irtParameters || {};

            // Calculate probability of correct response
            const probability = calculateIRTProbability(ability, difficulty, discrimination, guessing);
            
            // Update ability estimate based on response
            const responseValue = normalizeResponse(response, question.type);
            const likelihoodRatio = responseValue === 1 ? probability : (1 - probability);
            
            // Bayesian update
            const newAbility = ability + (standardError * (responseValue - probability));
            const newStandardError = Math.max(0.1, standardError * Math.sqrt(1 - Math.pow(probability * (1 - probability) * discrimination, 2)));

            return {
                ability: newAbility,
                standardError: newStandardError,
                lastUpdated: new Date().toISOString()
            };
        }

        // Calculate IRT probability
        function calculateIRTProbability(ability, difficulty, discrimination = 1, guessing = 0) {
            const exponent = discrimination * (ability - difficulty);
            return guessing + (1 - guessing) / (1 + Math.exp(-exponent));
        }

        // Normalize response to 0-1 scale
        function normalizeResponse(response, questionType) {
            switch (questionType) {
                case 'rating':
                    return (response - 1) / 4; // Assuming 1-5 scale
                case 'multiple-choice':
                    return response.correct ? 1 : 0;
                case 'scenario-response':
                    return response.score || 0; // Assuming pre-scored
                case 'behavioral-indicator':
                    return response.strength || 0; // Assuming strength score
                default:
                    return Math.min(1, Math.max(0, response));
            }
        }

        // Check if assessment should be completed
        function shouldCompleteAssessment(assessment) {
            const { adaptiveSettings, competencyEstimates, confidenceLevels, currentQuestionIndex, questions } = assessment;
            
            // Maximum questions reached
            if (currentQuestionIndex >= questions.length) {
                return true;
            }

            // All competencies have sufficient confidence
            if (adaptiveSettings.enabled) {
                const allCompetenciesConfident = Object.entries(confidenceLevels).every(([competency, confidence]) => 
                    confidence >= adaptiveSettings.confidenceThreshold
                );
                
                // Minimum questions met for each competency
                const minQuestionsMet = Object.keys(competencyEstimates).every(competency => 
                    getCompetencyQuestionCount(assessment, competency) >= ASSESSMENT_CONFIG.adaptiveThresholds.minQuestions
                );

                if (allCompetenciesConfident && minQuestionsMet) {
                    return true;
                }
            }

            return false;
        }

        // Calculate final scores
        async function calculateFinalScores(assessment) {
            const scores = {};
            
            for (const [competency, estimate] of Object.entries(assessment.competencyEstimates)) {
                scores[competency] = {
                    rawScore: estimate.ability,
                    standardizedScore: standardizeScore(estimate.ability),
                    percentileRank: await calculatePercentileRank(competency, estimate.ability),
                    confidence: assessment.confidenceLevels[competency] || 0,
                    reliability: calculateCompetencyReliability(assessment, competency),
                    measurementError: estimate.standardError
                };
            }

            // Calculate dimension scores
            const dimensionScores = calculateDimensionScores(scores);
            
            // Calculate overall score
            const overallScore = calculateOverallScore(scores, dimensionScores);

            return {
                competencies: scores,
                dimensions: dimensionScores,
                overall: overallScore,
                metadata: {
                    scoringMethod: assessment.scoringMethod,
                    assessmentType: assessment.type,
                    calculatedAt: new Date().toISOString()
                }
            };
        }

        // Generate comprehensive analysis
        async function generateAssessmentAnalysis(assessment, scores) {
            const analysis = {
                summary: generateScoreSummary(scores),
                strengths: identifyStrengths(scores),
                developmentAreas: identifyDevelopmentAreas(scores),
                competencyGaps: analyzeCompetencyGaps(scores),
                progressTrends: await analyzeProgressTrends(assessment.userId, scores),
                behavioralInsights: analyzeBehavioralPatterns(assessment),
                reliabilityMetrics: calculateReliabilityMetrics(assessment),
                recommendations: await generateDetailedRecommendations(scores, assessment)
            };

            return analysis;
        }

        // Generate competency profile
        function generateCompetencyProfile(scores) {
            const profile = {
                competencyLevels: {},
                dimensionStrengths: {},
                overallMaturity: calculateOverallMaturity(scores),
                competencyDistribution: analyzeCompetencyDistribution(scores),
                developmentPriorities: rankDevelopmentPriorities(scores)
            };

            // Map competency levels
            Object.entries(scores.competencies).forEach(([competency, score]) => {
                profile.competencyLevels[competency] = {
                    level: score.standardizedScore,
                    confidence: score.confidence,
                    percentile: score.percentileRank,
                    category: categorizeCompetencyLevel(score.standardizedScore)
                };
            });

            // Map dimension strengths
            Object.entries(scores.dimensions).forEach(([dimension, score]) => {
                profile.dimensionStrengths[dimension] = {
                    strength: score.average,
                    consistency: score.consistency,
                    trend: score.trend || 'stable'
                };
            });

            return profile;
        }

        // Save assessment result
        async function saveAssessmentResult(result) {
            try {
                await Growth90.Data.Storage.setItem('assessmentResults', result);
                
            } catch (error) {
                console.error('❌ Failed to save assessment result:', error);
                throw error;
            }
        }

        // Update user competency profile
        async function updateUserCompetencyProfile(assessmentResult) {
            try {
                const userState = Growth90.Data.Models.AppState.getState();
                const updatedCompetencies = {};

                // Update competency levels
                Object.entries(assessmentResult.competencyProfile.competencyLevels).forEach(([competency, data]) => {
                    updatedCompetencies[competency] = {
                        current: data.level,
                        confidence: data.confidence,
                        lastAssessed: assessmentResult.completedAt,
                        trend: data.trend || 'stable'
                    };
                });

                // Update app state
                Growth90.Data.Models.AppState.setState({
                    user: {
                        ...userState.user,
                        competencyLevels: {
                            ...userState.user?.competencyLevels,
                            ...updatedCompetencies
                        },
                        lastAssessment: {
                            id: assessmentResult.id,
                            completedAt: assessmentResult.completedAt,
                            overallScore: assessmentResult.scores.overall.score
                        }
                    }
                });


            } catch (error) {
                console.error('❌ Failed to update user competency profile:', error);
            }
        }

        // Load question banks
        async function loadQuestionBanks() {
            try {
                // Load from API or local storage
                const banks = await Growth90.Data.API.assessment.getQuestionBanks();
                
                banks.forEach(bank => {
                    questionBank.set(bank.competency, bank.questions);
                });


            } catch (error) {
                loadDefaultQuestionBanks();
            }
        }

        // Load default question banks
        function loadDefaultQuestionBanks() {
            // Default question bank structure
            const defaultBanks = {
                'leadership': DEFAULT_LEADERSHIP_QUESTIONS,
                'communication': DEFAULT_COMMUNICATION_QUESTIONS,
                'problem-solving': DEFAULT_PROBLEM_SOLVING_QUESTIONS,
                'teamwork': DEFAULT_TEAMWORK_QUESTIONS,
                'adaptability': DEFAULT_ADAPTABILITY_QUESTIONS
            };

            Object.entries(defaultBanks).forEach(([competency, questions]) => {
                questionBank.set(competency, questions);
            });
        }

        // Initialize adaptive model
        async function initializeAdaptiveModel() {
            try {
                // Load pre-trained model parameters if available
                const modelData = await Growth90.Data.Storage.getItem('settings', 'adaptiveModel');
                
                if (modelData) {
                    adaptiveModel = modelData;
                } else {
                    // Initialize with default parameters
                    adaptiveModel = createDefaultAdaptiveModel();
                }

            } catch (error) {
                adaptiveModel = createDefaultAdaptiveModel();
            }
        }

        function createDefaultAdaptiveModel() {
            return {
                version: '1.0',
                params: {
                    confidenceThreshold: ASSESSMENT_CONFIG.adaptiveThresholds.confidence,
                    precision: ASSESSMENT_CONFIG.adaptiveThresholds.precision,
                    maxQuestions: ASSESSMENT_CONFIG.adaptiveThresholds.maxQuestions,
                    minQuestions: ASSESSMENT_CONFIG.adaptiveThresholds.minQuestions
                }
            };
        }

        // Public API
        return {
            initialize,
            createAssessment,
            getNextQuestion,
            processResponse,
            completeAssessment,
            getCurrentAssessment: () => currentAssessment,
            getAssessmentHistory: () => assessmentHistory,
            isInitialized: () => isInitialized
        };
    })();

    // Default question sets (abbreviated for space)
    const DEFAULT_LEADERSHIP_QUESTIONS = [
        {
            id: 'lead_1',
            type: 'scenario-response',
            competency: 'leadership',
            difficulty: 0.5,
            discrimination: 1.2,
            question: 'Your team is facing a tight deadline and two key members are in conflict. How do you handle this situation?',
            scenarios: [
                'Address the conflict immediately in a team meeting',
                'Speak with each member individually first',
                'Focus on the deadline and address conflict later',
                'Involve HR or your manager for support'
            ],
            scoring: {
                optimal: [1, 2],
                acceptable: [4],
                suboptimal: [3]
            }
        }
        // More questions would be included in full implementation
    ];

    const DEFAULT_COMMUNICATION_QUESTIONS = [
        {
            id: 'comm_1',
            type: 'multiple-choice',
            competency: 'communication',
            difficulty: 0.3,
            discrimination: 1.0,
            question: 'When delivering difficult feedback to a team member, what is the most important principle to follow?',
            options: [
                'Be direct and honest regardless of feelings',
                'Focus on specific behaviors, not personality',
                'Deliver feedback publicly to set an example',
                'Wait for the annual review for formal feedback'
            ],
            correct: 1,
            explanation: 'Effective feedback focuses on specific, observable behaviors rather than personal characteristics.'
        }
        // More questions would be included in full implementation
    ];

    const DEFAULT_PROBLEM_SOLVING_QUESTIONS = [
        {
            id: 'prob_1',
            type: 'rating',
            competency: 'problem-solving',
            difficulty: 0.4,
            discrimination: 1.1,
            question: 'How comfortable are you with analyzing complex problems that have multiple possible solutions?',
            scale: {
                min: 1,
                max: 5,
                labels: ['Very uncomfortable', 'Uncomfortable', 'Neutral', 'Comfortable', 'Very comfortable']
            }
        }
        // More questions would be included in full implementation
    ];

    const DEFAULT_TEAMWORK_QUESTIONS = [
        {
            id: 'team_1',
            type: 'multiple-choice',
            competency: 'teamwork',
            difficulty: 0.4,
            discrimination: 1.0,
            question: 'A teammate is consistently missing deadlines. What is your first step?',
            options: [
                'Inform your manager immediately',
                'Discuss privately to understand blockers',
                'Publicly call it out in the next standup',
                'Reassign their tasks without discussion'
            ],
            correct: 1
        }
    ];

    const DEFAULT_ADAPTABILITY_QUESTIONS = [
        {
            id: 'adapt_1',
            type: 'rating',
            competency: 'adaptability',
            difficulty: 0.3,
            discrimination: 0.9,
            question: 'How comfortable are you when priorities change unexpectedly?',
            scale: { min: 1, max: 5, labels: ['Not at all', 'Slightly', 'Moderately', 'Very', 'Extremely'] }
        }
    ];

    // Initialize when app starts
    Growth90.Core.EventBus.on('app:initialized', () => {
        Growth90.Assessment.Engine.initialize();
    });

})(window.Growth90 = window.Growth90 || {
    Core: { EventBus: { on: () => {}, emit: () => {} } },
    Data: {}, UI: {}, Learning: {}, User: {}
});

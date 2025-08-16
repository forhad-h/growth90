/**
 * Growth90 User Onboarding System
 * Comprehensive professional assessment and personalization
 */

(function(Growth90) {
    'use strict';

    // Onboarding configuration and steps
    const ONBOARDING_CONFIG = {
        steps: [
            'welcome',
            'personal-info',
            'professional-context',
            'skills-assessment',
            'learning-preferences',
            'goal-setting',
            'customization',
            'completion'
        ],
        assessmentQuestions: {
            leadership: {
                core: [
                    {
                        id: 'leadership_1',
                        question: 'How comfortable are you with making decisions under pressure?',
                        type: 'rating',
                        followUp: {
                            condition: (rating) => rating >= 4,
                            questions: [
                                'Describe a recent high-pressure decision you made and its outcome.',
                                'What strategies do you use to remain calm under pressure?'
                            ]
                        }
                    },
                    {
                        id: 'leadership_2',
                        question: 'How effectively do you communicate vision to team members?',
                        type: 'rating',
                        followUp: {
                            condition: (rating) => rating <= 2,
                            questions: [
                                'What challenges do you face when communicating with your team?',
                                'What communication methods would you like to improve?'
                            ]
                        }
                    },
                    {
                        id: 'leadership_3',
                        question: 'How well do you handle conflict resolution in teams?',
                        type: 'rating',
                        contextual: {
                            'Team Lead': 'Consider conflicts between team members you supervise',
                            'Manager': 'Think about conflicts across different departments',
                            'Individual Contributor': 'Focus on peer-to-peer conflicts'
                        }
                    }
                ],
                situational: [
                    {
                        id: 'leadership_scenario_1',
                        scenario: 'Your team is behind on a critical project deadline, and team members are becoming stressed and less productive.',
                        question: 'What would be your primary approach to address this situation?',
                        options: [
                            'Hold a team meeting to discuss priorities and redistribute workload',
                            'Work overtime yourself to help catch up on deliverables',
                            'Communicate with stakeholders about timeline adjustments',
                            'Implement daily check-ins to monitor progress more closely'
                        ],
                        type: 'multiple-choice'
                    }
                ]
            },
            communication: {
                core: [
                    {
                        id: 'communication_1',
                        question: 'How confident are you in public speaking situations?',
                        type: 'rating',
                        contextual: {
                            'entry': 'Focus on team meetings and small presentations',
                            'mid': 'Consider client presentations and department meetings',
                            'senior': 'Think about executive presentations and conference speaking'
                        }
                    },
                    {
                        id: 'communication_2',
                        question: 'How effectively do you write professional emails and reports?',
                        type: 'rating',
                        followUp: {
                            condition: (rating) => rating >= 4,
                            questions: [
                                'What makes your written communication particularly effective?',
                                'How do you adapt your writing style for different audiences?'
                            ]
                        }
                    },
                    {
                        id: 'communication_3',
                        question: 'How well do you listen and respond to feedback?',
                        type: 'rating',
                        followUp: {
                            condition: (rating) => rating <= 3,
                            questions: [
                                'What aspects of receiving feedback do you find most challenging?',
                                'How would you like to improve your response to constructive criticism?'
                            ]
                        }
                    }
                ],
                practical: [
                    {
                        id: 'communication_practical_1',
                        question: 'You need to deliver disappointing news to a client about project delays. How would you structure this communication?',
                        type: 'scenario-response',
                        evaluationCriteria: ['clarity', 'empathy', 'solution-focus', 'professionalism']
                    }
                ]
            },
            problemSolving: {
                core: [
                    {
                        id: 'problem_solving_1',
                        question: 'How systematically do you approach complex problems?',
                        type: 'rating',
                        followUp: {
                            condition: (rating) => rating >= 4,
                            questions: [
                                'Describe your typical problem-solving methodology.',
                                'What tools or frameworks do you use for complex analysis?'
                            ]
                        }
                    },
                    {
                        id: 'problem_solving_2',
                        question: 'How creatively do you generate solutions to challenges?',
                        type: 'rating',
                        contextual: {
                            'Technology & Software': 'Consider technical challenges and innovative solutions',
                            'Healthcare & Medicine': 'Think about patient care improvements and process optimization',
                            'Finance & Banking': 'Focus on regulatory compliance and efficiency improvements'
                        }
                    }
                ],
                analytical: [
                    {
                        id: 'problem_solving_case_1',
                        case: 'Your department is experiencing a 20% increase in customer complaints, but customer satisfaction surveys show stable ratings.',
                        question: 'What steps would you take to investigate and resolve this discrepancy?',
                        type: 'structured-response',
                        expectedElements: ['data analysis', 'stakeholder consultation', 'root cause analysis', 'action planning']
                    }
                ]
            },
            teamwork: {
                core: [
                    {
                        id: 'teamwork_1',
                        question: 'How collaboratively do you work with diverse team members?',
                        type: 'rating',
                        contextual: {
                            'small': 'Consider working with 2-5 team members',
                            'medium': 'Think about coordination with 6-15 team members',
                            'large': 'Focus on collaboration across multiple sub-teams'
                        }
                    },
                    {
                        id: 'teamwork_2',
                        question: 'How reliably do you meet team commitments and deadlines?',
                        type: 'rating',
                        followUp: {
                            condition: (rating) => rating <= 3,
                            questions: [
                                'What factors typically cause delays in your work?',
                                'How do you prioritize when facing multiple urgent deadlines?'
                            ]
                        }
                    }
                ],
                collaborative: [
                    {
                        id: 'teamwork_scenario_1',
                        scenario: 'A team member consistently dominates meetings and interrupts others.',
                        question: 'How would you address this situation to maintain team effectiveness?',
                        type: 'scenario-choice',
                        options: [
                            'Speak with the person privately about their meeting behavior',
                            'Suggest implementing structured meeting protocols',
                            'Address it directly in the next team meeting',
                            'Discuss with your manager for guidance'
                        ]
                    }
                ]
            },
            adaptability: {
                core: [
                    {
                        id: 'adaptability_1',
                        question: 'How quickly do you adapt to changes in work processes?',
                        type: 'rating',
                        followUp: {
                            condition: (rating) => rating >= 4,
                            questions: [
                                'What strategies help you adapt quickly to change?',
                                'How do you help others adapt to new processes?'
                            ]
                        }
                    },
                    {
                        id: 'adaptability_2',
                        question: 'How effectively do you learn new technologies or tools?',
                        type: 'rating',
                        contextual: {
                            'Technology & Software': 'Consider programming languages, frameworks, and development tools',
                            'Healthcare & Medicine': 'Think about medical technologies and electronic health records',
                            'Marketing & Advertising': 'Focus on digital marketing platforms and analytics tools'
                        }
                    }
                ],
                changeManagement: [
                    {
                        id: 'adaptability_change_1',
                        scenario: 'Your organization is implementing a major system change that will significantly alter your daily workflow.',
                        question: 'What would be your approach to managing this transition effectively?',
                        type: 'open-response',
                        keyAreas: ['preparation', 'learning strategy', 'resistance management', 'support seeking']
                    }
                ]
            }
        },
        industries: [
            'Technology & Software',
            'Healthcare & Medicine',
            'Finance & Banking',
            'Education & Training',
            'Manufacturing & Engineering',
            'Marketing & Advertising',
            'Consulting & Professional Services',
            'Retail & E-commerce',
            'Media & Communications',
            'Government & Public Sector',
            'Non-profit & Social Impact',
            'Other'
        ],
        roles: [
            'Individual Contributor',
            'Team Lead',
            'Manager',
            'Senior Manager',
            'Director',
            'VP/C-Level Executive',
            'Entrepreneur',
            'Consultant',
            'Student/Recent Graduate',
            'Career Changer'
        ],
        learningStyles: [
            'Visual (charts, diagrams, videos)',
            'Auditory (lectures, discussions, podcasts)',
            'Reading/Writing (articles, notes, documents)',
            'Kinesthetic (hands-on, interactive exercises)',
            'Social (group activities, peer learning)',
            'Solitary (independent study, reflection)'
        ]
    };

    // Onboarding state management
    let onboardingState = {
        currentStep: 0,
        stepData: {},
        userProfile: {
            id: Growth90.Core.Utils.generateId(),
            createdAt: new Date().toISOString(),
            completedOnboarding: false
        },
        assessmentResults: {},
        learningPath: null
    };

    // Onboarding UI Management
    Growth90.User.Onboarding = (() => {
        let currentStepElement = null;
        let isTransitioning = false;

        function initialize() {
            
            // Register onboarding route handler
            Growth90.Core.Router.register('onboarding', handleOnboardingRoute);
            
            // Listen for onboarding events
            Growth90.Core.EventBus.on('onboarding:step:complete', handleStepComplete);
            Growth90.Core.EventBus.on('onboarding:complete', handleOnboardingComplete);
            
        }

        function handleOnboardingRoute(params = []) {
            const stepIndex = params[0] ? parseInt(params[0]) : 0;
            startOnboarding(stepIndex);
        }

        function startOnboarding(stepIndex = 0) {
            onboardingState.currentStep = Math.max(0, Math.min(stepIndex, ONBOARDING_CONFIG.steps.length - 1));
            renderCurrentStep();
        }

        function renderCurrentStep() {
            if (isTransitioning) return;
            
            const stepName = ONBOARDING_CONFIG.steps[onboardingState.currentStep];
            const contentArea = document.getElementById('app-content');
            
            Growth90.UI.Components.Loading.show('Preparing your onboarding experience...');
            
            setTimeout(() => {
                contentArea.innerHTML = generateStepHTML(stepName);
                currentStepElement = contentArea.querySelector('.onboarding-step');
                initializeStepInteractions(stepName);
                updateProgressIndicator();
                Growth90.UI.Components.Loading.hide();
                
                // Focus management for accessibility
                const firstInput = currentStepElement.querySelector('input, select, textarea, button');
                if (firstInput) {
                    firstInput.focus();
                }
                
                Growth90.Core.EventBus.emit('onboarding:step:rendered', { step: stepName, index: onboardingState.currentStep });
            }, 300);
        }

        function generateStepHTML(stepName) {
            const stepGenerators = {
                welcome: generateWelcomeStep,
                'personal-info': generatePersonalInfoStep,
                'professional-context': generateProfessionalContextStep,
                'skills-assessment': generateSkillsAssessmentStep,
                'learning-preferences': generateLearningPreferencesStep,
                'goal-setting': generateGoalSettingStep,
                customization: generateCustomizationStep,
                completion: generateCompletionStep
            };

            const generator = stepGenerators[stepName];
            if (!generator) {
                console.error(`Unknown onboarding step: ${stepName}`);
                return '<div class="error">Unknown onboarding step</div>';
            }

            return generator();
        }

        function generateWelcomeStep() {
            return `
                <div class="onboarding-step welcome-step">
                    <div class="onboarding-container">
                        <div class="step-header">
                            <div class="step-icon">🌟</div>
                            <h1 class="step-title">Welcome to Your Growth Journey</h1>
                            <p class="step-subtitle">Let's create a personalized 90-day learning experience that transforms your professional skills</p>
                        </div>
                        
                        <div class="welcome-content">
                            <div class="journey-preview">
                                <h3>Your Journey Will Include:</h3>
                                <div class="preview-items">
                                    <div class="preview-item">
                                        <div class="preview-icon">🎯</div>
                                        <div class="preview-content">
                                            <h4>Personalized Assessment</h4>
                                            <p>We'll evaluate your current skills and professional context</p>
                                        </div>
                                    </div>
                                    <div class="preview-item">
                                        <div class="preview-icon">🗺️</div>
                                        <div class="preview-content">
                                            <h4>Custom Learning Path</h4>
                                            <p>AI-generated curriculum tailored to your goals and industry</p>
                                        </div>
                                    </div>
                                    <div class="preview-item">
                                        <div class="preview-icon">📈</div>
                                        <div class="preview-content">
                                            <h4>Progress Tracking</h4>
                                            <p>Real-time insights and analytics to optimize your learning</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="time-estimate">
                                <p><strong>Time to complete:</strong> 10-15 minutes</p>
                                <p><strong>Your privacy:</strong> All data is stored locally and securely</p>
                            </div>
                        </div>
                        
                        <div class="step-actions">
                            <button class="primary-btn" data-action="next-step">Begin Assessment</button>
                        </div>
                    </div>
                </div>
            `;
        }

        function generatePersonalInfoStep() {
            const existingData = onboardingState.stepData['personal-info'] || {};
            
            return `
                <div class="onboarding-step personal-info-step">
                    <div class="onboarding-container">
                        <div class="step-header">
                            <div class="step-icon">👤</div>
                            <h1 class="step-title">Personal Information</h1>
                            <p class="step-subtitle">Help us personalize your learning experience</p>
                        </div>
                        
                        <form class="onboarding-form" data-step="personal-info">
                            <div class="form-group">
                                <label for="firstName" class="form-label">First Name *</label>
                                <input type="text" id="firstName" name="firstName" class="form-input" 
                                       value="${existingData.firstName || ''}" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="lastName" class="form-label">Last Name *</label>
                                <input type="text" id="lastName" name="lastName" class="form-input" 
                                       value="${existingData.lastName || ''}" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="email" class="form-label">Email Address *</label>
                                <input type="email" id="email" name="email" class="form-input" 
                                       value="${existingData.email || ''}" required>
                                <div class="form-help">Used for progress reports and important updates</div>
                            </div>
                            
                            <div class="form-group">
                                <label for="phone" class="form-label">Phone Number (Optional)</label>
                                <input type="tel" id="phone" name="phone" class="form-input" 
                                       value="${existingData.phone || ''}">
                            </div>
                            
                            <div class="form-group">
                                <label for="timezone" class="form-label">Timezone *</label>
                                <select id="timezone" name="timezone" class="form-select" required>
                                    ${generateTimezoneOptions(existingData.timezone)}
                                </select>
                                <div class="form-help">Helps us schedule learning activities optimally</div>
                            </div>
                            
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" name="emailUpdates" 
                                           ${existingData.emailUpdates ? 'checked' : ''}>
                                    <span class="checkbox-custom"></span>
                                    I'd like to receive learning tips and progress updates via email
                                </label>
                            </div>
                        </form>
                        
                        <div class="step-actions">
                            <button class="secondary-btn" data-action="prev-step">Back</button>
                            <button class="primary-btn" data-action="next-step">Continue</button>
                        </div>
                    </div>
                </div>
            `;
        }

        function generateProfessionalContextStep() {
            const existingData = onboardingState.stepData['professional-context'] || {};
            
            return `
                <div class="onboarding-step professional-context-step">
                    <div class="onboarding-container">
                        <div class="step-header">
                            <div class="step-icon">💼</div>
                            <h1 class="step-title">Professional Context</h1>
                            <p class="step-subtitle">Tell us about your professional environment and goals</p>
                        </div>
                        
                        <form class="onboarding-form" data-step="professional-context">
                            <div class="form-group">
                                <label for="currentRole" class="form-label">Current Role Level *</label>
                                <select id="currentRole" name="currentRole" class="form-select" required>
                                    <option value="">Select your role level...</option>
                                    ${ONBOARDING_CONFIG.roles.map(role => 
                                        `<option value="${role}" ${existingData.currentRole === role ? 'selected' : ''}>${role}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="industry" class="form-label">Industry *</label>
                                <select id="industry" name="industry" class="form-select" required>
                                    <option value="">Select your industry...</option>
                                    ${ONBOARDING_CONFIG.industries.map(industry => 
                                        `<option value="${industry}" ${existingData.industry === industry ? 'selected' : ''}>${industry}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="companySize" class="form-label">Organization Size *</label>
                                <select id="companySize" name="companySize" class="form-select" required>
                                    <option value="">Select organization size...</option>
                                    <option value="startup" ${existingData.companySize === 'startup' ? 'selected' : ''}>Startup (1-50 employees)</option>
                                    <option value="small" ${existingData.companySize === 'small' ? 'selected' : ''}>Small Business (51-200 employees)</option>
                                    <option value="medium" ${existingData.companySize === 'medium' ? 'selected' : ''}>Medium Company (201-1000 employees)</option>
                                    <option value="large" ${existingData.companySize === 'large' ? 'selected' : ''}>Large Corporation (1000+ employees)</option>
                                    <option value="freelance" ${existingData.companySize === 'freelance' ? 'selected' : ''}>Freelancer/Self-employed</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="experience" class="form-label">Years of Professional Experience *</label>
                                <select id="experience" name="experience" class="form-select" required>
                                    <option value="">Select experience level...</option>
                                    <option value="entry" ${existingData.experience === 'entry' ? 'selected' : ''}>0-2 years (Entry Level)</option>
                                    <option value="junior" ${existingData.experience === 'junior' ? 'selected' : ''}>3-5 years (Junior Professional)</option>
                                    <option value="mid" ${existingData.experience === 'mid' ? 'selected' : ''}>6-10 years (Mid-Level)</option>
                                    <option value="senior" ${existingData.experience === 'senior' ? 'selected' : ''}>11-15 years (Senior Professional)</option>
                                    <option value="expert" ${existingData.experience === 'expert' ? 'selected' : ''}>15+ years (Expert/Executive)</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="currentChallenges" class="form-label">Current Professional Challenges</label>
                                <textarea id="currentChallenges" name="currentChallenges" class="form-textarea" 
                                          rows="4" placeholder="Describe the main challenges you're facing in your current role...">${existingData.currentChallenges || ''}</textarea>
                                <div class="form-help">This helps us tailor content to your specific needs</div>
                            </div>
                            
                            <div class="form-group">
                                <label for="teamSize" class="form-label">Team Size (if applicable)</label>
                                <select id="teamSize" name="teamSize" class="form-select">
                                    <option value="">Select team size...</option>
                                    <option value="individual" ${existingData.teamSize === 'individual' ? 'selected' : ''}>Individual Contributor</option>
                                    <option value="small" ${existingData.teamSize === 'small' ? 'selected' : ''}>2-5 team members</option>
                                    <option value="medium" ${existingData.teamSize === 'medium' ? 'selected' : ''}>6-15 team members</option>
                                    <option value="large" ${existingData.teamSize === 'large' ? 'selected' : ''}>16+ team members</option>
                                    <option value="multiple" ${existingData.teamSize === 'multiple' ? 'selected' : ''}>Multiple teams</option>
                                </select>
                            </div>
                        </form>
                        
                        <div class="step-actions">
                            <button class="secondary-btn" data-action="prev-step">Back</button>
                            <button class="primary-btn" data-action="next-step">Continue</button>
                        </div>
                    </div>
                </div>
            `;
        }

        function generateSkillsAssessmentStep() {
            return `
                <div class="onboarding-step skills-assessment-step">
                    <div class="onboarding-container">
                        <div class="step-header">
                            <div class="step-icon">🎯</div>
                            <h1 class="step-title">Skills Assessment</h1>
                            <p class="step-subtitle">Rate your current proficiency in key professional skills</p>
                        </div>
                        
                        <div class="assessment-intro">
                            <p>Please rate yourself honestly on a scale of 1-5 for each skill area:</p>
                            <div class="rating-scale">
                                <div class="scale-item">
                                    <span class="scale-number">1</span>
                                    <span class="scale-label">Beginner</span>
                                </div>
                                <div class="scale-item">
                                    <span class="scale-number">2</span>
                                    <span class="scale-label">Developing</span>
                                </div>
                                <div class="scale-item">
                                    <span class="scale-number">3</span>
                                    <span class="scale-label">Proficient</span>
                                </div>
                                <div class="scale-item">
                                    <span class="scale-number">4</span>
                                    <span class="scale-label">Advanced</span>
                                </div>
                                <div class="scale-item">
                                    <span class="scale-number">5</span>
                                    <span class="scale-label">Expert</span>
                                </div>
                            </div>
                        </div>
                        
                        <form class="assessment-form" data-step="skills-assessment">
                            ${generateSkillAssessmentQuestions()}
                        </form>
                        
                        <div class="step-actions">
                            <button class="secondary-btn" data-action="prev-step">Back</button>
                            <button class="primary-btn" data-action="next-step">Continue</button>
                        </div>
                    </div>
                </div>
            `;
        }

        function generateSkillAssessmentQuestions() {
            let html = '';
            
            Object.entries(ONBOARDING_CONFIG.assessmentQuestions).forEach(([skillArea, questionGroups]) => {
                html += `
                    <div class="skill-area" data-skill="${skillArea}">
                        <h3 class="skill-area-title">${skillArea.charAt(0).toUpperCase() + skillArea.slice(1).replace(/([A-Z])/g, ' $1')}</h3>
                        <div class="skill-questions">
                `;
                
                // Generate core questions
                if (questionGroups.core) {
                    questionGroups.core.forEach((questionObj, index) => {
                        html += generateQuestionHTML(questionObj, skillArea, index);
                    });
                }
                
                html += `
                        </div>
                        <div class="follow-up-questions" style="display: none;">
                            <!-- Follow-up questions will be dynamically added here -->
                        </div>
                    </div>
                `;
            });
            
            return html;
        }

        function generateQuestionHTML(questionObj, skillArea, index) {
            const questionId = questionObj.id || `${skillArea}_${index}`;
            const userContext = getUserContext();
            
            // Get contextual prompt if applicable
            let contextualPrompt = '';
            if (questionObj.contextual && userContext) {
                const contextKey = Object.keys(questionObj.contextual).find(key => 
                    userContext.role?.includes(key) || 
                    userContext.industry?.includes(key) || 
                    userContext.experience === key ||
                    userContext.teamSize === key
                );
                if (contextKey) {
                    contextualPrompt = `<div class="contextual-prompt">${questionObj.contextual[contextKey]}</div>`;
                }
            }
            
            if (questionObj.type === 'rating') {
                return `
                    <div class="skill-question" data-question-id="${questionId}" data-type="rating">
                        <label class="question-label">${questionObj.question}</label>
                        ${contextualPrompt}
                        <div class="rating-group" role="radiogroup" aria-label="${questionObj.question}">
                            ${[1, 2, 3, 4, 5].map(rating => `
                                <label class="rating-option">
                                    <input type="radio" name="${questionId}" value="${rating}" required 
                                           data-follow-up="${questionObj.followUp ? 'true' : 'false'}">
                                    <span class="rating-visual">${rating}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
            
            if (questionObj.type === 'multiple-choice') {
                return `
                    <div class="skill-question scenario-question" data-question-id="${questionId}" data-type="multiple-choice">
                        ${questionObj.scenario ? `<div class="scenario-text">${questionObj.scenario}</div>` : ''}
                        <label class="question-label">${questionObj.question}</label>
                        <div class="multiple-choice-group">
                            ${questionObj.options.map((option, optionIndex) => `
                                <label class="choice-option">
                                    <input type="radio" name="${questionId}" value="${optionIndex}" required>
                                    <span class="choice-custom"></span>
                                    <span class="choice-text">${option}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
            
            if (questionObj.type === 'scenario-response') {
                return `
                    <div class="skill-question scenario-question" data-question-id="${questionId}" data-type="scenario-response">
                        <label class="question-label">${questionObj.question}</label>
                        <textarea name="${questionId}" class="scenario-response" rows="5" 
                                  placeholder="Describe your approach in detail..." required></textarea>
                        <div class="evaluation-criteria">
                            <small>Your response will be evaluated on: ${questionObj.evaluationCriteria.join(', ')}</small>
                        </div>
                    </div>
                `;
            }
            
            return '';
        }

        function getUserContext() {
            const personalInfo = onboardingState.stepData['personal-info'] || {};
            const professionalContext = onboardingState.stepData['professional-context'] || {};
            
            return {
                role: professionalContext.currentRole,
                industry: professionalContext.industry,
                experience: professionalContext.experience,
                teamSize: professionalContext.teamSize
            };
        }

        function generateLearningPreferencesStep() {
            const existingData = onboardingState.stepData['learning-preferences'] || {};
            
            return `
                <div class="onboarding-step learning-preferences-step">
                    <div class="onboarding-container">
                        <div class="step-header">
                            <div class="step-icon">🧠</div>
                            <h1 class="step-title">Learning Preferences</h1>
                            <p class="step-subtitle">Help us customize your learning experience to match your preferred style</p>
                        </div>
                        
                        <form class="onboarding-form" data-step="learning-preferences">
                            <div class="form-group">
                                <label class="form-label">Preferred Learning Styles (select all that apply) *</label>
                                <div class="checkbox-group">
                                    ${ONBOARDING_CONFIG.learningStyles.map(style => {
                                        const isChecked = existingData.learningStyles && existingData.learningStyles.includes(style);
                                        return `
                                            <label class="checkbox-label">
                                                <input type="checkbox" name="learningStyles" value="${style}" ${isChecked ? 'checked' : ''}>
                                                <span class="checkbox-custom"></span>
                                                ${style}
                                            </label>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="dailyTimeCommitment" class="form-label">Daily Time Commitment *</label>
                                <select id="dailyTimeCommitment" name="dailyTimeCommitment" class="form-select" required>
                                    <option value="">Select daily time commitment...</option>
                                    <option value="15-30" ${existingData.dailyTimeCommitment === '15-30' ? 'selected' : ''}>15-30 minutes</option>
                                    <option value="30-45" ${existingData.dailyTimeCommitment === '30-45' ? 'selected' : ''}>30-45 minutes</option>
                                    <option value="45-60" ${existingData.dailyTimeCommitment === '45-60' ? 'selected' : ''}>45-60 minutes</option>
                                    <option value="60-90" ${existingData.dailyTimeCommitment === '60-90' ? 'selected' : ''}>1-1.5 hours</option>
                                    <option value="90+" ${existingData.dailyTimeCommitment === '90+' ? 'selected' : ''}>1.5+ hours</option>
                                </select>
                                <div class="form-help">Be realistic - consistency is more important than duration</div>
                            </div>
                            
                            <div class="form-group">
                                <label for="preferredTime" class="form-label">Preferred Learning Time *</label>
                                <select id="preferredTime" name="preferredTime" class="form-select" required>
                                    <option value="">Select preferred time...</option>
                                    <option value="early-morning" ${existingData.preferredTime === 'early-morning' ? 'selected' : ''}>Early Morning (6-8 AM)</option>
                                    <option value="morning" ${existingData.preferredTime === 'morning' ? 'selected' : ''}>Morning (8-11 AM)</option>
                                    <option value="midday" ${existingData.preferredTime === 'midday' ? 'selected' : ''}>Midday (11 AM-2 PM)</option>
                                    <option value="afternoon" ${existingData.preferredTime === 'afternoon' ? 'selected' : ''}>Afternoon (2-5 PM)</option>
                                    <option value="evening" ${existingData.preferredTime === 'evening' ? 'selected' : ''}>Evening (5-8 PM)</option>
                                    <option value="night" ${existingData.preferredTime === 'night' ? 'selected' : ''}>Night (8-11 PM)</option>
                                    <option value="flexible" ${existingData.preferredTime === 'flexible' ? 'selected' : ''}>Flexible/Varies</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="difficultyPreference" class="form-label">Learning Difficulty Preference *</label>
                                <select id="difficultyPreference" name="difficultyPreference" class="form-select" required>
                                    <option value="">Select difficulty preference...</option>
                                    <option value="gradual" ${existingData.difficultyPreference === 'gradual' ? 'selected' : ''}>Gradual progression (start easy, build up)</option>
                                    <option value="moderate" ${existingData.difficultyPreference === 'moderate' ? 'selected' : ''}>Moderate challenge throughout</option>
                                    <option value="intensive" ${existingData.difficultyPreference === 'intensive' ? 'selected' : ''}>Intensive challenge (jump in deep)</option>
                                    <option value="adaptive" ${existingData.difficultyPreference === 'adaptive' ? 'selected' : ''}>Adaptive (adjust based on performance)</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="motivationFactors" class="form-label">What motivates you most in learning? (select up to 3)</label>
                                <div class="checkbox-group">
                                    ${[
                                        'Achievement badges and recognition',
                                        'Progress tracking and analytics',
                                        'Peer collaboration and discussion',
                                        'Real-world application opportunities',
                                        'Expert feedback and mentorship',
                                        'Competitive elements and leaderboards',
                                        'Personal reflection and journaling',
                                        'Immediate practical benefits'
                                    ].map(factor => {
                                        const isChecked = existingData.motivationFactors && existingData.motivationFactors.includes(factor);
                                        return `
                                            <label class="checkbox-label">
                                                <input type="checkbox" name="motivationFactors" value="${factor}" ${isChecked ? 'checked' : ''}>
                                                <span class="checkbox-custom"></span>
                                                ${factor}
                                            </label>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        </form>
                        
                        <div class="step-actions">
                            <button class="secondary-btn" data-action="prev-step">Back</button>
                            <button class="primary-btn" data-action="next-step">Continue</button>
                        </div>
                    </div>
                </div>
            `;
        }

        function generateGoalSettingStep() {
            const existingData = onboardingState.stepData['goal-setting'] || {};
            
            return `
                <div class="onboarding-step goal-setting-step">
                    <div class="onboarding-container">
                        <div class="step-header">
                            <div class="step-icon">🎯</div>
                            <h1 class="step-title">Goals & Objectives</h1>
                            <p class="step-subtitle">Define what success looks like for your 90-day learning journey</p>
                        </div>
                        
                        <form class="onboarding-form" data-step="goal-setting">
                            <div class="form-group">
                                <label for="primaryGoal" class="form-label">Primary Learning Goal *</label>
                                <select id="primaryGoal" name="primaryGoal" class="form-select" required>
                                    <option value="">Select your primary goal...</option>
                                    <option value="promotion" ${existingData.primaryGoal === 'promotion' ? 'selected' : ''}>Prepare for promotion/advancement</option>
                                    <option value="career-change" ${existingData.primaryGoal === 'career-change' ? 'selected' : ''}>Career change or transition</option>
                                    <option value="skill-gap" ${existingData.primaryGoal === 'skill-gap' ? 'selected' : ''}>Address specific skill gaps</option>
                                    <option value="leadership" ${existingData.primaryGoal === 'leadership' ? 'selected' : ''}>Develop leadership capabilities</option>
                                    <option value="productivity" ${existingData.primaryGoal === 'productivity' ? 'selected' : ''}>Improve work efficiency/productivity</option>
                                    <option value="confidence" ${existingData.primaryGoal === 'confidence' ? 'selected' : ''}>Build confidence in current role</option>
                                    <option value="innovation" ${existingData.primaryGoal === 'innovation' ? 'selected' : ''}>Drive innovation in my organization</option>
                                    <option value="entrepreneurship" ${existingData.primaryGoal === 'entrepreneurship' ? 'selected' : ''}>Prepare for entrepreneurship</option>
                                    <option value="other" ${existingData.primaryGoal === 'other' ? 'selected' : ''}>Other (specify below)</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="specificObjectives" class="form-label">Specific Objectives *</label>
                                <textarea id="specificObjectives" name="specificObjectives" class="form-textarea" 
                                          rows="4" placeholder="Describe 2-3 specific, measurable objectives you want to achieve in the next 90 days..." required>${existingData.specificObjectives || ''}</textarea>
                                <div class="form-help">Be specific and measurable (e.g., "Lead a cross-functional project team of 8 people" or "Deliver a presentation to senior leadership")</div>
                            </div>
                            
                            <div class="form-group">
                                <label for="successMetrics" class="form-label">How will you measure success? *</label>
                                <textarea id="successMetrics" name="successMetrics" class="form-textarea" 
                                          rows="3" placeholder="How will you know you've achieved your goals?" required>${existingData.successMetrics || ''}</textarea>
                            </div>
                            
                            <div class="form-group">
                                <label for="timelineUrgency" class="form-label">Timeline Urgency *</label>
                                <select id="timelineUrgency" name="timelineUrgency" class="form-select" required>
                                    <option value="">Select urgency level...</option>
                                    <option value="immediate" ${existingData.timelineUrgency === 'immediate' ? 'selected' : ''}>Immediate need (within 30 days)</option>
                                    <option value="near-term" ${existingData.timelineUrgency === 'near-term' ? 'selected' : ''}>Near-term goal (30-60 days)</option>
                                    <option value="full-program" ${existingData.timelineUrgency === 'full-program' ? 'selected' : ''}>Full program duration (90 days)</option>
                                    <option value="long-term" ${existingData.timelineUrgency === 'long-term' ? 'selected' : ''}>Long-term development (90+ days)</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="currentObstacles" class="form-label">Potential Obstacles</label>
                                <textarea id="currentObstacles" name="currentObstacles" class="form-textarea" 
                                          rows="3" placeholder="What challenges or obstacles might prevent you from achieving these goals?">${existingData.currentObstacles || ''}</textarea>
                                <div class="form-help">Identifying obstacles helps us prepare strategies to overcome them</div>
                            </div>
                            
                            <div class="form-group">
                                <label for="supportSystems" class="form-label">Available Support Systems</label>
                                <div class="checkbox-group">
                                    ${[
                                        'Supportive manager/supervisor',
                                        'Mentor or coach',
                                        'Peer learning group',
                                        'Professional network',
                                        'Organizational learning resources',
                                        'Family support for time commitment',
                                        'Budget for additional resources',
                                        'Flexible work arrangements'
                                    ].map(support => {
                                        const isChecked = existingData.supportSystems && existingData.supportSystems.includes(support);
                                        return `
                                            <label class="checkbox-label">
                                                <input type="checkbox" name="supportSystems" value="${support}" ${isChecked ? 'checked' : ''}>
                                                <span class="checkbox-custom"></span>
                                                ${support}
                                            </label>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        </form>
                        
                        <div class="step-actions">
                            <button class="secondary-btn" data-action="prev-step">Back</button>
                            <button class="primary-btn" data-action="next-step">Continue</button>
                        </div>
                    </div>
                </div>
            `;
        }

        function generateCustomizationStep() {
            const existingData = onboardingState.stepData['customization'] || {};
            
            return `
                <div class="onboarding-step customization-step">
                    <div class="onboarding-container">
                        <div class="step-header">
                            <div class="step-icon">🎨</div>
                            <h1 class="step-title">Personalization</h1>
                            <p class="step-subtitle">Customize your learning environment and preferences</p>
                        </div>
                        
                        <form class="onboarding-form" data-step="customization">
                            <div class="form-group">
                                <label for="themePreference" class="form-label">Visual Theme Preference</label>
                                <select id="themePreference" name="themePreference" class="form-select">
                                    <option value="auto" ${existingData.themePreference === 'auto' ? 'selected' : ''}>Auto (follow system preference)</option>
                                    <option value="light" ${existingData.themePreference === 'light' ? 'selected' : ''}>Light theme</option>
                                    <option value="dark" ${existingData.themePreference === 'dark' ? 'selected' : ''}>Dark theme</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="reminderPreferences" class="form-label">Learning Reminders</label>
                                <div class="checkbox-group">
                                    ${[
                                        'Daily learning reminder',
                                        'Weekly progress summary',
                                        'Milestone achievement notifications',
                                        'Encouragement messages',
                                        'Streak maintenance alerts'
                                    ].map(reminder => {
                                        const isChecked = existingData.reminderPreferences && existingData.reminderPreferences.includes(reminder);
                                        return `
                                            <label class="checkbox-label">
                                                <input type="checkbox" name="reminderPreferences" value="${reminder}" ${isChecked ? 'checked' : ''}>
                                                <span class="checkbox-custom"></span>
                                                ${reminder}
                                            </label>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="contentComplexity" class="form-label">Content Complexity Preference</label>
                                <select id="contentComplexity" name="contentComplexity" class="form-select">
                                    <option value="beginner-friendly" ${existingData.contentComplexity === 'beginner-friendly' ? 'selected' : ''}>Beginner-friendly explanations</option>
                                    <option value="balanced" ${existingData.contentComplexity === 'balanced' ? 'selected' : ''}>Balanced complexity</option>
                                    <option value="advanced" ${existingData.contentComplexity === 'advanced' ? 'selected' : ''}>Advanced/technical focus</option>
                                    <option value="adaptive" ${existingData.contentComplexity === 'adaptive' ? 'selected' : ''}>Adaptive based on performance</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="languagePreference" class="form-label">Language Preference</label>
                                <select id="languagePreference" name="languagePreference" class="form-select">
                                    <option value="en" ${existingData.languagePreference === 'en' ? 'selected' : ''}>English</option>
                                    <option value="es" ${existingData.languagePreference === 'es' ? 'selected' : ''}>Español</option>
                                    <option value="fr" ${existingData.languagePreference === 'fr' ? 'selected' : ''}>Français</option>
                                    <option value="de" ${existingData.languagePreference === 'de' ? 'selected' : ''}>Deutsch</option>
                                    <option value="pt" ${existingData.languagePreference === 'pt' ? 'selected' : ''}>Português</option>
                                    <option value="ar" ${existingData.languagePreference === 'ar' ? 'selected' : ''}>العربية</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="additionalPreferences" class="form-label">Additional Preferences or Comments</label>
                                <textarea id="additionalPreferences" name="additionalPreferences" class="form-textarea" 
                                          rows="3" placeholder="Any additional preferences, accessibility needs, or special considerations?">${existingData.additionalPreferences || ''}</textarea>
                            </div>
                        </form>
                        
                        <div class="step-actions">
                            <button class="secondary-btn" data-action="prev-step">Back</button>
                            <button class="primary-btn" data-action="complete-onboarding">Generate My Learning Path</button>
                        </div>
                    </div>
                </div>
            `;
        }

        function generateCompletionStep() {
            return `
                <div class="onboarding-step completion-step">
                    <div class="onboarding-container">
                        <div class="step-header">
                            <div class="step-icon">🎉</div>
                            <h1 class="step-title">Welcome to Growth90!</h1>
                            <p class="step-subtitle">Your personalized learning journey is ready to begin</p>
                        </div>
                        
                        <div class="completion-content">
                            <div class="completion-summary">
                                <h3>Your Learning Profile Summary:</h3>
                                <div id="profile-summary" class="profile-summary">
                                    <!-- Profile summary will be populated dynamically -->
                                </div>
                            </div>
                            
                            <div class="next-steps">
                                <h3>What happens next:</h3>
                                <div class="next-steps-list">
                                    <div class="next-step-item">
                                        <div class="step-number">1</div>
                                        <div class="step-content">
                                            <h4>Explore Your Home</h4>
                                            <p>Review your personalized learning path and daily objectives</p>
                                        </div>
                                    </div>
                                    <div class="next-step-item">
                                        <div class="step-number">2</div>
                                        <div class="step-content">
                                            <h4>Begin Day 1</h4>
                                            <p>Start your first learning session when you're ready</p>
                                        </div>
                                    </div>
                                    <div class="next-step-item">
                                        <div class="step-number">3</div>
                                        <div class="step-content">
                                            <h4>Track Your Progress</h4>
                                            <p>Monitor your advancement and celebrate milestones</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="motivation-message">
                                <blockquote>
                                    "The journey of a thousand miles begins with a single step. Your professional transformation starts today."
                                </blockquote>
                            </div>
                        </div>
                        
                        <div class="step-actions">
                            <button class="primary-btn" data-action="go-to-home">Go to Home</button>
                            <button class="secondary-btn" data-action="review-profile">Review Profile</button>
                        </div>
                    </div>
                </div>
            `;
        }

        function generateTimezoneOptions(selectedTimezone = null) {
            const timezones = [
                'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
                'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Rome',
                'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Kolkata', 'Asia/Dubai',
                'Australia/Sydney', 'Australia/Melbourne',
                'Africa/Cairo', 'Africa/Johannesburg'
            ];
            
            const defaultTimezone = selectedTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
            
            return timezones.map(tz => {
                const isSelected = tz === defaultTimezone ? 'selected' : '';
                const displayName = tz.replace('_', ' ').replace('/', ' - ');
                return `<option value="${tz}" ${isSelected}>${displayName}</option>`;
            }).join('');
        }

        function initializeStepInteractions(stepName) {
            const stepElement = currentStepElement;
            if (!stepElement) return;

            // Form validation
            const form = stepElement.querySelector('.onboarding-form');
            if (form) {
                setupFormValidation(form);
            }

            // Step-specific interactions
            switch (stepName) {
                case 'skills-assessment':
                    setupSkillsAssessmentInteractions();
                    break;
                case 'learning-preferences':
                    setupLearningPreferencesInteractions();
                    break;
                case 'completion':
                    setupCompletionInteractions();
                    break;
            }

            // Action button handlers
            stepElement.addEventListener('click', handleStepActions);
        }

        function setupFormValidation(form) {
            const inputs = form.querySelectorAll('input, select, textarea');
            
            inputs.forEach(input => {
                input.addEventListener('blur', validateField);
                input.addEventListener('input', clearFieldError);
            });
            
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                validateForm(form);
            });
        }

        function validateField(e) {
            const field = e.target;
            const value = field.value.trim();
            
            clearFieldError(e);
            
            if (field.hasAttribute('required') && !value) {
                showFieldError(field, 'This field is required');
                return false;
            }
            
            if (field.type === 'email' && value && !Growth90.Core.Utils.isValidEmail(value)) {
                showFieldError(field, 'Please enter a valid email address');
                return false;
            }
            
            return true;
        }

        function clearFieldError(e) {
            const field = e.target;
            const errorElement = field.parentNode.querySelector('.form-error');
            if (errorElement) {
                errorElement.remove();
            }
            field.classList.remove('error');
        }

        function showFieldError(field, message) {
            clearFieldError({ target: field });
            
            field.classList.add('error');
            const errorElement = document.createElement('div');
            errorElement.className = 'form-error';
            errorElement.textContent = message;
            field.parentNode.appendChild(errorElement);
        }

        function validateForm(form) {
            const fields = form.querySelectorAll('input, select, textarea');
            let isValid = true;
            
            fields.forEach(field => {
                if (!validateField({ target: field })) {
                    isValid = false;
                }
            });
            
            return isValid;
        }

        function setupSkillsAssessmentInteractions() {
            const ratingGroups = currentStepElement.querySelectorAll('.rating-group');
            
            ratingGroups.forEach(group => {
                const radioButtons = group.querySelectorAll('input[type="radio"]');
                
                radioButtons.forEach(radio => {
                    radio.addEventListener('change', () => {
                        // Visual feedback for selection
                        const labels = group.querySelectorAll('.rating-option');
                        labels.forEach(label => label.classList.remove('selected'));
                        radio.closest('.rating-option').classList.add('selected');
                        
                        // Handle follow-up questions
                        if (radio.dataset.followUp === 'true') {
                            handleFollowUpQuestions(radio);
                        }
                        
                        // Update assessment results
                        updateAssessmentResults();
                    });
                });
            });

            // Set up scenario question interactions
            const scenarioQuestions = currentStepElement.querySelectorAll('.scenario-question');
            scenarioQuestions.forEach(question => {
                const inputs = question.querySelectorAll('input, textarea');
                inputs.forEach(input => {
                    input.addEventListener('change', updateAssessmentResults);
                    input.addEventListener('input', updateAssessmentResults);
                });
            });
        }

        function handleFollowUpQuestions(radio) {
            const questionElement = radio.closest('.skill-question');
            const questionId = questionElement.dataset.questionId;
            const skillArea = questionElement.closest('.skill-area').dataset.skill;
            const rating = parseInt(radio.value);
            
            // Find the question configuration
            const questionGroups = ONBOARDING_CONFIG.assessmentQuestions[skillArea];
            if (!questionGroups || !questionGroups.core) return;
            
            const questionConfig = questionGroups.core.find(q => q.id === questionId);
            if (!questionConfig || !questionConfig.followUp) return;
            
            const followUpContainer = questionElement.closest('.skill-area').querySelector('.follow-up-questions');
            
            // Check if follow-up condition is met
            if (questionConfig.followUp.condition(rating)) {
                // Generate follow-up questions
                const followUpHTML = questionConfig.followUp.questions.map((question, index) => {
                    const followUpId = `${questionId}_followup_${index}`;
                    return `
                        <div class="follow-up-question" data-parent="${questionId}">
                            <label class="question-label follow-up-label">${question}</label>
                            <textarea name="${followUpId}" class="form-textarea follow-up-response" 
                                      rows="3" placeholder="Please elaborate..."></textarea>
                        </div>
                    `;
                }).join('');
                
                followUpContainer.innerHTML = followUpHTML;
                followUpContainer.style.display = 'block';
                
                // Add smooth animation
                followUpContainer.style.opacity = '0';
                followUpContainer.style.transform = 'translateY(-10px)';
                setTimeout(() => {
                    followUpContainer.style.transition = 'all 0.3s ease-out';
                    followUpContainer.style.opacity = '1';
                    followUpContainer.style.transform = 'translateY(0)';
                }, 10);
                
            } else {
                // Hide follow-up questions if condition not met
                followUpContainer.style.display = 'none';
                followUpContainer.innerHTML = '';
            }
        }

        function updateAssessmentResults() {
            const form = currentStepElement.querySelector('.assessment-form');
            const formData = new FormData(form);
            const results = {};
            
            // Process assessment responses
            Object.entries(ONBOARDING_CONFIG.assessmentQuestions).forEach(([skillArea, questions]) => {
                results[skillArea] = {
                    scores: [],
                    average: 0
                };
                
                questions.forEach((question, index) => {
                    const questionId = `${skillArea}_${index}`;
                    const score = parseInt(formData.get(questionId)) || 0;
                    results[skillArea].scores.push(score);
                });
                
                const scores = results[skillArea].scores.filter(score => score > 0);
                results[skillArea].average = scores.length > 0 
                    ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
                    : 0;
            });
            
            onboardingState.assessmentResults = results;
        }

        function setupLearningPreferencesInteractions() {
            // Limit motivation factors to 3 selections
            const motivationCheckboxes = currentStepElement.querySelectorAll('input[name="motivationFactors"]');
            
            motivationCheckboxes.forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    const checkedBoxes = Array.from(motivationCheckboxes).filter(cb => cb.checked);
                    
                    if (checkedBoxes.length > 3) {
                        checkbox.checked = false;
                        Growth90.UI.Components.Notifications.warning('Please select up to 3 motivation factors');
                    }
                });
            });
        }

        function setupCompletionInteractions() {
            // Populate profile summary
            const summaryElement = document.getElementById('profile-summary');
            if (summaryElement) {
                summaryElement.innerHTML = generateProfileSummary();
            }
        }

        function generateProfileSummary() {
            const personalInfo = onboardingState.stepData['personal-info'] || {};
            const professionalContext = onboardingState.stepData['professional-context'] || {};
            const learningPrefs = onboardingState.stepData['learning-preferences'] || {};
            const goals = onboardingState.stepData['goal-setting'] || {};
            
            return `
                <div class="summary-section">
                    <h4>Personal Information</h4>
                    <p><strong>Name:</strong> ${personalInfo.firstName} ${personalInfo.lastName}</p>
                    <p><strong>Email:</strong> ${personalInfo.email}</p>
                    <p><strong>Timezone:</strong> ${personalInfo.timezone}</p>
                </div>
                
                <div class="summary-section">
                    <h4>Professional Context</h4>
                    <p><strong>Role:</strong> ${professionalContext.currentRole}</p>
                    <p><strong>Industry:</strong> ${professionalContext.industry}</p>
                    <p><strong>Experience:</strong> ${professionalContext.experience}</p>
                    <p><strong>Organization Size:</strong> ${professionalContext.companySize}</p>
                </div>
                
                <div class="summary-section">
                    <h4>Learning Preferences</h4>
                    <p><strong>Daily Commitment:</strong> ${learningPrefs.dailyTimeCommitment} minutes</p>
                    <p><strong>Preferred Time:</strong> ${learningPrefs.preferredTime}</p>
                    <p><strong>Learning Styles:</strong> ${(learningPrefs.learningStyles || []).join(', ')}</p>
                </div>
                
                <div class="summary-section">
                    <h4>Goals</h4>
                    <p><strong>Primary Goal:</strong> ${goals.primaryGoal}</p>
                    <p><strong>Timeline:</strong> ${goals.timelineUrgency}</p>
                </div>
            `;
        }

        function handleStepActions(e) {
            const action = e.target.getAttribute('data-action');
            if (!action) return;
            
            e.preventDefault();
            
            switch (action) {
                case 'next-step':
                    nextStep();
                    break;
                case 'prev-step':
                    previousStep();
                    break;
                case 'complete-onboarding':
                    completeOnboarding();
                    break;
                case 'go-to-home':
                    Growth90.Core.Router.navigate('learning');
                    break;
                case 'review-profile':
                    Growth90.Core.Router.navigate('profile');
                    break;
            }
        }

        function nextStep() {
            if (isTransitioning) return;
            
            // Validate current step
            const form = currentStepElement.querySelector('.onboarding-form');
            if (form && !validateForm(form)) {
                Growth90.UI.Components.Notifications.error('Please complete all required fields before continuing');
                return;
            }
            
            // Save step data
            saveCurrentStepData();
            
            // Move to next step
            if (onboardingState.currentStep < ONBOARDING_CONFIG.steps.length - 1) {
                onboardingState.currentStep++;
                Growth90.Core.Router.navigate('onboarding', [onboardingState.currentStep]);
            }
        }

        function previousStep() {
            if (isTransitioning) return;
            
            // Save current step data (no validation required for going back)
            saveCurrentStepData();
            
            // Move to previous step
            if (onboardingState.currentStep > 0) {
                onboardingState.currentStep--;
                Growth90.Core.Router.navigate('onboarding', [onboardingState.currentStep]);
            }
        }

        function saveCurrentStepData() {
            const form = currentStepElement.querySelector('.onboarding-form');
            if (!form) return;
            
            const stepName = form.getAttribute('data-step');
            const formData = new FormData(form);
            const stepData = {};
            
            // Process form data
            for (const [key, value] of formData.entries()) {
                if (stepData[key]) {
                    // Handle multiple values (checkboxes)
                    if (Array.isArray(stepData[key])) {
                        stepData[key].push(value);
                    } else {
                        stepData[key] = [stepData[key], value];
                    }
                } else {
                    stepData[key] = value;
                }
            }
            
            // Handle checkboxes that weren't checked
            const checkboxes = form.querySelectorAll('input[type="checkbox"]');
            const checkboxGroups = {};
            
            checkboxes.forEach(checkbox => {
                const name = checkbox.name;
                if (!checkboxGroups[name]) {
                    checkboxGroups[name] = [];
                }
                if (checkbox.checked) {
                    checkboxGroups[name].push(checkbox.value);
                }
            });
            
            Object.entries(checkboxGroups).forEach(([name, values]) => {
                stepData[name] = values;
            });
            
            onboardingState.stepData[stepName] = stepData;
            
            // Update user profile
            Object.assign(onboardingState.userProfile, stepData);
            
        }

        async function completeOnboarding() {
            try {
                Growth90.UI.Components.Loading.show('Creating your personalized learning path...');
                
                // Save final step data
                saveCurrentStepData();
                
                // Mark onboarding as complete
                onboardingState.userProfile.completedOnboarding = true;
                onboardingState.userProfile.onboardingCompletedAt = new Date().toISOString();
                
                // Save user profile to storage
                await Growth90.Data.Storage.setItem('userProfiles', onboardingState.userProfile);
                
                // Update app state
                Growth90.Data.Models.AppState.setState({ 
                    user: onboardingState.userProfile 
                });
                
                // Generate comprehensive learning path using the enhanced system
                const learningPath = await Growth90.Learning.PathManager.generateLearningPath(
                    onboardingState.userProfile,
                    onboardingState.assessmentResults,
                    onboardingState.stepData['learning-preferences']
                );
                
                // Navigate to completion step
                onboardingState.currentStep = ONBOARDING_CONFIG.steps.length - 1;
                renderCurrentStep();
                
                Growth90.Core.EventBus.emit('onboarding:complete', {
                    user: onboardingState.userProfile,
                    learningPath: learningPath
                });
                
                Growth90.UI.Components.Notifications.success('Your learning path has been created successfully!');
                
            } catch (error) {
                console.error('❌ Failed to complete onboarding:', error);
                Growth90.UI.Components.Notifications.error('Failed to complete onboarding. Please try again.');
            } finally {
                Growth90.UI.Components.Loading.hide();
            }
        }

        async function generateLearningPath() {
            // This is a simplified learning path generation
            // In a real implementation, this would call an API
            
            const personalInfo = onboardingState.stepData['personal-info'] || {};
            const professionalContext = onboardingState.stepData['professional-context'] || {};
            const goals = onboardingState.stepData['goal-setting'] || {};
            const preferences = onboardingState.stepData['learning-preferences'] || {};
            
            const learningPath = {
                id: Growth90.Core.Utils.generateId(),
                userId: onboardingState.userProfile.id,
                title: `${personalInfo.firstName}'s Professional Development Journey`,
                description: `A personalized 90-day learning path focused on ${goals.primaryGoal}`,
                duration: 90,
                industry: professionalContext.industry,
                role: professionalContext.currentRole,
                primaryGoal: goals.primaryGoal,
                dailyTimeCommitment: preferences.dailyTimeCommitment,
                status: 'active',
                createdAt: new Date().toISOString(),
                milestones: [
                    { day: 30, title: 'First Competency Review', description: 'Assess initial progress and adjust path' },
                    { day: 45, title: 'Mid-Program Assessment', description: 'Comprehensive skills evaluation' },
                    { day: 60, title: 'Advanced Application Phase', description: 'Apply skills in real-world scenarios' },
                    { day: 90, title: 'Program Completion', description: 'Final assessment and certification' }
                ],
                modules: generateLearningModules(professionalContext, goals, preferences)
            };
            
            return learningPath;
        }

        function generateLearningModules(professionalContext, goals, preferences) {
            // Simplified module generation based on user input
            const baseModules = [
                {
                    id: 'foundation',
                    title: 'Foundation Skills',
                    description: 'Core professional competencies',
                    duration: 20,
                    lessons: [
                        { id: 'communication-basics', title: 'Effective Communication Fundamentals' },
                        { id: 'time-management', title: 'Advanced Time Management' },
                        { id: 'critical-thinking', title: 'Critical Thinking and Analysis' }
                    ]
                },
                {
                    id: 'specialization',
                    title: 'Role-Specific Skills',
                    description: `Skills specific to ${professionalContext.currentRole}`,
                    duration: 40,
                    lessons: [
                        { id: 'leadership-basics', title: 'Leadership Fundamentals' },
                        { id: 'decision-making', title: 'Strategic Decision Making' },
                        { id: 'team-dynamics', title: 'Team Dynamics and Collaboration' }
                    ]
                },
                {
                    id: 'application',
                    title: 'Practical Application',
                    description: 'Real-world skill application and assessment',
                    duration: 30,
                    lessons: [
                        { id: 'project-management', title: 'Project Management Essentials' },
                        { id: 'innovation', title: 'Innovation and Creative Problem Solving' },
                        { id: 'reflection', title: 'Reflection and Continuous Improvement' }
                    ]
                }
            ];
            
            return baseModules;
        }

        function updateProgressIndicator() {
            const progress = Math.round((onboardingState.currentStep / (ONBOARDING_CONFIG.steps.length - 1)) * 100);
            
            // Update any progress indicators in the UI
            const progressElements = document.querySelectorAll('.onboarding-progress');
            progressElements.forEach(element => {
                element.style.width = `${progress}%`;
                element.setAttribute('aria-valuenow', progress);
            });
        }

        function handleStepComplete(data) {
        }

        function handleOnboardingComplete(data) {
            Growth90.UI.Components.Notifications.success('Welcome to Growth90! Your learning journey begins now.');
        }

        // Public API
        return {
            initialize,
            startOnboarding,
            getCurrentStep: () => onboardingState.currentStep,
            getOnboardingState: () => Growth90.Core.Utils.deepClone(onboardingState)
        };
    })();

    // Initialize onboarding system when app starts
    Growth90.Core.EventBus.on('app:initialized', () => {
        Growth90.User.Onboarding.initialize();
    });

})(window.Growth90 = window.Growth90 || {
    Core: { EventBus: { on: () => {}, emit: () => {} } },
    Data: {}, UI: {}, Learning: {}, User: {}
});
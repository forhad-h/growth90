/**
 * Growth90 Simplified Onboarding System
 * Basic functional onboarding flow
 */

(function(Growth90) {
    'use strict';

    // Simple onboarding flow
    Growth90.User.Onboarding = (() => {
        let currentStep = 0;
        let onboardingData = {};

        const steps = [
            {
                id: 'welcome',
                title: 'Welcome to Growth90',
                content: generateWelcomeStep
            },
            {
                id: 'personal-info',
                title: 'Personal Information',
                content: generatePersonalInfoStep
            },
            {
                id: 'professional-context',
                title: 'Professional Background',
                content: generateProfessionalStep
            },
            {
                id: 'preferences',
                title: 'Learning Preferences',
                content: generatePreferencesStep
            },
            {
                id: 'completion',
                title: 'Setup Complete',
                content: generateCompletionStep
            }
        ];

        function startOnboarding() {
            currentStep = 0;
            onboardingData = {};
            renderOnboardingStep();
        }

        function renderOnboardingStep() {
            const contentArea = document.getElementById('app-content');
            const step = steps[currentStep];
            
            contentArea.innerHTML = `
                <div class="onboarding-container">
                    <div class="onboarding-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${((currentStep + 1) / steps.length) * 100}%"></div>
                        </div>
                        <span class="progress-text">Step ${currentStep + 1} of ${steps.length}</span>
                    </div>
                    
                    <div class="onboarding-content">
                        <h1 class="onboarding-title">${step.title}</h1>
                        <div class="step-content" id="step-content">
                            ${step.content()}
                        </div>
                    </div>
                    
                    <div class="onboarding-actions">
                        ${currentStep > 0 ? '<button class="secondary-btn" id="prev-btn">Previous</button>' : ''}
                        <button class="primary-btn" id="next-btn">${currentStep === steps.length - 1 ? 'Complete Setup' : 'Next'}</button>
                    </div>
                </div>
            `;

            setupStepEventListeners();
        }

        function generateWelcomeStep() {
            return `
                <div class="welcome-step">
                    <div class="welcome-icon">🎓</div>
                    <p class="welcome-text">Welcome to Growth90, your personalized professional learning platform! We'll help you transform your skills in just 90 days.</p>
                    <div class="welcome-features">
                        <div class="feature">
                            <span class="feature-icon">🎯</span>
                            <span>Personalized learning paths</span>
                        </div>
                        <div class="feature">
                            <span class="feature-icon">📊</span>
                            <span>Real-time progress tracking</span>
                        </div>
                        <div class="feature">
                            <span class="feature-icon">🤝</span>
                            <span>Professional community</span>
                        </div>
                    </div>
                </div>
            `;
        }

        function generatePersonalInfoStep() {
            return `
                <div class="personal-info-step">
                    <div class="form-group">
                        <label for="firstName" class="form-label">First Name</label>
                        <input type="text" id="firstName" class="form-input" placeholder="Your first name" value="${onboardingData.firstName || ''}">
                    </div>
                    
                    <div class="form-group">
                        <label for="lastName" class="form-label">Last Name</label>
                        <input type="text" id="lastName" class="form-input" placeholder="Your last name" value="${onboardingData.lastName || ''}">
                    </div>
                    
                    <div class="form-group">
                        <label for="email" class="form-label">Email</label>
                        <input type="email" id="email" class="form-input" placeholder="your.email@company.com" value="${onboardingData.email || ''}">
                    </div>
                </div>
            `;
        }

        function generateProfessionalStep() {
            return `
                <div class="professional-step">
                    <div class="form-group">
                        <label for="industry" class="form-label">Industry</label>
                        <select id="industry" class="form-select">
                            <option value="">Select your industry</option>
                            <option value="Technology & Software" ${onboardingData.industry === 'Technology & Software' ? 'selected' : ''}>Technology & Software</option>
                            <option value="Healthcare & Medicine" ${onboardingData.industry === 'Healthcare & Medicine' ? 'selected' : ''}>Healthcare & Medicine</option>
                            <option value="Finance & Banking" ${onboardingData.industry === 'Finance & Banking' ? 'selected' : ''}>Finance & Banking</option>
                            <option value="Education" ${onboardingData.industry === 'Education' ? 'selected' : ''}>Education</option>
                            <option value="Marketing & Sales" ${onboardingData.industry === 'Marketing & Sales' ? 'selected' : ''}>Marketing & Sales</option>
                            <option value="Other" ${onboardingData.industry === 'Other' ? 'selected' : ''}>Other</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="currentRole" class="form-label">Current Role</label>
                        <select id="currentRole" class="form-select">
                            <option value="">Select your role</option>
                            <option value="Individual Contributor" ${onboardingData.currentRole === 'Individual Contributor' ? 'selected' : ''}>Individual Contributor</option>
                            <option value="Team Lead" ${onboardingData.currentRole === 'Team Lead' ? 'selected' : ''}>Team Lead</option>
                            <option value="Manager" ${onboardingData.currentRole === 'Manager' ? 'selected' : ''}>Manager</option>
                            <option value="Director" ${onboardingData.currentRole === 'Director' ? 'selected' : ''}>Director</option>
                            <option value="Executive" ${onboardingData.currentRole === 'Executive' ? 'selected' : ''}>Executive</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="experience" class="form-label">Years of Experience</label>
                        <select id="experience" class="form-select">
                            <option value="">Select experience level</option>
                            <option value="0-2" ${onboardingData.experience === '0-2' ? 'selected' : ''}>0-2 years</option>
                            <option value="3-5" ${onboardingData.experience === '3-5' ? 'selected' : ''}>3-5 years</option>
                            <option value="6-10" ${onboardingData.experience === '6-10' ? 'selected' : ''}>6-10 years</option>
                            <option value="10+" ${onboardingData.experience === '10+' ? 'selected' : ''}>10+ years</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="primaryGoal" class="form-label">Primary Learning Goal</label>
                        <select id="primaryGoal" class="form-select">
                            <option value="">Select your main goal</option>
                            <option value="career-advancement" ${onboardingData.primaryGoal === 'career-advancement' ? 'selected' : ''}>Career Advancement</option>
                            <option value="skill-improvement" ${onboardingData.primaryGoal === 'skill-improvement' ? 'selected' : ''}>Skill Improvement</option>
                            <option value="leadership-development" ${onboardingData.primaryGoal === 'leadership-development' ? 'selected' : ''}>Leadership Development</option>
                            <option value="job-transition" ${onboardingData.primaryGoal === 'job-transition' ? 'selected' : ''}>Job Transition</option>
                        </select>
                    </div>
                </div>
            `;
        }

        function generatePreferencesStep() {
            return `
                <div class="preferences-step">
                    <div class="form-group">
                        <label for="dailyTimeCommitment" class="form-label">Daily Time Commitment</label>
                        <select id="dailyTimeCommitment" class="form-select">
                            <option value="">How much time can you dedicate daily?</option>
                            <option value="15-30" ${onboardingData.dailyTimeCommitment === '15-30' ? 'selected' : ''}>15-30 minutes</option>
                            <option value="30-45" ${onboardingData.dailyTimeCommitment === '30-45' ? 'selected' : ''}>30-45 minutes</option>
                            <option value="45-60" ${onboardingData.dailyTimeCommitment === '45-60' ? 'selected' : ''}>45-60 minutes</option>
                            <option value="60+" ${onboardingData.dailyTimeCommitment === '60+' ? 'selected' : ''}>60+ minutes</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Preferred Learning Styles</label>
                        <div class="checkbox-group">
                            <label class="checkbox-option">
                                <input type="checkbox" value="visual" ${(onboardingData.learningStyles || []).includes('visual') ? 'checked' : ''}>
                                <span>📊 Visual (charts, diagrams)</span>
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" value="reading" ${(onboardingData.learningStyles || []).includes('reading') ? 'checked' : ''}>
                                <span>📖 Reading/Writing</span>
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" value="interactive" ${(onboardingData.learningStyles || []).includes('interactive') ? 'checked' : ''}>
                                <span>🤲 Interactive exercises</span>
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" value="social" ${(onboardingData.learningStyles || []).includes('social') ? 'checked' : ''}>
                                <span>👥 Group activities</span>
                            </label>
                        </div>
                    </div>
                </div>
            `;
        }

        function generateCompletionStep() {
            return `
                <div class="completion-step">
                    <div class="completion-icon">🎉</div>
                    <h2>Setup Complete!</h2>
                    <p>Welcome to Growth90, ${onboardingData.firstName || 'there'}! Your personalized learning journey is ready.</p>
                    
                    <div class="completion-summary">
                        <div class="summary-item">
                            <strong>Industry:</strong> ${onboardingData.industry || 'Not specified'}
                        </div>
                        <div class="summary-item">
                            <strong>Role:</strong> ${onboardingData.currentRole || 'Not specified'}
                        </div>
                        <div class="summary-item">
                            <strong>Daily Commitment:</strong> ${onboardingData.dailyTimeCommitment || 'Not specified'} minutes
                        </div>
                    </div>
                    
                    <p>We're now creating your personalized 90-day learning path...</p>
                </div>
            `;
        }

        function setupStepEventListeners() {
            const nextBtn = document.getElementById('next-btn');
            const prevBtn = document.getElementById('prev-btn');

            if (nextBtn) {
                nextBtn.addEventListener('click', handleNext);
            }

            if (prevBtn) {
                prevBtn.addEventListener('click', handlePrevious);
            }

            // Auto-save form data
            const inputs = document.querySelectorAll('input, select');
            inputs.forEach(input => {
                input.addEventListener('change', saveStepData);
            });
        }

        function saveStepData() {
            const stepId = steps[currentStep].id;
            
            switch (stepId) {
                case 'personal-info':
                    onboardingData.firstName = document.getElementById('firstName')?.value || '';
                    onboardingData.lastName = document.getElementById('lastName')?.value || '';
                    onboardingData.email = document.getElementById('email')?.value || '';
                    break;
                
                case 'professional-context':
                    onboardingData.industry = document.getElementById('industry')?.value || '';
                    onboardingData.currentRole = document.getElementById('currentRole')?.value || '';
                    onboardingData.experience = document.getElementById('experience')?.value || '';
                    onboardingData.primaryGoal = document.getElementById('primaryGoal')?.value || '';
                    break;
                
                case 'preferences':
                    onboardingData.dailyTimeCommitment = document.getElementById('dailyTimeCommitment')?.value || '';
                    
                    const checkedStyles = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
                        .map(cb => cb.value);
                    onboardingData.learningStyles = checkedStyles;
                    break;
            }
        }

        function handleNext() {
            saveStepData();

            if (currentStep === steps.length - 1) {
                completeOnboarding();
            } else {
                currentStep++;
                renderOnboardingStep();
            }
        }

        function handlePrevious() {
            if (currentStep > 0) {
                currentStep--;
                renderOnboardingStep();
            }
        }

        async function completeOnboarding() {
            try {
                Growth90.UI.Components.Loading.show('Setting up your learning experience...');

                // Create user profile
                const userProfile = {
                    id: Growth90.Core.Utils.generateId(),
                    ...onboardingData,
                    createdAt: new Date().toISOString(),
                    onboardingCompleted: true
                };

                // Save user profile
                await Growth90.Data.Storage.setItem('userProfiles', userProfile);

                // Update app state
                Growth90.Data.Models.AppState.setState({ user: userProfile });

                // Generate sample learning path
                const samplePath = generateSampleLearningPath(userProfile);
                await Growth90.Data.Storage.setItem('learningPaths', samplePath);

                Growth90.UI.Components.Loading.hide();
                Growth90.UI.Components.Notifications.success('Welcome to Growth90! Your learning journey begins now.');

                // Navigate to learning path
                setTimeout(() => {
                    Growth90.Core.Router.navigate('learning');
                }, 1500);

            } catch (error) {
                console.error('Failed to complete onboarding:', error);
                Growth90.UI.Components.Loading.hide();
                Growth90.UI.Components.Notifications.error('Failed to complete setup. Please try again.');
            }
        }

        function generateSampleLearningPath(userProfile) {
            return {
                id: Growth90.Core.Utils.generateId(),
                userId: userProfile.id,
                title: `${userProfile.primaryGoal || 'Professional Development'} Journey`,
                description: `A personalized 90-day learning path for ${userProfile.currentRole || 'professional'} in ${userProfile.industry || 'your industry'}`,
                duration: 90,
                status: 'active',
                createdAt: new Date().toISOString(),
                modules: [
                    {
                        id: 'foundation',
                        title: 'Foundation Skills',
                        lessons: [
                            { id: 'lesson_1', title: 'Communication Fundamentals', completed: false },
                            { id: 'lesson_2', title: 'Time Management', completed: false },
                            { id: 'lesson_3', title: 'Professional Ethics', completed: false }
                        ]
                    },
                    {
                        id: 'application',
                        title: 'Practical Application',
                        lessons: [
                            { id: 'lesson_4', title: 'Problem Solving', completed: false },
                            { id: 'lesson_5', title: 'Team Collaboration', completed: false },
                            { id: 'lesson_6', title: 'Project Management', completed: false }
                        ]
                    },
                    {
                        id: 'mastery',
                        title: 'Advanced Mastery',
                        lessons: [
                            { id: 'lesson_7', title: 'Leadership Principles', completed: false },
                            { id: 'lesson_8', title: 'Strategic Thinking', completed: false },
                            { id: 'lesson_9', title: 'Continuous Learning', completed: false }
                        ]
                    }
                ],
                milestones: [
                    { day: 30, title: 'First Competency Review', completed: false },
                    { day: 60, title: 'Mid-Program Assessment', completed: false },
                    { day: 90, title: 'Program Completion', completed: false }
                ]
            };
        }

        return {
            start: startOnboarding,
            getCurrentStep: () => currentStep,
            getOnboardingData: () => onboardingData
        };
    })();

    // Auto-start onboarding when the route is hit
    Growth90.Core.EventBus.on('route:change', (routeData) => {
        if (routeData.to === 'onboarding') {
            Growth90.User.Onboarding.start();
        }
    });

})(window.Growth90 = window.Growth90 || {
    Core: { EventBus: { on: () => {}, emit: () => {} } },
    Data: {}, UI: {}, Learning: {}, User: {}
});
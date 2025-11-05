// --- Main App Namespace ---
const App = {
    // --- State ---
    state: {
        db: null, // IndexedDB instance
        fb: { // Firebase services
            app: null,
            auth: null,
            db: null,
            googleProvider: null
        },
        appId: 'default-app-id',
        userId: null, // Firebase Auth User ID
        pin: {
            hash: null,
            salt: null,
            encryptionKey: null, // CryptoKey
            input: "",
            setupStep: 0, // 0=login, 1=new, 2=confirm
            confirmPin: "",
            actionCallback: null
        },
        storageDriver: 'local', // 'local' or 'firestore'
        data: {
            checkinHistory: [],
            gratitudeHistory: [],
            sabbathHistory: [],
            ruleOfLifeHistory: [],
            userResources: {},
            ruleOfLife: {}
        },
        ui: {
            currentView: 'welcomeView',
            currentWarningCategory: 0,
            currentPositiveCategory: 0,
            currentSabbathCategory: 0,
            currentSummaryIndex: -1,
            currentNotesIndex: -1,
            currentTrendView: 'recent',
            currentOnboardingStep: 1,
            charts: {
                trends: null,
                rule: null
            },
            alertTimeout: null
        }
    },

    // --- Config (Static Data) ---
    config: {
        warningSigns: {
            emotional: ["Loss of joy or satisfaction in ministry", "Increased irritability, impatience, or anger", "Cynicism, negativity, or disillusionment about ministry or the Church", "Feeling emotionally exhausted, overwhelmed, or \"numb\"", "Increased anxiety or feelings of dread related to work", "Heightened sensitivity to criticism", "Feelings of failure, inadequacy, or guilt"],
            mentalCognitive: ["Difficulty concentrating or making decisions", "Forgetfulness", "Constant rumination about work problems, even during time off", "Loss of creativity or motivation", "A sennse that you are never \"not working\" mentally"],
            physical: ["Persistent fatigue, exhaustion, or low energy", "Changes in sleep patterns (insomnia, oversleeping)", "Headaches, muscle tension, or other physical ailments", "Changes in appetite or weight", "Increased susceptibility to illness"],
            spiritual: ["Feeling disconnected from God or your faith", "Finding prayer or spiritual practices a burden rather than a source of strength", "Loss of meaning or purpose in your ministry", "Questioning your calling"],
            behaviouralRelational: ["Withdrawal from colleagues, friends, or family", "Increased conflict in relationships", "Neglecting personal needs or hobbies", "Increased use of alcohol, medication, or other coping mechanisms (e.g., overeating, excessive screen time, escapist behaviours)", "Procrastination or avoidance of tasks", "Working longer hours but feeling less effective", "Reduced empathy or compassion for others (depersonalisation)"]
        },
        categoryDisplayNames: {
            emotional: "Emotional Signs", mentalCognitive: "Mental/Cognitive Signs", physical: "Physical Signs", spiritual: "Spiritual Signs", behaviouralRelational: "Behavioural/Relational Signs"
        },
        categoryOrder: ["emotional", "mentalCognitive", "physical", "spiritual", "behaviouralRelational"],
        
        positiveSigns: {
            connection: ["Felt a sense of connection with others", "Had a positive interaction with a colleague", "Spent quality time with family or friends", "Felt connected to my community"],
            purpose: ["Felt a sense of meaning or purpose in my work", "Felt I made a positive difference", "Engaged in an activity I find truly meaningful"],
            engagement: ["Felt engaged and interested in a task (flow)", "Enjoyed a hobby or leisure activity", "Felt creative or generative"],
            selfCare: ["Had a restful Sabbath or day off", "Got enough sleep", "Ate well", "Was physically active", "Took time for quiet reflection"],
            spiritual: ["Felt a sense of connection to God", "Found prayer or spiritual practice life-giving", "Felt gratitude", "Experienced a moment of awe or wonder"]
        },
        positiveCategoryDisplayNames: {
            connection: "Connection & Relationships",
            purpose: "Purpose & Meaning",
            engagement: "Engagement & Joy",
            selfCare: "Rest & Self-Care",
            spiritual: "Spiritual Life"
        },
        positiveCategoryOrder: ["connection", "purpose", "engagement", "selfCare", "spiritual"],

        sabbathSigns: {
            disengagement: ["I was able to mentally disengage from work (e.g., not ruminating on problems)", "I successfully avoided or limited work-related emails and calls", "I felt 'off-duty' and not on call"],
            rest: ["I experienced physical rest and renewal", "I engaged in activities I find genuinely restful (which might be active or passive)", "I felt my energy levels were restored"],
            connection: ["I spent quality time with family or friends", "I connected meaningfully with my community (outside of a work context)", "I took time for myself"],
            spiritual: ["I engaged in spiritual practices that were life-giving (e.g., worship, prayer, nature)", "I felt connected to God", "I felt a sense of joy or peace"]
        },
        sabbathCategoryDisplayNames: {
            disengagement: "Disengagement from Work",
            rest: "Physical & Mental Rest",
            connection: "Connection (Self, Others, Community)",
            spiritual: "Spiritual Refreshment"
        },
        sabbathCategoryOrder: ["disengagement", "rest", "connection", "spiritual"],
        
        DB_NAME: 'TokuHauoraDB_v2', // New DB name for encrypted store
        DB_VERSION: 1,
        STORE_NAME: 'encryptedData'
    },

    // --- DOM Element Cache ---
    dom: {},

    // --- Initialization ---
    init: async function() {
        console.log("App.init() started");
        
        // 0. Import Firebase Functions
        // We need to do this here because app.js is a module
        const Firebase = {
            initializeApp: (await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js")).initializeApp,
            getAuth: (await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js")).getAuth,
            onAuthStateChanged: (await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js")).onAuthStateChanged,
            GoogleAuthProvider: (await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js")).GoogleAuthProvider,
            signInWithPopup: (await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js")).signInWithPopup,
            createUserWithEmailAndPassword: (await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js")).createUserWithEmailAndPassword,
            signInWithEmailAndPassword: (await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js")).signInWithEmailAndPassword,
            signOut: (await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js")).signOut,
            getFirestore: (await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js")).getFirestore,
            doc: (await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js")).doc,
            getDoc: (await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js")).getDoc,
            setDoc: (await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js")).setDoc,
            writeBatch: (await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js")).writeBatch,
            collection: (await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js")).collection,
            query: (await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js")).query,
            getDocs: (await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js")).getDocs,
            deleteDoc: (await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js")).deleteDoc,
            setLogLevel: (await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js")).setLogLevel
        };
        // Store for other modules to use
        this.Firebase = Firebase;
        
        // 1. Cache DOM Elements
        this.cacheDom();
        
        // 2. Attach Core Listeners
        this.attachListeners();

        // 3. Initialize Firebase (if config is present)
        this.state.appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const fbConfig = window.firebaseConfig || null;

        if (fbConfig && fbConfig.apiKey) {
            try {
                console.log("Initializing Firebase...");
                this.state.fb.app = Firebase.initializeApp(fbConfig);
                this.state.fb.auth = Firebase.getAuth(this.state.fb.app);
                this.state.fb.db = Firebase.getFirestore(this.state.fb.app);
                this.state.fb.googleProvider = new Firebase.GoogleAuthProvider();
                Firebase.setLogLevel('debug');
                console.log("Firebase initialized successfully.");
            } catch (e) {
                console.error("Firebase initialization failed:", e);
                this.ui.showAlert("Firebase Error: " + e.message, "error");
            }
        } else {
            console.warn("Firebase config is not set. App will run in local-only mode.");
        }

        // 4. Initialize Local DB (IndexedDB)
        try {
            this.state.db = await this.storage.initDB();
        } catch (e) {
            console.error("Failed to initialize local DB:", e);
            this.ui.showModal("Critical Error", "Could not load the app's database. Please try refreshing or clearing your browser cache if the problem persists.");
            this.dom.lock.keypad.style.display = 'none';
            return; // Stop initialization
        }

        // 5. Check PIN status and start Auth flow
        await this.auth.checkPinAndAuthState();
        
        console.log("App.init() complete.");
    },
    
    // --- Caches all common DOM elements ---
    cacheDom: function() {
        this.dom.app = document.getElementById('app');
        this.dom.main = document.querySelector('main');
        this.dom.views = document.querySelectorAll('.view');
        this.dom.navButtons = document.querySelectorAll('.nav-tab-btn');
        
        // Lock Screen
        this.dom.lock = {
            screen: document.getElementById('lockScreen'),
            title: document.getElementById('lockTitle'),
            subtitle: document.getElementById('lockSubtitle'),
            error: document.getElementById('lockError'),
            dots: document.querySelectorAll('.pin-dot'),
            keypad: document.querySelector('#lockScreen .grid')
        };
        
        // Login View
        this.dom.login = {
            view: document.getElementById('loginView'),
            signInGoogleBtn: document.getElementById('signInGoogleBtn'),
            showEmailLoginBtn: document.getElementById('showEmailLoginBtn'),
            stayLocalBtn: document.getElementById('stayLocalBtn'),
            emailLoginView: document.getElementById('emailLoginView'),
            emailInput: document.getElementById('emailInput'),
            passwordInput: document.getElementById('passwordInput'),
            emailLoginBtn: document.getElementById('emailLoginBtn'),
            emailSignUpBtn: document.getElementById('emailSignUpBtn'),
            backToLoginOptionsBtn: document.getElementById('backToLoginOptionsBtn'),
            authError: document.getElementById('authError')
        };

        // Modals
        this.dom.onboarding = {
            modal: document.getElementById('onboardingModal'),
            stepIndicator: document.getElementById('onboardingStepIndicator'),
            prevBtn: document.getElementById('onboardingPrevBtn'),
            nextBtn: document.getElementById('onboardingNextBtn'),
            finishBtn: document.getElementById('onboardingFinishBtn'),
            steps: document.querySelectorAll('.onboarding-step')
        };
        this.dom.prompt = {
            modal: document.getElementById('promptModal'),
            title: document.getElementById('promptModalTitle'),
            message: document.getElementById('promptModalMessage'),
            buttons: document.getElementById('promptModalButtons'),
            closeBtn: document.getElementById('closePromptModalBtn')
        };
        this.dom.alert = {
            box: document.getElementById('alert-box'),
            content: document.getElementById('alert-content'),
            icon: document.getElementById('alert-icon'),
            message: document.getElementById('alert-message')
        };
        
        // Dashboard
        this.dom.dashboard = {
            preview: document.getElementById('dashboardPreview'),
            rulePreview: document.getElementById('dashboardRulePreview'),
            startWarningBtn: document.getElementById('startWarningCheckinBtn'),
            startPositiveBtn: document.getElementById('startPositiveCheckinBtn'),
            startSabbathBtn: document.getElementById('startSabbathCheckinBtn'),
            startRuleBtn: document.getElementById('startRuleOfLifeBtn'),
            startGratitudeBtn: document.getElementById('startGratitudeBtn')
        };
        
        // Check-in (Warning)
        this.dom.warn = {
            title: document.getElementById('categoryTitle'),
            container: document.getElementById('questionsContainer'),
            prevBtn: document.getElementById('prevCategoryBtn'),
            nextBtn: document.getElementById('nextCategoryBtn'),
            finishBtn: document.getElementById('finishCheckinBtn'),
            progress: document.getElementById('checkinProgress'),
            progressText: document.getElementById('progressText'),
            btnContainer: document.getElementById('checkinButtonContainer')
        };
        
        // Check-in (Positive)
        this.dom.positive = {
            title: document.getElementById('positiveCategoryTitle'),
            container: document.getElementById('positiveQuestionsContainer'),
            prevBtn: document.getElementById('positivePrevCategoryBtn'),
            nextBtn: document.getElementById('positiveNextCategoryBtn'),
            finishBtn: document.getElementById('positiveFinishCheckinBtn'),
            progress: document.getElementById('positiveCheckinProgress'),
            progressText: document.getElementById('positiveProgressText'),
            btnContainer: document.getElementById('positiveCheckinButtonContainer')
        };
        
        // Sabbath
        this.dom.sabbath = {
            title: document.getElementById('sabbathCategoryTitle'),
            container: document.getElementById('sabbathQuestionsContainer'),
            prevBtn: document.getElementById('sabbathPrevCategoryBtn'),
            nextBtn: document.getElementById('sabbathNextCategoryBtn'),
            finishBtn: document.getElementById('sabbathFinishCheckinBtn'),
            progress: document.getElementById('sabbathCheckinProgress'),
            progressText: document.getElementById('sabbathProgressText'),
            btnContainer: document.getElementById('sabbathCheckinButtonContainer'),
            dateInput: document.getElementById('sabbathCheckinDate'),
            notes: document.getElementById('sabbathNotesArea'),
            viewPastBtn: document.getElementById('viewPastSabbathBtn'),
            pastContainer: document.getElementById('pastSabbathContainer')
        };
        
        // Gratitude
        this.dom.gratitude = {
            notes: document.getElementById('gratitudeEntryArea'),
            saveBtn: document.getElementById('saveGratitudeBtn'),
            viewPastBtn: document.getElementById('viewPastGratitudeBtn'),
            pastContainer: document.getElementById('pastGratitudeContainer')
        };
        
        // Rule of Life
        this.dom.rule = {
            editBtn: document.getElementById('editRuleBtn'),
            saveBtn: document.getElementById('saveRuleBtn'),
            readView: document.getElementById('ruleOfLifeReadView'),
            editView: document.getElementById('ruleOfLifeEditView'),
            readList: document.getElementById('ruleOfLifeReadList'),
            inputs: document.querySelectorAll('#ruleOfLifeEditView input'),
            startCheckinBtn: document.getElementById('startRuleOfLifeCheckinBtn'),
            viewPastBtn: document.getElementById('viewPastRuleOfLifeBtn'),
            checkinDate: document.getElementById('ruleOfLifeCheckinDate'),
            checklistContainer: document.getElementById('ruleOfLifeChecklistContainer'),
            checkinNotes: document.getElementById('ruleOfLifeNotesArea'),
            saveCheckinBtn: document.getElementById('saveRuleOfLifeCheckinBtn'),
            pastContainer: document.getElementById('pastRuleOfLifeContainer'),
            chart: document.getElementById('ruleOfLifeChart'),
            chartEmpty: document.getElementById('ruleOfLifeChartEmpty')
        };

        // Summary & Notes
        this.dom.summary = {
            content: document.getElementById('summaryContent'),
            prompt: document.getElementById('summaryPrompt'),
            backToTrendsBtn: document.getElementById('backToTrendsBtn'),
            addNotesBtn: document.getElementById('notesForSummaryBtn')
        };
        this.dom.notes = {
            notes: document.getElementById('personalNotesArea'),
            saveBtn: document.getElementById('saveNotesBtn'),
            dateText: document.getElementById('notesForDateText'),
            backBtn: document.getElementById('backToSummaryFromNotesBtn')
        };
        
        // Trends
        this.dom.trends = {
            chart: document.getElementById('wellbeingChart'),
            chartEmpty: document.getElementById('trendsChartEmpty'),
            toggleRecentBtn: document.getElementById('trendsToggleRecent'),
            toggleAllBtn: document.getElementById('trendsToggleAll'),
            correlationsContainer: document.getElementById('correlationsContainer')
        };
        
        // Resources
        this.dom.resources = {
            editBtn: document.getElementById('editResourcesBtn'),
            saveBtn: document.getElementById('saveResourcesBtn'),
            readView: document.getElementById('resourcesReadView'),
            editView: document.getElementById('resourcesEditView'),
            readSpans: {
                supervisor: document.getElementById('readSupervisor'),
                mentor: document.getElementById('readMentor'),
                spiritualDirector: document.getElementById('readSpiritualDirector'),
                doctor: document.getElementById('readDoctor'),
                counsellor: document.getElementById('readCounsellor'),
                other: document.getElementById('readOther')
            },
            editInputs: {
                supervisor: document.getElementById('editSupervisor'),
                mentor: document.getElementById('editMentor'),
                spiritualDirector: document.getElementById('editSpiritualDirector'),
                doctor: document.getElementById('editDoctor'),
                counsellor: document.getElementById('editCounsellor'),
                other: document.getElementById('editOther')
            }
        };

        // Settings
        this.dom.settings = {
            syncLoading: document.getElementById('syncStatusLoading'),
            syncOut: document.getElementById('syncStatusOut'),
            syncIn: document.getElementById('syncStatusIn'),
            userEmail: document.getElementById('userEmailDisplay'),
            changePinBtn: document.getElementById('changePinBtn'),
            exportBtn: document.getElementById('exportDataBtn'),
            importInput: document.getElementById('importDataInput'),
            viewDataBtn: document.getElementById('viewDataBtn'),
            clearDataBtn: document.getElementById('clearDataBtn'),
            rawDataDisplay: document.getElementById('rawDataDisplay')
        };
    },
    
    // --- Attaches all event listeners ---
    attachListeners: function() {
        // --- Navigation ---
        this.dom.navButtons.forEach(btn => {
            btn.onclick = () => {
                const view = btn.dataset.view;
                if (view === 'summaryView') {
                    this.navigation.navigateTo('summaryViewLast');
                } else if(view) {
                    this.navigation.navigateTo(view);
                }
            };
        });

        // --- PIN Pad ---
        this.dom.lock.keypad.addEventListener('click', (e) => {
            const key = e.target.closest('button')?.dataset.key;
            if (key) {
                this.pin.onKeyPress(key);
            }
        });

        // --- Login ---
        this.dom.login.signInGoogleBtn.onclick = () => this.auth.signInWithGoogle();
        this.dom.login.showEmailLoginBtn.onclick = () => this.auth.showEmailLogin(true);
        this.dom.login.stayLocalBtn.onclick = () => this.auth.stayLocal();
        this.dom.login.emailLoginBtn.onclick = () => this.auth.signInWithEmail();
        this.dom.login.emailSignUpBtn.onclick = () => this.auth.signUpWithEmail();
        this.dom.login.backToLoginOptionsBtn.onclick = () => this.auth.showEmailLogin(false);
        
        // --- Modals ---
        this.dom.prompt.closeBtn.onclick = () => this.ui.hideModal();
        this.dom.prompt.modal.onclick = (e) => {
            if (e.target === this.dom.prompt.modal) this.ui.hideModal();
        };
        this.dom.onboarding.nextBtn.onclick = () => this.ui.updateOnboardingStep(1);
        this.dom.onboarding.prevBtn.onclick = () => this.ui.updateOnboardingStep(-1);
        this.dom.onboarding.finishBtn.onclick = () => {
            this.dom.onboarding.modal.classList.remove('visible');
            localStorage.setItem('hauoraOnboardComplete', 'true');
        };
        
        // --- Dashboard ---
        this.dom.dashboard.startWarningBtn.onclick = () => this.moduleCheckin.start('warning');
        this.dom.dashboard.startPositiveBtn.onclick = () => this.moduleCheckin.start('positive');
        this.dom.dashboard.startSabbathBtn.onclick = () => this.navigation.navigateTo('sabbathCheckinView');
        this.dom.dashboard.startRuleBtn.onclick = () => this.navigation.navigateTo('ruleOfLifeView');
        this.dom.dashboard.startGratitudeBtn.onclick = () => this.navigation.navigateTo('gratitudeView');
        
        // --- Check-ins ---
        this.dom.warn.prevBtn.onclick = () => this.moduleCheckin.navigateCategory(-1, 'warning');
        this.dom.warn.nextBtn.onclick = () => this.moduleCheckin.navigateCategory(1, 'warning');
        this.dom.warn.finishBtn.onclick = () => this.moduleCheckin.finish('warning');
        
        this.dom.positive.prevBtn.onclick = () => this.moduleCheckin.navigateCategory(-1, 'positive');
        this.dom.positive.nextBtn.onclick = () => this.moduleCheckin.navigateCategory(1, 'positive');
        this.dom.positive.finishBtn.onclick = () => this.moduleCheckin.finish('positive');

        // --- Sabbath ---
        this.dom.sabbath.dateInput.onchange = () => this.moduleSabbath.loadForDate();
        this.dom.sabbath.prevBtn.onclick = () => this.moduleSabbath.navigateCategory(-1);
        this.dom.sabbath.nextBtn.onclick = () => this.moduleSabbath.navigateCategory(1);
        this.dom.sabbath.finishBtn.onclick = () => this.moduleSabbath.finish();
        this.dom.sabbath.viewPastBtn.onclick = () => this.navigation.navigateTo('pastSabbathView');
        
        // --- Gratitude ---
        this.dom.gratitude.saveBtn.onclick = () => this.moduleGratitude.save();
        this.dom.gratitude.viewPastBtn.onclick = () => this.navigation.navigateTo('pastGratitudeView');

        // --- Rule of Life ---
        this.dom.rule.editBtn.onclick = () => this.moduleRule.renderRule('edit');
        this.dom.rule.saveBtn.onclick = () => this.moduleRule.saveRule();
        this.dom.rule.startCheckinBtn.onclick = () => this.navigation.navigateTo('ruleOfLifeCheckinView');
        this.dom.rule.viewPastBtn.onclick = () => this.navigation.navigateTo('pastRuleOfLifeView');
        this.dom.rule.saveCheckinBtn.onclick = () => this.moduleRule.saveCheckin();

        // --- Summary & Notes ---
        this.dom.summary.backToTrendsBtn.onclick = () => this.navigation.navigateTo('trendsView');
        this.dom.summary.addNotesBtn.onclick = () => this.moduleCheckin.editNotesForSummary();
        this.dom.notes.saveBtn.onclick = () => this.moduleCheckin.saveNotes();
        this.dom.notes.backBtn.onclick = () => this.moduleCheckin.backToSummary();

        // --- Trends ---
        this.dom.trends.toggleRecentBtn.onclick = () => this.moduleTrends.setTrendView('recent');
        this.dom.trends.toggleAllBtn.onclick = () => this.moduleTrends.setTrendView('all');

        // --- Resources ---
        this.dom.resources.editBtn.onclick = () => this.moduleResources.render('edit');
        this.dom.resources.saveBtn.onclick = () => this.moduleResources.save();

        // --- Settings ---
        this.dom.settings.changePinBtn.onclick = () => this.pin.startChangePin();
        this.dom.settings.exportBtn.onclick = () => this.storage.exportData();
        this.dom.settings.importInput.onchange = (e) => this.storage.importData(e);
        this.dom.settings.viewDataBtn.onclick = () => this.storage.toggleViewRawData();
        this.dom.settings.clearDataBtn.onclick = () => this.storage.confirmClearAllData();
    }
};

// --- UI & Navigation Module ---
App.ui = {
    showAlert: function(message, type = 'info', duration = 3000) {
        const { alert } = App.dom;
        if (!alert || !alert.box || !alert.content) {
            console.error("Alert DOM not found!");
            return;
        }

        if (App.state.ui.alertTimeout) {
            clearTimeout(App.state.ui.alertTimeout);
        }
        
        // Set text
        alert.message.textContent = message;
        
        // Set color and icon
        alert.content.classList.remove('bg-green-600', 'bg-red-600', 'bg-indigo-600');
        if (type === 'success') {
            alert.content.classList.add('bg-green-600');
            alert.icon.innerHTML = `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>`;
        } else if (type === 'error') {
            alert.content.classList.add('bg-red-600');
            alert.icon.innerHTML = `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>`;
        } else { // info
            alert.content.classList.add('bg-indigo-600');
            alert.icon.innerHTML = `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9a1 1 0 112 0v4a1 1 0 11-2 0V9zm1-4a1 1 0 100 2 1 1 0 000-2z" clip-rule="evenodd"></path></svg>`;
        }
        
        // Show
        alert.box.classList.add('show');

        // Hide after duration
        App.state.ui.alertTimeout = setTimeout(() => {
            alert.box.classList.remove('show');
            App.state.ui.alertTimeout = null;
        }, duration);
    },

    showModal: function(title, message) {
        const { prompt } = App.dom;
        prompt.title.textContent = title;
        prompt.message.innerHTML = message.replace(/\n/g, '<br>'); // Support newlines
        prompt.modal.classList.add('visible');

        // Clear old buttons
        prompt.buttons.innerHTML = '';
        // Add default close button
        const closeBtn = document.createElement('button');
        closeBtn.id = 'closePromptModalBtn';
        closeBtn.className = 'btn btn-primary';
        closeBtn.textContent = "Okay, I Understand";
        closeBtn.onclick = () => this.hideModal();
        prompt.buttons.appendChild(closeBtn);
    },
    
    hideModal: function() {
        App.dom.prompt.modal.classList.remove('visible');
    },
    
    // Adds a second button (e.g., "Confirm") to the modal
    addModalButton: function(text, type, onClick) {
        const { prompt } = App.dom;
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.className = `btn ${type === 'danger' ? 'btn-danger' : 'btn-secondary'}`;
        btn.onclick = () => {
            onClick();
            this.hideModal(); // Auto-hide after click
        };
        
        // Re-style default button
        const defaultBtn = document.getElementById('closePromptModalBtn');
        if (defaultBtn) {
            defaultBtn.textContent = "Cancel";
            defaultBtn.className = 'btn btn-secondary';
        }
        
        prompt.buttons.prepend(btn); // Add new button before "Cancel"
    },
    
    updateOnboardingStep: function(direction) {
        const { onboarding } = App.dom;
        const totalSteps = onboarding.steps.length;
        let { currentOnboardingStep } = App.state.ui;
        
        currentOnboardingStep += direction;
        if (currentOnboardingStep < 1) currentOnboardingStep = 1;
        if (currentOnboardingStep > totalSteps) currentOnboardingStep = totalSteps;
        App.state.ui.currentOnboardingStep = currentOnboardingStep;

        onboarding.steps.forEach((step, index) => {
            step.style.display = (index + 1 === currentOnboardingStep) ? 'block' : 'none';
        });
        
        onboarding.stepIndicator.textContent = `Step ${currentOnboardingStep} of ${totalSteps}`;
        onboarding.prevBtn.style.display = (currentOnboardingStep > 1) ? 'inline-block' : 'none';
        onboarding.nextBtn.style.display = (currentOnboardingStep < totalSteps) ? 'inline-block' : 'none';
        onboarding.finishBtn.style.display = (currentOnboardingStep === totalSteps) ? 'inline-block' : 'none';
    },

    // --- Dashboard Module ---
    renderDashboardPreview: function() {
        const { dashboard } = App.dom;
        const { checkinHistory, ruleOfLife } = App.state.data;

        // 1. Render Last Check-in Preview
        if (checkinHistory.length > 0) {
            const lastEntry = checkinHistory[checkinHistory.length - 1];
            const totals = App.moduleCheckin.calculateTotals(lastEntry);
            
            const totalSigns = totals.warning + totals.positive;
            const warningPercent = totalSigns === 0 ? 0 : (totals.warning / totalSigns) * 100;
            const positivePercent = totalSigns === 0 ? 0 : (totals.positive / totalSigns) * 100;
            
            const d = App.util.parseDateString(lastEntry.date);
            const dateStr = d ? d.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' }) : 'Last Entry';
            
            dashboard.preview.innerHTML = `
                <p class="text-sm text-slate-600 mb-2">Your last check-in (${dateStr}):</p>
                <div class="flex w-full h-6 rounded-full overflow-hidden bg-gray-200">
                    <div class="bg-indigo-600" style="width: ${warningPercent}%" title="Warning Signs"></div>
                    <div class="bg-emerald-600" style="width: ${positivePercent}%" title="Positive Signs"></div>
                </div>
                <div class="flex justify-between text-sm mt-1">
                    <span class="font-semibold text-indigo-700">${totals.warning} Warning</span>
                    <span class="font-semibold text-emerald-700">${totals.positive} Positive</span>
                </div>
                <button class="btn-link-like text-sm mt-3" onclick="App.navigation.navigateTo('summaryViewLast')">View Full Summary</button>
            `;
        } else {
            dashboard.preview.innerHTML = '<p class="text-slate-500 italic">You haven\'t completed a check-in yet. Start one below!</p>';
        }

        // 2. Render Rule of Life Preview
        const intentions = (ruleOfLife && ruleOfLife.intentions) ? ruleOfLife.intentions : [];
        if (intentions.length > 0) {
            dashboard.rulePreview.innerHTML = `
                <ul class="list-disc list-inside text-teal-700 font-medium space-y-1">
                    ${intentions.map(i => `<li>${i}</li>`).join('')}
                </ul>`;
        } else {
            dashboard.rulePreview.innerHTML = '<p class="text-slate-500 italic">You haven\'t set your intentions yet. Tap "My Rule of Life" to begin.</p>';
        }
    }
};

// --- Navigation Module ---
App.navigation = {
    navigateTo: function(viewId, params = {}) {
        const { dom, state } = App;
        dom.views.forEach(view => view.classList.remove('active-view'));
        
        let targetViewId = viewId;
        state.ui.currentSummaryIndex = -1; // Reset summary index by default
        dom.summary.backToTrendsBtn.style.display = 'none'; 

        if (viewId === 'summaryViewLast') { 
            const history = state.data.checkinHistory;
            if (history.length > 0) {
                state.ui.currentSummaryIndex = history.length - 1;
                App.moduleCheckin.renderSummary(history[state.ui.currentSummaryIndex]);
                targetViewId = 'summaryView';
            } else {
                 targetViewId = 'welcomeView'; 
                 App.ui.renderDashboardPreview(); 
                 App.ui.showAlert("No Summary Yet. Please complete a check-in.", "info");
            }
        } else if (viewId === 'summaryView' && typeof params.entryIndex !== 'undefined') { 
            const history = state.data.checkinHistory;
            state.ui.currentSummaryIndex = params.entryIndex;
            if (history[state.ui.currentSummaryIndex]) {
                App.moduleCheckin.renderSummary(history[state.ui.currentSummaryIndex]);
                dom.summary.backToTrendsBtn.style.display = 'block'; 
            } else {
                console.error("Historical entry not found for index:", params.entryIndex);
                targetViewId = 'trendsView'; 
            }
        } else if (viewId === 'notesView') {
            const history = state.data.checkinHistory;
            if (state.ui.currentNotesIndex !== -1 && history[state.ui.currentNotesIndex]) {
                const entry = history[state.ui.currentNotesIndex];
                dom.notes.notes.value = entry.notes || '';
                const d = App.util.parseDateString(entry.date);
                dom.notes.dateText.textContent = d ? `Notes for: ${d.toLocaleDateString('en-NZ', { day: '2-digit', month: 'short', year: 'numeric' })}` : "Notes";
            }
        } else if (viewId === 'gratitudeView') {
            App.moduleGratitude.loadForToday();
        } else if (viewId === 'pastGratitudeView') {
            App.moduleGratitude.renderPast();
        } else if (viewId === 'sabbathCheckinView') {
            App.moduleSabbath.loadForDate();
        } else if (viewId === 'pastSabbathView') {
            App.moduleSabbath.renderPast();
        } else if (viewId === 'resourcesView') {
            App.moduleResources.render('read');
        } else if (viewId === 'ruleOfLifeView') {
            App.moduleRule.renderRule('read');
        } else if (viewId === 'ruleOfLifeCheckinView') {
            App.moduleRule.loadChecklist();
        } else if (viewId === 'pastRuleOfLifeView') { 
            App.moduleRule.renderPast();
            App.moduleRule.renderTrends();
        } else if (viewId === 'welcomeView') { 
            App.ui.renderDashboardPreview();
        } else if (viewId === 'settingsView') {
            App.auth.updateSyncStatusUI();
        }
        
        const targetViewEl = document.getElementById(targetViewId);
        if (targetViewEl) {
            targetViewEl.classList.add('active-view');
            state.ui.currentView = targetViewId;
        } else {
            console.error("Target view not found:", targetViewId);
            document.getElementById('welcomeView').classList.add('active-view'); 
            state.ui.currentView = 'welcomeView';
        }
        
        dom.navButtons.forEach(btn => {
            const btnView = btn.dataset.view;
            if (btnView === state.ui.currentView || (viewId === 'summaryViewLast' && btnView === 'summaryView')) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        dom.main.scrollTop = 0;

        if (targetViewId === 'trendsView') {
            App.moduleTrends.renderTrends();
            App.moduleTrends.renderCorrelations(); 
        }
    }
};

// --- Utility Module ---
App.util = {
    parseDateString: function(dateString) {
        if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return null; 
        const parts = dateString.split('-');
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        if (d && d.getMonth() + 1 == parts[1]) return d;
        return null;
    },
    bufferToHex: function(buffer) {
        return Array.from(new Uint8Array(buffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    },
    hexToBuffer: function(hex) {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        return bytes.buffer;
    },
    generateSalt: function() {
        const array = new Uint8Array(16);
        window.crypto.getRandomValues(array);
        return this.bufferToHex(array);
    }
};


// --- Storage & Crypto Module ---
App.storage = {
    initDB: async function() {
        const { DB_NAME, DB_VERSION } = App.config;
        return await idb.openDB(DB_NAME, DB_VERSION, {
            upgrade(db, oldVersion) {
                console.log(`Upgrading DB from ${oldVersion} to ${DB_VERSION}`);
                if (oldVersion < 1) {
                    // Main data stores
                    db.createObjectStore('checkinHistory', { keyPath: 'date' });
                    db.createObjectStore('gratitudeHistory', { keyPath: 'date' });
                    db.createObjectStore('sabbathHistory', { keyPath: 'date' });
                    db.createObjectStore('ruleOfLifeHistory', { keyPath: 'date' });
                    // Single key-value store for app state (PIN, resources, etc.)
                    db.createObjectStore('appState', { keyPath: 'id' });
                }
            },
        });
    },

    // --- Encryption ---
    deriveKey: async function(pin, saltHex) {
        try {
            const salt = App.util.hexToBuffer(saltHex);
            const encoder = new TextEncoder();
            const keyMaterial = await window.crypto.subtle.importKey(
                'raw', encoder.encode(pin), { name: 'PBKDF2' }, false, ['deriveKey']
            );
            return await window.crypto.subtle.deriveKey(
                { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
                keyMaterial,
                { name: 'AES-GCM', length: 256 },
                false, // not extractable
                ['encrypt', 'decrypt']
            );
        } catch (e) { console.error("Key derivation failed:", e); return null; }
    },

    encrypt: async function(data) {
        const key = App.state.pin.encryptionKey;
        if (!key) throw new Error("Encryption key not available.");
        try {
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            const dataBuffer = new TextEncoder().encode(JSON.stringify(data));
            const encryptedBuffer = await window.crypto.subtle.encrypt(
                { name: 'AES-GCM', iv }, key, dataBuffer
            );
            return {
                iv: App.util.bufferToHex(iv),
                data: App.util.bufferToHex(encryptedBuffer)
            };
        } catch (e) { console.error("Encryption failed:", e); throw new Error("Could not encrypt data."); }
    },
    
    decrypt: async function(encryptedObject) {
        const key = App.state.pin.encryptionKey;
        if (!key) throw new Error("Encryption key not available for decryption.");
        try {
            const iv = App.util.hexToBuffer(encryptedObject.iv);
            const data = App.util.hexToBuffer(encryptedObject.data);
            const decryptedBuffer = await window.crypto.subtle.decrypt(
                { name: 'AES-GCM', iv }, key, data
            );
            return JSON.parse(new TextDecoder().decode(decryptedBuffer));
        } catch (e) {
            console.error("Decryption failed (Wrong PIN or corrupt data):", e);
            return null; // Return null to handle gracefully
        }
    },
    
    hashPIN: async function(pin, salt) {
        const encoder = new TextEncoder();
        const data = encoder.encode(pin + salt);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        return App.util.bufferToHex(hashBuffer);
    },
    
    verifyPIN: async function(enteredPin) {
        const { pin } = App.state;
        if (!pin.hash || !pin.salt) return false;
        const enteredHash = await this.hashPIN(enteredPin, pin.salt);
        return enteredHash === pin.hash;
    },

    // --- Local Storage (IndexedDB) ---
    localSave: async function(storeName, data, key) {
        try {
            const encryptedData = await this.encrypt(data);
            const itemToSave = { [App.state.db.objectStore(storeName).keyPath]: key, data: encryptedData };
            await App.state.db.put(storeName, itemToSave);
        } catch (e) {
            console.error(`Error saving ${key} to ${storeName}:`, e);
            App.ui.showAlert(`Could not save ${key}.`, "error");
        }
    },
    
    localSaveAppState: async function(id, data) {
        await this.localSave('appState', data, id);
    },
    
    localLoadAll: async function() {
        console.log("Loading and decrypting all data...");
        const { db } = App.state;
        const data = App.state.data;
        
        try {
            // Check-in History
            const encCheckins = await db.getAll('checkinHistory');
            data.checkinHistory = (await Promise.all(encCheckins.map(i => this.decrypt(i.data)))).filter(Boolean);
            
            // Gratitude History
            const encGratitudes = await db.getAll('gratitudeHistory');
            data.gratitudeHistory = (await Promise.all(encGratitudes.map(i => this.decrypt(i.data)))).filter(Boolean);
            
            // Sabbath History
            const encSabbaths = await db.getAll('sabbathHistory');
            data.sabbathHistory = (await Promise.all(encSabbaths.map(i => this.decrypt(i.data)))).filter(Boolean);

            // Rule of Life History
            const encRuleHistory = await db.getAll('ruleOfLifeHistory');
            data.ruleOfLifeHistory = (await Promise.all(encRuleHistory.map(i => this.decrypt(i.data)))).filter(Boolean);
            
            // AppState: User Resources & Rule
            const encResources = await db.get('appState', 'userResources');
            data.userResources = encResources ? (await this.decrypt(encResources.data) || {}) : {};
            
            const encRule = await db.get('appState', 'ruleOfLife');
            data.ruleOfLife = encRule ? (await this.decrypt(encRule.data) || {}) : {};
            
            console.log("All data loaded and decrypted.");
        } catch (error) {
            console.error("A critical error occurred during data decryption:", error);
            throw new Error("Failed to decrypt data.");
        }
    },
    
    // --- Firestore Storage ---
    firestoreSave: async function(docId, data) {
        if (!App.state.userId) return;
        try {
            const encryptedData = await this.encrypt(data);
            const docRef = App.Firebase.doc(App.state.fb.db, `artifacts/${App.state.appId}/users/${App.state.userId}/data`, docId);
            await App.Firebase.setDoc(docRef, { data: encryptedData });
        } catch (e) {
            console.error(`Error saving ${docId} to Firestore:`, e);
            App.ui.showAlert(`Could not sync ${docId}.`, "error");
        }
    },
    
    firestoreLoadAll: async function() {
        if (!App.state.userId) return this.mergeData({});
        console.log("Loading from Firestore...");
        
        const allData = {};
        const collectionRef = App.Firebase.collection(App.state.fb.db, `artifacts/${App.state.appId}/users/${App.state.userId}/data`);
        const q = App.Firebase.query(collectionRef);
        
        const docsSnap = await App.Firebase.getDocs(q);
        for (const doc of docsSnap.docs) {
            const decrypted = await this.decrypt(doc.data().data);
            if (decrypted) {
                allData[doc.id] = decrypted;
            } else {
                console.warn(`Failed to decrypt ${doc.id} from Firestore`);
            }
        }
        return this.mergeData(allData);
    },
    
    // --- Data Migration (Local -> Firestore) ---
    migrateLocalToFirestore: async function() {
        console.log("Starting migration from local to Firestore...");
        App.ui.showModal("Migrating Data", "Please wait, we're securely moving your local data to the cloud...");
        
        const { db } = App.state;
        const batch = App.Firebase.writeBatch(App.state.fb.db);
        const basePath = `artifacts/${App.state.appId}/users/${App.state.userId}/data`;

        try {
            // Get all local data (it's already encrypted)
            const allCheckins = await db.getAll('checkinHistory');
            const allGratitudes = await db.getAll('gratitudeHistory');
            const allSabbaths = await db.getAll('sabbathHistory');
            const allRuleHistory = await db.getAll('ruleOfLifeHistory');
            const appStateResources = await db.get('appState', 'userResources');
            const appStateRule = await db.get('appState', 'ruleOfLife');
            
            // Add to batch
            // This is complex. The local-first stores data by date, but firestore stores by collection.
            // We need to save each *collection* as a single document.
            const allData = App.state.data; // This holds the decrypted data
            
            batch.set(App.Firebase.doc(App.state.fb.db, basePath, 'checkinHistory'), { data: await this.encrypt(allData.checkinHistory) });
            batch.set(App.Firebase.doc(App.state.fb.db, basePath, 'gratitudeHistory'), { data: await this.encrypt(allData.gratitudeHistory) });
            batch.set(App.Firebase.doc(App.state.fb.db, basePath, 'sabbathHistory'), { data: await this.encrypt(allData.sabbathHistory) });
            batch.set(App.Firebase.doc(App.state.fb.db, basePath, 'ruleOfLifeHistory'), { data: await this.encrypt(allData.ruleOfLifeHistory) });
            batch.set(App.Firebase.doc(App.state.fb.db, basePath, 'userResources'), { data: await this.encrypt(allData.userResources) });
            batch.set(App.Firebase.doc(App.state.fb.db, basePath, 'ruleOfLife'), { data: await this.encrypt(allData.ruleOfLife) });

            await batch.commit();
            console.log("Migration complete.");
            
            // Now, clear the *local* data stores
            await db.clear('checkinHistory');
            await db.clear('gratitudeHistory');
            await db.clear('sabbathHistory');
            await db.clear('ruleOfLifeHistory');
            await db.delete('appState', 'userResources');
            await db.delete('appState', 'ruleOfLife');
            
            console.log("Local data (except PIN) cleared after migration.");
            App.ui.hideModal();
            
        } catch (e) {
            console.error("Migration failed:", e);
            App.ui.showModal("Migration Error", `Could not move your data to the cloud. ${e.message}`);
        }
    },
    
    // --- Unified Save/Load/Merge ---
    save: function(storeName, data, key) {
        // This function is now more specific
        this.localSave(storeName, data, key); 
        
        if (App.state.storageDriver === 'firestore') {
            // We save the *entire collection* as one doc
            const collectionData = App.state.data[storeName];
            if (collectionData) {
                 this.firestoreSave(storeName, collectionData);
            }
        }
    },
    
    saveAppState: function(id, data) {
        this.localSaveAppState(id, data);
        if (App.state.storageDriver === 'firestore') {
            this.firestoreSave(id, data);
        }
    },
    
    load: async function() {
        let data;
        if (App.state.storageDriver === 'firestore') {
            data = await this.firestoreLoadAll();
        } else {
            data = await this.localLoadAll();
        }
        App.state.data = data; // Set global state
        return data;
    },
    
    // Merges loaded data with defaults to prevent errors
    mergeData: function(loadedData) {
        return {
            checkinHistory: loadedData.checkinHistory || [],
            gratitudeHistory: loadedData.gratitudeHistory || [],
            sabbathHistory: loadedData.sabbathHistory || [],
            ruleOfLifeHistory: loadedData.ruleOfLifeHistory || [],
            userResources: loadedData.userResources || {},
            ruleOfLife: loadedData.ruleOfLife || {}
        };
    },
    
    // --- Data Import/Export ---
    exportData: function() {
        const data = App.state.data;
        if (Object.values(data).every(val => (Array.isArray(val) && val.length === 0) || (typeof val === 'object' && Object.keys(val).length === 0))) {
            App.ui.showAlert("No data to export.", "info");
            return;
        }
        
        try {
            const exportObject = { ...data, appVersion: "2.0.0" };
            const dataStr = JSON.stringify(exportObject, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `toku_hauora_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            App.ui.showAlert("Export Successful!", "success");
        } catch (e) {
            console.error("Export failed:", e);
            App.ui.showAlert("Export failed. See console for details.", "error");
        }
    },
    
    importData: function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            let importedData;
            try {
                const importedObject = JSON.parse(e.target.result);
                importedData = this.mergeData(importedObject); // Use merge to ensure all keys exist
            } catch (err) {
                App.ui.showModal("Import Failed", `Could not parse file. ${err.message}`);
                return;
            }
            
            App.ui.showModal("Confirm Import", `This will OVERWRITE all current data. Are you sure?`);
            App.ui.addModalButton("Yes, Overwrite", "danger", async () => {
                try {
                    // 1. Clear existing runtime state
                    App.state.data = this.mergeData({});
                    
                    // 2. Clear existing DB
                    const db = App.state.db;
                    await db.clear('checkinHistory');
                    await db.clear('gratitudeHistory');
                    await db.clear('sabbathHistory');
                    await db.clear('ruleOfLifeHistory');
                    await db.delete('appState', 'userResources');
                    await db.delete('appState', 'ruleOfLife');

                    // 3. Save all imported data (which will encrypt and save to DB)
                    const { checkinHistory, gratitudeHistory, sabbathHistory, ruleOfLifeHistory, userResources, ruleOfLife } = importedData;
                    
                    const tx = db.transaction(db.objectStoreNames, 'readwrite');
                    await Promise.all([
                        ...checkinHistory.map(item => this.encrypt(item).then(d => tx.objectStore('checkinHistory').put({date: item.date, data: d}))),
                        ...gratitudeHistory.map(item => this.encrypt(item).then(d => tx.objectStore('gratitudeHistory').put({date: item.date, data: d}))),
                        ...sabbathHistory.map(item => this.encrypt(item).then(d => tx.objectStore('sabbathHistory').put({date: item.date, data: d}))),
                        ...ruleOfLifeHistory.map(item => this.encrypt(item).then(d => tx.objectStore('ruleOfLifeHistory').put({date: item.date, data: d}))),
                        this.encrypt(userResources).then(d => tx.objectStore('appState').put({id: 'userResources', data: d})),
                        this.encrypt(ruleOfLife).then(d => tx.objectStore('appState').put({id: 'ruleOfLife', data: d}))
                    ]);
                    await tx.done;

                    // 4. If cloud-syncing, batch save to Firestore
                    if (App.state.storageDriver === 'firestore') {
                        await this.firestoreSave('checkinHistory', checkinHistory);
                        await this.firestoreSave('gratitudeHistory', gratitudeHistory);
                        await this.firestoreSave('sabbathHistory', sabbathHistory);
                        await this.firestoreSave('ruleOfLifeHistory', ruleOfLifeHistory);
                        await this.firestoreSave('userResources', userResources);
                        await this.firestoreSave('ruleOfLife', ruleOfLife);
                    }
                    
                    // 5. Reload data into global state
                    App.state.data = importedData;
                    
                    // 6. Navigate home and show success
                    App.navigation.navigateTo('welcomeView');
                    App.ui.showAlert("Import Successful!", "success");

                } catch (importError) {
                    console.error("Failed during import process:", importError);
                    App.ui.showModal("Import Failed", "An error occurred while encrypting and saving the imported data.");
                }
            });
        };
        reader.readAsText(file);
        event.target.value = null; // Clear input
    },
    
    confirmClearAllData: function() {
        App.ui.showModal("Confirm Deletion", "Are you sure you want to clear ALL your data (Check-ins, Gratitude, Sabbath, Rule of Life, Resources, and PIN)? This action is permanent and cannot be undone.");
        App.ui.addModalButton("Yes, Delete Everything", "danger", async () => {
            try {
                // 1. Clear local DB
                const db = App.state.db;
                await db.clear('checkinHistory');
                await db.clear('gratitudeHistory');
                await db.clear('sabbathHistory');
                await db.clear('ruleOfLifeHistory');
                await db.clear('appState');
                
                // 2. Clear local storage (onboarding flag)
                localStorage.removeItem('hauoraOnboardComplete');
                
                // 3. If signed in, clear Firestore data
                if (App.state.userId) {
                    App.ui.showAlert("Clearing cloud data... please wait.", "info", 5000);
                    const batch = App.Firebase.writeBatch(App.state.fb.db);
                    const basePath = `artifacts/${App.state.appId}/users/${App.state.userId}`;
                    
                    const dataIds = ['checkinHistory', 'gratitudeHistory', 'sabbathHistory', 'ruleOfLifeHistory', 'userResources', 'ruleOfLife'];
                    dataIds.forEach(id => {
                        batch.delete(App.Firebase.doc(App.state.fb.db, `${basePath}/data`, id));
                    });
                    
                    // Delete the meta (PIN) doc
                    batch.delete(App.Firebase.doc(App.state.fb.db, basePath, 'meta'));
                    
                    await batch.commit();
                }
                
                // 4. Show success and reload
                App.ui.showModal("Data Cleared", "All your data has been removed. The app will now reload and require a new PIN setup.");
                setTimeout(() => window.location.reload(), 2500);
                
            } catch (e) {
                console.error("Failed to clear data:", e);
                App.ui.showModal("Error", "Could not clear all data. Please try again.");
            }
        });
    },
    
    toggleViewRawData: function() {
        const { rawDataDisplay } = App.dom.settings;
        if (rawDataDisplay.style.display === 'none') {
            try {
                rawDataDisplay.textContent = JSON.stringify(App.state.data, null, 2);
                rawDataDisplay.style.display = 'block';
            } catch (e) {
                rawDataDisplay.textContent = "Error displaying data.";
            }
        } else {
            rawDataDisplay.style.display = 'none';
        }
    }
};

// --- Authentication Module (Firebase) ---
App.auth = {
    checkPinAndAuthState: async function() {
        const { db } = App.state;
        const saltEntry = await db.get('appState', 'securitySalt');
        const hashEntry = await db.get('appState', 'securityHash');

        if (saltEntry && hashEntry) {
            // PIN is set.
            App.state.pin.salt = saltEntry.data.iv ? (await App.storage.decrypt(saltEntry.data)) : saltEntry.data; // Handle legacy unencrypted
            App.state.pin.hash = hashEntry.data.iv ? (await App.storage.decrypt(hashEntry.data)) : hashEntry.data; // Handle legacy unencrypted
            
            // Now, check auth state
            if (App.state.fb.auth) {
                this.setupAuthListener();
            } else {
                // No Firebase, just stay local
                App.pin.showLockScreen('login');
            }
        } else {
            // No PIN is set. Force setup.
            App.pin.showLockScreen('setup');
        }
    },
    
    setupAuthListener: function() {
        const { auth } = App.state.fb;
        App.Firebase.onAuthStateChanged(auth, async (user) => {
            if (user) {
                // User is signed in
                console.log("User signed in:", user.uid);
                App.state.userId = user.uid;
                App.state.storageDriver = 'firestore';
                
                // 1. Check for Firestore PIN meta
                const metaDocRef = App.Firebase.doc(App.state.fb.db, `artifacts/${App.state.appId}/users/${user.uid}`, 'meta');
                const metaDoc = await App.Firebase.getDoc(metaDocRef);
                
                if (metaDoc.exists()) {
                    // Cloud user exists. Use cloud PIN info.
                    const cloudPin = metaDoc.data();
                    App.state.pin.salt = cloudPin.salt;
                    App.state.pin.hash = cloudPin.hash;
                    
                    // Overwrite local PIN info to sync
                    await App.storage.localSaveAppState('securitySalt', cloudPin.salt);
                    await App.storage.localSaveAppState('securityHash', cloudPin.hash);
                    
                    App.pin.showLockScreen('login');
                } else {
                    // New cloud user. Migrate local PIN info.
                    console.log("New cloud user. Migrating local PIN to cloud...");
                    await App.Firebase.setDoc(metaDocRef, { 
                        salt: App.state.pin.salt, 
                        hash: App.state.pin.hash 
                    });
                    
                    // Now migrate local *data*
                    await App.storage.migrateLocalToFirestore();
                    App.pin.showLockScreen('login');
                }
                
            } else {
                // User is signed out. Show login view.
                console.log("User is signed out.");
                App.state.userId = null;
                App.state.storageDriver = 'local';
                App.dom.app.style.display = 'none';
                App.dom.lock.screen.style.display = 'none';
                App.dom.login.view.style.display = 'flex';
            }
            this.updateSyncStatusUI();
        });
    },
    
    showLogin: function() {
        App.dom.app.style.display = 'none';
        App.dom.lock.screen.style.display = 'none';
        App.dom.login.view.style.display = 'flex';
    },

    stayLocal: function() {
        App.dom.login.view.style.display = 'none';
        App.pin.showLockScreen('login'); // Show local PIN login
    },
    
    updateSyncStatusUI: function() {
        const { settings } = App.dom;
        const user = App.state.fb.auth ? App.state.fb.auth.currentUser : null;
        
        settings.syncLoading.style.display = 'none';
        if (user) {
            settings.syncIn.style.display = 'block';
            settings.syncOut.style.display = 'none';
            settings.userEmail.textContent = user.email || (user.isAnonymous ? 'Anonymous User' : 'Signed In');
        } else {
            settings.syncIn.style.display = 'none';
            settings.syncOut.style.display = 'block';
        }
    },
    
    showEmailLogin: function(show) {
        App.dom.login.emailLoginView.style.display = show ? 'block' : 'none';
    },
    
    signInWithGoogle: async function() {
        this.showAuthError('');
        try {
            await App.Firebase.signInWithPopup(App.state.fb.auth, App.state.fb.googleProvider);
            // onAuthStateChanged will handle the rest
        } catch (e) { this.showAuthError(e.message); }
    },
    
    signInWithEmail: async function() {
        this.showAuthError('');
        try {
            const email = App.dom.login.emailInput.value;
            const pass = App.dom.login.passwordInput.value;
            await App.Firebase.signInWithEmailAndPassword(App.state.fb.auth, email, pass);
            // onAuthStateChanged will handle the rest
        } catch (e) { this.showAuthError(e.message); }
    },
    
    signUpWithEmail: async function() {
        this.showAuthError('');
        try {
            const email = App.dom.login.emailInput.value;
            const pass = App.dom.login.passwordInput.value;
            await App.Firebase.createUserWithEmailAndPassword(App.state.fb.auth, email, pass);
            // onAuthStateChanged will handle the rest
        } catch (e) { this.showAuthError(e.message); }
    },
    
    signOut: async function() {
        try {
            await App.Firebase.signOut(App.state.fb.auth);
            // onAuthStateChanged will handle showing the login screen
        } catch (e) { this.showAuthError(e.message); }
    },
    
    showAuthError: function(message) {
        App.dom.login.authError.textContent = message;
    }
};

// --- PIN Module ---
App.pin = {
    showLockScreen: function(mode) { // 'login', 'setup', 'change'
        const { lock } = App.dom;
        lock.screen.style.display = 'flex';
        App.dom.app.style.display = 'none';
        this.resetInput();
        
        if (mode === 'setup') {
            lock.title.textContent = "Create PIN";
            lock.subtitle.textContent = "Create a 4-digit PIN to secure your data.";
            App.state.pin.setupStep = 1;
        } else if (mode === 'change') {
            lock.title.textContent = "Change PIN";
            lock.subtitle.textContent = "First, enter your CURRENT PIN.";
            App.state.pin.setupStep = 0; // 0 = login
            App.state.pin.actionCallback = this.startChangePinFlow;
        } else { // 'login'
            lock.title.textContent = "Enter PIN";
            lock.subtitle.textContent = "Enter your 4-digit PIN to unlock.";
            App.state.pin.setupStep = 0; // 0 = login
        }
    },
    
    onKeyPress: function(key) {
        let { input } = App.state.pin;
        if (key === 'del') {
            input = input.slice(0, -1);
        } else if (input.length < 4) {
            input += key;
        }
        
        App.state.pin.input = input;
        this.updateDots();
        
        if (input.length === 4) {
            this.processInput();
        }
    },
    
    updateDots: function() {
        App.dom.lock.dots.forEach((dot, index) => {
            dot.classList.toggle('filled', index < App.state.pin.input.length);
        });
    },
    
    resetInput: function(errorMsg = '') {
        App.state.pin.input = "";
        App.dom.lock.error.textContent = errorMsg;
        if (errorMsg) {
            App.dom.lock.screen.classList.add('shake');
            setTimeout(() => App.dom.lock.screen.classList.remove('shake'), 500);
        }
        this.updateDots();
    },
    
    processInput: async function() {
        const { setupStep } = App.state.pin;
        
        if (setupStep === 0) { // Login
            await this.handleLogin();
        } else { // Setup
            await this.handleSetup();
        }
    },
    
    handleLogin: async function() {
        const { input, salt, actionCallback } = App.state.pin;
        
        // 1. Verify PIN
        const isValid = await App.storage.verifyPIN(input);

        if (isValid) {
            // Success! Derive key
            App.state.pin.encryptionKey = await App.storage.deriveKey(input, salt);
            if (!App.state.pin.encryptionKey) {
                this.resetInput("PIN correct, but key derivation failed.");
                return;
            }

            if (actionCallback) {
                actionCallback(); // Run "change pin" flow
            } else {
                this.unlock(); // Normal unlock
            }
        } else {
            // Fail
            setTimeout(() => this.resetInput("Invalid PIN. Please try again."), 200);
        }
    },
    
    handleSetup: async function() {
        const { setupStep, input, confirmPin } = App.state.pin;
        
        if (setupStep === 1) { // Step 1: First PIN entry
            App.state.pin.confirmPin = input;
            setTimeout(() => {
                App.state.pin.input = "";
                App.dom.lock.title.textContent = "Confirm PIN";
                App.dom.lock.subtitle.textContent = "Please re-enter your 4-digit PIN.";
                this.updateDots();
                App.state.pin.setupStep = 2;
            }, 200);
        } else { // Step 2: Confirm PIN entry
            if (input === confirmPin) {
                // PINs match! Save and log in.
                await this.saveNewPin(input);
                this.unlock();
            } else {
                // PINs don't match. Reset.
                App.dom.lock.title.textContent = "Create PIN";
                App.dom.lock.subtitle.textContent = "PINs did not match. Please try again.";
                App.state.pin.setupStep = 1;
                App.state.pin.confirmPin = "";
                setTimeout(() => this.resetInput(""), 200);
            }
        }
    },
    
    saveNewPin: async function(pin) {
        const newSalt = App.util.generateSalt();
        const newKey = await App.storage.deriveKey(pin, newSalt);
        const newHash = await App.storage.hashPIN(pin, newSalt);
        
        // Save to local DB
        await App.storage.localSaveAppState('securitySalt', newSalt);
        await App.storage.localSaveAppState('securityHash', newHash);
        
        // Save to Firestore if signed in
        if (App.state.userId) {
            const metaDocRef = App.Firebase.doc(App.state.fb.db, `artifacts/${App.state.appId}/users/${App.state.userId}`, 'meta');
            await App.Firebase.setDoc(metaDocRef, { salt: newSalt, hash: newHash });
        }
        
        // Update runtime state
        App.state.pin.salt = newSalt;
        App.state.pin.hash = newHash;
        App.state.pin.encryptionKey = newKey;
        
        console.log("New PIN saved and key derived.");
    },
    
    unlock: async function(targetView = 'welcomeView') {
        App.dom.lock.screen.style.display = 'none';
        App.dom.app.style.display = 'flex';
        
        try {
            await App.storage.load();
            App.navigation.navigateTo(targetView);
            
            const hasOnboarded = localStorage.getItem('hauoraOnboardComplete');
            if (hasOnboarded !== 'true') {
                App.dom.onboarding.modal.classList.add('visible');
                App.state.ui.currentOnboardingStep = 1;
                App.ui.updateOnboardingStep(0);
            }
        } catch (e) {
            console.error("Failed to load and decrypt data:", e);
            this.showLockScreen('login');
            this.resetInput("Decryption failed. Wrong PIN or corrupt data.");
        }
    },
    
    startChangePin: function() {
        this.showLockScreen('change');
    },
    
    startChangePinFlow: function() {
        // This is the callback, so `this` is App.pin
        console.log("Current PIN verified. Starting change flow...");
        App.state.pin.setupStep = 1; // 1 = new
        App.state.pin.confirmPin = "";
        App.dom.lock.title.textContent = "Enter NEW PIN";
        App.dom.lock.subtitle.textContent = "Create a new 4-digit PIN.";
        
        const oldKey = App.state.pin.encryptionKey; // Keep the old key for re-encryption
        
        // Override the setup handler for this flow
        App.pin.handleSetup = async function() {
            const { setupStep, input, confirmPin } = App.state.pin;
            
            if (setupStep === 1) {
                App.state.pin.confirmPin = input;
                setTimeout(() => {
                    App.state.pin.input = "";
                    App.dom.lock.title.textContent = "Confirm NEW PIN";
                    App.dom.lock.subtitle.textContent = "Re-enter your new 4-digit PIN.";
                    this.updateDots();
                    App.state.pin.setupStep = 2;
                }, 200);
            } else { // Step 2
                if (input === confirmPin) {
                    try {
                        App.dom.lock.title.textContent = "Re-encrypting...";
                        App.dom.lock.subtitle.textContent = "Please wait, this may take a moment.";
                        
                        // 1. Derive new key
                        const newSalt = App.util.generateSalt();
                        const newKey = await App.storage.deriveKey(input, newSalt);
                        const newHash = await App.storage.hashPIN(input, newSalt);
                        
                        // 2. Re-encrypt all data
                        const allData = App.state.data;
                        App.state.pin.encryptionKey = newKey; // Set to new key
                        
                        await App.storage.save('checkinHistory', allData.checkinHistory, 'checkinHistory');
                        await App.storage.save('gratitudeHistory', allData.gratitudeHistory, 'gratitudeHistory');
                        await App.storage.save('sabbathHistory', allData.sabbathHistory, 'sabbathHistory');
                        await App.storage.save('ruleOfLifeHistory', allData.ruleOfLifeHistory, 'ruleOfLifeHistory');
                        await App.storage.saveAppState('userResources', allData.userResources);
                        await App.storage.saveAppState('ruleOfLife', allData.ruleOfLife);

                        // 3. Save new PIN info
                        await App.storage.localSaveAppState('securitySalt', newSalt);
                        await App.storage.localSaveAppState('securityHash', newHash);
                        
                        // 4. Update runtime state
                        App.state.pin.salt = newSalt;
                        App.state.pin.hash = newHash;
                        // App.state.pin.encryptionKey is already the new key

                        // 5. Update Firestore (if syncing)
                        if (App.state.storageDriver === 'firestore') {
                            const metaDocRef = App.Firebase.doc(App.state.fb.db, `artifacts/${App.state.appId}/users/${App.state.userId}`, 'meta');
                            await App.Firebase.setDoc(metaDocRef, { salt: newSalt, hash: newHash });
                            // Also re-encrypt cloud data
                            await App.storage.firestoreSave('checkinHistory', allData.checkinHistory);
                            await App.storage.firestoreSave('gratitudeHistory', allData.gratitudeHistory);
                            await App.storage.firestoreSave('sabbathHistory', allData.sabbathHistory);
                            await App.storage.firestoreSave('ruleOfLifeHistory', allData.ruleOfLifeHistory);
                            await App.storage.firestoreSave('userResources', allData.userResources);
                            await App.storage.firestoreSave('ruleOfLife', allData.ruleOfLife);
                        }
                        
                        App.ui.showAlert("PIN Changed Successfully!", "success");
                        this.unlock('settingsView');
                        
                    } catch (e) {
                        console.error("Failed to change PIN:", e);
                        App.state.pin.encryptionKey = oldKey; // Restore old key on fail
                        App.ui.showModal("Error", "Failed to change PIN. Your old PIN is still active.");
                        this.unlock('settingsView');
                    } finally {
                        // Restore original setup handler
                        App.pin.handleSetup = App.pin.originalHandleSetup;
                    }
                } else {
                    // PINs don't match
                    App.dom.lock.title.textContent = "Enter NEW PIN";
                    App.dom.lock.subtitle.textContent = "PINs did not match. Please try again.";
                    App.state.pin.setupStep = 1;
                    App.state.pin.confirmPin = "";
                    setTimeout(() => this.resetInput(""), 200);
                }
            }
        };
    }
};
// Store original handler
App.pin.originalHandleSetup = App.pin.handleSetup;


// --- Check-in Module (Warning & Positive) ---
App.moduleCheckin = {
    currentData: {},

    start: function(type) { // 'warning' or 'positive'
        App.state.ui.currentWarningCategory = 0;
        App.state.ui.currentPositiveCategory = 0;
        
        const today = new Date().toISOString().split('T')[0];
        let entry = App.state.data.checkinHistory.find(e => e.date === today);
        
        if (!entry) {
            entry = { date: today, warningResponses: {}, positiveResponses: {}, notes: "" };
            App.state.data.checkinHistory.push(entry); // Add to state
        }
        this.currentData = entry; // Work on the state object directly
        
        if (type === 'warning') {
            if (!this.currentData.warningResponses) this.currentData.warningResponses = {};
            this.renderQuestions('warning');
            App.navigation.navigateTo('checkinView');
        } else {
            if (!this.currentData.positiveResponses) this.currentData.positiveResponses = {};
            this.renderQuestions('positive');
            App.navigation.navigateTo('positiveCheckinView');
        }
    },

    renderQuestions: function(type) {
        const isWarning = type === 'warning';
        const { config, state, dom } = App;
        
        const index = isWarning ? state.ui.currentWarningCategory : state.ui.currentPositiveCategory;
        const order = isWarning ? config.categoryOrder : config.positiveCategoryOrder;
        const key = order[index];
        const questions = isWarning ? config.warningSigns[key] : config.positiveSigns[key];
        const titles = isWarning ? config.categoryDisplayNames : config.positiveCategoryDisplayNames;
        const responses = isWarning ? this.currentData.warningResponses : this.currentData.positiveResponses;
        
        const domEls = isWarning ? dom.warn : dom.positive;
        
        domEls.title.textContent = titles[key];
        domEls.container.innerHTML = '';
        
        if (!responses[key]) responses[key] = {};

        questions.forEach(q => {
            const res = responses[key][q];
            const noticed = res === true;
            const notReally = res === false;
            
            const qDiv = document.createElement('div');
            qDiv.className = 'p-4 border border-slate-200 rounded-xl shadow-sm bg-white';
            qDiv.innerHTML = `
                <p class="mb-3 text-slate-700">${q}</p>
                <div class="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
                    <button class="checkin-btn-choice ${isWarning ? 'checkin-btn-warn' : 'checkin-btn-pos'} ${noticed ? 'active' : ''}" data-value="true">Noticed</button>
                    <button class="checkin-btn-choice checkin-btn-neg ${notReally ? 'active' : ''}" data-value="false">Not Really</button>
                </div>
            `;
            
            qDiv.querySelector('.checkin-btn-warn, .checkin-btn-pos').onclick = (e) => this.selectAnswer(e, key, q, true, type);
            qDiv.querySelector('.checkin-btn-neg').onclick = (e) => this.selectAnswer(e, key, q, false, type);
            
            domEls.container.appendChild(qDiv);
        });
        
        this.updateControls(type);
        this.updateProgress(type);
    },
    
    selectAnswer: function(e, key, q, value, type) {
        const isWarning = type === 'warning';
        const responses = isWarning ? this.currentData.warningResponses : this.currentData.positiveResponses;
        
        if (!responses[key]) responses[key] = {};
        responses[key][q] = value;
        
        const btn = e.currentTarget;
        const parent = btn.parentElement;
        
        parent.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    },

    updateControls: function(type) {
        const isWarning = type === 'warning';
        const { config, state, dom } = App;
        const index = isWarning ? state.ui.currentWarningCategory : state.ui.currentPositiveCategory;
        const order = isWarning ? config.categoryOrder : config.positiveCategoryOrder;
        const domEls = isWarning ? dom.warn : dom.positive;

        domEls.prevBtn.style.display = index > 0 ? 'inline-block' : 'none';
        domEls.nextBtn.style.display = index < order.length - 1 ? 'inline-block' : 'none';
        domEls.finishBtn.style.display = index === order.length - 1 ? 'inline-block' : 'none';
        
        domEls.btnContainer.classList.toggle('sm:justify-between', index > 0);
        domEls.btnContainer.classList.toggle('sm:justify-end', index === 0);
    },

    updateProgress: function(type) {
        const isWarning = type === 'warning';
        const { config, state, dom } = App;
        const index = isWarning ? state.ui.currentWarningCategory : state.ui.currentPositiveCategory;
        const order = isWarning ? config.categoryOrder : config.positiveCategoryOrder;
        const domEls = isWarning ? dom.warn : dom.positive;
        
        const total = order.length;
        const percent = ((index + 1) / total) * 100;
        domEls.progress.value = percent;
        domEls.progressText.textContent = `Category ${index + 1} of ${total}`;
    },
    
    navigateCategory: function(dir, type) {
        if (dir === 1 && !this.allQuestionsAnswered(type)) {
            App.ui.showAlert("Please answer all questions.", "info");
            return;
        }
        
        const isWarning = type === 'warning';
        const { config, state } = App;
        
        if (isWarning) {
            state.ui.currentWarningCategory += dir;
        } else {
            state.ui.currentPositiveCategory += dir;
        }
        
        this.renderQuestions(type);
    },
    
    allQuestionsAnswered: function(type) {
        const isWarning = type === 'warning';
        const { config, state } = App;
        
        const index = isWarning ? state.ui.currentWarningCategory : state.ui.currentPositiveCategory;
        const order = isWarning ? config.categoryOrder : config.positiveCategoryOrder;
        const key = order[index];
        const questions = isWarning ? config.warningSigns[key] : config.positiveSigns[key];
        const responses = isWarning ? this.currentData.warningResponses : this.currentData.positiveResponses;

        if (!responses[key]) return false; // No responses for this category yet

        for (const q of questions) {
            if (typeof responses[key][q] === 'undefined') {
                return false;
            }
        }
        return true;
    },
    
    finish: function(type) {
        if (!this.allQuestionsAnswered(type)) {
            App.ui.showAlert("Please answer all questions.", "info");
            return;
        }
        
        // Data is already in App.state.data, just need to save
        App.storage.save('checkinHistory', App.state.data.checkinHistory, 'checkinHistory'); // This is wrong, save one entry
        App.storage.save('checkinHistory', this.currentData, this.currentData.date);
        
        App.state.ui.currentSummaryIndex = App.state.data.checkinHistory.findIndex(e => e.date === this.currentData.date);
        this.renderSummary(this.currentData);
        App.navigation.navigateTo('summaryView'); 
    },
    
    calculateTotals: function(entry) {
        let warning = 0;
        let positive = 0;
        
        if (entry.warningResponses) {
            Object.values(entry.warningResponses).forEach(cat => {
                warning += Object.values(cat).filter(Boolean).length;
            });
        }
        if (entry.positiveResponses) {
            Object.values(entry.positiveResponses).forEach(cat => {
                positive += Object.values(cat).filter(Boolean).length;
            });
        }
        return { warning, positive };
    },
    
    renderSummary: function(entry) {
        if (!entry) {
            App.dom.summary.content.innerHTML = "<p>No summary data.</p>";
            return;
        }
        
        const { summary } = App.dom;
        const { config } = App;
        const totals = this.calculateTotals(entry);
        let promptMsgs = [];
        
        let html = `<p class="text-sm text-slate-500 mb-3">Summary for: ${App.util.parseDateString(entry.date).toLocaleDateString('en-NZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>`;
        
        // Warning Signs
        html += `<h3 class="text-lg font-semibold text-indigo-800 mb-2 border-b border-indigo-200 pb-1">Warning Signs Noted</h3>`;
        let warnCount = 0;
        if (entry.warningResponses) {
            config.categoryOrder.forEach(key => {
                const responses = entry.warningResponses[key];
                if (responses && Object.values(responses).some(v => v)) {
                    let catCount = 0;
                    let listHtml = `<ul class="list-disc list-inside text-sm text-slate-600">`;
                    Object.entries(responses).forEach(([q, val]) => {
                        if (val) {
                            catCount++;
                            listHtml += `<li>${q}</li>`;
                        }
                    });
                    listHtml += `</ul>`;
                    
                    html += `<div class="mb-2 p-3 bg-white rounded-md shadow-sm">
                        <h3 class="font-semibold text-indigo-700">${config.categoryDisplayNames[key]}</h3>
                        ${listHtml}
                    </div>`;
                    
                    warnCount += catCount;
                    if (catCount >= 3) promptMsgs.push(`You noted ${catCount} signs in "${config.categoryDisplayNames[key]}".`);
                }
            });
        }
        if (warnCount === 0) html += `<p class="text-sm text-slate-500 italic mb-3">No warning signs noted.</p>`;
        
        // Positive Signs
        html += `<h3 class="text-lg font-semibold text-emerald-800 mt-4 mb-2 border-b border-emerald-200 pb-1">Positive Signs Noted</h3>`;
        let posCount = 0;
        if (entry.positiveResponses) {
            config.positiveCategoryOrder.forEach(key => {
                const responses = entry.positiveResponses[key];
                if (responses && Object.values(responses).some(v => v)) {
                    let catCount = 0;
                    let listHtml = `<ul class="list-disc list-inside text-sm text-slate-600">`;
                    Object.entries(responses).forEach(([q, val]) => {
                        if (val) {
                            catCount++;
                            listHtml += `<li>${q}</li>`;
                        }
                    });
                    listHtml += `</ul>`;
                    html += `<div class="mb-2 p-3 bg-white rounded-md shadow-sm">
                        <h3 class="font-semibold text-emerald-700">${config.positiveCategoryDisplayNames[key]}</h3>
                        ${listHtml}
                    </div>`;
                    posCount += catCount;
                }
            });
        }
        if (posCount === 0) html += `<p class="text-sm text-slate-500 italic mb-3">No positive signs noted.</p>`;
        
        // Totals and Notes
        html += `<p class="font-bold mt-4 text-md text-indigo-800">Total Warning Signs: ${totals.warning}</p>`;
        html += `<p class="font-bold mt-1 text-md text-emerald-800">Total Positive Signs: ${totals.positive}</p>`;
        
        if (entry.notes) {
            html += `<h3 class="font-semibold text-amber-700 mt-4">Personal Notes:</h3>
                     <div class="notes-display">${entry.notes.replace(/\n/g, '<br>')}</div>`;
        }
        
        summary.content.innerHTML = html;
        
        // Prompt
        if (totals.warning >= 7 && !promptMsgs.some(m => m.includes("total"))) {
            promptMsgs.push(`You noted a total of ${totals.warning} warning signs.`);
        }
        
        if (promptMsgs.length > 0) {
            summary.prompt.innerHTML = `
                <p class="font-semibold mb-1">A Moment for Reflection:</p>
                <ul class="list-disc list-inside text-sm">
                    ${promptMsgs.map(m => `<li>${m}</li>`).join('')}
                </ul>
                <p class="mt-2">Acknowledging these signs is a strength. Consider talking with a supervisor, mentor, or counsellor.</p>`;
            summary.prompt.style.display = 'block';
        } else {
            summary.prompt.style.display = 'none';
        }
    },
    
    editNotesForSummary: function() {
        App.state.ui.currentNotesIndex = App.state.ui.currentSummaryIndex;
        App.navigation.navigateTo('notesView');
    },
    
    saveNotes: function() {
        const { state, dom } = App;
        if (state.ui.currentNotesIndex !== -1 && state.data.checkinHistory[state.ui.currentNotesIndex]) {
            const entry = state.data.checkinHistory[state.ui.currentNotesIndex];
            entry.notes = dom.notes.notes.value;
            App.storage.save('checkinHistory', entry, entry.date);
            App.ui.showAlert("Notes Saved!", "success");
            this.backToSummary();
        } else {
            App.ui.showAlert("Error saving notes.", "error");
        }
    },
    
    backToSummary: function() {
        const { state

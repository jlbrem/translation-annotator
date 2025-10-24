/**
 * Translation Ranking Annotator
 * 
 * OWNER PASSWORD CONFIGURATION:
 * To change the owner password, modify the 'ownerPassword' value in the constructor below.
 * Default password: admin123
 */

class TranslationAnnotator {
    constructor() {
        this.csvData = [];
        this.currentSentenceIndex = 0;
        this.translations = [];
        this.currentEditIndex = -1;
        this.sessionSentences = []; // Current 5 sentences for this session
        this.sessionIndex = 0; // Current sentence within the session
        this.completedAnnotations = this.loadCompletedAnnotations();
        this.allAnnotations = this.loadAllAnnotations(); // Store all submitted annotations
        this.currentMode = 'user'; // 'user' or 'owner'
        this.interactedSentences = new Set(); // Track which sentences user has interacted with
        
        // OWNER PASSWORD - Change this to your desired password
        this.ownerPassword = 'admin123';
        
        this.isOwnerAuthenticated = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkForExistingData();
        this.updateModeDisplay();
    }

    setupEventListeners() {
        // CSV file upload
        document.getElementById('csvFileInput').addEventListener('change', (e) => {
            this.handleCSVUpload(e);
        });

        // Sample CSV button
        document.getElementById('loadSampleCSV').addEventListener('click', () => {
            this.loadSampleCSV();
        });

        // Sentence navigation
        document.getElementById('prevSentence').addEventListener('click', () => {
            this.previousSentence();
        });

        document.getElementById('nextSentence').addEventListener('click', () => {
            this.nextSentence();
        });

        // Add translation button
        document.getElementById('addTranslation').addEventListener('click', () => {
            this.showAddTranslationModal();
        });

        // Clear rankings button
        document.getElementById('clearRankings').addEventListener('click', () => {
            this.clearAllTranslations();
        });

        // Export data button
        document.getElementById('exportData').addEventListener('click', () => {
            this.exportAnnotations();
        });

        // Modal event listeners
        this.setupModalListeners();

        // Drag and drop setup
        this.setupDragAndDrop();
    }

    setupModalListeners() {
        const modal = document.getElementById('editModal');
        const closeBtn = document.querySelector('.close');
        const cancelBtn = document.getElementById('cancelEdit');
        const saveBtn = document.getElementById('saveEdit');

        closeBtn.addEventListener('click', () => this.closeModal());
        cancelBtn.addEventListener('click', () => this.closeModal());
        saveBtn.addEventListener('click', () => this.saveTranslation());

        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                this.closeModal();
            }
        });

        // Handle Enter key in textarea
        document.getElementById('editTextarea').addEventListener('keydown', (event) => {
            if (event.ctrlKey && event.key === 'Enter') {
                this.saveTranslation();
            }
        });
    }

    setupDragAndDrop() {
        const rankingArea = document.getElementById('rankingArea');
        let draggedElement = null;

        rankingArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            rankingArea.classList.add('drag-active');
            
            // Highlight the target item
            const afterElement = this.getDragAfterElement(rankingArea, e.clientY);
            const draggable = document.querySelector('.dragging');
            
            if (afterElement == null) {
                rankingArea.appendChild(draggable);
            } else {
                rankingArea.insertBefore(draggable, afterElement);
            }
        });

        rankingArea.addEventListener('dragenter', (e) => {
            e.preventDefault();
        });

        rankingArea.addEventListener('dragleave', (e) => {
            if (!rankingArea.contains(e.relatedTarget)) {
                rankingArea.classList.remove('drag-active');
            }
        });

        rankingArea.addEventListener('drop', (e) => {
            e.preventDefault();
            rankingArea.classList.remove('drag-active');
            
            // Get the new order from the DOM
            const items = Array.from(rankingArea.querySelectorAll('.translation-item'));
            const newOrder = items.map(item => parseInt(item.dataset.originalIndex));
            
            // Reorder the translations array based on new DOM order
            const reorderedTranslations = newOrder.map(originalIdx => 
                this.translations[originalIdx]
            );
            
            this.translations = reorderedTranslations;
            this.updateRanks();
            this.renderTranslations();
            this.markSentenceAsInteracted();
        });
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.translation-item:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    setupEventListeners() {
        // Mode switching
        document.getElementById('userModeBtn').addEventListener('click', () => {
            this.switchMode('user');
        });

        document.getElementById('ownerModeBtn').addEventListener('click', () => {
            if (this.currentMode === 'owner' && this.isOwnerAuthenticated) {
                // Already in owner mode, no need to authenticate again
                return;
            }
            this.promptOwnerPassword();
        });

        // CSV file upload (owner mode)
        document.getElementById('csvFileInput').addEventListener('change', (e) => {
            this.handleCSVUpload(e);
        });

        // Owner controls
        document.getElementById('downloadAllAnnotations').addEventListener('click', () => {
            this.downloadAllAnnotations();
        });

        document.getElementById('downloadCSV').addEventListener('click', () => {
            this.downloadOriginalCSV();
        });

        document.getElementById('resetAllData').addEventListener('click', () => {
            this.resetAllData();
        });

        // Sentence navigation
        document.getElementById('prevSentence').addEventListener('click', () => {
            this.previousSentence();
        });

        document.getElementById('nextSentence').addEventListener('click', () => {
            this.nextSentence();
        });

        // Add translation button
        document.getElementById('addTranslation').addEventListener('click', () => {
            this.showAddTranslationModal();
        });

        // Clear rankings button
        document.getElementById('clearRankings').addEventListener('click', () => {
            this.clearAllTranslations();
        });

        // Submit session button
        document.getElementById('submitSession').addEventListener('click', () => {
            this.submitSession();
        });

        // Export data button
        document.getElementById('exportData').addEventListener('click', () => {
            this.exportAnnotations();
        });

        // Modal event listeners
        this.setupModalListeners();

        // Drag and drop setup
        this.setupDragAndDrop();
    }

    checkForExistingData() {
        const storedCSV = localStorage.getItem('translationCSV');
        if (storedCSV) {
            this.parseCSV(storedCSV);
            this.showDataLoadedState();
        } else {
            this.showEmptyState();
        }
    }

    showEmptyState() {
        const emptyState = document.getElementById('emptyState');
        const activeState = document.getElementById('activeState');
        const csvUploadSection = document.getElementById('csvUploadSection');
        const dashboardSection = document.getElementById('dashboardSection');

        if (emptyState) emptyState.style.display = 'block';
        if (activeState) activeState.style.display = 'none';
        if (csvUploadSection) csvUploadSection.style.display = 'block';
        if (dashboardSection) dashboardSection.style.display = 'none';
    }

    showDataLoadedState() {
        const emptyState = document.getElementById('emptyState');
        const activeState = document.getElementById('activeState');
        const csvUploadSection = document.getElementById('csvUploadSection');
        const dashboardSection = document.getElementById('dashboardSection');

        if (emptyState) emptyState.style.display = 'none';
        if (activeState) activeState.style.display = 'block';
        if (csvUploadSection) csvUploadSection.style.display = 'none';
        if (dashboardSection) dashboardSection.style.display = 'block';
    }

    handleCSVUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const csvText = e.target.result;
            this.parseCSV(csvText);
            localStorage.setItem('translationCSV', csvText);
            this.showDataLoadedState();
            alert('CSV data uploaded successfully! Users can now start annotating.');
        };
        reader.readAsText(file);
    }

    promptOwnerPassword() {
        const password = prompt('Enter owner password to access Owner Mode:');
        
        if (password === null) {
            // User cancelled
            return;
        }
        
        if (password === this.ownerPassword) {
            this.isOwnerAuthenticated = true;
            this.switchMode('owner');
        } else {
            alert('Incorrect password. Access denied.');
            this.isOwnerAuthenticated = false;
        }
    }

    switchMode(mode) {
        // Prevent switching to owner mode without authentication
        if (mode === 'owner' && !this.isOwnerAuthenticated) {
            alert('Authentication required for Owner Mode.');
            return;
        }
        
        // Clear authentication when switching to user mode
        if (mode === 'user') {
            this.isOwnerAuthenticated = false;
        }
        
        this.currentMode = mode;
        this.updateModeDisplay();
        
        if (mode === 'owner') {
            this.updateOwnerStats();
            // Hide annotation panel in owner mode
            document.getElementById('annotationPanel').style.display = 'none';
        }
    }

    updateModeDisplay() {
        const userSection = document.getElementById('userModeSection');
        const ownerSection = document.getElementById('ownerModeSection');
        const userBtn = document.getElementById('userModeBtn');
        const ownerBtn = document.getElementById('ownerModeBtn');
        const submitBtn = document.getElementById('submitSession');
        const exportBtn = document.getElementById('exportData');
        const addBtn = document.getElementById('addTranslation');
        const clearBtn = document.getElementById('clearRankings');

        if (this.currentMode === 'user') {
            userSection.style.display = 'block';
            ownerSection.style.display = 'none';
            userBtn.classList.add('active');
            ownerBtn.classList.remove('active');
            submitBtn.style.display = 'inline-flex';
            exportBtn.style.display = 'none';
            addBtn.style.display = 'none';
            clearBtn.style.display = 'none';
        } else {
            userSection.style.display = 'none';
            ownerSection.style.display = 'block';
            userBtn.classList.remove('active');
            ownerBtn.classList.add('active');
            submitBtn.style.display = 'none';
            exportBtn.style.display = 'inline-flex';
            addBtn.style.display = 'inline-flex';
            clearBtn.style.display = 'inline-flex';
        }
    }

    loadAllAnnotations() {
        const stored = localStorage.getItem('allAnnotations');
        return stored ? JSON.parse(stored) : [];
    }

    saveAllAnnotations() {
        localStorage.setItem('allAnnotations', JSON.stringify(this.allAnnotations));
    }

    updateOwnerStats() {
        const statsElement = document.getElementById('ownerStats');
        const totalSentences = this.csvData.length;
        const completedSentences = this.completedAnnotations.length;
        const totalAnnotations = this.allAnnotations.length;
        
        statsElement.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                <div><strong>Total Sentences:</strong><br>${totalSentences}</div>
                <div><strong>Completed:</strong><br>${completedSentences}</div>
                <div><strong>Remaining:</strong><br>${totalSentences - completedSentences}</div>
                <div><strong>Total Annotations:</strong><br>${totalAnnotations}</div>
            </div>
        `;
    }

    getAvailableSentences() {
        return this.csvData.filter(sentence => !this.completedAnnotations.includes(sentence.id));
    }

    selectRandomSentences(count = 5) {
        const available = this.getAvailableSentences();
        
        if (available.length === 0) {
            return [];
        }

        // Shuffle and take up to count sentences
        const shuffled = [...available].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, available.length));
    }

    shuffleTranslations(translations) {
        return [...translations].sort(() => Math.random() - 0.5);
    }

    startNewSession() {
        if (this.csvData.length === 0) {
            alert('No translation data available. Please contact the system administrator to upload CSV data.');
            return;
        }

        // Don't start annotation sessions in owner mode
        if (this.currentMode === 'owner') {
            alert('Annotation sessions are for users only. Switch to User Mode to test annotations.');
            return;
        }

        this.sessionSentences = this.selectRandomSentences(5);
        
        if (this.sessionSentences.length === 0) {
            this.showCompletionMessage();
            return;
        }

        // Shuffle translations for each sentence
        this.sessionSentences.forEach(sentence => {
            sentence.shuffledTranslations = this.shuffleTranslations(sentence.translations);
        });

        this.sessionIndex = 0;
        this.interactedSentences.clear(); // Reset interaction tracking
        this.loadCurrentSessionSentence();
        this.showAnnotationPanel();
        this.updateSessionProgress();
        this.resetSubmitButton();
        this.updateCompletionStatus();
    }

    resetSubmitButton() {
        const submitBtn = document.getElementById('submitSession');
        const nextBtn = document.getElementById('nextSentence');
        
        submitBtn.style.display = 'none';
        submitBtn.disabled = true;
        nextBtn.style.display = 'inline-flex';
    }

    markSentenceAsInteracted() {
        if (this.sessionSentences.length > 0) {
            const currentSentence = this.sessionSentences[this.sessionIndex];
            this.interactedSentences.add(currentSentence.id);
            this.updateCompletionStatus();
        }
    }

    updateCompletionStatus() {
        const completionText = document.getElementById('completionText');
        const progressFill = document.getElementById('progressFill');
        const submitBtn = document.getElementById('submitSession');
        
        if (!completionText || !progressFill || !submitBtn) return;

        const totalSentences = this.sessionSentences.length;
        const interactedCount = this.interactedSentences.size;
        const percentage = (interactedCount / totalSentences) * 100;

        progressFill.style.width = `${percentage}%`;
        
        if (interactedCount === totalSentences) {
            completionText.textContent = 'All sentences completed! You can now submit.';
            progressFill.classList.add('complete');
            submitBtn.disabled = false;
        } else {
            completionText.textContent = `${interactedCount}/${totalSentences} sentences completed`;
            progressFill.classList.remove('complete');
            submitBtn.disabled = true;
        }
    }

    loadCurrentSessionSentence() {
        if (this.sessionSentences.length === 0) return;

        const currentData = this.sessionSentences[this.sessionIndex];
        
        // Update source text
        document.getElementById('sourceText').textContent = currentData.sourceText;
        
        // Load shuffled translations
        this.translations = [];
        currentData.shuffledTranslations.forEach((translation, index) => {
            this.addTranslation(translation);
        });

        // Update navigation
        this.updateSessionNavigation();
    }

    updateSessionNavigation() {
        const prevBtn = document.getElementById('prevSentence');
        const nextBtn = document.getElementById('nextSentence');
        const counter = document.getElementById('sentenceCounter');

        prevBtn.disabled = this.sessionIndex === 0;
        nextBtn.disabled = this.sessionIndex === this.sessionSentences.length - 1;
        
        if (this.sessionSentences.length > 0) {
            const currentData = this.sessionSentences[this.sessionIndex];
            counter.textContent = `ID: ${currentData.id} - Session ${this.sessionIndex + 1} of ${this.sessionSentences.length}`;
        }
    }

    updateSessionProgress() {
        // Update any progress indicators in the UI
        const progressInfo = document.getElementById('progressInfo');
        if (progressInfo) {
            const totalCompleted = this.completedAnnotations.length;
            const totalAvailable = this.csvData.length;
            progressInfo.textContent = `Progress: ${totalCompleted}/${totalAvailable} sentences completed`;
        }
    }

    resetAllProgress() {
        if (confirm('Are you sure you want to reset all progress? This will clear all completed annotations and cannot be undone.')) {
            this.completedAnnotations = [];
            this.saveCompletedAnnotations();
            this.startNewSession();
            alert('All progress has been reset. Starting fresh session...');
        }
    }

    parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        this.csvData = [];

        if (lines.length < 2) {
            alert('CSV file must have at least a header row and one data row.');
            return;
        }

        // Parse headers from first row
        const headerColumns = this.parseCSVLine(lines[0]);
        const translationHeaders = headerColumns.slice(2); // Skip ID and sentence columns

        // Parse data rows
        lines.slice(1).forEach((line, index) => {
            const columns = this.parseCSVLine(line);
            if (columns.length >= 3) {
                const id = columns[0].trim();
                const sourceText = columns[1].trim();
                const translations = columns.slice(2).map((t, colIndex) => ({
                    text: t.trim(),
                    header: translationHeaders[colIndex] ? translationHeaders[colIndex].trim() : `Col${colIndex + 2}`,
                    originalColumn: colIndex + 2,
                    originalIndex: colIndex
                })).filter(t => t.text);
                
                this.csvData.push({
                    id: id,
                    sourceText: sourceText,
                    translations: translations,
                    rankings: [] // Will store user rankings
                });
            }
        });

        if (this.csvData.length > 0) {
            // Only start a new session if in user mode
            if (this.currentMode === 'user') {
                this.startNewSession();
            }
        } else {
            alert('No valid data found in CSV file. Please check the format: ID, sentence, translation1, translation2, ...');
        }
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current);
        return result;
    }

    parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        this.csvData = [];

        if (lines.length < 2) {
            alert('CSV file must have at least a header row and one data row.');
            return;
        }

        // Parse headers from first row
        const headerColumns = this.parseCSVLine(lines[0]);
        const translationHeaders = headerColumns.slice(2); // Skip ID and sentence columns

        // Parse data rows
        lines.slice(1).forEach((line, index) => {
            const columns = this.parseCSVLine(line);
            if (columns.length >= 3) {
                const id = columns[0].trim();
                const sourceText = columns[1].trim();
                const translations = columns.slice(2).map((t, colIndex) => ({
                    text: t.trim(),
                    header: translationHeaders[colIndex] ? translationHeaders[colIndex].trim() : `Col${colIndex + 2}`,
                    originalColumn: colIndex + 2,
                    originalIndex: colIndex
                })).filter(t => t.text);
                
                this.csvData.push({
                    id: id,
                    sourceText: sourceText,
                    translations: translations,
                    rankings: [] // Will store user rankings
                });
            }
        });

        if (this.csvData.length > 0) {
            // Start a new session with random sentences
            this.startNewSession();
        } else {
            alert('No valid data found in CSV file. Please check the format: ID, sentence, translation1, translation2, ...');
        }
    }

    showAnnotationPanel() {
        document.getElementById('annotationPanel').style.display = 'block';
    }

    loadCurrentSentence() {
        if (this.csvData.length === 0) return;

        const currentData = this.csvData[this.currentSentenceIndex];
        
        // Update source text
        document.getElementById('sourceText').textContent = currentData.sourceText;
        
        // Load translations
        this.translations = [];
        currentData.translations.forEach((translation, index) => {
            this.addTranslation(translation);
        });

        // Update navigation
        this.updateNavigation();
    }

    updateNavigation() {
        const prevBtn = document.getElementById('prevSentence');
        const nextBtn = document.getElementById('nextSentence');
        const counter = document.getElementById('sentenceCounter');

        prevBtn.disabled = this.currentSentenceIndex === 0;
        nextBtn.disabled = this.currentSentenceIndex === this.csvData.length - 1;
        
        if (this.csvData.length > 0) {
            const currentData = this.csvData[this.currentSentenceIndex];
            counter.textContent = `ID: ${currentData.id} - Sentence ${this.currentSentenceIndex + 1} of ${this.csvData.length}`;
        }
    }

    previousSentence() {
        if (this.sessionIndex > 0) {
            this.saveCurrentRankings();
            this.sessionIndex--;
            this.loadCurrentSessionSentence();
        }
    }

    nextSentence() {
        if (this.sessionIndex < this.sessionSentences.length - 1) {
            this.saveCurrentRankings();
            this.sessionIndex++;
            this.loadCurrentSessionSentence();
        } else {
            // End of session - show submit button
            this.saveCurrentRankings();
            this.showSubmitButton();
        }
    }

    showSubmitButton() {
        const submitBtn = document.getElementById('submitSession');
        const nextBtn = document.getElementById('nextSentence');
        
        submitBtn.style.display = 'inline-flex';
        nextBtn.style.display = 'none';
        
        // Update navigation to show completion
        const counter = document.getElementById('sentenceCounter');
        if (this.sessionSentences.length > 0) {
            const currentData = this.sessionSentences[this.sessionIndex];
            counter.textContent = `ID: ${currentData.id} - Session Complete (${this.sessionSentences.length}/5)`;
        }

        // Check if all sentences have been interacted with
        this.updateCompletionStatus();
    }

    loadCompletedAnnotations() {
        const stored = localStorage.getItem('completedAnnotations');
        return stored ? JSON.parse(stored) : [];
    }

    saveCompletedAnnotations() {
        localStorage.setItem('completedAnnotations', JSON.stringify(this.completedAnnotations));
    }

    submitSession() {
        // Check if all sentences have been interacted with
        if (this.interactedSentences.size < this.sessionSentences.length) {
            alert('Please interact with all sentences by moving at least one translation in each before submitting.');
            return;
        }

        this.saveCurrentRankings();
        
        // Create session data for submission
        const sessionData = {
            timestamp: new Date().toISOString(),
            sessionId: Date.now(),
            sentences: this.sessionSentences.map(sentence => ({
                id: sentence.id,
                sourceText: sentence.sourceText,
                originalTranslations: sentence.translations,
                shuffledTranslations: sentence.shuffledTranslations,
                rankings: sentence.rankings || []
            }))
        };

        // Add to all annotations
        this.allAnnotations.push(sessionData);
        this.saveAllAnnotations();

        // Mark sentences as completed
        this.sessionSentences.forEach(sentence => {
            if (!this.completedAnnotations.includes(sentence.id)) {
                this.completedAnnotations.push(sentence.id);
            }
        });
        
        this.saveCompletedAnnotations();
        
        // Check if there are more sentences to annotate
        const remainingSentences = this.getAvailableSentences();
        
        if (remainingSentences.length > 0) {
            // Show success message and automatically start new session
            alert(`Session submitted successfully!\n\nYou completed ${this.sessionSentences.length} translation rankings.\n\nLoading next 5 sentences...`);
            this.startNewSession();
        } else {
            // All sentences completed
            alert(`Session submitted successfully!\n\nYou completed ${this.sessionSentences.length} translation rankings.\n\nAll sentences have been annotated. Thank you for your contribution!`);
            this.showCompletionMessage();
        }
    }

    showCompletionMessage() {
        const totalCompleted = this.completedAnnotations.length;
        const totalAvailable = this.csvData.length;
        
        // Hide annotation panel and show completion message
        document.getElementById('annotationPanel').style.display = 'none';
        
        // Update the active state to show completion
        const activeState = document.getElementById('activeState');
        if (activeState) {
            activeState.innerHTML = `
                <div class="completion-message">
                    <div class="completion-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h3>All Annotations Completed!</h3>
                    <p>You have successfully completed all ${totalCompleted} sentences.</p>
                    <p>Thank you for your valuable contributions!</p>
                </div>
            `;
            activeState.style.display = 'block';
        }
    }

    downloadAllAnnotations() {
        if (this.allAnnotations.length === 0) {
            alert('No annotations have been submitted yet.');
            return;
        }

        const exportData = {
            exportTimestamp: new Date().toISOString(),
            totalSessions: this.allAnnotations.length,
            totalAnnotations: this.allAnnotations.reduce((sum, session) => sum + session.sentences.length, 0),
            sessions: this.allAnnotations
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `all-translation-annotations-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        alert(`Downloaded ${this.allAnnotations.length} annotation sessions with ${exportData.totalAnnotations} total rankings.`);
    }

    downloadOriginalCSV() {
        const storedCSV = localStorage.getItem('translationCSV');
        if (!storedCSV) {
            alert('No CSV data found.');
            return;
        }

        const dataBlob = new Blob([storedCSV], { type: 'text/csv' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'original-translation-data.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    resetAllData() {
        if (confirm('Are you sure you want to reset ALL data? This will delete all annotations, completed progress, and CSV data. This action cannot be undone.')) {
            this.completedAnnotations = [];
            this.allAnnotations = [];
            this.csvData = [];
            localStorage.removeItem('completedAnnotations');
            localStorage.removeItem('allAnnotations');
            localStorage.removeItem('translationCSV');
            this.showEmptyState();
            this.updateOwnerStats();
            alert('All data has been reset. The system is now empty and ready for new CSV data.');
        }
    }

    saveCurrentRankings() {
        if (this.sessionSentences.length > 0 && this.sessionIndex < this.sessionSentences.length) {
            const currentSentence = this.sessionSentences[this.sessionIndex];
            currentSentence.rankings = this.translations.map(t => ({
                rank: t.rank,
                text: t.text,
                id: t.id,
                header: t.header,
                originalColumn: t.originalColumn,
                originalIndex: t.originalIndex
            }));
        }
    }

    addTranslation(translationData) {
        const translation = {
            id: Date.now() + Math.random(),
            text: typeof translationData === 'string' ? translationData : translationData.text,
            header: translationData.header || null,
            originalColumn: translationData.originalColumn || null,
            originalIndex: translationData.originalIndex || null,
            rank: this.translations.length + 1
        };

        this.translations.push(translation);
        this.renderTranslations();
    }

    showAddTranslationModal() {
        this.currentEditIndex = -1;
        document.getElementById('editTextarea').value = '';
        document.getElementById('editModal').style.display = 'block';
        document.getElementById('editTextarea').focus();
    }

    showEditModal(index) {
        this.currentEditIndex = index;
        document.getElementById('editTextarea').value = this.translations[index].text;
        document.getElementById('editModal').style.display = 'block';
        document.getElementById('editTextarea').focus();
    }

    closeModal() {
        document.getElementById('editModal').style.display = 'none';
        this.currentEditIndex = -1;
    }

    saveTranslation() {
        const text = document.getElementById('editTextarea').value.trim();
        
        if (!text) {
            alert('Please enter some text for the translation.');
            return;
        }

        if (this.currentEditIndex === -1) {
            // Adding new translation
            this.addTranslation(text);
        } else {
            // Editing existing translation
            this.translations[this.currentEditIndex].text = text;
            this.renderTranslations();
        }

        this.closeModal();
    }

    deleteTranslation(index) {
        if (confirm('Are you sure you want to delete this translation?')) {
            this.translations.splice(index, 1);
            this.updateRanks();
            this.renderTranslations();
        }
    }


    updateRanks() {
        this.translations.forEach((translation, index) => {
            translation.rank = index + 1;
        });
    }

    renderTranslations() {
        const rankingArea = document.getElementById('rankingArea');
        rankingArea.innerHTML = '';

        this.translations.forEach((translation, index) => {
            const translationElement = this.createTranslationElement(translation, index);
            rankingArea.appendChild(translationElement);
        });
    }

    createTranslationElement(translation, index) {
        const div = document.createElement('div');
        div.className = 'translation-item';
        div.draggable = true;
        div.dataset.index = index;
        div.dataset.originalIndex = index; // Store original index for reordering

        // Only show edit button in owner mode
        const editButton = this.currentMode === 'owner' ? 
            `<button class="edit-btn" title="Edit translation">
                <i class="fas fa-edit"></i>
            </button>` : '';

        div.innerHTML = `
            <div class="rank-number">${translation.rank}</div>
            <div class="content">${this.escapeHtml(translation.text)}</div>
            <div class="drag-handle" title="Drag to reorder">
                <i class="fas fa-grip-vertical"></i>
            </div>
            ${editButton}
        `;

        // Add event listeners
        div.addEventListener('dragstart', (e) => {
            e.dataTransfer.effectAllowed = 'move';
            div.classList.add('dragging');
        });

        div.addEventListener('dragend', () => {
            div.classList.remove('dragging');
        });

        // Only add edit functionality in owner mode
        if (this.currentMode === 'owner') {
            div.addEventListener('click', (e) => {
                if (e.target.closest('.edit-btn')) {
                    this.showEditModal(index);
                }
            });

            // Add double-click to edit
            div.addEventListener('dblclick', () => {
                this.showEditModal(index);
            });
        }

        return div;
    }

    clearAllTranslations() {
        if (this.translations.length === 0) {
            alert('No translations to clear.');
            return;
        }

        if (confirm('Are you sure you want to clear all translations? This action cannot be undone.')) {
            this.translations = [];
            this.renderTranslations();
        }
    }

    exportAnnotations() {
        if (this.csvData.length === 0) {
            alert('No data to export. Please load a CSV file first.');
            return;
        }

        // Save current rankings before exporting
        this.saveCurrentRankings();

        const exportData = {
            timestamp: new Date().toISOString(),
            totalSentences: this.csvData.length,
            sentences: this.csvData.map((sentenceData, index) => ({
                id: sentenceData.id,
                sentenceIndex: index + 1,
                sourceText: sentenceData.sourceText,
                originalTranslations: sentenceData.translations,
                rankings: sentenceData.rankings.length > 0 ? sentenceData.rankings : 
                    sentenceData.translations.map((translation, rank) => ({
                        rank: rank + 1,
                        text: translation.text,
                        id: `original_${sentenceData.id}_${rank}`,
                        header: translation.header,
                        originalColumn: translation.originalColumn,
                        originalIndex: translation.originalIndex
                    }))
            }))
        };

        // Create and download JSON file
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `translation-annotations-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // Also show a summary
        this.showExportSummary(exportData);
    }

    showExportSummary(data) {
        const summary = `
Translation Annotations Exported Successfully!

Summary:
- Total Sentences: ${data.totalSentences}
- Export Time: ${new Date(data.timestamp).toLocaleString()}

Sentences Processed:
${data.sentences.map(s => `ID ${s.id}: "${s.sourceText.substring(0, 40)}${s.sourceText.length > 40 ? '...' : ''}" (${s.rankings.length} translations)`).join('\n')}
        `;

        alert(summary);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TranslationAnnotator();
});

// Add some keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + N to add new translation
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        document.getElementById('addTranslation').click();
    }
    
    // Ctrl/Cmd + S to export
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        document.getElementById('exportData').click();
    }
    
    // Escape to close modal
    if (e.key === 'Escape') {
        const modal = document.getElementById('editModal');
        if (modal.style.display === 'block') {
            modal.style.display = 'none';
        }
    }
});

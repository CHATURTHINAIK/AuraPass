document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const lengthSlider = document.getElementById('length-slider');
    const lengthVal = document.getElementById('length-val');
    const toggleUppercase = document.getElementById('toggle-uppercase');
    const toggleLowercase = document.getElementById('toggle-lowercase');
    const toggleNumbers = document.getElementById('toggle-numbers');
    const toggleSymbols = document.getElementById('toggle-symbols');
    const passwordDisplay = document.getElementById('password-display');
    const copyBtn = document.getElementById('copy-btn');
    const copyTooltip = document.getElementById('copy-tooltip');
    const generateBtn = document.getElementById('generate-btn');
    const strengthBar = document.getElementById('strength-bar');
    const strengthText = document.getElementById('strength-text');

    // Update length display as slider moves
    lengthSlider.addEventListener('input', (e) => {
        lengthVal.textContent = e.target.value;
    });

    // Check if at least one checkbox is checked
    function isAnyCheckboxChecked() {
        return toggleUppercase.checked || 
               toggleLowercase.checked || 
               toggleNumbers.checked || 
               toggleSymbols.checked;
    }

    // Monitor checkbox states to prevent setting all to unchecked
    const checkboxes = [toggleUppercase, toggleLowercase, toggleNumbers, toggleSymbols];
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            if (!isAnyCheckboxChecked()) {
                // Keep the last active one checked or show visual warnings
                checkbox.checked = true;
                showNotification("At least one option must be selected!", "warning");
            }
        });
    });

    // Calculate password strength visually
    function updateStrengthMeter(password) {
        if (!password) {
            strengthBar.className = 'strength-bar';
            strengthText.textContent = 'Strength: N/A';
            return;
        }

        const len = password.length;
        let score = 0;

        if (len >= 8) score++;
        if (len >= 14) score++;
        
        // Count variety of characters
        let hasUpper = /[A-Z]/.test(password);
        let hasLower = /[a-z]/.test(password);
        let hasDigit = /[0-9]/.test(password);
        let hasSpecial = /[^A-Za-z0-9]/.test(password);
        
        const varietyCount = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;
        score += (varietyCount - 1);

        // Map score to UX
        strengthBar.className = 'strength-bar';
        if (score <= 1) {
            strengthBar.classList.add('weak');
            strengthText.textContent = 'Strength: Weak';
            strengthText.style.color = 'var(--danger)';
        } else if (score === 2 || score === 3) {
            strengthBar.classList.add('medium');
            strengthText.textContent = 'Strength: Medium';
            strengthText.style.color = 'var(--warning)';
        } else {
            strengthBar.classList.add('strong');
            strengthText.textContent = 'Strength: Strong';
            strengthText.style.color = 'var(--success)';
        }
    }

    // Temporary warning notifications
    function showNotification(message, type = "info") {
        // Simple alert for now, or custom toast if needed
        alert(message);
    }

    // Call API to generate password
    async function generatePassword() {
        const payload = {
            length: parseInt(lengthSlider.value, 10),
            uppercase: toggleUppercase.checked,
            lowercase: toggleLowercase.checked,
            numbers: toggleNumbers.checked,
            symbols: toggleSymbols.checked
        };

        // Visual loading state
        generateBtn.disabled = true;
        const originalBtnText = generateBtn.querySelector('span').textContent;
        generateBtn.querySelector('span').textContent = 'Generating...';

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok && data.password) {
                // Enable display and copy
                passwordDisplay.disabled = false;
                passwordDisplay.value = data.password;
                copyBtn.disabled = false;
                
                // Update UX indicators
                updateStrengthMeter(data.password);
                
                // Sparkle animation effect can go here
                animateTextReveal(passwordDisplay);
            } else {
                showNotification(data.error || 'Failed to generate password.', 'error');
            }
        } catch (error) {
            console.error('Error generating password:', error);
            showNotification('Network error. Is the Flask server running?', 'error');
        } finally {
            generateBtn.disabled = false;
            generateBtn.querySelector('span').textContent = originalBtnText;
        }
    }

    // Text Reveal Animation
    function animateTextReveal(inputEl) {
        inputEl.style.letterSpacing = '0.3em';
        inputEl.style.transition = 'letter-spacing 0.5s ease-out';
        setTimeout(() => {
            inputEl.style.letterSpacing = '0.05em';
        }, 50);
    }

    // Copy to Clipboard
    async function copyToClipboard() {
        const password = passwordDisplay.value;
        if (!password || copyBtn.disabled) return;

        try {
            await navigator.clipboard.writeText(password);
            
            // Show feedback tooltip
            copyTooltip.textContent = 'Copied!';
            copyTooltip.style.opacity = '1';
            copyTooltip.style.visibility = 'visible';
            copyTooltip.style.transform = 'translateX(50%) translateY(0)';
            
            // Revert feedback after delay
            setTimeout(() => {
                copyTooltip.style.opacity = '';
                copyTooltip.style.visibility = '';
                copyTooltip.style.transform = '';
                // Wait for transition to finish before changing text
                setTimeout(() => {
                    copyTooltip.textContent = 'Copy';
                }, 200);
            }, 1500);

        } catch (err) {
            console.error('Failed to copy text: ', err);
            showNotification('Could not copy to clipboard automatically.', 'error');
        }
    }

    // Event Listeners
    generateBtn.addEventListener('click', generatePassword);
    copyBtn.addEventListener('click', copyToClipboard);
});

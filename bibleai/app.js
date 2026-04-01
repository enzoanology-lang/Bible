// State Management
const state = {
    isAuthenticated: false,
    userToken: null,
    userName: null,
    currentModel: 'v4',
    chatHistory: []
};

// DOM Elements
const elements = {
    loginModal: document.getElementById('login-modal'),
    modalLoginBtn: document.getElementById('modal-login-btn'),
    modalSignupBtn: document.getElementById('modal-signup-btn'),
    modalGuestBtn: document.getElementById('modal-guest-btn'),
    chatContainer: document.getElementById('chat-container'),
    messageInput: document.getElementById('message-input'),
    sendBtn: document.getElementById('send-btn'),
    micBtn: document.getElementById('mic-btn'),
    modelSelect: document.getElementById('model-select'),
    logoutBtn: document.getElementById('logout-btn'),
    profileLink: document.getElementById('profile-link'),
    bibleLink: document.getElementById('bible-link'),
    aboutLink: document.getElementById('about-link')
};

// API Configuration
const API_ENDPOINT = 'https://restapi-ratx.onrender.com/api/biblegpt';

// Initialize App
function initApp() {
    checkAuthentication();
    setupEventListeners();
    adjustTextareaHeight();
}

// Authentication Check
function checkAuthentication() {
    const token = localStorage.getItem('bibleai_token');
    const userName = localStorage.getItem('bibleai_user');
    
    if (token) {
        state.isAuthenticated = true;
        state.userToken = token;
        state.userName = userName || 'User';
        hideLoginModal();
    } else {
        showLoginModal();
    }
}

// Show/Hide Login Modal
function showLoginModal() {
    elements.loginModal.classList.add('active');
}

function hideLoginModal() {
    elements.loginModal.classList.remove('active');
}

// Event Listeners
function setupEventListeners() {
    // Modal buttons
    elements.modalLoginBtn.addEventListener('click', () => {
        window.location.href = 'sign-in.html';
    });

    elements.modalSignupBtn.addEventListener('click', () => {
        window.location.href = 'sign-up.html';
    });

    elements.modalGuestBtn.addEventListener('click', handleGuestAccess);

    // Send message
    elements.sendBtn.addEventListener('click', handleSendMessage);
    elements.messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });

    // Auto-resize textarea
    elements.messageInput.addEventListener('input', adjustTextareaHeight);

    // Model selection
    elements.modelSelect.addEventListener('change', (e) => {
        state.currentModel = e.target.value;
    });

    // Logout
    elements.logoutBtn.addEventListener('click', handleLogout);

    // Mic button (voice input placeholder)
    elements.micBtn.addEventListener('click', handleVoiceInput);

    // Navigation links
    elements.profileLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (!state.isAuthenticated) {
            showLoginModal();
        } else {
            alert('Profile feature coming soon!');
        }
    });

    elements.bibleLink.addEventListener('click', (e) => {
        e.preventDefault();
        alert('Bible reading feature coming soon!');
    });

    elements.aboutLink.addEventListener('click', (e) => {
        e.preventDefault();
        alert('Bibleai is your AI-powered companion for exploring scripture and biblical wisdom.');
    });
}

// Guest Access
function handleGuestAccess() {
    state.isAuthenticated = true;
    state.userName = 'Guest';
    localStorage.setItem('bibleai_token', 'guest_token');
    localStorage.setItem('bibleai_user', 'Guest');
    hideLoginModal();
}

// Handle Logout
function handleLogout() {
    localStorage.removeItem('bibleai_token');
    localStorage.removeItem('bibleai_user');
    state.isAuthenticated = false;
    state.userToken = null;
    state.userName = null;
    state.chatHistory = [];
    window.location.reload();
}

// Auto-resize Textarea
function adjustTextareaHeight() {
    elements.messageInput.style.height = 'auto';
    elements.messageInput.style.height = Math.min(elements.messageInput.scrollHeight, 150) + 'px';
}

// Send Message
async function handleSendMessage() {
    const message = elements.messageInput.value.trim();
    
    if (!message) return;

    if (!state.isAuthenticated) {
        showLoginModal();
        return;
    }

    // Clear input
    elements.messageInput.value = '';
    adjustTextareaHeight();

    // Add user message to chat
    addMessage(message, 'user');

    // Show typing indicator
    const typingId = showTypingIndicator();

    try {
        // Call API
        const response = await fetch(`${API_ENDPOINT}?q=${encodeURIComponent(message)}`);
        
        if (!response.ok) {
            throw new Error('API request failed');
        }

        const data = await response.json();
        
        // Remove typing indicator
        removeTypingIndicator(typingId);

        // Add AI response to chat
        const aiResponse = data.response || data.answer || data.message || 'I apologize, but I could not process your request. Please try again.';
        addMessage(aiResponse, 'assistant');

        // Update chat history
        state.chatHistory.push({
            user: message,
            assistant: aiResponse,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error:', error);
        removeTypingIndicator(typingId);
        addMessage('I apologize, but I encountered an error. Please try again later.', 'assistant');
    }

    // Scroll to bottom
    scrollToBottom();
}

// Add Message to Chat
function addMessage(content, role) {
    // Remove welcome message if it exists
    const welcomeMessage = elements.chatContainer.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = role === 'user' ? (state.userName ? state.userName[0].toUpperCase() : 'U') : 'AI';

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    // Convert markdown-like formatting to HTML
    const formattedContent = formatMessage(content);
    messageContent.innerHTML = formattedContent;

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);

    elements.chatContainer.appendChild(messageDiv);
}

// Format Message (basic markdown support)
function formatMessage(text) {
    // Convert newlines to <br>
    let formatted = text.replace(/\n/g, '<br>');
    
    // Bold: **text** or __text__
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/__(.*?)__/g, '<strong>$1</strong>');
    
    // Italic: *text* or _text_
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/_(.*?)_/g, '<em>$1</em>');
    
    // Split into paragraphs
    const paragraphs = formatted.split('<br><br>');
    formatted = paragraphs.map(p => `<p>${p}</p>`).join('');
    
    return formatted;
}

// Typing Indicator
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message assistant';
    typingDiv.id = 'typing-indicator';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = 'AI';

    const typingContent = document.createElement('div');
    typingContent.className = 'message-content';
    typingContent.innerHTML = `
        <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;

    typingDiv.appendChild(avatar);
    typingDiv.appendChild(typingContent);

    elements.chatContainer.appendChild(typingDiv);
    scrollToBottom();

    return 'typing-indicator';
}

function removeTypingIndicator(id) {
    const typingIndicator = document.getElementById(id);
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Scroll to Bottom
function scrollToBottom() {
    elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight;
}

// Voice Input (Placeholder)
function handleVoiceInput() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            elements.micBtn.style.color = '#d4a574';
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            elements.messageInput.value = transcript;
            adjustTextareaHeight();
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            alert('Voice input error. Please check your microphone permissions.');
        };

        recognition.onend = () => {
            elements.micBtn.style.color = '';
        };

        recognition.start();
    } else {
        alert('Voice input is not supported in your browser. Please use Chrome or Safari.');
    }
}

// Load chat history from localStorage (optional feature)
function loadChatHistory() {
    const savedHistory = localStorage.getItem('bibleai_chat_history');
    if (savedHistory) {
        try {
            state.chatHistory = JSON.parse(savedHistory);
            // Optionally display previous messages
        } catch (e) {
            console.error('Error loading chat history:', e);
        }
    }
}

// Save chat history to localStorage
function saveChatHistory() {
    try {
        localStorage.setItem('bibleai_chat_history', JSON.stringify(state.chatHistory));
    } catch (e) {
        console.error('Error saving chat history:', e);
    }
}

// Auto-save chat history
setInterval(() => {
    if (state.chatHistory.length > 0) {
        saveChatHistory();
    }
}, 30000); // Save every 30 seconds

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

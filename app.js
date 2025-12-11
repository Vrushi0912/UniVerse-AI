// Configuration
const CONFIG = {
    GEMINI_API_KEY: 'AIzaSyCBKYLT_8T9eVQF7zm-2eaMHJi-zaQVwu8',
    UNSPLASH_ACCESS_KEY: 'demo', // Using demo mode - get free key at unsplash.com/developers
};

// DOM Elements
const topicInput = document.getElementById('topicInput');
const generateBtn = document.getElementById('generateBtn');
const regenerateBtn = document.getElementById('regenerateBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const contentSection = document.getElementById('contentSection');
const errorSection = document.getElementById('errorSection');
const errorMessage = document.getElementById('errorMessage');
const contentTitle = document.getElementById('contentTitle');
const contentBody = document.getElementById('contentBody');
const generatedImage = document.getElementById('generatedImage');
const audioPlayer = document.getElementById('audioPlayer');
const audioSource = document.getElementById('audioSource');

let currentTopic = '';

// Event Listeners
generateBtn.addEventListener('click', handleGenerate);
regenerateBtn.addEventListener('click', handleRegenerate);
topicInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleGenerate();
});

// Main generation handler
async function handleGenerate() {
    const topic = topicInput.value.trim();
    if (!topic) {
        showError('Please enter a topic to learn about');
        return;
    }
    
    currentTopic = topic;
    await generateContent(topic);
}

// Regenerate handler
async function handleRegenerate() {
    if (!currentTopic) {
        showError('Please generate content first');
        return;
    }
    await generateContent(currentTopic);
}

// Main content generation function
async function generateContent(topic) {
    showLoading();
    hideError();
    
    try {
        // Generate all content in parallel
        const [content, imageUrl, audioUrl] = await Promise.all([
            generateTextContent(topic),
            generateImage(topic),
            generateAudio(topic)
        ]);
        
        // Display results
        displayContent(content);
        displayImage(imageUrl);
        displayAudio(audioUrl);
        
        showContent();
    } catch (error) {
        console.error('Generation error:', error);
        showError('Failed to generate content. Please check your API keys and try again.');
    } finally {
        hideLoading();
    }
}

// Generate text content using Gemini API
async function generateTextContent(topic) {
    const prompt = `Create educational content about "${topic}" in the following format:

Title: [Create an engaging title]

## Overview
[Brief introduction in 2-3 sentences]

## Key Concepts
- [Point 1]
- [Point 2]
- [Point 3]
- [Point 4]

## How It Works
[Concise explanation in 2-3 sentences]

## Common Use Cases
- [Use case 1]
- [Use case 2]
- [Use case 3]

Keep it concise and educational.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${CONFIG.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to generate text content: ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

// Generate image using Unsplash API
async function generateImage(topic) {
    try {
        // Use Unsplash to fetch relevant educational images
        const searchQuery = encodeURIComponent(topic);
        const response = await fetch(`https://api.unsplash.com/photos/random?query=${searchQuery}&orientation=landscape&client_id=${CONFIG.UNSPLASH_ACCESS_KEY}`);
        
        if (!response.ok) {
            // Fallback to Picsum for random placeholder image
            return `https://picsum.photos/seed/${encodeURIComponent(topic)}/800/600`;
        }
        
        const data = await response.json();
        return data.urls.regular;
    } catch (error) {
        console.warn('Image API failed, using placeholder:', error);
        // Fallback to placeholder
        return `https://picsum.photos/seed/${encodeURIComponent(topic)}/800/600`;
    }
}

// Generate audio using Web Speech API (browser-based TTS)
async function generateAudio(topic) {
    try {
        // First generate the script using Gemini
        const scriptPrompt = `Create a brief audio script (under 200 words) explaining "${topic}" in simple, clear terms for voice narration. Make it educational and engaging.`;
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${CONFIG.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: scriptPrompt
                    }]
                }]
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to generate audio script');
        }
        
        const data = await response.json();
        const script = data.candidates[0].content.parts[0].text;
        
        // Use browser's Web Speech API for TTS
        return new Promise((resolve) => {
            const utterance = new SpeechSynthesisUtterance(script);
            utterance.rate = 0.9;
            utterance.pitch = 1;
            utterance.volume = 1;
            
            // Store the script for playback
            window.currentAudioScript = script;
            
            // Return a data URL (will be handled by display function)
            resolve('data:text/plain;base64,' + btoa(script));
        });
    } catch (error) {
        console.error('Audio generation error:', error);
        // Return a simple fallback message
        return 'data:text/plain;base64,' + btoa(`Learn about ${topic}`);
    }
}

// Display functions
function displayContent(content) {
    const lines = content.split('\n');
    const title = lines[0].replace('Title:', '').trim();
    
    contentTitle.textContent = title;
    
    // Convert markdown-like content to HTML
    let html = '';
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('## ')) {
            html += `<h2>${line.replace('## ', '')}</h2>`;
        } else if (line.startsWith('- ')) {
            if (!html.endsWith('</ul>')) {
                html += '<ul>';
            }
            html += `<li>${line.replace('- ', '')}</li>`;
        } else if (line.trim() === '' && html.endsWith('</li>')) {
            html += '</ul>';
        } else if (line.trim() !== '') {
            html += `<p>${line}</p>`;
        }
    }
    
    contentBody.innerHTML = html;
}

function displayImage(imageUrl) {
    generatedImage.src = imageUrl;
    generatedImage.alt = `Diagram about ${currentTopic}`;
}

function displayAudio(audioUrl) {
    // Hide the audio element and add a play button instead
    audioPlayer.style.display = 'none';
    
    const audioCard = document.querySelector('.audio-card');
    let playBtn = document.getElementById('playAudioBtn');
    
    if (!playBtn) {
        playBtn = document.createElement('button');
        playBtn.id = 'playAudioBtn';
        playBtn.className = 'btn btn-primary';
        playBtn.textContent = '🔊 Play Audio Explanation';
        playBtn.style.width = '100%';
        playBtn.style.marginTop = '10px';
        audioCard.appendChild(playBtn);
    }
    
    playBtn.onclick = () => {
        if (window.currentAudioScript) {
            speechSynthesis.cancel(); // Stop any ongoing speech
            const utterance = new SpeechSynthesisUtterance(window.currentAudioScript);
            utterance.rate = 0.9;
            utterance.pitch = 1;
            utterance.volume = 1;
            
            playBtn.textContent = '🔊 Playing...';
            playBtn.disabled = true;
            
            utterance.onend = () => {
                playBtn.textContent = '🔊 Play Audio Explanation';
                playBtn.disabled = false;
            };
            
            speechSynthesis.speak(utterance);
        }
    };
}

// UI state functions
function showLoading() {
    loadingIndicator.classList.remove('hidden');
    contentSection.classList.add('hidden');
    generateBtn.disabled = true;
    regenerateBtn.disabled = true;
}

function hideLoading() {
    loadingIndicator.classList.add('hidden');
    generateBtn.disabled = false;
    regenerateBtn.disabled = false;
}

function showContent() {
    contentSection.classList.remove('hidden');
}

function showError(message) {
    errorMessage.textContent = message;
    errorSection.classList.remove('hidden');
    setTimeout(() => {
        errorSection.classList.add('hidden');
    }, 5000);
}

function hideError() {
    errorSection.classList.add('hidden');
}

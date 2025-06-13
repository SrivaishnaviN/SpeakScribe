document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content Loaded. Initializing script.");

    // Tab Management
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // Update active states
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            button.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });

    // Existing speech recognition code
    const micButton = document.getElementById('micButton');
    const statusText = document.getElementById('statusText');
    const transcribedText = document.getElementById('transcribedText');
    const languageSelector = document.getElementById('languageSelector');
    const copyButton = document.getElementById('copyButton');
    const downloadButton = document.getElementById('downloadButton');

    let SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;

    if (!SpeechRecognition) {
        console.error("SpeechRecognition API not supported by this browser.");
        statusText.textContent = "Your browser doesn't support Speech Recognition. Try Chrome or Edge.";
        if(micButton) micButton.disabled = true;
        if(languageSelector) languageSelector.disabled = true;
        if(copyButton) copyButton.disabled = true;
        if(downloadButton) downloadButton.disabled = true;
        return;
    } else {
        console.log("SpeechRecognition API is supported.");
    }

    let isListening = false;
    let finalTranscript = '';

    function initializeRecognition() {
        console.log(`Initializing Recognition. Language: ${languageSelector.value}`);
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = languageSelector.value;
        console.log(`Recognition object created. Set lang to: ${recognition.lang}`);

        recognition.onstart = () => {
            console.log("Recognition started (onstart event).");
            isListening = true;
            micButton.classList.add('listening');
            micButton.querySelector('i').classList.replace('fa-microphone', 'fa-stop');
            statusText.textContent = "Listening...";
            transcribedText.placeholder = "Listening... speak now.";
        };

        recognition.onresult = (event) => {
            console.log("Recognition result received (onresult event).");
            let interimTranscript = '';
            let currentFinalTranscriptChunk = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    currentFinalTranscriptChunk += event.results[i][0].transcript + ' ';
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            if (currentFinalTranscriptChunk) {
                finalTranscript += currentFinalTranscriptChunk;
            }
            
            transcribedText.value = finalTranscript + interimTranscript;
            transcribedText.scrollTop = transcribedText.scrollHeight;
        };

        recognition.onerror = (event) => {
            console.error(`Recognition error (onerror event). Error type: ${event.error}`, event);
            let errorMessage = "Error: " + event.error; 

            if (event.error === 'no-speech') {
                errorMessage = "No speech detected. Please try again.";
            } else if (event.error === 'audio-capture') {
                errorMessage = "Audio capture error. Is your microphone working and enabled?";
            } else if (event.error === 'not-allowed') {
                errorMessage = "Microphone access denied. Please allow microphone access in your browser settings.";
            } else if (event.error === 'language-not-supported') {
                errorMessage = `The selected language (${recognition.lang}) is not supported by your browser. Try English or Hindi, or check your browser's language pack settings.`;
            } else if (event.error === 'service-not-allowed') {
                errorMessage = "Speech recognition service is not allowed. Check browser permissions, extensions, or if you are in incognito mode with restricted permissions."
            } else if (event.error === 'network') {
                errorMessage = "Network error during speech recognition. Please check your internet connection."
            }
            
            statusText.textContent = errorMessage;
            if (event.error === 'not-allowed' || event.error === 'language-not-supported' || event.error === 'service-not-allowed' || event.error === 'audio-capture') {
                 stopUiUpdate(); 
            }
        };

        recognition.onend = () => {
            console.log("Recognition ended (onend event). isListening:", isListening);
            if (isListening) { 
                 statusText.textContent = "Mic stopped. Click to restart.";
            }
            stopUiUpdate();
        };
        console.log("Recognition event handlers attached.");
    }

    function startRecognition() {
        console.log("Attempting to start recognition...");
        if (isListening) {
            console.log("Already listening, returning.");
            return;
        }
        
        finalTranscript = ''; 
        transcribedText.value = ''; 

        initializeRecognition(); 
        try {
            console.log(`Calling recognition.start() for language: ${recognition.lang}`);
            recognition.start();
        } catch (e) {
            console.error("Error executing recognition.start(): ", e);
            statusText.textContent = "Could not start microphone due to an exception.";
            stopUiUpdate();
        }
    }
    
    function stopUiUpdate() { 
        console.log("Updating UI to non-listening state.");
        isListening = false;
        micButton.classList.remove('listening');
        micButton.querySelector('i').classList.replace('fa-stop', 'fa-microphone');
        statusText.textContent = "Click the mic to start";
        transcribedText.placeholder = "Transcribed text will appear here...";
    }

    function stopRecognitionService() {
        console.log("Attempting to stop recognition service...");
        if (recognition && isListening) {
            console.log("Calling recognition.stop()");
            recognition.stop(); 
        } else {
            console.log("Recognition service not active or no recognition object, just updating UI.");
            stopUiUpdate(); 
        }
    }

    micButton.addEventListener('click', () => {
        console.log("Mic button clicked. isListening:", isListening);
        if (isListening) {
            stopRecognitionService();
        } else {
            startRecognition();
        }
    });

    languageSelector.addEventListener('change', () => {
        const newLang = languageSelector.value;
        console.log(`Language selector changed to: ${newLang}`);
        if (isListening) {
            console.log("Was listening, stopping service due to language change.");
            stopRecognitionService(); 
        }
        if(recognition) {
             recognition.lang = newLang; // Update for next time, though initializeRecognition will also set it
        }
        transcribedText.value = "";
        finalTranscript = "";
        statusText.textContent = "Language changed. Click mic to start.";
        console.log("Text area cleared, status updated for language change.");
    });

    copyButton.addEventListener('click', () => {
        console.log("Copy button clicked.");
        if (transcribedText.value) {
            navigator.clipboard.writeText(transcribedText.value)
                .then(() => {
                    console.log("Text copied to clipboard.");
                    copyButton.innerHTML = '<i class="fas fa-check"></i> Copied!';
                    setTimeout(() => {
                        copyButton.innerHTML = '<i class="fas fa-copy"></i> Copy to Clipboard';
                    }, 2000);
                })
                .catch(err => {
                    console.error('Failed to copy with navigator.clipboard: ', err);
                    try {
                        transcribedText.select();
                        document.execCommand('copy');
                        console.log("Text copied to clipboard using fallback.");
                        copyButton.innerHTML = '<i class="fas fa-check"></i> Copied (fallback)!';
                        setTimeout(() => {
                            copyButton.innerHTML = '<i class="fas fa-copy"></i> Copy to Clipboard';
                        }, 2000);
                    } catch (e) {
                        console.error('Fallback copy method failed: ', e);
                        alert("Failed to copy text. Please try again or copy manually.");
                    }
                });
        } else {
            console.log("Nothing to copy.");
            alert("Nothing to copy!");
        }
    });

    downloadButton.addEventListener('click', () => {
        console.log("Download button clicked.");
        const textToDownload = transcribedText.value;
        if (textToDownload.trim() === "") {
            console.log("Nothing to download.");
            alert("Nothing to download!");
            return;
        }
        const blob = new Blob([textToDownload], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'transcribed_text.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log("Text download initiated.");

        downloadButton.innerHTML = '<i class="fas fa-check"></i> Downloaded!';
        setTimeout(() => {
            downloadButton.innerHTML = '<i class="fas fa-download"></i> Download .txt';
        }, 2000);
    });

    // File Upload Handling
    const fileDropZone = document.getElementById('fileDropZone');
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        fileDropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop zone when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        fileDropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        fileDropZone.addEventListener(eventName, unhighlight, false);
    });

    // Handle dropped files
    fileDropZone.addEventListener('drop', handleDrop, false);
    fileInput.addEventListener('change', handleFileSelect, false);

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight(e) {
        fileDropZone.classList.add('highlight');
    }

    function unhighlight(e) {
        fileDropZone.classList.remove('highlight');
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    function handleFileSelect(e) {
        const files = e.target.files;
        handleFiles(files);
    }

    function handleFiles(files) {
        if (files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
                displayFileInfo(file);
                processFile(file);
            } else {
                alert('Please upload an audio or video file.');
            }
        }
    }

    function displayFileInfo(file) {
        fileInfo.innerHTML = `
            <p><strong>File:</strong> ${file.name}</p>
            <p><strong>Size:</strong> ${formatFileSize(file.size)}</p>
            <p><strong>Type:</strong> ${file.type}</p>
        `;
        fileInfo.classList.add('active');
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async function processFile(file) {
        try {
            statusText.textContent = 'Processing file...';
            // Here you would implement the actual file processing logic
            // For now, we'll just simulate a delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            statusText.textContent = 'File processed successfully';
        } catch (error) {
            console.error('Error processing file:', error);
            statusText.textContent = 'Error processing file';
        }
    }

    // Chat Interface
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendMessageButton = document.getElementById('sendMessageButton');
    const clearMemoryButton = document.getElementById('clearMemoryButton');

    let chatHistory = [];

    // Define related topics and their responses
    const relatedTopics = {
        transcription: {
            keywords: ['transcribe', 'transcription', 'speech to text', 'voice to text', 'audio to text', 'video to text'],
            responses: [
                "I can help you with transcription! You can either use real-time speech recognition or upload audio/video files.",
                "For transcription, you can use the microphone button for real-time speech or upload files in the File Upload tab.",
                "Our transcription supports multiple languages including English, Hindi, Telugu, and more!"
            ]
        },
        languages: {
            keywords: ['language', 'languages', 'hindi', 'telugu', 'bengali', 'tamil', 'marathi', 'gujarati', 'kannada', 'malayalam', 'punjabi', 'urdu'],
            responses: [
                "We support multiple Indian languages including Hindi, Telugu, Bengali, Tamil, Marathi, Gujarati, Kannada, Malayalam, Punjabi, and Urdu.",
                "You can select your preferred language from the dropdown menu in the Real-time Speech tab.",
                "All our transcription features work with the supported languages!"
            ]
        },
        fileUpload: {
            keywords: ['upload', 'file', 'audio', 'video', 'mp3', 'mp4', 'wav', 'avi'],
            responses: [
                "You can upload audio or video files by dragging and dropping them into the File Upload tab or using the Choose File button.",
                "We support various audio and video formats. Just go to the File Upload tab to get started!",
                "After uploading, your file will be processed and transcribed automatically."
            ]
        },
        help: {
            keywords: ['help', 'how to', 'how do i', 'what is', 'how does', 'guide', 'tutorial'],
            responses: [
                "I can help you with transcription, language selection, and file uploads. What would you like to know?",
                "You can use real-time speech recognition, upload files, or ask me questions about our features!",
                "Need help? Just ask about transcription, languages, or file uploads!"
            ]
        }
    };

    function getRandomResponse(responses) {
        return responses[Math.floor(Math.random() * responses.length)];
    }

    function isRelatedQuestion(message) {
        const lowerMessage = message.toLowerCase();
        
        for (const topic in relatedTopics) {
            if (relatedTopics[topic].keywords.some(keyword => lowerMessage.includes(keyword))) {
                return {
                    isRelated: true,
                    topic: topic
                };
            }
        }
        
        return {
            isRelated: false
        };
    }

    function addMessage(message, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${isUser ? 'user' : 'ai'}`;
        messageDiv.textContent = message;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        if (isUser) {
            chatHistory.push({ role: 'user', content: message });
        } else {
            chatHistory.push({ role: 'assistant', content: message });
        }
    }

    async function sendMessage() {
        const message = chatInput.value.trim();
        if (message) {
            addMessage(message, true);
            chatInput.value = '';

            try {
                const { isRelated, topic } = isRelatedQuestion(message);
                
                if (isRelated) {
                    const response = getRandomResponse(relatedTopics[topic].responses);
                    addMessage(response);
                } else {
                    addMessage("I'm sorry, but I can only help with questions related to transcription, languages, file uploads, and general help. Please ask something related to these topics.");
                }
            } catch (error) {
                console.error('Error processing message:', error);
                addMessage('Sorry, there was an error processing your message.');
            }
        }
    }

    sendMessageButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    clearMemoryButton.addEventListener('click', () => {
        chatHistory = [];
        chatMessages.innerHTML = '';
        addMessage('Chat history cleared. How can I help you with transcription today?');
    });

    // Add initial greeting
    addMessage('Hello! I can help you with transcription, language selection, and file uploads. What would you like to know?');

    console.log("Event listeners for buttons and selector attached.");
});

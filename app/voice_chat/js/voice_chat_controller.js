import { Controller } from "@hotwired/stimulus"
import { showToast } from '../../static/js/utils/toast.js';

export default class extends Controller {
  static targets = ["walkieButton", "micSelect", "status"]
  static values = {
    autoConnect: Boolean,
    baseUrl: { type: String, default: 'https://api.openai.com/v1/realtime' },
    model: { type: String, default: 'gpt-4o-realtime-preview-2024-12-17' }
  }

  initialize() {
    this.pc = null;
    this.dc = null;
    this.audioEl = null;
    this.microphoneStream = null;
    this.isConnected = false;
    this.ephemeralKey = null;
    this.isMuted = true;
    this.isHolding = false;
    this.audioTrack = null;
    this.pressStartTime = 0;
    this.holdThreshold = 200; // ms to distinguish between click and hold

    // Set initial mute state on the button
    if (this.hasWalkieButtonTarget) {
      this.walkieButtonTarget.setAttribute('data-muted', 'true');
    }
  }

  connect() {
    if (this.autoConnectValue) {
      this.initializeConnection();
    }
  }

  disconnect() {
    this.closeConnection();
  }

  async initializeConnection() {
    try {
      // Get session token first
      await this.getSessionToken();
      
      // Setup microphone
      await this.setupMicrophone();
      
      // Setup WebRTC with the session token
      await this.setupWebRTC();
    } catch (error) {
      this.updateStatus(`Error: ${error.message}`, 'error');
    }
  }

  async getSessionToken() {
    this.updateStatus('Getting session token...', 'info');
    const response = await fetch('/api/session/');
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    this.ephemeralKey = data.client_secret;
    this.updateStatus('Session token received', 'success');
  }

  async setupMicrophone() {
    try {
      this.updateStatus('Setting up microphone...', 'info');
      this.microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Start with microphone muted
      this.audioTrack = this.microphoneStream.getAudioTracks()[0];
      this.audioTrack.enabled = false;
      this.isMuted = true;
      
      // Update UI to reflect muted state
      if (this.hasWalkieButtonTarget) {
        this.walkieButtonTarget.setAttribute('data-muted', 'true');
      }
      
      await this.updateAudioDevices();
      this.updateStatus(`Using microphone: ${this.audioTrack.label}`, 'success');
      
      // Set up space bar controls for push-to-talk
      this.setupPushToTalk();
    } catch (error) {
      throw new Error('Failed to access microphone: ' + error.message);
    }
  }

  setupPushToTalk() {
    // Space bar handlers
    const keydownHandler = (e) => {
      if (e.code === 'Space' && !e.repeat && this.audioTrack && !this.isHolding) {
        e.preventDefault();
        this.pressStartTime = Date.now();
        this.startTalking();
      }
    };

    const keyupHandler = (e) => {
      if (e.code === 'Space' && this.audioTrack) {
        e.preventDefault();
        const pressDuration = Date.now() - this.pressStartTime;
        
        this.stopTalking();
        
        // If it was a short press, treat it as a toggle
        if (pressDuration < this.holdThreshold) {
          this.toggleMute();
        }
      }
    };

    document.addEventListener('keydown', keydownHandler);
    document.addEventListener('keyup', keyupHandler);

    // Store handlers for cleanup
    this.pushToTalkHandlers = { keydown: keydownHandler, keyup: keyupHandler };
  }

  async updateAudioDevices() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioDevices = devices.filter(device => device.kind === 'audioinput');
    
    if (this.hasMicSelectTarget) {
      this.micSelectTarget.innerHTML = audioDevices
        .map(device => `<option value="${device.deviceId}">${device.label || 'Microphone ' + (i + 1)}</option>`)
        .join('');
    }
  }

  async switchMicrophone(event) {
    const deviceId = event.target.value;
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } }
      });

      if (this.pc && this.microphoneStream) {
        const sender = this.pc.getSenders().find(s => s.track.kind === 'audio');
        if (sender) {
          await sender.replaceTrack(newStream.getAudioTracks()[0]);
        }
      }

      this.microphoneStream.getAudioTracks().forEach(track => track.stop());
      this.microphoneStream = newStream;
      this.updateStatus('Microphone switched successfully', 'success');
    } catch (error) {
      this.updateStatus('Failed to switch microphone: ' + error.message, 'error');
    }
  }

  async setupWebRTC() {
    try {
      if (!this.ephemeralKey) {
        throw new Error('No session token available');
      }

      this.updateStatus('Creating WebRTC connection...', 'info');
      this.pc = new RTCPeerConnection();

      // Set up audio playback
      this.audioEl = document.createElement('audio');
      this.audioEl.autoplay = true;
      this.pc.ontrack = e => {
        console.log('Received audio track', e);
        this.audioEl.srcObject = e.streams[0];
      };

      // Add microphone track
      if (!this.microphoneStream) {
        throw new Error('No microphone stream available');
      }
      this.pc.addTrack(this.microphoneStream.getAudioTracks()[0], this.microphoneStream);

      // Set up data channel
      this.dc = this.pc.createDataChannel('oai-events');
      this.setupDataChannelHandlers();

      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      // Connect to OpenAI's Realtime API
      this.updateStatus('Connecting to OpenAI...', 'info');
      const sdpResponse = await fetch(`${this.baseUrlValue}?model=${this.modelValue}`, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${this.ephemeralKey}`,
          'Content-Type': 'application/sdp'
        },
      });

      if (!sdpResponse.ok) {
        const error = await sdpResponse.json();
        throw new Error('Failed to connect to OpenAI: ' + error.error?.message || 'Unknown error');
      }

      const answer = {
        type: 'answer',
        sdp: await sdpResponse.text(),
      };
      await this.pc.setRemoteDescription(answer);

      // Wait for data channel to open
      if (this.dc.readyState !== 'open') {
        await this.waitForDataChannel();
      }

      this.isConnected = true;
      this.updateStatus('Connection established!', 'success');
    } catch (error) {
      console.error('Error setting up WebRTC:', error);
      this.updateStatus(`Error: ${error.message}`, 'error');
      this.closeConnection();
      throw error;
    }
  }

  setupDataChannelHandlers() {
    this.dc.onopen = () => {
      console.log('Data channel opened');
      this.updateStatus('Data channel ready', 'success');
    };

    this.dc.onclose = () => {
      console.log('Data channel closed');
      this.updateStatus('Connection closed', 'info');
      this.isConnected = false;
    };

    this.dc.onerror = (error) => {
      console.error('Data channel error:', error);
      this.updateStatus('Connection error', 'error');
      this.closeConnection();
    };

    this.dc.onmessage = this.handleMessage.bind(this);
  }

  async waitForDataChannel() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for data channel'));
      }, 5000);

      this.dc.onopen = () => {
        clearTimeout(timeout);
        resolve();
      };
    });
  }

  handleMessage(event) {
    const message = JSON.parse(event.data);
    // Dispatch a custom event that other controllers can listen to
    const customEvent = new CustomEvent('voice-chat-message', {
      detail: message,
      bubbles: true
    });
    this.element.dispatchEvent(customEvent);
  }

  closeConnection() {
    if (this.dc) {
      this.dc.close();
      this.dc = null;
    }

    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }

    if (this.microphoneStream) {
      this.microphoneStream.getTracks().forEach(track => track.stop());
      this.microphoneStream = null;
    }

    if (this.audioEl) {
      this.audioEl.srcObject = null;
      this.audioEl = null;
    }

    // Remove push-to-talk handlers
    if (this.pushToTalkHandlers) {
      document.removeEventListener('keydown', this.pushToTalkHandlers.keydown);
      document.removeEventListener('keyup', this.pushToTalkHandlers.keyup);
      this.pushToTalkHandlers = null;
    }

    this.isConnected = false;
    this.ephemeralKey = null;
    this.updateStatus('Connection closed', 'info');
  }

  updateStatus(message, type = 'info') {
    if (this.hasStatusTarget) {
      this.statusTarget.textContent = message;
      this.statusTarget.className = `voice-status text-${type}`;
    }
  }

  // Action methods for Stimulus
  // Action methods for Stimulus
  handleMouseDown(event) {
    if (!this.audioTrack || !this.isConnected) return;
    this.pressStartTime = Date.now();
    this.startTalking();
  }

  handleMouseUp(event) {
    if (!this.audioTrack || !this.isConnected) return;
    const pressDuration = Date.now() - this.pressStartTime;
    
    this.stopTalking();
    
    // If it was a short press, treat it as a toggle
    if (pressDuration < this.holdThreshold) {
      this.toggleMute();
    }
  }

  handleTouchStart(event) {
    this.handleMouseDown(event);
  }

  handleTouchEnd(event) {
    this.handleMouseUp(event);
    // Prevent mouseup from firing on touch devices
    event.preventDefault();
  }

  startTalking() {
    if (!this.audioTrack || !this.isConnected) return;
    
    this.isHolding = true;
    this.audioTrack.enabled = true;
    this.walkieButtonTarget.classList.add('active');
    this.updateStatus('Listening...', 'info');
  }

  stopTalking() {
    if (!this.audioTrack || !this.isConnected) return;
    
    this.isHolding = false;
    // When releasing hold, respect the current mute state
    this.audioTrack.enabled = !this.isMuted;
    this.walkieButtonTarget.classList.remove('active');
    this.updateStatus(this.isMuted ? 'Hold to talk or tap to toggle' : 'Channel open (tap to mute)', 'info');
  }

  toggleMute() {
    if (!this.audioTrack || !this.isConnected) return;
    
    this.isMuted = !this.isMuted;
    this.audioTrack.enabled = !this.isMuted;
    
    // Update button state
    if (this.hasWalkieButtonTarget) {
      this.walkieButtonTarget.setAttribute('data-muted', this.isMuted.toString());
      // Add or remove active class based on mute state
      if (this.isMuted) {
        this.walkieButtonTarget.classList.remove('active');
      } else {
        this.walkieButtonTarget.classList.add('active');
      }
    }
    
    if (this.isMuted) {
      this.updateStatus('Hold to talk or tap to toggle', 'info');
    } else {
      this.updateStatus('Channel open (tap to mute)', 'info');
    }
  }
}

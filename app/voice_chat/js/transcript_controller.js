import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["container"]

  connect() {
    // Listen for transcript events from voice chat controller
    document.addEventListener('voice-chat:user-transcript', this.handleUserTranscript.bind(this))
    document.addEventListener('voice-chat:ai-transcript-delta', this.handleAITranscriptDelta.bind(this))
    document.addEventListener('voice-chat:ai-transcript-done', this.handleAITranscriptDone.bind(this))
    
    // Initialize streaming transcript element
    this.streamingTranscript = document.createElement('div')
    this.streamingTranscript.classList.add('streaming-transcript')
  }

  disconnect() {
    document.removeEventListener('voice-chat:user-transcript', this.handleUserTranscript.bind(this))
    document.removeEventListener('voice-chat:ai-transcript-delta', this.handleAITranscriptDelta.bind(this))
    document.removeEventListener('voice-chat:ai-transcript-done', this.handleAITranscriptDone.bind(this))
  }

  handleUserTranscript(event) {
    const message = this.createMessageElement('user', event.detail.transcript)
    this.containerTarget.appendChild(message)
    this.scrollToBottom()
  }

  handleAITranscriptDelta(event) {
    if (!this.streamingTranscript.parentElement) {
      const message = this.createMessageElement('ai', '')
      message.appendChild(this.streamingTranscript)
      this.containerTarget.appendChild(message)
    }
    this.streamingTranscript.textContent += event.detail.delta
    this.scrollToBottom()
  }

  handleAITranscriptDone(event) {
    // Remove streaming transcript element
    if (this.streamingTranscript.parentElement) {
      this.streamingTranscript.parentElement.remove()
    }
    
    // Add final message
    const message = this.createMessageElement('ai', event.detail.transcript)
    this.containerTarget.appendChild(message)
    this.scrollToBottom()
  }

  createMessageElement(role, content) {
    const messageEl = document.createElement('div')
    messageEl.classList.add('message', `message-${role}`)
    
    const avatarEl = document.createElement('div')
    avatarEl.classList.add('message-avatar')
    avatarEl.innerHTML = role === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>'
    
    const contentEl = document.createElement('div')
    contentEl.classList.add('message-content')
    contentEl.textContent = content
    
    messageEl.appendChild(avatarEl)
    messageEl.appendChild(contentEl)
    
    return messageEl
  }

  scrollToBottom() {
    this.containerTarget.scrollTop = this.containerTarget.scrollHeight
  }
}

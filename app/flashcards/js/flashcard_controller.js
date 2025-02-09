import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["container"]
  static values = {
    voiceChatId: String
  }

  connect() {
    this.registerFlashcardTool()
  }

  disconnect() {
  }

  registerFlashcardTool() {
    // Get the voice chat controller using Stimulus
    const voiceChatElement = document.querySelector(`[data-controller="voice-chat"]`)
    if (!voiceChatElement) {
      console.error('Voice chat element not found')
      return
    }

    const voiceChatController = this.application.getControllerForElementAndIdentifier(voiceChatElement, 'voice-chat')
    if (!voiceChatController) {
      console.error('Voice chat controller not found')
      return
    }

    const flashcardTool = {
      type: 'function',
      name: 'create_flashcard',
      description: 'Create a new flashcard with the specified front and back content.',
      parameters: {
        type: 'object',
        properties: {
          front: {
            type: 'string',
            description: 'The content for the front of the flashcard'
          },
          back: {
            type: 'string',
            description: 'The content for the back of the flashcard'
          },
          tags: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Optional tags to categorize the flashcard'
          }
        },
        required: ['front', 'back']
      }
    }

    voiceChatController.registerTool(flashcardTool)
  }

  async handleFunctionCall(event) {
    const { name, arguments: args } = event.detail

    if (name === 'create_flashcard') {
      try {
        // Get the CSRF token from the cookie
        const csrfToken = document.cookie.split('; ')
          .find(row => row.startsWith('csrftoken='))
          ?.split('=')[1];

        if (!csrfToken) {
          throw new Error('CSRF token not found')
        }

        const response = await fetch('/api/flashcards/', {
          method: 'POST',
          credentials: 'same-origin',  // This is important for sending the session cookie
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
          },
          body: JSON.stringify({
            front: args.front,
            back: args.back,
            tags: args.tags || []
          })
        })

        if (!response.ok) {
          throw new Error('Failed to create flashcard')
        }

        const flashcard = await response.json()
        this.appendFlashcard(flashcard)
      } catch (error) {
        console.error('Error creating flashcard:', error)
      }
    }
  }

  appendFlashcard(flashcard) {
    // Create and append the flashcard element to the container
    const flashcardElement = document.createElement('div')
    flashcardElement.classList.add('flashcard')
    flashcardElement.innerHTML = `
      <div class="flashcard-front">${flashcard.front}</div>
      <div class="flashcard-back">${flashcard.back}</div>
      ${flashcard.tags.length ? `<div class="flashcard-tags">${flashcard.tags.join(', ')}</div>` : ''}
    `
    this.containerTarget.appendChild(flashcardElement)
  }
}

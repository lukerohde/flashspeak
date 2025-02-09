import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["previewContainer", "reviewContainer"]

  connect() {
    this.registerFlashcardTool()
  }

  disconnect() {
  }

  registerFlashcardTool() {
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

    this.dispatch('register-tool', { detail: flashcardTool })
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
        console.log(flashcard)
        this.appendFlashcard(flashcard)
      } catch (error) {
        console.error('Error creating flashcard:', error)
      }
    }
  }

  appendFlashcard(flashcard) {
    if (flashcard) {
      // Prepend the new flashcards to the preview container
      this.previewContainerTarget.insertAdjacentHTML('afterbegin', flashcard.html);
    }
  }
}

import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["previewContainer", "reviewContainer"]

  connect() {
    console.log('Flashcard controller connected')
    this.registerTools()
  }

  registerTools() {
    console.log('Registering flashcard tools')
    // Flashcard creation tool
    const flashcardTool = {
      type: 'function',
      name: 'create_flashcard',
      description: 'Create a new flashcard with the specified front and back content.',
      parameters: {
        type: 'object',
        properties: {
          front: {
            type: 'string',
            description: 'The english content for the front of the flashcard'
          },
          back: {
            type: 'string',
            description: 'The foreign language content for the back of the flashcard'
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

    // Review start tool
    const startReviewTool = {
      type: 'function',
      name: 'start_review',
      description: 'Start reviewing flashcards',
      parameters: {
        type: 'object',
        properties: {}
      }
    }

    console.log('Dispatching tool registration:', { flashcardTool, startReviewTool })
    this.dispatch('register-tool', { detail: flashcardTool })
    this.dispatch('register-tool', { detail: startReviewTool })
  }

  async handleFunctionCall(event) {
    console.log('Handling function call:', event.detail)
    const { name, arguments: args } = event.detail

    if (name === 'create_flashcard') {
      try {
        const response = await this.postWithToken('/api/flashcards/', {
          front: args.front,
          back: args.back,
          tags: args.tags || []
        })

        const flashcard = await response.json()
        this.appendFlashcard(flashcard)
      } catch (error) {
        console.error('Error creating flashcard:', error)
      }
    } else if (name === 'start_review') {
      this.fetchNextCard()
    }
  }

  appendFlashcard(flashcard) {
    if (flashcard && this.hasPreviewContainerTarget) {
      // Prepend the new flashcards to the preview container
      this.previewContainerTarget.insertAdjacentHTML('afterbegin', flashcard.html);
    }
  }

  async playFullCard(event) {
    console.log('Playing full card')
    const card = event.target.closest('.flashcard')
    if (!card) return

    const front = card.dataset.flashcardFrontValue
    const back = card.dataset.flashcardBackValue
    
    // Instruction to read both sides
    const instruction = `Please read both sides of this flashcard. Front: "${front}". Back: "${back}".`
    console.log('Dispatching play events with instruction:', instruction)
    this.dispatch('add-context', { detail: instruction })
    this.dispatch('please-respond')
  }

  async fetchNextCard() {
    console.log('Fetching next card')
    if (!this.hasReviewContainerTarget) {
      console.log('No review container target found')
      return
    }

    // Show the review area if it's hidden
    this.reviewContainerTarget.classList.remove('d-none')

    try {
      const response = await fetch('/api/flashcards/next_review/')
      if (!response.ok) throw new Error('Failed to fetch next review')
      
      const data = await response.json()
      this.reviewContainerTarget.innerHTML = data.html
      
      console.log('Received next card data:', data)
      // If we got a card, automatically start the review
      if (data.html.includes('flashcard')) {
        console.log('Card found, starting review')
        this.reviewCard()
      } else {
        console.log('No card found in response')
      }
    } catch (error) {
      console.error('Error loading next review:', error)
    }
  }

  async reviewCard() {
    console.log('Starting card review')
    // Get current card data from the review container
    const card = this.reviewContainerTarget.querySelector('.flashcard')
    if (!card) {
      console.log('No card found in review container')
      return
    }
    console.log('Found card:', card.dataset)
    
    const side = card.dataset.flashcardSide
    const content = side === 'front' 
      ? card.dataset.flashcardFrontValue 
      : card.dataset.flashcardBackValue
    
    // Instruction to read one side and assess response
    const instruction = `We are reviewing flashcards. Please read the ${side} of the card: "${content}". After the user responds, assess their answer but do not reveal the correct answer unless they ask for it. Provide hints and corrections as needed.`
    
    console.log('Dispatching review events with instruction:', instruction)
    this.dispatch('add-context', { detail: instruction })
    this.dispatch('please-respond')
  }

  async judgeCard(event) {
    console.log('Judging card')
    const status = event.target.dataset.status
    const card = event.target.closest('.flashcard')
    console.log('Judge data:', { status, cardData: card?.dataset })
    if (!card || !status) return
    
    try {
      const response = await this.postWithToken(
        `/api/flashcards/${card.dataset.flashcardId}/review/`,
        {
          status: status,
          side: card.dataset.flashcardSide
        }
      )
      
      if (!response.ok) throw new Error('Failed to update review')
      
      // Fetch the next card (which will trigger reviewCard if one exists)
      await this.fetchNextCard()
    } catch (error) {
      console.error('Error updating review:', error)
    }
  }

  async postWithToken(url, data) {
    const csrfToken = document.cookie.split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];

    if (!csrfToken) {
      throw new Error('CSRF token not found')
    }

    return fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      body: JSON.stringify(data)
    })
  }
}

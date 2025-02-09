import { Application } from '@hotwired/stimulus'
import VoiceChatController from '../../voice_chat/js/voice_chat_controller'
import TranscriptController from '../../voice_chat/js/transcript_controller'
import FlashcardController from '../../flashcards/js/flashcard_controller'

console.log('Loading Stimulus application...')
let application = null

if (module.hot) {
    module.hot.accept()

    if (module.hot.data) {
        application = module.hot.data.application
    }

    module.hot.dispose(data => {
        data.application = application
    })
}

if (!application) {
    console.log('Initializing application...')
    try {
        application = Application.start()
        console.log('Application initialized successfully')

        // Register all controllers
     } catch (error) {
        console.error('Failed to initialize application:', error)
    }
}

console.log('Registering controllers...')
application.register('voice-chat', VoiceChatController)
application.register('transcript', TranscriptController)
application.register('flashcard', FlashcardController)
console.log('Controllers registered successfully')


// Export the application instance for other modules to use
export { application }

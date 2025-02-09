# Voice Anki

A Django-based language learning application that combines the power of spaced repetition with AI-powered voice interaction. Initially focused on Japanese language learning, with a vision to support multiple languages in the future.

## MVP Features & User Stories (Japanese)

We are migrating from our POC in /Users/lrohde/voice-anki to a proper django app in /Users/lrohde/voice-anki/app.

### Voice Chat with AI Tutor
- As a language learner, I want to practice speaking Japanese with an AI tutor
  - DONE Bootstrap-based responsive layout with main content and sidebar
  - DONE Sliding sidebar on mobile, fixed on desktop (col-md-3)
  - DONE Main content area with transcript (col-md-9)
  - DONE Footer area for active flashcard review
  - DONE OpenAI session creation endpoint
  - DONE Stimulus voice controller with auto-connect

- As a learner, I want to see the conversation transcript in real-time
  - DONE Independent scrolling for transcript 
  - DONE Auto-scroll for new transcript entries
  - DONE Server-rendered transcript updates

- As a user, I want flexible microphone controls:
  - DONE WebRTC audio streaming setup
  - DONE Click to toggle mute/unmute
  - DONE Push-to-talk (walkie-talkie mode)
  - DONE Push-to-talk when not on hold disables the VAD temporarily for that response
  - UNTESTED Microphone input selection
  - DONE Disable Voice activity detection (VAD) when in walkie-talkie mode

### Flashcard Creation
- As a learner, I want to create flashcards directly from our conversation
  - Text selection handling in transcript
  - Server-side flashcard creation endpoint
  - Real-time sidebar update with new card

- As a learner, I want to create flashcards by selecting text from the transcript
  - Text selection event handling
  - Popup form for card creation
  - Card preview before saving

- As a learner, I want to categorize my flashcards (multiple categories per card)
  - Category management in sidebar
  - Multi-select category interface
  - Category CRUD endpoints

- As a learner, I want to review and edit flashcards
  - Inline editing interface
  - Card update endpoint
  - Optimistic UI updates

### Flashcard Review
- As a learner, I want to review flashcards using spaced repetition (SM-2)
  - SM-2 algorithm implementation
  - Review scheduling system
  - Review state persistence

- As a learner, I want to practice pronunciation and discuss cards during reviews
  - Integration with voice chat system
  - Card-specific conversation context
  - Progress tracking during review

- As a learner, I want to filter reviews by category
  - Category filter interface in sidebar
  - Dynamic review queue updates
  - Review statistics by category

- As a learner, I want to track my review progress
  - Review history tracking
  - Progress visualization
  - Statistics calculation endpoints

## Future Features

### Multi-language Support
- As a language learner, I want to practice my language of choice
- As a language learner, I want to configure AI tutor prompts for my specific learning needs
- As a language learner, I want to reset tutor prompts to default settings
- As a language learner, I want to customize the tutor's teaching style and focus areas

## Implementation Approach

### Story 1: Japanese Voice Chat Implementation

1. Layout Setup
   - Bootstrap-based responsive layout
   - Main content area with transcript
   - Sliding sidebar (full-screen on mobile, fixed on desktop)
     - Deck/category selection
     - Flashcard list
   - Footer area for active flashcard review
   - Independent scrolling for transcript and sidebar
   - Auto-scroll for new transcript entries

### Technical Architecture
- Server-side rendering with Django templates
- StimulusJS for interactive components
- Partial updates via JSON payloads
- Asset bundling with NPM and Parcel
- Bootstrap 5 for responsive layout

## Setup

Run the setup script to configure your project name and `.env` plus `docker-compose.override.yml` for local development.

```
./setup
```

This will setup your .env and docker-compose.override.yml file for local development.

```
docker-compose up -d
```

see logs
```
docker-compose logs
```

Shell into the python app container
```
docker-compose exec app /bin/bash
```

To make typing these commands less tedious it helps to have docker aliases in your .bash_profile or similar
```
alias dc='docker-compose'
alias dcu='docker-compose up -d'
alias dcd='docker-compose down'
alias dcl='docker-compose logs'
```

Once in the app container you can run the django commands
```
python manage.py runserver 0.0.0.0:3000
``` 

To run with a production gunicorn server
```
./start
```

To run tests
```
pytest
```

To run playwright tests in headed mode
Start your x server (hint: `brew install xquartz` and permit your server)

```
pytest --headed
```

To debug your playwright tests
```
PWDEBUG=1 pytest --headed
```

# Deployment Instructions

For more detailed instructions, please refer to the following README files:

- [Deploy to AWS](deploy-aws-infra/pulumi/README.md)
- [Deploy to Render](deploy-render/README.md)
- [Deploy to Digital Ocean](deploy-do/README.md)
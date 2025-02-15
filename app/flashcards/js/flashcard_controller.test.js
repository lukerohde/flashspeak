import FlashcardController from './flashcard_controller'

describe('FlashcardController', () => {
  let flashcardController;
  const card = {
    dataset: {
      flashcardId: 1,
      flashcardSide: 'front',
      flashcardFrontValue: '新しい',
      flashcardBackValue: 'New'
    }
  }
  
  beforeEach(() => {
    flashcardController = new FlashcardController()
    global.Audio = jest.fn().mockImplementation(() => ({
      play: jest.fn().mockResolvedValue()
    }));
    flashcardController.postWithToken = jest.fn().mockReturnValue({ ok: true, json: jest.fn() })
    flashcardController.updatePreviewOfJudgedCard = jest.fn()
    flashcardController.dispatch = jest.fn()
    jest.spyOn(flashcardController, "dispatch")
    jest.spyOn(flashcardController, "fetchNextCard")
  })
  
  it('should provide explanation for an incorrect answer', async () => {
    await flashcardController.postJudgement(card, 'forgot')
    
    const cardFront = card.dataset.flashcardFrontValue
    const cardBack = card.dataset.flashcardBackValue

    expect(flashcardController.dispatch).toHaveBeenCalledWith("add-context", {"detail": `We are reviewing flashcards.
    Currently showing the front: \"${cardFront}\"
    The complete card content is:
    Front: \"${cardFront}\"
    Back: \"${cardBack}\"
    Do not tell me the answer but give me a hint of why my previous answer was not good enough.`})
  })

  it('should fetch next card for an easy question', async () => {
    await flashcardController.postJudgement(card, 'easy')
  
    expect(flashcardController.fetchNextCard).toHaveBeenCalled()
  })
})

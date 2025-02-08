import { Controller } from "@hotwired/stimulus"
import { showToast } from '../../static/js/utils/toast.js'; // Import the showToast function from '../../../static/js/utils/toast'

export default class extends Controller {
  static targets = ["walkieButton"]

  connect() {
  }

  disconnect() {
  }
}

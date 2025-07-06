class PollCreationForm {
  constructor(apiService) {
    this.apiService = apiService;
    this.formElement = document.createElement("form");
    this.optionsContainer = null;
  }

  render(container) {
    this.formElement.innerHTML = `
      <div class="poll-creation-header">
        <h1>📊 Create a New Poll</h1>
        <p class="subtitle">Create engaging polls and collect responses in real-time</p>
      </div>
      
      <div class="form-group" id="question-container">
        <label>📝 Poll Question</label>
        <div class="question-input">
          <textarea id="poll-question" name="taskDescription" placeholder="What would you like to ask?" required></textarea>
        </div>
      </div>
      
      <div class="form-group">
        <label>⚡ Poll Options</label>
        <p class="options-help">Add at least 2 options for your poll</p>
        <div id="options-container"></div>
      </div>
      
      <div class="form-actions">
        <button type="button" id="add-option-btn">➕ Add Option</button>
        <button type="submit" id="create-poll-btn">🚀 Create Poll</button>
      </div>
    `;

    // Initialize options container
    this.optionsContainer = this.formElement.querySelector('#options-container');

    // Add initial option inputs
    this.addOptionInput();
    this.addOptionInput();

    // Bind add option button click event to addOptionInput method
    this.formElement.querySelector('#add-option-btn').addEventListener('click', () => this.addOptionInput());
    // Bind form submit event to handleSubmit method
    this.formElement.addEventListener("submit", this.handleSubmit.bind(this));

    // Put the form element in the container
    container.appendChild(this.formElement);

    // Prefill question from URL if provided
    const params = new URLSearchParams(window.location.search);
    const prefill = params.get('prefill');
    if (prefill) {
      this.formElement.querySelector('#poll-question').value = decodeURIComponent(prefill);
    }
  }

  addOptionInput() {
    const optionCount = this.optionsContainer.querySelectorAll('.option-input').length + 1;

    const optionDiv = document.createElement('div');
    optionDiv.classList.add('option-input');

    const optionInput = document.createElement('textarea');
    optionInput.name = 'options';
    optionInput.placeholder = `Option ${optionCount}`;
    optionInput.required = true;

    const removeOptionBtn = document.createElement('button');
    removeOptionBtn.type = 'button';
    removeOptionBtn.classList.add('remove-option-btn');
    removeOptionBtn.innerHTML = '🗑️';
    removeOptionBtn.title = 'Remove this option';
    removeOptionBtn.addEventListener('click', () => {
      if (this.optionsContainer.querySelectorAll('.option-input').length > 2) {
        optionDiv.remove();
        this.updateOptionPlaceholders();
      } else {
        alert('You need at least 2 options for a poll.');
      }
    });

    optionDiv.appendChild(optionInput);
    optionDiv.appendChild(removeOptionBtn);
    
    // Append the new option to the options container
    this.optionsContainer.appendChild(optionDiv);
  }

  updateOptionPlaceholders() {
    const optionInputs = this.optionsContainer.querySelectorAll('.option-input textarea');
    optionInputs.forEach((input, index) => {
      input.placeholder = `Option ${index + 1}`;
    });
  }

  async handleSubmit(event) {
    event.preventDefault();

    const pollQuestion = this.formElement.querySelector('#poll-question').value.trim();
    const optionInputs = this.optionsContainer.querySelectorAll('.option-input textarea');
    const options = Array.from(optionInputs).map(input => input.value.trim()).filter(value => value !== '');

    if (pollQuestion === '' || options.length < 2) {
      alert('Please enter a question and at least two options.');
      return;
    }

    const pollData = {
      taskDescription: pollQuestion,
      options: options
    };

    try {
      const response = await this.apiService.createPoll(pollData);
      const pollUrl = response.pollUrl;
      window.location.href = pollUrl;
    } catch (error) {
      alert("Error creating poll: " + error.message);
    }
  }
}

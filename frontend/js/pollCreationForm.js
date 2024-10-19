class PollCreationForm {
  constructor(apiService) {
    this.apiService = apiService;
    this.formElement = document.createElement("form");
    this.optionsContainer = null; // 用于存储选项容器
  }

  render(container) {
    this.formElement.innerHTML = `
      <h1>Create a New Poll</h1>
      <div class="form-group" id="question-container">
        <label>Poll Question</label>
        <div class="question-input">
          <textarea id="poll-question" name="taskDescription" placeholder="Poll Question" required></textarea>
        </div>
      </div>
      <!-- Poll Options -->
      <div class="form-group" id="options-container">
        <label>Poll Options</label>
      </div>
      <button type="button" id="add-option-btn">Add Option</button>
      <button type="submit" id="create-poll-btn">Create Poll</button>
    `;

    // 初始化选项容器
    this.optionsContainer = this.formElement.querySelector('#options-container');

    // 添加初始的两个选项输入框
    this.addOptionInput();
    this.addOptionInput();

    // 绑定事件
    this.formElement.querySelector('#add-option-btn').addEventListener('click', () => this.addOptionInput());
    this.formElement.addEventListener("submit", this.handleSubmit.bind(this));

    // 将表单元素添加到提供的容器中
    container.appendChild(this.formElement);
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
    removeOptionBtn.textContent = '✖';
    removeOptionBtn.addEventListener('click', () => {
      optionDiv.remove();
      this.updateOptionPlaceholders();
    });

    optionDiv.appendChild(optionInput);
    optionDiv.appendChild(removeOptionBtn);
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

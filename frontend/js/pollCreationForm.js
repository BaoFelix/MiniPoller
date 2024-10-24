class PollCreationForm {
  constructor(apiService) {
    this.apiService = apiService;
    this.formElement = document.createElement("form");
    this.optionsContainer = null; // 用于存储选项容器
    this.fixedOptions = ['1', '2', '3', '5', '8'];
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
      <!-- Fixed Poll Options -->
      <div class="form-group" id="options-container">
        <label>Poll Options (Fixed for JIRA Story Points)</label>
        <div class="fixed-options">
          ${this.fixedOptions.map(option => `
            <div class="option-display">
              <input type="radio" name="options" value="${option}" required disabled />
              <label>${option}</label>
            </div>
          `).join('')}
        </div>
      </div>
      <button type="submit" id="create-poll-btn">Create Poll</button>
    `;

    // 初始化选项容器
    this.optionsContainer = this.formElement.querySelector('#options-container');

    // 绑定事件
    this.formElement.addEventListener("submit", this.handleSubmit.bind(this));

    // 将表单元素添加到提供的容器中
    container.appendChild(this.formElement);
  }

  async handleSubmit(event) {
    event.preventDefault();

    const pollQuestion = this.formElement.querySelector('#poll-question').value.trim();
    const optionInputs = this.optionsContainer.querySelectorAll('.option-input textarea');
    // const options = Array.from(optionInputs).map(input => input.value.trim()).filter(value => value !== '');
    const options = this.fixedOptions;

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

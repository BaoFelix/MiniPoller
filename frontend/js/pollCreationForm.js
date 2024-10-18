// Creating a new poll form

class PollCreationForm {
    constructor(apiService) {
      this.apiService = apiService; // Store the API service instance
      this.formElement = document.createElement("form"); // Create a new form element
    }
  
    render(container) {
      // Set the inner HTML of the form element to create the poll creation form
      this.formElement.innerHTML = `
        <h2>Create New Poll</h2>
        <label>
          Question Description:
          <input type="text" name="taskDescription" required>
        </label>
        <label>
          Options (separated by commas):
          <input type="text" name="options" required>
        </label>
        <label>
          Display Style:
          <select name="displayStyle">
            <option value="anonymous">Anonymous</option>
            <option value="public">Public</option>
          </select>
        </label>
        <button type="submit">Create Poll</button>
      `;
  
      // Add an event listener to handle form submission
      /*1. this.formElement.addEventListener("submit", ...)
this.formElement：这是指向类中创建的表单元素（即 form），它是在 constructor 中通过 document.createElement("form") 创建的。
addEventListener("submit", ...)：
addEventListener() 是一个标准的 JavaScript 方法，用于向 HTML 元素（如表单、按钮等）添加事件监听器。
"submit"：这是事件的类型。在这里，"submit" 表示提交表单时触发该事件。
2. this.handleSubmit.bind(this)
这里的 this.handleSubmit.bind(this) 处理了 JavaScript 中常见的 this 指向问题。让我们逐步分析这一部分。

2.1 this.handleSubmit
this.handleSubmit 是类中定义的一个方法（即 handleSubmit(event)），用于处理表单提交事件。
在事件触发时，浏览器会调用这个方法来处理提交逻辑。
2.2 为什么需要 bind(this)
在 JavaScript 中，this 的值取决于函数的调用方式。因此，当事件处理器被触发时，this 默认指向触发事件的元素，即 this.formElement，而不是当前类的实例对象 PollCreationForm。

如果我们不做特殊处理，直接将 this.handleSubmit 作为事件监听函数传递给 addEventListener，那么 handleSubmit 中的 this 将指向 formElement，而不是我们期望的 PollCreationForm 的实例对象。这会导致代码出错，因为 handleSubmit 中需要访问 this.apiService 等属性，它们属于 PollCreationForm 类的实例，而不是 formElement。

bind(this)：

bind() 是 JavaScript 的 Function 对象上的方法，返回一个新函数，该新函数的 this 被永久绑定为指定的对象。
在这段代码中，this.handleSubmit.bind(this) 返回了一个新的函数，该函数的 this 永远指向当前类的实例 PollCreationForm，而不是触发事件的 HTML 元素（即 formElement）。
2.3 bind(this) 解决了什么问题？
在事件处理函数 handleSubmit(event) 中，我们需要访问 this.apiService 来进行 API 调用。如果不使用 bind(this)，this 会变为指向 formElement，从而无法正确访问类的其他属性，导致报错。
bind(this) 确保 this 始终指向类的实例，这样在 handleSubmit 中能够正确调用 this.apiService，并访问类的其他属性。*/

      this.formElement.addEventListener("submit", this.handleSubmit.bind(this));
  
      // Append the form element to the provided container
      container.appendChild(this.formElement);
    }
  
    async handleSubmit(event) {
      event.preventDefault(); // Prevent the default form submission behavior
  
      const formData = new FormData(this.formElement); // Create a FormData object from the form element
      const pollData = {
        taskDescription: formData.get("taskDescription"), // Get the poll question description
        options: formData
          .get("options")
          .split(",")
          .map((opt) => opt.trim()), // Get the poll options, split by commas and trimmed of whitespace
        displayStyle: formData.get("displayStyle"), // Get the selected display style
      };
  
      try {
        const response = await this.apiService.createPoll(pollData); // Call the API to create the poll
        const pollUrl = response.pollUrl; // Get the URL of the new poll
        window.location.href = pollUrl; // Redirect to the new poll's URL
      } catch (error) {
        alert("Error creating poll: " + error.message); // Display an error message if poll creation fails
      }
    }
  }

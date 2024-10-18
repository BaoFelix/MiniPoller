// Displaying results

class ResultsDisplay {
    constructor() {
      this.chart = null; // Will hold the Chart.js instance
      this.ctx = null; // Will hold the 2D drawing context for the canvas
    }
  
    render(container) {
      // Create a canvas element for rendering the chart
      const canvas = document.createElement('canvas');
      // Append the canvas to the provided container
      container.appendChild(canvas);
      // Get the 2D drawing context from the canvas
      this.ctx = canvas.getContext('2d');
      // Initialize the chart with default settings
      this.initializeChart();
    }
  
    initializeChart() {
      // Create a new Chart.js instance with a bar chart type
      this.chart = new Chart(this.ctx, {
        type: 'bar',
        data: {
          labels: [], // Will be set when data is received
          datasets: [{
            label: 'Votes', // Label for the dataset
            data: [], // Will be set when data is received
            backgroundColor: 'rgba(54, 162, 235, 0.6)', // Bar color
          }],
        },
        options: {
          scales: {
            y: { beginAtZero: true }, // Y-axis starts at zero
          },
        },
      });
    }
  
    update(results) {
      const voteCounts = results.voteCounts;
      // Update the chart labels with the keys from the results
      this.chart.data.labels = Object.keys(voteCounts);
      // Update the chart data with the values from the results
      this.chart.data.datasets[0].data = Object.values(voteCounts);
      // Refresh the chart to display the new data
      this.chart.update();

      if(results.votes)
      {
        // ToDo: Display the votes by user
      }
    }
  
    showFinalResults() {
      // Display an alert indicating that the voting has ended and show the final results
      alert('Voting has ended. Here are the final results.');
    }
  }
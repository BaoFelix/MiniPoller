// Handling HTTP requests to the server

class ApiService {
  constructor() {
    this.baseUrl = "";
  }

  async createPoll(pollData) {
    const response = await fetch("/api/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pollData),
    });

    if (!response.ok) {
      throw new Error("Failed to create poll");
    }
    return await response.json();
  }

  async getPoll(pollId) {
    const response = await fetch(`/api/polls/${pollId}`);
    if(!response.ok)
    {
        throw new Error("Failed to get poll");
    }

    return await response.json();
  }

  async endPoll(pollId, ownerToken) {
    const response = await fetch(`/api/polls/${pollId}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerToken }),
      });


      if (!response.ok) {
        throw new Error('Failed to end poll');
      }
      return await response.json();
  }
}

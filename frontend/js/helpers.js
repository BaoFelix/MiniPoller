// Utility functions shared across the frontend
// Generates a short unique identifier for poll participants
function generateUserId() {
  return 'user_' + Math.random().toString(36).substr(2, 9);
}

// Utility to format technical errors into plain, human-readable explanations
// and dispatch global UI notification events.

export function formatHumanErrorMessage(errData, status) {
  let message = '';

  if (typeof errData === 'string') {
    message = errData;
  } else if (errData && typeof errData === 'object') {
    if (errData.details) {
      if (Array.isArray(errData.details)) {
        message = errData.details.map(d => (typeof d === 'object' ? (d.message || d.field || JSON.stringify(d)) : String(d))).join('. ');
      } else if (typeof errData.details === 'object') {
        const detailValues = Object.values(errData.details).map(d => (typeof d === 'object' ? (d.message || JSON.stringify(d)) : String(d)));
        if (detailValues.length > 0) {
          message = detailValues.join('. ');
        }
      }
    }
    if (!message && errData.error) {
      message = errData.error;
    }
  }

  // If backend provided a clear human sentence (and not raw HTTP status string), use it
  if (message && !message.includes('HTTP') && !message.includes('status') && !/^\d{3}$/.test(message.trim())) {
    if (message.includes('temporarily locked')) {
      return message;
    }
    return message;
  }

  // Fallback to clear, human-readable explanations based on status code
  switch (status) {
    case 400:
      return "Invalid form details. Please check your inputs and try again.";
    case 401:
      return "Incorrect email or password. Please check your credentials and try again.";
    case 403:
      return "Access restricted: You do not have administrator permissions for this action.";
    case 404:
      return "The requested item or endpoint could not be found.";
    case 409:
      return "An account or record with these details already exists.";
    case 429:
      return "Too many attempts: Your account or connection has been temporarily paused for security. Please wait a few minutes before trying again.";
    case 500:
    case 502:
    case 503:
      return "Our server experienced a temporary glitch. Please try again in a moment.";
    default:
      return message || "An unexpected error occurred. Please try again.";
  }
}

export const notify = {
  error(message, title = 'Action Failed') {
    window.dispatchEvent(
      new CustomEvent('diya-notification', {
        detail: { id: Date.now() + Math.random(), type: 'error', title, message },
      })
    );
  },
  success(message, title = 'Success') {
    window.dispatchEvent(
      new CustomEvent('diya-notification', {
        detail: { id: Date.now() + Math.random(), type: 'success', title, message },
      })
    );
  },
  info(message, title = 'Notice') {
    window.dispatchEvent(
      new CustomEvent('diya-notification', {
        detail: { id: Date.now() + Math.random(), type: 'info', title, message },
      })
    );
  },
};

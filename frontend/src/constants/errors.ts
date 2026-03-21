export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: {
    title: 'Wallet not connected',
    message: 'Please connect your wallet to continue.',
  },
  REGISTRATION_REQUIRED: {
    title: 'Registration required',
    message: 'Enter a username to register before subscribing.',
  },
  INVALID_USERNAME: {
    title: 'Invalid username',
    message: 'Username must be 3–32 characters and contain only letters, numbers, and underscores.',
  },
  INVALID_EMAIL: {
    title: 'Invalid email',
    message: 'Please enter a valid email address.',
  },
  CONTRACT_ERROR: {
    title: 'Contract error',
    message: 'There was an issue communicating with the Stacks blockchain.',
  },
  SAVE_FAILED: {
    title: 'Save failed',
    message: 'Unable to update your preferences. Please try again.',
  },
  GENERIC_ERROR: {
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Please try again later.',
  },
};

export type ErrorCode = keyof typeof ERROR_MESSAGES;

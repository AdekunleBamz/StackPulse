export const LOADING_STATES = {
  INITIALIZING: 'Initializing application...',
  FETCHING_ACCOUNT: 'Fetching account data...',
  LOADING_ALERTS: 'Loading your alerts...',
  CREATING_ALERT: 'Creating your alert...',
  UPDATING_PREFERENCES: 'Updating preferences...',
  REFRESHING_STATS: 'Refreshing live stats...',
  SAVING: 'Saving changes...',
};

export type LoadingStateKey = keyof typeof LOADING_STATES;

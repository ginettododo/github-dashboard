export * from './shared/types';

export type ActivityLogEntry = {
  id: string;
  level: 'info' | 'warn' | 'error';
  timestamp: string;
  message: string;
};

export const isCurrentRequest = (revision, currentRevision, signal) =>
  revision === currentRevision && !signal.aborted;

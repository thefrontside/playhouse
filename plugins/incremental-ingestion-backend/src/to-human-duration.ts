import { Duration } from 'luxon';

export function toHumanDuration(duration: Duration) {
  return duration.shiftTo('days', 'hours', 'minutes', 'seconds').toHuman();
}

import ShareDB from 'sharedb';
import { addReadSnapshotsAction } from './read-snapshots';
import { addReceivePresenceAction } from './receive-presence';
import { addSubmitAction } from './submit';

export function addActions(backend: ShareDB) {
  addSubmitAction(backend);
  addReadSnapshotsAction(backend);
  addReceivePresenceAction(backend);
}

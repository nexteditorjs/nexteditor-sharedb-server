import assert from 'assert';
import ShareDB from 'sharedb';
import { AgentCustom } from '../types/common';

export function addSubmitAction(backend: ShareDB) {
  backend.use('submit', (context, next) => {
    const custom = context.agent.custom as AgentCustom;
    const tokenInfo = custom.tokenInfo;
    assert(tokenInfo, 'no token info');
    if (tokenInfo.collectionId !== context.collection || tokenInfo.docId !== context.id) {
      next(new Error('access denied'));
      return;
    }
    next();
  });
}

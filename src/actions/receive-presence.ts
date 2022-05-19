import { getLogger } from '@nexteditorjs/nexteditor-core/dist/common';
import { NextEditorJoinMessage, NextEditorWelcomeMessage } from '@nexteditorjs/nexteditor-sharedb/dist/messages';
import WebSocketJSONStream from '@teamwork/websocket-json-stream';
import ShareDB from 'sharedb';
import onlineUsers from '../online-users';
import { AgentCustom } from '../types/common';

const logger = getLogger('receive-presence');

async function sendWelcomeMessage(stream: WebSocketJSONStream, presenceChannel: string) {
  const message: NextEditorWelcomeMessage = {
    nexteditor: 'welcome',
    onlineUsers: onlineUsers.getOnlineUsers(presenceChannel),
  };
  // eslint-disable-next-line no-param-reassign
  return new Promise<void>((resolve, reject) => {
    stream.ws.send(JSON.stringify(message), (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export function addReceivePresenceAction(backend: ShareDB) {
  backend.use('receivePresence', (context, next) => {
  // Do something with the context
    const custom = context.agent.custom as AgentCustom;
    const data = context.presence.p;
    if (data === null) {
      const message = custom.joinMessage;
      if (message && message.user) {
        logger.debug(`${message.user.name} [${message.user.clientId}] leave`);
        onlineUsers.removeUser(context.presence.ch, message.user.clientId);
      }
    //
    } else if (data.nexteditor === 'join') {
    //
      const message = data as NextEditorJoinMessage;
      const old = custom.joinMessage;
      if (old && old.user) {
        if (old.user.clientId === message.user.clientId) {
          logger.debug(`resent join message, ${message.user.name} ${message.user.clientId} to new client`);
        } else {
          logger.error(`invalid resent join message, from ${old.user.name} ${old.user.clientId} to ${message.user.name} ${message.user.clientId}`);
        }
      } else {
        if (!message.user) {
          logger.error('invalid message');
        }
        logger.debug(`${message.user.name} [${message.user.clientId}] join`);
        custom.joinMessage = message;
        onlineUsers.addUser(context.presence.ch, message.user);
        sendWelcomeMessage(context.agent.stream as WebSocketJSONStream, context.presence.ch);
      }
    }
    next();
  });
}

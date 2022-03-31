import express from 'express';
import WebSocket from 'ws';
import ShareDB from 'sharedb';
import WebSocketJSONStream from '@teamwork/websocket-json-stream';
import http from 'http';
import richText from '@nexteditorjs/nexteditor-core/dist/ot-types/rich-text';
import { NextEditorCustomMessage, NextEditorJoinMessage, NextEditorUser, NextEditorWelcomeMessage } from '@nexteditorjs/nexteditor-sharedb/dist/messages';
import * as json1 from 'ot-json1';
import { genId } from '@nexteditorjs/nexteditor-core/dist/common';

json1.type.registerSubtype(richText.type);
json1.type.name = 'ot-json1';
ShareDB.types.register(json1.type);

const app = express();
const server = http.createServer(app);
const webSocketServer = new WebSocket.Server({ server });

const users = [
  {
    userId: 'user-1',
    name: 'Bruce',
    avatarUrl: '',
  },
  {
    userId: 'user-2',
    name: 'Steve',
    avatarUrl: '',
  },
  {
    userId: 'user-3',
    name: 'James',
    avatarUrl: '',
  },
];

class OnlineUsers {
  private users = new Map<string, Map<string, NextEditorUser> >();

  addUser(presenceChannel: string, user: NextEditorUser) {
    const users = this.users.get(presenceChannel);
    if (users) {
      users.set(user.clientId, user);
    } else {
      const newUsers = new Map<string, NextEditorUser>();
      newUsers.set(user.clientId, user);
      this.users.set(presenceChannel, newUsers);
    }
  }

  removeUser(presenceChannel: string, clientId: string) {
    const users = this.users.get(presenceChannel);
    if (!users) return;
    users.delete(clientId);
  }

  getOnlineUsers(presenceChannel: string) {
    const users = this.users.get(presenceChannel);
    if (!users) return [];
    return Array.from(users.values());
  }
}

const onlineUsers = new OnlineUsers();

function getRandomUser() {
  return users[Date.now() % users.length];
}

async function sendInitMessage(stream: WebSocketJSONStream) {
  const user: NextEditorUser = {
    ...getRandomUser(),
    clientId: genId(),
  };
  const message: NextEditorCustomMessage = {
    nexteditor: 'init',
    user,
  };
  // eslint-disable-next-line no-param-reassign
  return new Promise<void>((resolve, reject) => {
    stream.ws.send(JSON.stringify(message), (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

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

const backend = new ShareDB({ presence: true, doNotForwardSendPresenceErrorsToClient: true });

webSocketServer.on('connection', async (webSocket, req) => {
  const stream = new WebSocketJSONStream(webSocket);
  try {
    await sendInitMessage(stream);
    backend.listen(stream, req);
  } catch (err) {
    webSocket.close();
  }
});

backend.use('receivePresence', (context, next) => {
  // Do something with the context
  const data = context.presence.p;
  if (data === null) {
    const message = context.agent.custom as NextEditorJoinMessage;
    console.debug(`${message.user.name} leave`);
    onlineUsers.removeUser(context.presence.ch, message.user.clientId);
  } else if (data.nexteditor === 'join') {
    //
    context.agent.custom = data;
    const message = data as NextEditorJoinMessage;
    console.debug(`${message.user.name} join`);
    onlineUsers.addUser(context.presence.ch, message.user);
    //
    sendWelcomeMessage(context.agent.stream as WebSocketJSONStream, context.presence.ch);
  }
  next();
});

server.listen(8080);

import WebSocket from 'ws';
import { NextEditorCustomMessage, NextEditorUser } from '@nexteditorjs/nexteditor-sharedb/dist/messages';
import WebSocketJSONStream from '@teamwork/websocket-json-stream';
import ShareDB from 'sharedb';
import { getLogger } from '@nexteditorjs/nexteditor-core/dist/common';
import { userToRainbow } from '../rainbow/user-to-rainbow';
import { AgentCustom, TokenInfo } from '../types/common';
import { verifyToken } from '../auth/verify-token';

const logger = getLogger('websocket');

async function sendInitMessage(stream: WebSocketJSONStream, tokenInfo: TokenInfo, clientId: string) {
  const user: NextEditorUser = {
    ...tokenInfo,
    clientId,
    rainbowIndex: userToRainbow(tokenInfo),
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

export function initWebSocket(webSocketServer: WebSocket.Server, backend: ShareDB) {
  //
  webSocketServer.on('connection', async (webSocket, req) => {
  //
    const parseProtocol = () => {
      const protocol = req.headers['sec-websocket-protocol'];
      if (typeof protocol !== 'string') {
        throw new Error(`invalid protocol, ${JSON.stringify(protocol)}`);
      }
      let json;
      try {
        const jsonText = Buffer.from(protocol, 'base64').toString('utf8');
        json = JSON.parse(jsonText);
      } catch (err) {
        throw new Error(`invalid protocol, failed to parse, ${(err as Error).message}, ${JSON.stringify(protocol)}`);
      }
      //
      if (!json.token || !json.clientId || typeof json.token !== 'string' || typeof json.clientId !== 'string') {
        throw new Error(`invalid protocol, no token or clientId. ${JSON.stringify(protocol)}`);
      }
      //
      try {
        const tokenInfo = verifyToken(json.token);
        // eslint-disable-next-line no-param-reassign
        const clientId: string = json.clientId;
        return { tokenInfo, clientId };
      } catch (err) {
        throw new Error(`invalid protocol, invalid token. ${JSON.stringify(protocol)}`);
      }
    };
    //
    // verify token
    const stream = new WebSocketJSONStream(webSocket);
    try {
      const { tokenInfo, clientId } = parseProtocol();
      await sendInitMessage(stream, tokenInfo, clientId);
      const agent = backend.listen(stream, req);
      agent.custom = { tokenInfo } as AgentCustom;
    } catch (err) {
      logger.error(`failed to create connection, ${(err as Error).message}`);
      webSocket.close();
    }
  });
}

declare module '@teamwork/websocket-json-stream' {
  import { Duplex } from 'stream';
  import WebSocket from 'ws';

  export default class WebSocketJSONStream extends Duplex {
    constructor(ws: WebSocket.WebSocket);
    ws: WebSocket.WebSocket;
  }
}

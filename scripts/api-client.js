export class ApiClient {
  constructor({ url }) {
    this.url = url;
    this.socket = null;
    this.callbacks = [];
  }

  onData(cb) {
    this.callbacks.push(cb);
  }

  emit(data) {
    for (const cb of this.callbacks) cb(data);
  }

  connect() {
    if (!this.url) return;
    this.socket = new WebSocket(this.url);
    this.socket.onmessage = ev => {
      const data = JSON.parse(ev.data);
      this.emit(data);
    };
  }

  disconnect() {
    if (this.socket) this.socket.close();
  }
}
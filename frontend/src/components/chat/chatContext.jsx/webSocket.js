export class WebSocketService {
    constructor(url, onMessage, onError) {
      this.url = url;
      this.onMessage = onMessage;
      this.onError = onError;
      this.ws = null;
      this.reconnectAttempts = 0;
      this.maxReconnectAttempts = 5;
      this.reconnectTimeout = null;
    }
  
    connect() {
      try {
        this.ws = new WebSocket(this.url);
        
        this.ws.onopen = () => {
          console.log('WebSocket Connected');
          this.reconnectAttempts = 0;
        };
  
        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.onMessage(data);
          } catch (error) {
            this.onError('Failed to parse message');
          }
        };
  
        this.ws.onclose = () => {
          this.handleReconnect();
        };
  
        this.ws.onerror = (error) => {
          this.onError('WebSocket error occurred');
          this.handleReconnect();
        };
      } catch (error) {
        this.onError('Failed to establish WebSocket connection');
      }
    }
  
    handleReconnect() {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectTimeout = setTimeout(() => {
          this.reconnectAttempts++;
          this.connect();
        }, 3000 * Math.pow(2, this.reconnectAttempts));
      } else {
        this.onError('Maximum reconnection attempts reached');
      }
    }
  
    sendMessage(message) {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message));
        return true;
      }
      return false;
    }
  
    disconnect() {
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }
      if (this.ws) {
        this.ws.close();
      }
    }
  }
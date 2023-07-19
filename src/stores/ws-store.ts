import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useLive2DStore } from './live2D-store';

export const DEFAULT_DRIVER_WS_ADDR = process.env.DEFAULT_DRIVER_WS_ADDR || 'ws://localhost:9001/live2d';
console.log('DEFAULT_DRIVER_WS_ADDR', DEFAULT_DRIVER_WS_ADDR);

const live2DStore = useLive2DStore();

export const useWsStore = defineStore('ws', () => {
  let _connected = false;
  const ws = ref<WebSocket>();

  /** deprecated: use connected instead */
  const opened = computed(() => ws.value?.readyState === WebSocket.OPEN);
  /** deprecated: use connected instead */
  const closed = computed(() => ws.value?.readyState === WebSocket.CLOSED);

  /** WebSocket connection status */
  // const connected = computed(() => _connected);
  // emm, 不知道为啥 computed 看不到变化，姑且先用个 action 吧，能跑就行哈哈哈。
  function connected(): boolean {
    return _connected;
  }

  function dialWebSocket(address: string = DEFAULT_DRIVER_WS_ADDR) {
    console.log('dailWebSocket:', address);

    ws.value = new WebSocket(address);

    ws.value.onopen = (event: Event) => {
      console.log('ws onopen:', event);
      _connected = true;
    };
    ws.value.onmessage = (event: MessageEvent) => {
      console.log('ws onmessage:', event);
      let data: any;
      try {
        data = JSON.parse(event.data);
      } catch (error) {
        console.log('ws onmessage error:', error);
        return;
      }
      if (!data) {
        return;
      }
      console.log('ws onmessage data:', data);
      if (data.model) {
        console.log('ws onmessage data.model:', data.model);
        live2DStore.setModel(data.model);
      }
      if (data.motion) {
        console.log('ws onmessage data.motion:', data.motion);
        if (typeof data.motion === 'string') {
          data.motion = {
            group: data.motion,
          };
        }
        live2DStore.setMotion(data.motion);
      }
      if (data.expression) {
        console.log('ws onmessage data.expression:', data.expression);
        live2DStore.setExpression(data.expression);
      }
      if (data.speak) {
        console.log('ws onmessage data.speak:', data.speak);
        live2DStore.speak(data.speak);
      }
    };
    ws.value.onerror = (event: Event) => {
      console.log('ws onerror:', event);
      _connected = false;
    };
    ws.value.onclose = (event: CloseEvent) => {
      console.log('ws onclose:', event);
      _connected = false;
    };
  }

  function closeWebSocket() {
    if (ws.value) {
      ws.value.close();
    }
  }

  return {
    // getters
    opened,
    closed,
    // actions
    connected,
    dialWebSocket,
    closeWebSocket,
  };
});

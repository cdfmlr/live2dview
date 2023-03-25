import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useLive2DStore } from './live2D-store';

export const DEFAULT_DRIVER_WS_ADDR = process.env.DEFAULT_DRIVER_WS_ADDR || 'ws://localhost:9001/live2d';
console.log('DEFAULT_DRIVER_WS_ADDR', DEFAULT_DRIVER_WS_ADDR);

const live2DStore = useLive2DStore();

export const useWsStore = defineStore('ws', () => {
  const ws = ref<WebSocket>();

  const opened = computed(() => ws.value?.readyState === WebSocket.OPEN);
  const closed = computed(() => ws.value?.readyState === WebSocket.CLOSED);

  function dialWebSocket(address: string = DEFAULT_DRIVER_WS_ADDR) {
    console.log('dailWebSocket:', address);

    ws.value = new WebSocket(address);

    ws.value.onopen = (event: Event) => {
      console.log('ws onopen:', event);
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
    };
    ws.value.onerror = (event: Event) => {
      console.log('ws onerror:', event);
    };
    ws.value.onclose = (event: CloseEvent) => {
      console.log('ws onclose:', event);
    };
  }

  return {
    // getters
    opened,
    closed,
    // actions
    dialWebSocket,
  };
});

<template>
  <q-page class="row items-center justify-evenly">
    <Live2DView />
  </q-page>
</template>

<script setup lang="ts">
import Live2DView from 'components/Live2DView.vue';
import { useWsStore, DEFAULT_DRIVER_WS_ADDR } from 'stores/ws-store';
import { onBeforeUnmount, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const wsStore = useWsStore();

function connectToControllers() {
  let driverWsAddr = DEFAULT_DRIVER_WS_ADDR;

  // custom wsAddr from url query
  if (route.query.driver) {
    driverWsAddr = route.query.driver as string;
    console.log('use driver ws addr from route param:', driverWsAddr);
  } else {
    console.log(
      'no driver param (?driver=ws://muvtuber.live2d.driver) set. use default:',
      driverWsAddr
    );
  }

  wsStore.dialWebSocket(driverWsAddr);
}

onMounted(() => {
  connectToControllers();
});

onBeforeUnmount(() => {
  console.log('onBeforeUnmount: close websocket connection');
  wsStore.closeWebSocket();
});

setInterval(() => {
  if (!wsStore.connected()) {
    console.log('no controllers connected. trying to connect...');
    connectToControllers();
  }
}, 1000 * 30);
// }, 1000 * 3); // for debug

// auto refresh page every 2 hours (#33)
setTimeout(() => {
  console.log('auto refresh page every 2 hours...');
  window.location.reload();
}, 1000 * 60 * 60 * 2);
// }, 1000 * 30); // for debug
</script>

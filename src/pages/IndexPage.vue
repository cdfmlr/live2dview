<template>
  <q-page class="row items-center justify-evenly">
    <Live2DView />
  </q-page>
</template>

<script setup lang="ts">
import Live2DView from 'components/Live2DView.vue';
import { useWsStore, DEFAULT_DRIVER_WS_ADDR } from 'stores/ws-store';
import { useRoute } from 'vue-router';

let driverWsAddr = DEFAULT_DRIVER_WS_ADDR;

// custom wsAddr from url query
const route = useRoute();
if (route.query.driver) {
  driverWsAddr = route.query.driver as string;
  console.log('use driver ws addr from route param:', driverWsAddr);
} else {
  console.log(
    'no driver param (?driver=ws://muvtuber.live2d.driver) set. use default:',
    driverWsAddr
  );
}

const wsStore = useWsStore();
wsStore.dialWebSocket(driverWsAddr);
</script>

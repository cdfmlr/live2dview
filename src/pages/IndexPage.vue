<template>
  <q-page class="row items-center justify-evenly">
    <Live2DView />
  </q-page>
</template>

<script setup lang="ts">
import Live2DView from 'components/Live2DView.vue';
import { useWsStore, DEFAULT_WS_ADDR } from 'stores/ws-store';
const wsStore = useWsStore();

wsStore.dialWebSocket(DEFAULT_WS_ADDR);
</script>

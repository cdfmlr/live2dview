<template>
  <div>
    <h2>Live2D Debug</h2>
    <div class="live2d-debug">
      <div class="live2d-debug-model">
        <p>Current Model: {{ live2DStore.model?.tag }}</p>

        <q-btn
          v-for="(modelSrc, key) in EXAMPLE_MODELS"
          :key="key"
          :label="key"
          @click="live2DStore.setModel(modelSrc)"
        />
      </div>
      <div class="live2d-debug-motion">
        <p>Current Motion: {{ live2DStore.currentMotion }}</p>
        <q-btn
          v-for="(motion, key) in live2DStore.motions"
          :key="key"
          :label="key"
          @click="live2DStore.setMotion({ group: key })"
        />
      </div>
      <div class="live2d-debug-expression">
        <p>Current Expression: {{ live2DStore.currentExpression }}</p>
        <q-btn
          v-for="(expression, index) in live2DStore.expressions"
          :key="index"
          :label="expression.name || index"
          @click="live2DStore.setExpression(index)"
        />
      </div>
      <div class="live2d-debug-ws">
        <p>WebSocket:</p>
        <q-input v-model="wsAddress" label="Address">
          <template v-slot:append>
            <q-btn
              :disable="wsStore.opened"
              label="Dial"
              @click="wsStore.dialWebSocket(wsAddress)"
            />
          </template>
        </q-input>
      </div>
      <div class="live2d-debug-speak">
        <p>Speak:</p>
        <div class="row">
          <q-input v-model="speaking.audio" label="Audio" />
          <q-input v-model="speaking.text" label="Text" />
          <q-input v-model="speaking.volume" label="Volume" />
        </div>
        <div class="row">
          <q-input v-model="speaking.expression" label="Expression" />
          <q-input v-model="speaking.motion" label="Motion" />
          <q-btn
            style="align-self: center; margin-inline-start: 32px"
            label="Speak"
            @click="speak()"
          />
        </div>
      </div>
    </div>
  </div>
  <Live2DView />
</template>

<script setup lang="ts">
import Live2DView from './Live2DView.vue';
import { useLive2DStore, EXAMPLE_MODELS } from 'stores/live2D-store';
import { useWsStore, DEFAULT_DRIVER_WS_ADDR } from 'stores/ws-store';
import { ref } from 'vue';

const live2DStore = useLive2DStore();

const wsStore = useWsStore();

const wsAddress = ref(DEFAULT_DRIVER_WS_ADDR);

const speaking = ref({
  audio: '',
  text: '',
  volume: '',
  expression: '',
  motion: '',
});

function speak() {
  console.log('speak', speaking.value);
  live2DStore.speak({
    ...speaking.value,
    volume: Number(speaking.value.volume),
  });
}

</script>

<style scoped>
.live2d-debug > div {
  margin-top: 16px;
}
</style>

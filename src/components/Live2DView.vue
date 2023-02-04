<!-- Live2D view and a set of controllers -->

<template>
  <div class="live2D-view" :class="{ 'pointer-on': pointerOnLive2D }">
    <canvas id="live2D-canvas"></canvas>

    <!-- controllers -->
    <q-page-sticky position="bottom-right" :offset="[0, 0]">
      <q-btn-group class="live2D-controllers">
        <div v-if="controllersPanel.opened">
          <!-- dropdown btn to motions -->
          <q-btn-dropdown
            no-caps
            unelevated
            :label="'motions'"
            :icon="'emoji_people'"
            @click="debugOps.logMotions"
          >
            <q-list>
              <q-item
                v-for="(motion, name, index) in store.motions"
                :key="index"
                clickable
                @click="
                  store.startMotion({
                    group: name,
                    priority: MotionPriority.FORCE,
                  })
                "
              >
                <q-item-section>{{ name }}</q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>

          <!-- dropdown btn to expressions -->
          <q-btn-dropdown
            no-caps
            unelevated
            :label="'expressions'"
            :icon="'emoji_emotions'"
            @click="debugOps.logExpressions"
          >
            <q-list>
              <q-item
                v-for="(expression, index) in store.expressions"
                :key="index"
                clickable
                @click="store.setExpression(expression.name)"
              >
                <q-item-section>{{ expression.name }}</q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>

          <!-- pointer on Live2D layer -->
          <q-toggle
            unelevated
            label="pointer on Live2D layer"
            v-model="pointerOnLive2D"
            unchecked-icon="pan_tool_alt"
            checked-icon="touch_app"
          />
        </div>

        <!-- close controllersPanel -->
        <q-btn
          id="controller"
          fab-mini
          :icon="controllersPanel.opened ? 'chevron_right' : 'games'"
          @click="onControllerClicked"
          :label="
            controllersPanel.opened && controllersPanel.autoClose.seconds < 5
              ? controllersPanel.autoClose.seconds
              : ''
          "
        >
          <q-tooltip
            :delay="1000"
            :anchor="controllersPanel.opened ? 'top middle' : 'center left'"
            :self="controllersPanel.opened ? 'center middle' : 'center right'"
            :offset="[10, 10]"
            transition-show="scale"
            transition-hide="rotate"
          >
            {{
              controllersPanel.opened
                ? '折叠(' + controllersPanel.autoClose.seconds + ')'
                : '展开控制面板'
            }}
          </q-tooltip>
        </q-btn>
      </q-btn-group>
    </q-page-sticky>
    <!-- /controllers -->
  </div>
</template>

<script setup lang="ts">
import * as PIXI from 'pixi.js';
import { Live2DModel } from 'pixi-live2d-display';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useLive2DStore, MotionPriority } from 'stores/live2D-store';

// #region : local variables

const store = useLive2DStore();
const CONTROLLER_PANEL_AUTOCLOSE_SECONDS = 60;

let canvas: HTMLCanvasElement | undefined;
let pixi: PIXI.Application | undefined;

// #endregion : local variables

// #region : watch model replacement

/**
 * watch props.model to replace model
 *
 * set to undefined | empty string will keep the old model.
 */
watch(
  () => store.modelSrc,
  async (newModelSrc) => {
    console.log('watch store.modelSrc:', newModelSrc);
    if (newModelSrc) {
      await replaceModel(newModelSrc);
    }
  }
);

/**
 * 加入视图，但放入 store 之前的 model。
 *
 * 这里保持一个原对象，可以在 store 那边 unsetModel 后 (store.model 变成了 undefined)，
 * 获取之前模型的位置，在替换模型时尽量保持原位置。
 *
 * 例如皮套现在在屏幕左边，不要换个模型就跳回到 default 的右边了。
 */
let modelInView: Live2DModel;

async function replaceModel(newModelSrc: string) {
  if (pixi?.stage?.children.length) {
    // remove all of the old things
    pixi?.stage.removeChildren(0);
  }

  console.log('[Live2D] replace model:', newModelSrc);

  // reusing the transform of the old model
  // 但也只能勉强保证模型的大致位置不变，因为模型的大小不定，
  // 且需要保证按照新模型 x 和 y 等比 scale，计算之后就会有一些偏差
  const transform: Transform | undefined = modelInView
    ? {
        width: modelInView.width,
        height: modelInView.height,
        x: modelInView.x,
        y: modelInView.y,
      }
    : undefined;

  // addChild first, then update store!!!
  modelInView = await initLive2DModel(newModelSrc, transform);
  store.model = pixi?.stage.addChild(modelInView);
}

// #endregion : watch model replacement

// #region : init pixi & model

onMounted(async () => {
  canvas = document.getElementById('live2D-canvas') as HTMLCanvasElement;
  pixi = initPixi(canvas);

  if (store.modelSrc) {
    await replaceModel(store.modelSrc);
  }
});

function initPixi(canvas: HTMLCanvasElement): PIXI.Application {
  // XXX(performance): importing Pixi packages on-demand:
  //    https://guansss.github.io/pixi-live2d-display/#package-importing

  // expose PIXI to window so that this plugin is able to
  // reference window.PIXI.Ticker to automatically update Live2D models

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  window.PIXI = PIXI;

  const app = new PIXI.Application({
    view: canvas,
    autoStart: true,
    resizeTo: window,
    backgroundAlpha: 0,
  });
  return app;
}

/**
 * init a draggable Live2DModel at hte right bottom of the window.
 */
async function initLive2DModel(
  source: string,
  transform?: Transform
): Promise<Live2DModel> {
  // const model = await Live2DModel.from('shizuku.model.json');
  const model = await Live2DModel.from(source, {
    autoInteract: true, // focus on pointer & response to tapping
  });

  if (transform) {
    setTransform(model, transform);
  } else {
    defaultTransform(model);
  }

  // interactions
  model.on('hit', (hitAreas) => {
    if (hitAreas.includes('body')) {
      model.motion('tap_body');
    }
  });

  draggable(model);
  resizeable(model);

  return model;
}

/**
 * do default transforms for model:
 * auto scale, put to right bottom of the window.
 * @param model Live2DModel
 */
function defaultTransform(model: Live2DModel) {
  const scaleX = (innerWidth * 0.3) / model.width;
  const scaleY = (innerHeight * 0.7) / model.height;

  const scale = Math.min(scaleX, scaleY);
  model.scale.set(scale);

  model.x = innerWidth - model.width; // right
  model.y = innerHeight - model.height; // bottom
}

// #endregion : init

// #region : model features

interface Transform {
  width: number;
  height: number;
  x: number;
  y: number;
}

function setTransform(model: Live2DModel, transform: Transform) {
  const scaleX = transform.width / model.width;
  const scaleY = transform.height / model.height;
  const scale = Math.min(scaleX, scaleY);
  model.scale.set(scale);

  model.x = transform.x;
  model.y = transform.y;
}

/**
 * Make a Live2DModel draggable
 *
 * @param model Live2DModel
 */
function draggable(model: Live2DModel) {
  /* eslint-disable */

  // copy from pixi-live2d-display example.
  // ignore the type errors (original code is in js).
  // It works fine. (I don't know how to fix it :()

  // @ts-ignore

  model.buttonMode = true;

  model.on('pointerdown', (e) => {
    // @ts-ignore
    model.dragging = true;
    // @ts-ignore
    model._pointerX = e.data.global.x - model.x;
    // @ts-ignore
    model._pointerY = e.data.global.y - model.y;
  });
  model.on('pointermove', (e) => {
    // @ts-ignore
    if (model.dragging) {
      // @ts-ignore
      model.position.x = e.data.global.x - model._pointerX;
      // @ts-ignore
      model.position.y = e.data.global.y - model._pointerY;
    }
  });
  // @ts-ignore
  model.on('pointerupoutside', () => (model.dragging = false));
  // @ts-ignore
  model.on('pointerup', () => (model.dragging = false));
}

function resizeable(model: Live2DModel) {
  canvas?.addEventListener('wheel', (e) => {
    if (pointInModel({ x: e.clientX, y: e.clientY }, model)) {
      model.scale.set(model.scale.x + e.deltaY * 0.001);
    }
  });
}

/**
 * Does the point {x, y} in model's area?
 * @param point a point by
 * @param model
 */
function pointInModel(
  point: { x: number; y: number },
  model: Live2DModel
): boolean {
  return (
    model.x < point.x &&
    model.y < point.y &&
    point.x < model.x + model.width &&
    point.y < model.y + model.height
  );
}

// #endregion : model features

// #region : local state: controllers & pointer-events

// Live2D view 是否捕获鼠标，若为 true 则 z 轴下层元素不可点击。
const pointerOnLive2D = ref(false);

// 打开控制按钮面板
const controllersPanel = ref({
  opened: false,
  autoClose: {
    seconds: 0,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    interval: null as any, // setInterval return type is NodeJS.Timeout
  },
});

function controllersAutoClose() {
  controllersPanel.value.opened = true;
  controllersPanel.value.autoClose.seconds = CONTROLLER_PANEL_AUTOCLOSE_SECONDS;

  controllersPanel.value.autoClose.interval = setInterval(() => {
    controllersPanel.value.autoClose.seconds -= 1;
    if (controllersPanel.value.autoClose.seconds <= 0) {
      clearInterval(controllersPanel.value.autoClose.interval);
      controllersPanel.value.opened = false;
    }
  }, 1000);
}

function onControllerClicked() {
  controllersPanel.value.opened = !controllersPanel.value.opened;

  if (controllersPanel.value.opened) {
    // false -> true: opening
    controllersAutoClose();
  } else {
    // true -> false: closing
    clearInterval(controllersPanel.value.autoClose.interval);
  }
}

onBeforeUnmount(() => {
  clearInterval(controllersPanel.value.autoClose.interval);
  store.unsetModel();
});

// #endregion : local state

// #region : other functions

const debugOps = {
  logExpressions() {
    console.log('expressions:', store.expressions);
  },
  logMotions() {
    console.log('motions:', store.motions);
  },
  startMotion: store.startMotion,
  startExpression: store.setExpression,
};

// #endregion : other functions
</script>

<style scoped>
.live2D-view {
  position: fixed;
  bottom: 0;
  right: 0;
  z-index: 999;
  pointer-events: none;
}

.pointer-on {
  pointer-events: auto;
}
.live2D-controllers {
  padding: 0, 8px, 0, 8px;
  background: #eee2;
  color: #222e;
}
</style>

import { defineStore } from 'pinia';
import { Live2DModel } from 'pixi-live2d-display';

// consts

/** an example v2 model source */
const SHIZUKU_MODEL = '/shizuku/shizuku.model.json'; // in public

/** an example v4 model source */
const HARU_MODEL =
  'https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/haru/haru_greeter_t03.model3.json';

export const EXAMPLE_MODELS = {
  SHIZUKU: SHIZUKU_MODEL,
  HARU: HARU_MODEL,
};

/**
 * 保持（repeat startMotion）动作的间隔，单位毫秒
 */
const KEEP_MOTION_INTERVAL_MS = 1000;

// state interface

export class Live2DState {
  modelSrc?: string = SHIZUKU_MODEL;

  model?: Live2DModel;

  /**
   * 当前的表情，设置上就一直不会变，直到重新设置该值
   *
   * should be set by `setExpression` instead of directly assigning to this.
   */
  expression?: string | number;
  /**
   * 当前的动作，设置上就一直不会变，直到重新设置该值
   *
   * 具体的当前具体动作可以通过 `currentMotion` 获取。
   *
   * Should be set by `setMotion` instead of directly assigning to this.
   */
  motion?: Motion;

  /**
   * 保持动作的 interval。
   *
   * 类型就是 `ReturnType<typeof setInterval>`，但赋值会报错，所以用了 any
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _keepMotion?: ReturnType<typeof setInterval> | any;

  isSpeaking?: boolean;
}

/**
 * Indicates the motion priority.
 *
 * Eq to MotionPriority from 'pixi-live2d-display'.
 */
export enum MotionPriority {
  /** Low priority, used when starting idle motions automatically. */
  IDLE = 1,
  /** Medium priority. */
  NORMAL = 2,
  /** High priority. Motions as this priority will always be played regardless of the current priority. */
  FORCE = 3,
}

export interface Motion {
  group?: string;
  index?: number;
  priority?: MotionPriority;
}

export interface Speaking {
  audio?: string;

  text?: string;
  volume?: number;

  expression?: string | number;
  motion?: string | Motion;
}

function motionManagerStateToMotion(state?: {
  currentGroup?: string;
  currentIndex?: number;
  currentPriority?: number;
}): Motion {
  return {
    group: state?.currentGroup,
    index: state?.currentIndex,
    priority: state?.currentPriority,
  };
}

export const useLive2DStore = defineStore('live2D', {
  state: () => new Live2DState(),
  getters: {
    motions: (state) => state.model?.internalModel.motionManager.definitions,
    expressions: (state) => {
      return state.model?.internalModel.motionManager.expressionManager?.definitions.map(
        (d) => ({
          name: d.name || d.Name, // v2 || v4 model
          file: d.file || d.File,
        })
      );
    },
    currentMotion: (state) => {
      const current = motionManagerStateToMotion(
        state.model?.internalModel.motionManager.state
      );
      return current;
    },
    currentExpression: (state) => state.expression,
  },
  actions: {
    /**
     * Set modelSrc and the model will be loaded by the view automatically.
     */
    setModel(src: string) {
      if (src === this.modelSrc || src.trim() === '') return;

      this.unsetModel();

      this.modelSrc = src;

      // view will see this change and load the model to `this.model`
      // 因为 pixi 需要放在 view 里才能工作，所以 model 的加载也放在 view 里
    },
    unsetModel() {
      clearInterval(this._keepMotion);
      this.model = undefined;
      this.motion = undefined;
      this.expression = undefined;
    },
    /**
     * Apply an expression.
     * @param id expression index (number) or name (string) or undefined for a random one
     */
    setExpression(id?: string | number | undefined) {
      if (!this.model) return;
      this.expression = id;
      this.startExpression(id);
    },
    /**
     * Set the motion and keep it.
     *
     * 开始并维持（循环播放）传进来的动作 newMotion，
     * 直到传入新的动作或者 undefined （即 idle） 为止。
     *
     * 利用这个特性可以勉强实现说话时的 lip 动作。
     *
     * 如果需要一次性的临时动作，可以直接调用 `startMotion`。
     */
    setMotion(newMotion: Motion) {
      if (!this.model) return;

      if (
        this.motion?.group !== newMotion.group ||
        this.motion?.index !== newMotion.index ||
        this.motion?.priority !== newMotion.priority
      ) {
        clearInterval(this._keepMotion);

        // 若为 undefined 即 idle 无需维持
        if (newMotion.group !== undefined) {
          console.log('keep motion ', newMotion);
          this._keepMotion = setInterval(() => {
            this.startMotion(newMotion);
          }, KEEP_MOTION_INTERVAL_MS);
        }
      }

      this.motion = newMotion;
    },
    /**
     * Start a motion without changing the current state (motion).
     *
     * 这个可以用于临时的动作，如果需要长期保持某种动作，应该用 `setMotion`。
     *
     * https://guansss.github.io/pixi-live2d-display/motions_expressions/#starting-motions
     *
     * @param model Live2DModel
     * @param group motions group name (string)
     * @param index index of motion in the group (number or undefined for a random one)
     * @param priority A motion can be started as one of these priorities: MotionPriority.IDLE, MotionPriority.NORMAL and MotionPriority.FORCE.
     */
    startMotion(motion: Motion) {
      if (!this.model || !motion.group) return;
      this.model?.motion(motion.group, motion.index, motion.priority);
      // this.model?.internalModel.addListener('beforeModelUpdate', () => {
      //   this.model?.internalModel.coreModel
      // });

      // lip sync
      // this.model?.internalModel.addListener('beforeModelUpdate', () => {
      //   const mm = this.model?.internalModel.motionManager;
      //   const params =
      //     mm?.motionGroups[mm.state.currentGroup ?? '']?.[
      //       mm.state.currentIndex ?? 0
      //     ].motions;
      //   if (!params) {
      //     return;
      //   }
      //   let i = 0; // indexOfPARAM_MOUTH_FORM
      //   for (; i < params.length; i++) {
      //     if ('PARAM_MOUTH_FORM' in Object.values(params[i])) {
      //       // xxx: 还有个 MOUTH_SIZE
      //       break;
      //     }
      //   }
      //   if (i > params.length) {
      //     return;
      //   }
      //   for (const key in Object.keys(params[i])) {
      //     if (Array.isArray(params[i][key])) {
      //       for (let j = 0; j < params[i][key].length; j++) {
      //         if (params[i][key][j] == 0) {
      //           params[i][key][j] = Math.random() * 2 - 1;
      //         }
      //       }
      //     }
      //   }

      //   this.model?.internalModel.removeListener('beforeModelUpdate');
      // });
    },
    /**
     * Apply an expression to the model without changing the current state (expression).
     *
     * store 的外部不应该直接调用这个方法，而应该调用 `setExpression`，以确保 state 与 model 内部状态一致。
     *
     * @param id expression index (number) or name (string) or undefined (for a random expression)
     *
     * ```
     * model.expression(0);  // apply the first expression
     * model.expression('smile');  // apply the expression named "smile"
     * model.expression();  // apply a random expression
     * ```
     */
    startExpression(id?: string | number | undefined) {
      if (!this.model) return;
      this.model?.expression(id);
    },
    /**
     * Speak with lip sync.
     *
     * @param s Speaking.
     * @returns void
     */
    speak(s: Speaking) {
      if (!this.model) return;

      this.model.internalModel?.motionManager?.stopAllMotions();
      clearInterval(this._keepMotion);

      // 张嘴幅度和 volume 正相关
      if (s.volume === undefined) {
        s.volume = 1;
      }

      if (s.motion) {
        if (typeof s.motion === 'string') {
          s.motion = {
            group: s.motion,
          };
        }
        this.model.motion(
          s.motion.group,
          s.motion.index || 0,
          s.motion.priority,
          s.audio,
          s.volume,
          s.expression
        );
      } else {
        this.model.speak(s.audio, s.volume, s.expression);
      }

      // this.isSpeaking = true;
      console.log('speak start');

      // TODO: 反馈机制: SpeakStart, SpeakFinish

      // // XXX: 曾观察到这里的 once 立即执行到的情况
      // //      可能是前一个动作的终止？
      // this.model.internalModel?.motionManager?.once('motionFinish', () => {
      //   console.log('motionFinish: speak end');
      //   this.isSpeaking = false;
      // });
    },
  },
});

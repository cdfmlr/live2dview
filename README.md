# live2dview

> 🔑 This is a muli component. You can find the main repository [here](https://github.com/cdfmlr/muvtuber).

A Live2D View.

Goto the [main repository](https://github.com/cdfmlr/muvtuber) for more information.

## Usage

浏览器打开：

```
http://localhost:51070/#/?driver=ws://localhost:51071/live2d
```

另有一个 debug 版界面：

```
http://localhost:51070/#/debug/
```

## Controlling

连接到 driver 之后，driver 通过发送 WebSocket 消息对 Live2D 模型进行控制：

- `{ model: "http://url.to.live2d/xxx.model.json" }`
    - 从 url 加载 live2d 模型
- `{ motion: { group?: string, index?: number, priority?: number} }`
    - 开始并维持（循环播放）传进来的动作, 直到传入新的动作或者 undefined （即 idle） 为止。
    - 参数详见 [pixi-live2d-display docs: motions](https://guansss.github.io/pixi-live2d-display/motions_expressions/)
- `{ expression: { id: string | number | undefined } } `
    - id: expression index (number) or name (string) or undefined for a random one
- `{ speak: audio?: string, volume?: number, motion?: Motin, expression?: Expression }`
    - speak out an audio with lip sync
    - audio: url to audio file (mp3 or wav) or base64 encoded audio data (wav)
    - volume: audio volume: 0 ~ 1
    - motion: motion to play while speaking: The value is the same as the `motion` field in `{ motion: { ... } }`
    - expression: expression to play while speaking. The value is the same as the `expression` field in `{ expression: { ... } }`

⚠️ ATTENTION: 由于[浏览器的策略限制](https://developer.chrome.com/blog/autoplay/)，必须在用户交互（例如点击）之后才能播放声音。也就是说使用 speak 前，必须先让用户点击一下页面。不过在 OBS 中，没有观察到这个限制，所以不影响直播吧（我还不确定，需要更多实验）。

现在的一个缺陷是，不能给出 speak 开始、结束的反馈。所以无法精准控制何时能“说下一句”。可能需要：

1. 由 RaSan147/pixi-live2d-display 那边提供一个回调，通知 speak 开始、结束。我再把信号通过 WebSocket 传回 driver。
2. 由 driver 根据音频时常自行估算。Best-effort playback.
3. 使用 audioview 进行播放。live2dview 只是做视觉上的 lip sync。也就是把音频和动作的同步性放松了。Best-effort lip-sync. (I prefer this one. More progressive. Will work on it.)

## Install the dependencies


```bash
yarn
# or
npm install
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)


```bash
quasar dev
```


### Lint the files


```bash
yarn lint
# or
npm run lint
```


### Format the files


```bash
yarn format
# or
npm run format
```

### Build the app for production


```bash
quasar build
```

### Customize the configuration

See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js).

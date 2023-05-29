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
- `{ modtion: { group?: string, index?: number, priority?: number} }`
    - 开始并维持（循环播放）传进来的动作, 直到传入新的动作或者 undefined （即 idle） 为止。
    - 参数详见 [pixi-live2d-display docs: motions](https://guansss.github.io/pixi-live2d-display/motions_expressions/)
- `{ expression: { id: string | number | undefined } } `
    - id: expression index (number) or name (string) or undefined for a random one

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

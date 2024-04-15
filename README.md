# @deviltea/tiny-pipe

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![License][license-src]][license-href]

A pipe function builder with tiny size and type-safe.

## Install

```sh
npm install @deviltea/tiny-pipe
```

## Usage

### Basic
```ts
import { createPipe } from '@deviltea/tiny-pipe'

const square = (x: number) => x * x
const minusOne = (x: number) => x - 1

// You may create a new executable function
// typeof squareAndMinusOne === (x: number) => number
const squareAndMinusOne = createPipe()
	.pipe(square)
	.pipe(minusOne)
	.execute

// Or directly execute the function
createPipe()
	.pipe(square)
	.pipe(minusOne)
	.execute(3) // 8

// The pipe function is type-safe
createPipe()
	.pipe(square)
	.pipe(minusOne)
	.execute('3') // Argument type error!

createPipe()
	.pipe(square)
	.pipe((v: string) => v) // Handler's parameter type error!
	.pipe(minusOne)
	.execute(3)
```

### Async
```ts
// During the execution, each handler of pipe
// will wait for the previous handler to finish,
// so you can pipe any async or sync functions together freely.

const myFn = createPipe()
	.pipe((x /* : number */) => Promise.resolve(x + 1))
	.pipe(async (x /* : number */) => x * 2)
	.pipe((x /* : number */) => x - 1)
	.execute
```

### Error handling
```ts
function getNumberOrThrow() {
	const n = Math.random()
	if (n < 0.5)
		throw new Error('Oops!')

	return n
}

const myFn = createPipe()
	.pipeSafe(getNumberOrThrow) // If the handler may throw an error, you can use `pipeSafe` to wrap it.
	.pipe((safeData) => { // It will wrap the result or error into an object. Do not destruct it to let type narrowing work.
		if (safeData.status === 'resolved') // type narrowing
			console.log(safeData.result /* :number */)

		else if (safeData.status === 'rejected') // type narrowing
			console.log(safeData.reason /* :Error */)
	})
	.execute
```

## License

[MIT](./LICENSE) License © 2023-PRESENT [DevilTea](https://github.com/DevilTea)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@deviltea/tiny-pipe?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/@deviltea/tiny-pipe
[npm-downloads-src]: https://img.shields.io/npm/dm/@deviltea/tiny-pipe?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/@deviltea/tiny-pipe
[bundle-src]: https://img.shields.io/bundlephobia/minzip/@deviltea/tiny-pipe?style=flat&colorA=080f12&colorB=1fa669&label=minzip
[bundle-href]: https://bundlephobia.com/result?p=@deviltea/tiny-pipe
[license-src]: https://img.shields.io/github/license/DevilTea/tiny-pipe.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/DevilTea/tiny-pipe/blob/main/LICENSE

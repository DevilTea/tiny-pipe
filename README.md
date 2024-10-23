# @deviltea/tiny-pipe

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![License][license-src]][license-href]

A pipe function builder with tiny size and type-safe.

## Overview

**Tiny Pipe** is a lightweight, type-safe pipe function builder. It allows you to create a sequence of operations, either synchronously or asynchronously, with safe error handling capabilities.

- **Lightweight**: Built with performance and minimal footprint in mind.
- **Type-safe**: Ensures correct types throughout the pipe's execution.
- **Error handling**: Built-in mechanisms for safely managing errors during pipeline execution.

## Features

- **Sync and Async Pipelines**: Support both synchronous and asynchronous function chains.
- **Safe Execution**: Use `pipeSafely` to automatically handle errors within the pipeline.
- **Tiny Size**: Optimized for minimal overhead while providing robust functionality.

## Installation

Install the package using `pnpm`:

```bash
pnpm add @deviltea/tiny-pipe
```

Or with `npm`:

```bash
npm install @deviltea/tiny-pipe
```

## Usage

### Synchronous Pipeline

```ts
import { createPipe } from '@deviltea/tiny-pipe'

const result = createPipe()
	.pipe((value: number) => value + 1)
	.pipe((value: number) => value * 2)
	.execute(5)

console.log(result) // Output: 12
```

### Asynchronous Pipeline

```ts
import { createPipe } from '@deviltea/tiny-pipe'

const result = await createPipe()
	.pipe(async (value: number) => value + 1)
	.pipe(async (value: number) => value * 2)
	.execute(5)

console.log(result) // Output: 12
```

### Error Handling

```ts
import { createPipe } from '@deviltea/tiny-pipe'

createPipe()
	.pipeSafely(() => {
		throw new Error('Oops!')
	})
	.pipe((result) => {
		if (result.status === 'error') {
			console.error(result.reason)
		}
		else {
			console.log(result.value)
		}
	})
	.execute()
```

## Development

### Scripts
- `pnpm build`: Build the library.
- `pnpm dev`: Start development mode.
- `pnpm lint`: Lint the code.
- `pnpm test`: Run the test suite with Vitest.

## Contributing

Feel free to open an issue or submit a pull request if you find any bugs or have suggestions for improvements.

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

import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import { createPipe } from '../src/index'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

describe('sync pipe', () => {
	it('should pass through handlers by executing directly', () => {
		const handlers = Array.from({ length: 5 }, (_, i) => vi.fn((value: number) => value + (i + 1)))

		const result = createPipe()
			.pipe(handlers[0]!)
			.pipe(handlers[1]!)
			.pipe(handlers[2]!)
			.pipe(handlers[3]!)
			.pipe(handlers[4]!)
			.execute(0)

		expect(result).toBe(15)
		handlers.forEach(
			handler => expect(handler).toBeCalledTimes(1),
		)
	})

	it('should pass through handlers by executing executable function', () => {
		const handlers = Array.from({ length: 5 }, (_, i) => vi.fn((value: number) => value + (i + 1)))

		const theFn = createPipe()
			.pipe(handlers[0]!)
			.pipe(handlers[1]!)
			.pipe(handlers[2]!)
			.pipe(handlers[3]!)
			.pipe(handlers[4]!)
			.execute

		expect(theFn(0)).toBe(15)
		handlers.forEach(
			handler => expect(handler).toBeCalledTimes(1),
		)
	})

	it('should not pass through handlers after throwing error', () => {
		const handlers = Array.from({ length: 5 }, (_, i) => vi.fn((value: number) => value + (i + 1)))
		expect(() => {
			createPipe()
				.pipe((_: number): number => {
					throw new Error('error')
				})
				.pipe(handlers[0]!)
				.pipe(handlers[1]!)
				.pipe(handlers[2]!)
				.pipe(handlers[3]!)
				.pipe(handlers[4]!)
				.execute(0)
		}).toThrowError()
		handlers.forEach(
			handler => expect(handler).not.toBeCalled(),
		)
	})

	it('should handle error automatically', () => {
		createPipe()
			.pipeSafely(() => {
				throw new Error('error')
				// @ts-expect-error for type correctness
				return 0
			})
			.pipe((data) => {
				expect(data.status).toBe('error')
				if (data.status === 'error') {
					expect(data.reason).toBeInstanceOf(Error)
					expectTypeOf(data).not.toHaveProperty('value')
				}
			})
			.pipeSafely(() => {
				return 0
			})
			.pipe((data) => {
				expect(data.status).toBe('success')
				if (data.status === 'success') {
					expect(data.value).toBe(0)
					expectTypeOf(data.value).toBeNumber()
					expectTypeOf(data).not.toHaveProperty('reason')
				}
			})
			.execute()
	})
})

describe('async pipe', () => {
	it('should pass through handlers by executing directly', async () => {
		const handlers = Array.from({ length: 5 }, (_, i) => vi.fn(async (value: number) => value + (i + 1)))

		const result = await createPipe()
			.pipe(handlers[0]!)
			.pipeAwaited(handlers[1]!)
			.pipeAwaited(handlers[2]!)
			.pipeAwaited(handlers[3]!)
			.pipeAwaited(handlers[4]!)
			.execute(0)

		expect(result).toBe(15)
		handlers.forEach(
			handler => expect(handler).toBeCalledTimes(1),
		)
	})

	it('should pass through handlers by executing executable function', async () => {
		const handlers = Array.from({ length: 5 }, (_, i) => vi.fn(async (value: number) => value + (i + 1)))

		const theFn = createPipe()
			.pipe(handlers[0]!)
			.pipeAwaited(handlers[1]!)
			.pipeAwaited(handlers[2]!)
			.pipeAwaited(handlers[3]!)
			.pipeAwaited(handlers[4]!)
			.execute

		expect(await theFn(0)).toBe(15)
		handlers.forEach(
			handler => expect(handler).toBeCalledTimes(1),
		)
	})

	it('should not pass through handlers after throwing error', async () => {
		const handlers = Array.from({ length: 5 }, (_, i) => vi.fn(async (value: number) => value + (i + 1)))
		await expect(async () => {
			await createPipe()
				.pipe(async (_: number) => {
					throw new Error('error')
					// @ts-expect-error for type correctness
					return 0
				})
				.pipeAwaited(handlers[0]!)
				.pipeAwaited(handlers[1]!)
				.pipeAwaited(handlers[2]!)
				.pipeAwaited(handlers[3]!)
				.pipeAwaited(handlers[4]!)
				.execute(0)
		}).rejects.toThrowError()
		handlers.forEach(
			handler => expect(handler).not.toBeCalled(),
		)
	})

	it('should execute async handlers in order and pass success value to next handler', async () => {
		let order = 0
		await createPipe()
			.pipe(async () => {
				await delay(500)
				expect(order++).toBe(0)
				return 0
			})
			.pipeAwaited(async (value) => {
				expectTypeOf(value).toBeNumber()
				await delay(300)
				expect(order++).toBe(1)
				return 0
			})
			.pipeAwaited(async (value) => {
				expectTypeOf(value).toBeNumber()
				await delay(100)
				expect(order++).toBe(2)
				return 0
			})
			.execute()
	})

	it('should handle error automatically', async () => {
		await createPipe()
			.pipeAwaitedSafely(async () => {
				await delay(500)
				throw new Error('error')
				// @ts-expect-error for type correctness
				return 0
			})
			.pipeAwaitedSafely((data) => {
				expect(data.status).toBe('error')
				if (data.status === 'error') {
					expect(data.reason).toBeInstanceOf(Error)
					expectTypeOf(data).not.toHaveProperty('value')
				}
			})
			.pipeAwaitedSafely(async () => {
				await delay(300)
				return 0
			})
			.pipeAwaitedSafely((data) => {
				expect(data.status).toBe('success')
				if (data.status === 'success') {
					expect(data.value).toBe(0)
					expectTypeOf(data.value).toBeNumber()
					expectTypeOf(data).not.toHaveProperty('reason')
				}
			})
			.execute()
	})
})

describe('mixed pipe', () => {
	it('should keep indeterminate type of executable function', async () => {
		const theFn = createPipe()
			.pipe(() => {
				if (Math.random() > 0.5)
					return 0

				return Promise.resolve(0)
			})
			.execute

		expectTypeOf(theFn()).toEqualTypeOf<Promise<number> | number>()
	})
})

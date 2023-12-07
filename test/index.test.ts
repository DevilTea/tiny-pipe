import { assertType, describe, expect, expectTypeOf, it, vi } from 'vitest'
import { createPipe, createPipeWith } from '../src/index'

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
			.getExecutable()

		expect(theFn(0)).toBe(15)
		handlers.forEach(
			handler => expect(handler).toBeCalledTimes(1),
		)
	})

	it('should not pass through handlers after throwing error', () => {
		const handlers = Array.from({ length: 5 }, (_, i) => vi.fn((value: number) => value + (i + 1)))
		expect(() => {
			createPipe()
				.pipe((_: number) => {
					throw new Error('error')
					// @ts-expect-error for type correctness
					return 0
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
			.pipeSafe(() => {
				throw new Error('error')
				// @ts-expect-error for type correctness
				return 0
			})
			.pipe((data) => {
				expect(data.status).toBe('rejected')
				if (data.status === 'rejected') {
					expect(data.reason).toBeInstanceOf(Error)
					expectTypeOf(data).not.toHaveProperty('result')
				}
			})
			.pipeSafe(() => {
				return 0
			})
			.pipe((data) => {
				expect(data.status).toBe('resolved')
				if (data.status === 'resolved') {
					expect(data.result).toBe(0)
					expectTypeOf(data.result).toBeNumber()
					expectTypeOf(data).not.toHaveProperty('reason')
				}
			})
			.execute()
	})

	it('should pass a value to next handler', () => {
		const result = createPipeWith(0)
			.pipe((value) => {
				expect(value).toBe(0)
				expectTypeOf(value).toBeNumber()
				return value + 1
			})
			.execute()

		expect(result).toBe(1)
	})
})

describe('async pipe', () => {
	it('should pass through handlers by executing directly', async () => {
		const handlers = Array.from({ length: 5 }, (_, i) => vi.fn(async (value: number) => value + (i + 1)))

		const result = await createPipe()
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

	it('should pass through handlers by executing executable function', async () => {
		const handlers = Array.from({ length: 5 }, (_, i) => vi.fn(async (value: number) => value + (i + 1)))

		const theFn = createPipe()
			.pipe(handlers[0]!)
			.pipe(handlers[1]!)
			.pipe(handlers[2]!)
			.pipe(handlers[3]!)
			.pipe(handlers[4]!)
			.getExecutable()

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
				.pipe(handlers[0]!)
				.pipe(handlers[1]!)
				.pipe(handlers[2]!)
				.pipe(handlers[3]!)
				.pipe(handlers[4]!)
				.execute(0)
		}).rejects.toThrowError()
		handlers.forEach(
			handler => expect(handler).not.toBeCalled(),
		)
	})

	it('should execute async handlers in order and pass resolved value to next handler', async () => {
		let order = 0
		await createPipe()
			.pipe(async () => {
				await delay(500)
				expect(order++).toBe(0)
				return 0
			})
			.pipe(async (value) => {
				expectTypeOf(value).toBeNumber()
				await delay(300)
				expect(order++).toBe(1)
				return 0
			})
			.pipe(async (value) => {
				expectTypeOf(value).toBeNumber()
				await delay(100)
				expect(order++).toBe(2)
				return 0
			})
			.execute()
	})

	it('should handle error automatically', async () => {
		await createPipe()
			.pipeSafe(async () => {
				await delay(500)
				throw new Error('error')
				// @ts-expect-error for type correctness
				return 0
			})
			.pipe((data) => {
				expect(data.status).toBe('rejected')
				if (data.status === 'rejected') {
					expect(data.reason).toBeInstanceOf(Error)
					expectTypeOf(data).not.toHaveProperty('result')
				}
			})
			.pipeSafe(async () => {
				await delay(300)
				return 0
			})
			.pipe((data) => {
				expect(data.status).toBe('resolved')
				if (data.status === 'resolved') {
					expect(data.result).toBe(0)
					expectTypeOf(data.result).toBeNumber()
					expectTypeOf(data).not.toHaveProperty('reason')
				}
			})
			.execute()
	})

	it('should pass a value to next handler', async () => {
		const result = await createPipeWith(Promise.resolve(0))
			.pipe((value) => {
				expect(value).toBe(0)
				expectTypeOf(value).toBeNumber()
				return value + 1
			})
			.execute()

		expect(result).toBe(1)
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
			.getExecutable()

		expectTypeOf(theFn()).toEqualTypeOf<Promise<number> | number>()
	})
})

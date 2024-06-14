type AnyFn = (...args: any[]) => any
type ToSafelyResult<Value> =
	| { status: 'success', value: Value }
	| { status: 'error', reason: any }
type ToSafelyFn<Fn extends AnyFn> = (...args: Parameters<Fn>) => ToSafelyResult<ReturnType<Fn>>
type ToAwaitedFn<Fn extends AnyFn> = (...args: Parameters<Fn>) => Promise<Awaited<ReturnType<Fn>>>
type ToAwaitedSafelyFn<Fn extends AnyFn> = (...args: Parameters<Fn>) => Promise<ToSafelyResult<Awaited<ReturnType<Fn>>>>

interface Pipe<
	FirstFn extends AnyFn,
	LastFn extends AnyFn,
> {
	pipe: <Fn extends (...args: [Awaited<ReturnType<LastFn>>]) => any>(fn: Fn) => Pipe<FirstFn, ReturnType<Fn> extends Promise<any> ? ToAwaitedFn<Fn> : Fn>
	pipeSafely: <Fn extends (...args: [Awaited<ReturnType<LastFn>>]) => any>(fn: Fn) => Pipe<FirstFn, ReturnType<Fn> extends Promise<any> ? ToAwaitedSafelyFn<Fn> : ToSafelyFn<Fn>>
	execute: (...args: Parameters<FirstFn>) => ReturnType<LastFn>
}

function pipe<M extends keyof Omit<Pipe<AnyFn, AnyFn>, 'exec'>>(method: M, fn: AnyFn, last: AnyFn | undefined): Pipe<AnyFn, AnyFn> {
	const execute = (() => {
		if (method === 'pipe') {
			if (last == null)
				return fn

			return (x: any) => {
				const lastResult = last(x)
				if (lastResult instanceof Promise)
					return lastResult.then(fn)
				return fn(lastResult)
			}
		}
		if (method === 'pipeSafely') {
			const wrapped = (x: any) => {
				try {
					const result = fn(x)
					if (result instanceof Promise) {
						return result
							.then(value => ({ status: 'success', value }))
							.catch(reason => ({ status: 'error', reason }))
					}
					return { status: 'success', value: fn(x) }
				}
				catch (reason) {
					return { status: 'error', reason }
				}
			}

			if (last == null)
				return wrapped

			return (x: any) => {
				const lastResult = last(x)
				if (lastResult instanceof Promise)
					return lastResult.then(wrapped)
				return wrapped(lastResult)
			}
		}

		throw new Error('Invalid method')
	})() as AnyFn
	return {
		pipe: (fn: AnyFn) => pipe('pipe', fn, execute),
		pipeSafely: (fn: AnyFn) => pipe('pipeSafely', fn, execute),
		execute,
	}
}

export function createPipe() {
	return {
		pipe: <Fn extends AnyFn>(fn: Fn): Pipe<Fn, ReturnType<Fn> extends Promise<any> ? ToAwaitedFn<Fn> : Fn> => pipe('pipe', fn, undefined),
		pipeSafely: <Fn extends AnyFn>(fn: Fn): Pipe<Fn, ReturnType<Fn> extends Promise<any> ? ToAwaitedSafelyFn<Fn> : ToSafelyFn<Fn>> => pipe('pipeSafely', fn, undefined),
	} satisfies Omit<Pipe<AnyFn, AnyFn>, 'execute'>
}

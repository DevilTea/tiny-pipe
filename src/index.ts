type AnyFn = (...args: any[]) => any
type ToSafelyResult<Value> =
	| { status: 'success', value: Value }
	| { status: 'error', reason: any }
type ToSafelyFn<Fn extends AnyFn> = (...args: Parameters<Fn>) => ToSafelyResult<ReturnType<Fn>>
type ToAwaitedFn<Fn extends AnyFn> = (...args: Parameters<Fn>) => Promise<Awaited<ReturnType<Fn>>>
type ToAwaitedSafelyFn<Fn extends AnyFn> = (...args: Parameters<Fn>) => Promise<ToSafelyResult<Awaited<ReturnType<Fn>>>>

type Pipe<
	FirstFn extends AnyFn,
	LastFn extends AnyFn,
> = Omit<
	{
		pipe: <Fn extends (...args: [ReturnType<LastFn>]) => any>(fn: Fn) => Pipe<FirstFn, Fn>
		pipeSafely: <Fn extends (...args: [ReturnType<LastFn>]) => any>(fn: Fn) => Pipe<FirstFn, ToSafelyFn<Fn>>
		pipeAwaited: <Fn extends (...args: [Awaited<ReturnType<LastFn>>]) => any>(fn: Fn) => Pipe<FirstFn, ToAwaitedFn<Fn>>
		pipeAwaitedSafely: <Fn extends (...args: [Awaited<ReturnType<LastFn>>]) => any>(fn: Fn) => Pipe<FirstFn, ToAwaitedSafelyFn<Fn>>
		execute: (...args: Parameters<FirstFn>) => ReturnType<LastFn>
	},
	| ((ReturnType<LastFn> extends Promise<any> ? true : false) extends false ? 'pipeAwaited' | 'pipeAwaitedSafely' : never)
>

function pipe<M extends keyof Omit<Pipe<AnyFn, AnyFn>, 'exec'>>(method: M, fn: AnyFn, last: AnyFn | undefined): Pipe<AnyFn, AnyFn> {
	const execute = (() => {
		if (method === 'pipe')
			return last == null ? fn : (x: any) => fn(last(x))

		if (method === 'pipeSafely') {
			const wrapped = (x: any) => {
				try {
					return { status: 'success', value: fn(x) }
				}
				catch (reason) {
					return { status: 'error', reason }
				}
			}
			return last == null
				? wrapped
				: (x: any) => wrapped(last(x))
		}

		if (method === 'pipeAwaited')
			return async (x: any) => fn(await last!(x))

		if (method === 'pipeAwaitedSafely') {
			const wrapped = async (x: any) => {
				try {
					return { status: 'success', value: await fn(x) }
				}
				catch (reason) {
					return { status: 'error', reason }
				}
			}
			return last == null
				? wrapped
				: async (x: any) => wrapped(await last!(x))
		}

		throw new Error('Invalid method')
	})() as AnyFn
	return {
		pipe: (fn: AnyFn) => pipe('pipe', fn, execute),
		pipeSafely: (fn: AnyFn) => pipe('pipeSafely', fn, execute),
		pipeAwaited: (fn: AnyFn) => pipe('pipeAwaited', fn, execute),
		pipeAwaitedSafely: (fn: AnyFn) => pipe('pipeAwaitedSafely', fn, execute),
		execute,
	}
}

export function createPipe() {
	return {
		pipe: <Fn extends AnyFn>(fn: Fn): Pipe<Fn, Fn> => pipe('pipe', fn, undefined),
		pipeSafely: <Fn extends AnyFn>(fn: Fn): Pipe<Fn, ToSafelyFn<Fn>> => pipe('pipeSafely', fn, undefined),
		pipeAwaited: <Fn extends AnyFn>(fn: Fn): Pipe<Fn, ToAwaitedFn<Fn>> => pipe('pipeAwaited', fn, undefined),
		pipeAwaitedSafely: <Fn extends AnyFn>(fn: Fn): Pipe<Fn, ToAwaitedSafelyFn<Fn>> => pipe('pipeAwaitedSafely', fn, undefined),
	} satisfies Omit<Pipe<AnyFn, AnyFn>, 'execute'>
}

type AnyFn = (...args: any[]) => any
type SafeReturnType<Fn extends AnyFn> =
	| { status: 'success', value: ReturnType<Fn> }
	| { status: 'error', reason: any }
type ToSafeFn<Fn extends AnyFn> = (...args: Parameters<Fn>) => SafeReturnType<Fn>
type ToAwaitedFn<Fn extends AnyFn> = (...args: Parameters<Fn>) => Promise<Awaited<ReturnType<Fn>>>

type Pipe<
	FirstFn extends AnyFn,
	LastFn extends AnyFn,
> = Omit<
	{
		pipe: <Fn extends (...args: [ReturnType<LastFn>]) => any>(fn: Fn) => Pipe<FirstFn, Fn>
		pipeSafely: <Fn extends (...args: [ReturnType<LastFn>]) => any>(fn: Fn) => Pipe<FirstFn, ToSafeFn<Fn>>
		pipeAwaited: <Fn extends (...args: [Awaited<ReturnType<LastFn>>]) => any>(fn: Fn) => Pipe<FirstFn, ToAwaitedFn<Fn>>
		pipeAwaitedSafely: <Fn extends (...args: [Awaited<ReturnType<LastFn>>]) => any>(fn: Fn) => Pipe<FirstFn, ToAwaitedFn<ToSafeFn<Fn>>>
		exec: (...args: Parameters<FirstFn>) => ReturnType<LastFn>
	},
	| ((ReturnType<LastFn> extends Promise<any> ? true : false) extends false ? 'pipeAwaited' | 'pipeAwaitedSafely' : never)
>

function pipe<M extends keyof Omit<Pipe<AnyFn, AnyFn>, 'exec'>>(method: M, fn: AnyFn, last: (M extends 'pipe' | 'pipeSafely' ? undefined : never) | AnyFn): Pipe<AnyFn, AnyFn> {
	const exec = (() => {
		if (method === 'pipe')
			return last == null ? fn : (x: any) => fn(last(x))

		if (method === 'pipeSafely') {
			return last == null
				? fn
				: (x: any) => {
						try {
							const result = fn(last(x))
							return { status: 'success', value: result }
						}
						catch (reason) {
							return { status: 'error', reason }
						}
					}
		}

		if (method === 'pipeAwaited')
			return async (x: any) => fn(await last!(x))

		if (method === 'pipeAwaitedSafely') {
			return async (x: any) => {
				try {
					const result = await last!(x)
					return { status: 'success', value: await fn(result) }
				}
				catch (reason) {
					return { status: 'error', reason }
				}
			}
		}

		throw new Error('Invalid method')
	})() as AnyFn
	return {
		pipe: (fn: AnyFn) => pipe('pipe', fn, exec),
		pipeSafely: (fn: AnyFn) => pipe('pipeSafely', fn, exec),
		pipeAwaited: (fn: AnyFn) => pipe('pipeAwaited', fn, exec),
		pipeAwaitedSafely: (fn: AnyFn) => pipe('pipeAwaitedSafely', fn, exec),
		exec,
	}
}

export function createPipe() {
	return {
		pipe: <Fn extends AnyFn>(fn: Fn): Pipe<Fn, Fn> => pipe('pipe', fn, undefined),
		pipeSafely: <Fn extends AnyFn>(fn: Fn): Pipe<Fn, Fn> => pipe('pipeSafely', fn, undefined),
	} satisfies Pick<Pipe<AnyFn, AnyFn>, 'pipe' | 'pipeSafely'>
}

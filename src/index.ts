type IsNever<T> = [T] extends [never] ? true : false
type AnyFn = (...params: any[]) => any
type MaybePromise<T = any> = T | Promise<T extends infer TT ? TT : never>
type AwaitedReturnType<Fn extends AnyFn> = Awaited<ReturnType<Fn>>
type IsAsyncFn<Fn extends AnyFn> = ReturnType<Fn> extends infer T
	? (T extends Promise<any> ? true : false)
	: never

type ConditionalType<Condition extends boolean, True, False, _Boolean> = Condition extends true ? True : Condition extends false ? False : _Boolean
type SafePipeData<Result, Reason> = { status: 'resolved', result: Result } | { status: 'rejected', reason: Reason }
type ToSafePipeHandler<
    Fn extends AnyFn,
    Reason = unknown,
    ReturnData extends SafePipeData<AwaitedReturnType<Fn>, Reason> = SafePipeData<AwaitedReturnType<Fn>, Reason>,
> = (...params: Parameters<Fn>) => ConditionalType<
    IsAsyncFn<Fn>,
    Promise<ReturnData>,
    ReturnData,
    MaybePromise<ReturnData>
>

type PipeHandler<Last extends PipeHandler = never> = (...params: IsNever<Last> extends true ? [any?] : (IsNever<AwaitedReturnType<Last>> extends true ? [void] : [AwaitedReturnType<Last>])) => any
type ReturnedPipeBuilder<
    First extends PipeHandler,
    HasAsync extends boolean,
    Fn extends AnyFn,
> = PipeBuilder<
    IsNever<First> extends true ? Fn : First,
    Fn,
    HasAsync extends true ? true : IsAsyncFn<Fn>
>

class PipeBuilder<
    First extends PipeHandler = never,
    Last extends PipeHandler = never,
    HasAsync extends boolean = false,
> {
	private _fnList: AnyFn[] = []

	static _createSafePipeData(status: 'resolved' | 'rejected', data: any) {
		return status === 'resolved'
			? { status, result: data }
			: { status, reason: data }
	}

	/**
	 * Add a handler to the pipe
	 */
	pipe<Handler extends PipeHandler<Last>>(handler: Handler) {
		this._fnList.push((inputPromiseOrValue: any) => {
			return inputPromiseOrValue instanceof Promise
				? inputPromiseOrValue.then(value => handler(value))
				: handler(inputPromiseOrValue)
		})
		return this as ReturnedPipeBuilder<First, HasAsync, Handler>
	}

	/**
	 * Add a handler to the pipe, and handle the error automatically
	 */
	pipeSafe<Reason, Handler extends PipeHandler<Last> = PipeHandler<Last>>(handler: Handler) {
		this._fnList.push((inputPromiseOrValue: any) => {
			try {
				const outputPromiseOrValue = inputPromiseOrValue instanceof Promise
					? inputPromiseOrValue.then(value => handler(value))
					: handler(inputPromiseOrValue)

				return outputPromiseOrValue instanceof Promise
					? outputPromiseOrValue
						.then(result => PipeBuilder._createSafePipeData('resolved', result))
						.catch(reason => PipeBuilder._createSafePipeData('rejected', reason))
					: PipeBuilder._createSafePipeData('resolved', outputPromiseOrValue)
			}
			catch (reason) {
				return PipeBuilder._createSafePipeData('rejected', reason)
			}
		})
		return this as ReturnedPipeBuilder<First, HasAsync, ToSafePipeHandler<Handler, Reason>>
	}

	/**
	 * Get the executable function of the pipe
	 */
	getExecutable() {
		return (...params: Parameters<First>): HasAsync extends true ? Promise<AwaitedReturnType<Last>> : ReturnType<Last> => [...this._fnList].reduce((v, f) => f(v), params[0])
	}

	/**
	 * Execute the pipe
	 */
	execute(...params: Parameters<First>) {
		return this.getExecutable()(...params)
	}
}

/**
 * Start to create a pipe
 */
export function createPipe() {
	return new PipeBuilder()
}

/**
 * Start to create a pipe with a value
 */
export function createPipeWith<T>(value: T) {
	return createPipe().pipe(() => value)
}

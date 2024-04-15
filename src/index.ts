type AnyFn = (...params: any[]) => any
type MaybePromise<T = any> = T | Promise<T>
type AwaitedReturnType<Fn extends AnyFn> = Awaited<ReturnType<Fn>>
type IsAsyncFn<Fn extends AnyFn> = ReturnType<Fn> extends infer T
	? (T extends Promise<any> ? true : false)
	: never
type IfTrue<T extends boolean, Then, Else> = T extends true ? Then : Else
type IfFalse<T extends boolean, Then, Else> = T extends false ? Then : Else
type ConditionalType<Condition extends boolean, True, False, _Boolean> = IfTrue<
	Condition,
	True,
	IfFalse<
		Condition,
		False,
		_Boolean
	>
>
type IsNever<T> = [T] extends [never] ? true : false

type SafeWrappedData<Result, Reason> = { status: 'resolved', result: Result } | { status: 'rejected', reason: Reason }
type ToSafePipeHandler<
	Fn extends AnyFn,
	Reason = unknown,
	ReturnData extends SafeWrappedData<AwaitedReturnType<Fn>, Reason> = SafeWrappedData<AwaitedReturnType<Fn>, Reason>,
> = (...params: Parameters<Fn>) => ConditionalType<
	IsAsyncFn<Fn>,
	Promise<ReturnData>,
	ReturnData,
	MaybePromise<ReturnData>
>

type PipeHandlerParams<Last extends PipeHandler> = IfTrue<
	IsNever<Last>,
	[any?],
	IfTrue<
		IsNever<AwaitedReturnType<Last>>,
		[void],
		[AwaitedReturnType<Last>]
	>
>
type PipeHandler<Last extends PipeHandler = never> = (...params: PipeHandlerParams<Last>) => any
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

	private static _createSafePipeData(status: 'resolved' | 'rejected', data: any) {
		return status === 'resolved'
			? { status, result: data }
			: { status, reason: data }
	}

	private static _invokeHandler<Last extends PipeHandler, Handler extends PipeHandler<Last>>(handler: Handler, promiseOrValue: any) {
		return promiseOrValue instanceof Promise
			? promiseOrValue.then(value => handler(value))
			: handler(promiseOrValue)
	}

	/**
	 * Add a handler to the pipe
	 */
	pipe<Handler extends PipeHandler<Last>>(handler: Handler) {
		this._fnList.push((promiseOrValue: any) => {
			return PipeBuilder._invokeHandler(handler, promiseOrValue)
		})

		type ReturnedBuilder = ReturnedPipeBuilder<First, HasAsync, Handler>
		return this as ReturnedBuilder
	}

	/**
	 * Add a handler to the pipe, and handle the error automatically
	 */
	pipeSafe<Reason, Handler extends PipeHandler<Last> = PipeHandler<Last>>(handler: Handler) {
		this._fnList.push((promiseOrValue: any) => {
			try {
				const unsafeResult = PipeBuilder._invokeHandler(handler, promiseOrValue)
				return unsafeResult instanceof Promise
					? unsafeResult
						.then(result => PipeBuilder._createSafePipeData('resolved', result))
						.catch(reason => PipeBuilder._createSafePipeData('rejected', reason))
					: PipeBuilder._createSafePipeData('resolved', unsafeResult)
			}
			catch (reason) {
				return PipeBuilder._createSafePipeData('rejected', reason)
			}
		})

		type ReturnedBuilder = ReturnedPipeBuilder<First, HasAsync, ToSafePipeHandler<Handler, Reason>>
		return this as ReturnedBuilder
	}

	/**
	 * The executable function of the pipe
	 */
	get execute() {
		type Fn = (...params: Parameters<First>) => HasAsync extends true
			? Promise<AwaitedReturnType<Last>>
			: ReturnType<Last>

		return ((...params: any) => {
			let result: any
			for (let i = 0; i < this._fnList.length; i++) {
				const fn = this._fnList[i]!
				result = i === 0
					? fn(...params)
					: fn(result)
			}
			return result
		}) as Fn
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

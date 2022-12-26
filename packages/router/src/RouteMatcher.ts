/* eslint-disable @typescript-eslint/ban-types */
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import * as Layer from '@effect/io/Layer'
import { pipe } from '@fp-ts/data/Function'
import * as Option from '@fp-ts/data/Option'
import * as Context from '@typed/context'
import * as Fx from '@typed/fx'
import * as html from '@typed/html'
import * as Path from '@typed/path'
import * as Route from '@typed/route'

import { RouteMatch } from './RouteMatch.js'
import { currentPath, Redirect, redirectTo, Router } from './router.js'

export interface RouteMatcher<R = never, E = never> {
  // Where things are actually stored immutably
  readonly routes: ReadonlyMap<Route.Route<any, any>, RouteMatch<any, any, any>>

  // Add Routes

  readonly match: <R2, P extends string, R3, E3>(
    route: Route.Route<R2, P>,
    f: (params: Path.ParamsOf<P>) => Fx.Fx<R3, E3, html.Renderable>,
  ) => RouteMatcher<R | R2, E | E3>

  readonly matchFx: <R2, P extends string, R3, E3>(
    route: Route.Route<R2, P>,
    f: (params: Fx.Fx<never, never, Path.ParamsOf<P>>) => Fx.Fx<R3, E3, html.Renderable>,
  ) => RouteMatcher<R | R2, E | E3>

  readonly matchEffect: <R2, P extends string, R3, E3>(
    route: Route.Route<R2, P>,
    f: (params: Path.ParamsOf<P>) => Effect.Effect<R3, E3, html.Renderable>,
  ) => RouteMatcher<R | R2, E | E3>

  // Add Layout

  readonly withLayout: <R2, E2>(fx: Fx.Fx<R2, E2, html.Renderable>) => RouteMatcher<R | R2, E | E2>

  // Provide resources

  readonly provideEnvironment: <R2>(
    environment: Context.Context<R2>,
  ) => RouteMatcher<Exclude<R, R2>, E>

  readonly provideService: <R2>(
    tag: Context.Tag<R2>,
    service: R2,
  ) => RouteMatcher<Exclude<R, R2>, E>

  readonly provideLayer: <R2, S>(
    layer: Layer.Layer<R2, never, S>,
  ) => RouteMatcher<Exclude<R, S> | R2, E>

  // Runners that turn a RouterMatcher back into an Fx.
  // Error handling should be handled after converting to an Fx for maximum flexibility.

  readonly notFound: <R2, E2, R3 = never, E3 = never>(
    f: (path: string) => Fx.Fx<R2, E2, html.Renderable>,
    options?: FallbackOptions<R3, E3>,
  ) => Fx.Fx<Router | R | R2 | R3, Exclude<E | E2 | E3, Redirect>, html.Renderable>

  readonly notFoundEffect: <R2, E2, R3 = never, E3 = never>(
    f: (path: string) => Effect.Effect<R2, E2, html.Renderable>,
    options?: FallbackOptions<R3, E3>,
  ) => Fx.Fx<Router | R | R2 | R3, Exclude<E | E2 | E3, Redirect>, html.Renderable>

  readonly redirectTo: <R2, P extends string>(
    route: Route.Route<R2, P>,
    ...params: [keyof Path.ParamsOf<P>] extends [never]
      ? // eslint-disable-next-line @typescript-eslint/ban-types
        [{}?]
      : [(path: string) => Path.ParamsOf<P>]
  ) => Fx.Fx<Router | R | R2, Exclude<E, Redirect>, html.Renderable>

  /**
   * @internal
   */
  readonly run: Fx.Fx<Router | R, Exclude<E, Redirect>, html.Renderable | null>
}

export interface FallbackOptions<R, E> {
  readonly layout?: Fx.Fx<R, E, html.Renderable>
}

export function RouteMatcher<R, E>(routes: RouteMatcher<R, E>['routes']): RouteMatcher<R, E> {
  const matcher: RouteMatcher<R, E> = {
    routes,
    matchFx: (route, f) => RouteMatcher(new Map(routes).set(route, RouteMatch(route, f))),
    match: (route, f) =>
      RouteMatcher(new Map(routes).set(route, RouteMatch(route, Fx.switchMap(f)))),
    matchEffect: (route, f) =>
      RouteMatcher(new Map(routes).set(route, RouteMatch(route, Fx.switchMapEffect(f)))),
    withLayout: (layout) =>
      RouteMatcher(
        new Map(
          Array.from(routes).map(([k, match]) => [
            k,
            RouteMatch(match.route, match.match, match.layout ?? layout),
          ]),
        ),
      ),
    provideEnvironment: (environment) =>
      RouteMatcher(
        new Map(Array.from(routes).map(([k, v]) => [k, v.provideEnvironment(environment)])),
      ),
    provideService: (tag, service) =>
      RouteMatcher(
        new Map(Array.from(routes).map(([k, v]) => [k, v.provideService(tag, service)])),
      ),
    provideLayer: (layer) =>
      RouteMatcher(new Map(Array.from(routes).map(([k, v]) => [k, v.provideLayer(layer)]))),
    notFound: <R2, E2, R3, E3>(
      f: (path: string) => Fx.Fx<R2, E2, html.Renderable>,
      options?: FallbackOptions<R3, E3>,
    ) =>
      Router.withFx((router) => {
        // Create stable references to the route matchers
        const matchers = Array.from(routes.values()).map(
          (v) => [v, runRouteMatch(router, v)] as const,
        )

        const renderFallback = pipe(currentPath, Fx.switchMap(f))
        const fallbackMatch = RouteMatch(Route.base, () => renderFallback, options?.layout)

        let previousFiber: Fiber.RuntimeFiber<any, any> | undefined
        let previousLayout: Fx.Fx<any, any, html.Renderable> | undefined
        let previousRender: Fx.Fx<any, any, html.Renderable> | undefined

        const samplePreviousValues = () => ({
          fiber: previousFiber,
          layout: previousLayout,
          render: previousRender,
        })

        // This function helps us to ensure shared layouts are only rendered once
        // and the outlet content is changed
        const verifyShouldRerender = (
          match: RouteMatch<any, any, any>,
          render: Fx.Fx<any, any, html.Renderable>,
        ): Effect.Effect<any, any, Option.Option<Fx.Fx<any, any, html.Renderable>>> =>
          Effect.gen(function* ($) {
            const previous = samplePreviousValues()

            // Update the previous values
            previousRender = render
            previousLayout = match.layout
            previousFiber = undefined

            // Skip rerendering if the render function is the same
            if (previous.render === render) {
              return Option.none
            }

            // Interrupt the previous fiber if it exists
            if (previous.fiber) {
              yield* $(Fiber.interrupt(previous.fiber))
            }

            // If we have a layout, we need to render it and use the route outlet.
            if (match.layout) {
              // Render into the route outlet
              previousFiber = yield* $(
                pipe(render, Fx.observe(router.outlet.set), Effect.forkScoped),
              )

              return Option.some(match.layout)
            }

            // If we don't have a layout, but we did, we need to clear the outlet
            if (previous.layout) {
              yield* $(router.outlet.set(null))
            }

            // Otherwise use the render function directly
            return Option.some(render)
          })

        return pipe(
          router.currentPath,
          Fx.skipRepeats,
          Fx.switchMapEffect((path) =>
            Effect.gen(function* ($) {
              // Attempt to find the best match
              for (const [match, render] of matchers) {
                const result = yield* $(match.route.match(path))

                if (Option.isSome(result)) {
                  return yield* $(verifyShouldRerender(match, render))
                }
              }

              // If we didn't find a match, render the not found page
              return yield* $(verifyShouldRerender(fallbackMatch, renderFallback))
            }),
          ),
          Fx.compact,
          Fx.skipRepeats, // Stable render references are used to avoid mounting the same component twice
          Fx.switchLatest,
          Fx.switchMapError((error) => {
            // Intercept redirect requests and update the router
            if (Redirect.is(error)) {
              return pipe(
                router.currentPath.set(error.path),
                Fx.fromEffect,
                Fx.flatMap(() => Fx.never),
              )
            }

            return Fx.fail(error as Exclude<E | E2, Redirect>)
          }),
        )
      }),
    notFoundEffect: (f) => matcher.notFound((path) => Fx.fromEffect(f(path))),
    redirectTo: ((route, ...params) =>
      matcher.notFound(() => redirectTo.fx(route, ...params))) as RouteMatcher<R, E>['redirectTo'],
    run: Fx.suspend(() => matcher.notFoundEffect(() => Effect.succeed(null))),
  }

  return matcher
}

export namespace RouteMatcher {
  export const empty = RouteMatcher<never, never>(new Map())

  export const concat = <R, E, R2, E2>(
    matcher: RouteMatcher<R, E>,
    matcher2: RouteMatcher<R2, E2>,
  ): RouteMatcher<R | R2, E | E2> => RouteMatcher(new Map([...matcher.routes, ...matcher2.routes]))
}

export const { matchFx, match, matchEffect } = RouteMatcher<never, never>(new Map())

function runRouteMatch<R, E, P extends string>(
  router: Router,
  { route, match }: RouteMatch<R, E, P>,
): Fx.Fx<R, E, html.Renderable> {
  return Fx.gen(function* ($) {
    const env = yield* $(Effect.environment<R>())
    const nestedRouter = router.define(route)
    const params = pipe(nestedRouter.params, Fx.provideEnvironment(env))

    return pipe(
      match(params as unknown as Fx.Fx<never, never, Path.ParamsOf<P>>),
      Router.provideFx(nestedRouter as Router),
    )
  })
}

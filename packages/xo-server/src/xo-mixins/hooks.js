import createLogger from 'debug'
import emitAsync from '@xen-orchestra/emit-async'

const debug = createLogger('xo:hooks')

const makeSingletonHook = (hook, postEvent) => {
  let promise
  return function () {
    if (promise === undefined) {
      promise = runHook(this, hook)
      promise.then(() => {
        this.removeAllListeners(hook)
        this.emit(postEvent)
        this.removeAllListeners(postEvent)
      })
    }
    return promise
  }
}

const runHook = (app, hook) => {
  debug(`${hook} start…`)
  const promise = emitAsync.call(
    app,
    {
      onError: error =>
        console.error(
          `[WARN] hook ${hook} failure:`,
          (error != null && error.stack) || error
        ),
    },
    hook
  )
  promise.then(() => {
    debug(`${hook} finished`)
  })
  return promise
}

export default {
  // Run *clean* async listeners.
  //
  // They normalize existing data, clear invalid entries, etc.
  clean () {
    return runHook(this, 'clean')
  },

  // Run *start* async listeners.
  //
  // They initialize the application.
  start: makeSingletonHook('start', 'started'),

  // Run *stop* async listeners.
  //
  // They close connections, unmount file systems, save states, etc.
  stop: makeSingletonHook('stop', 'stopped'),
}

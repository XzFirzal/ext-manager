'use strict'

/**
 * A custom error for the package to throwing error.
 * @extends {Error}
 */
class ExtError extends Error {
  /**
     * @param {String} message The error message
     * @param {String} code The error code
     * @param {String} path The path of the problem
     */
  constructor (message, code, path) {
    super(`ExtError: ${message}`)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ExtError)
    }

    this.name = 'ExtError'
    this.code = `3XT${code}`
    this.message = message
    this.path = path
  }
}

module.exports = ExtError

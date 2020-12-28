class ExtError extends Error {
    constructor(message, code, path) {
        super(`ExtError: ${message}`)

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ExtError)
        }

        this.name = 'ExtError'
        this.code = `3XT${code}`
        this.message = message
        this.path - path
    }
}

module.exports = ExtError
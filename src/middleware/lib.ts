// Custom error for when the user submits a header w/ an array value, which we never expect (currently)
// You can catch this error specifically in your Fastify route and return a 400 when it's hit
export class HeaderHasArrayValueError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "HeaderHasArrayValueError";
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, HeaderHasArrayValueError);
        }
    }
}

export function disallowArrayHeaders(headers: Record<string, string | string[]>): Record<string, string> {
    const ret: Record<string, string> = {}
    for (const headerKey in headers) {
        const header = headers[headerKey]
        if (Array.isArray(header)) {
            throw new HeaderHasArrayValueError(`You passed the same authorization header more than once: ${headerKey}`)
        }
        ret[headerKey] = header
        // console.log(`headerKey: ${headerKey}, header: ${header}`)
   }
    console.log("Returning sanitized headers", ret)
    return ret
}
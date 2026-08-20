export default function getCookieOptions() {
    const cookieSecure = process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production'
    const sameSite = process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    return {
        httpOnly: true,
        secure: cookieSecure,
        sameSite,
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000
    }
}

const cookieOptions = (req) => {
    const isProduction = process.env.NODE_ENV === "production";

    return {
        httpOnly : true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path:"/",
        maxAge: 48 * 60 * 60 * 1000, // 2 hari
    }
}

export {cookieOptions}
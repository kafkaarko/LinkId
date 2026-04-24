import rateLimit from 'express-rate-limit'

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max:5, //maksimal 5 percobaan
    message:{
        status:false,
        message:"terlalu banyak percobaan, silahkan coba login lagi setelah 15 menit"
    },
    standardHeaders: true,
    legacyHeaders: false,
})

const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 15 minutes
    max:100, //maksimal 100 percobaan
    message:{
        status:false,
        message:"terlalu banyak percobaan, silahkan coba lagi nanti"
    },
    standardHeaders: true,
    legacyHeaders: false,
})

export {loginLimiter,apiLimiter}
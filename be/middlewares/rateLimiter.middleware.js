import rateLimit from 'express-rate-limit'

const loginLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 15 minutes
    max:5, //maksimal 5 percobaan
    standardHeaders: true,
    legacyHeaders: false,
     handler: (req, res) => {
    const resetTime = req.rateLimit.resetTime; // Date object
    res.status(429).json({
      status: false,
      message: "Terlalu banyak percobaan.",
      resetAt: resetTime?.getTime() ?? null, // kirim sebagai unix ms
    });
  },
})

const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minutes
    max:100, //maksimal 100 percobaan
    message:{
        status:false,
        message:"terlalu banyak percobaan, silahkan coba lagi nanti"
    },
    standardHeaders: true,
    legacyHeaders: false,
})

export {loginLimiter,apiLimiter}
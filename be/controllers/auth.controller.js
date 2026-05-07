import { prisma } from "../lib/prisma.js";
import { cookieOptions } from "../utils/cookieOptions.util.js";
import { errorResponse, successResponse } from "../utils/response.util.js";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken'

const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({
        where: {
            email
        }
    })
    if (!user) return errorResponse(res, "email tidak ada silahkan coba lagi")

    const samePassword = await bcrypt.compare(password, user.password);
    if (!samePassword) return errorResponse(res, "password salah silahkan coba lagi")

    const token = jwt.sign({ id: user.id, name: user.name, role:user.role,subscriptionUntil: user.subscriptionUntil }, process.env.JWT_SECRET, { expiresIn: "2d" })

    res.cookie("token", token, cookieOptions(req))

    return successResponse(res, "login successfuly", ({
        userId: user.id,
        name: user.name,
        email: user.email,
        token: token
    }));
    } catch (error) {
        console.log(error)
        return errorResponse(res, "coba lagi", { message: error.message });
    }

    
}

const register = async (req, res) => {
    const { name, email, password, guestIdentifier } = req.body;

    if (!name || !email || !password) {
        return errorResponse(res, "silahkan isi semua field");
    }

    const emailDB = await prisma.user.findUnique({
        where: { email }
    });

    if (emailDB) {
        return errorResponse(res, "email sudah terdaftar");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = await prisma.user.create({
            data: { name, email, password: hashedPassword }
        });

        // 🔥 MIGRASI LINK GUEST → USER
        if (guestIdentifier) {
            await prisma.link.updateMany({
                where: {
                    guestIdentifier,
                    userId: null
                },
                data: {
                    userId: user.id,
                    guestIdentifier: null
                }
            });

            console.log(`Guest ${guestIdentifier} di-bind ke user ${user.email} dengan `);
        }

        return successResponse(res, "register successfully", {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        });

    } catch (error) {
        return errorResponse(res, "coba lagi", { message: error.message });
    }
};

const logout = async (req, res) => {
    res.clearCookie("token", {
        path: "/",
        sameSite: "lax"
    })
    return successResponse(res, "logout successfully")
}

export { login, register, logout }
import { NextResponse } from "next/server";
import { signinService } from "@/services/auth.service";

export async function POST(request:Request){
    try{
        console.log("reached to API")
        const body = await request.json();

        const {user,token} = await signinService(body);

        console.log("token :", token);

        const respones = NextResponse.json({
            success: true,
            user,
        })

        respones.cookies.set("token",token,{
            httpOnly:true,
            secure: process.env.NODE_ENV === "production",
            sameSite:"strict",
            maxAge:  60*60*24*7,
            path:"/",
        });
    
        return respones;

    }catch (error) {
    console.error("Login Error:", error);

    return NextResponse.json(
        {
            message: error instanceof Error ? error.message : "Login failed"
        },
        {
            status: 400
        }
    );
}
}

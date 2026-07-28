
import { signupService } from "@/services/auth.service";
import { NextResponse } from "next/server";

export async function POST(request:Request){
    try{
      console.log('reached to signup route');
      const body = await request.json();
      const {user,token} = await signupService(body)
      
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
    }catch(error){
      console.log(error);
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
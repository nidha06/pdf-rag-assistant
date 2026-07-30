
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
      console.error("Signup failed:", error);
      const message = error instanceof Error ? error.message : "Signup failed";
      const databaseUnavailable = /can't reach database server|database.*not.*reachable/i.test(
        message
      );
      const status = databaseUnavailable
        ? 503
        : message === "User already exists"
          ? 409
          : 400;

      return NextResponse.json(
        {
          message: databaseUnavailable
            ? "The database is unavailable. Please try again shortly."
            : message,
        },
        { status }
      );
    }
}
}

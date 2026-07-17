
import { signupService } from "@/services/auth.service";
import { NextResponse } from "next/server";

export async function POST(request:Request){
    try{
      console.log('reached to signup route');
      const body = await request.json();
      const result = await signupService(body)
      
      return NextResponse.json(result);
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
import { NextResponse } from "next/server";
import { signinService } from "@/services/auth.service";

export async function POST(request:Request){
    try{
        console.log("reached to API")
        const body = await request.json();
        const result = await signinService(body);
        console.log("User details that logged in :", result)
        return NextResponse.json(result);

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
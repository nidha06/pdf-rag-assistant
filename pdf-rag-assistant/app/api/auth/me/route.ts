import { verifyToken } from "@/lib/jwt";
import { getUser } from "@/services/user.service";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";


export async function GET(){
    try{
       const cookieStore = await cookies();
       const token = cookieStore.get("token")?.value;

       if(!token){
        return NextResponse.json(null);
       }

       const decoded = verifyToken(token);
       
       const user = await getUser(decoded.id);
       console.log(user,"user")
       return NextResponse.json(user);
    }catch(error){
       return NextResponse.json(null);
    }
}
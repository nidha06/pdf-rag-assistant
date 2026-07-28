import { verifyToken } from "@/lib/jwt";
import { getUser } from "@/services/user.service";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";


export async function GET(){
    try{
       const cookieStore = await cookies();
       console.log("1")
       const token = cookieStore.get("token")?.value;
       console.log("2", token)

       if(!token){
        return NextResponse.json(null);
       }
       console.log("3")

       const decoded = verifyToken(token);
       
       const user = await getUser(decoded.id);
       console.log(user,"user")
       return NextResponse.json(user);
    }catch(error){
       return NextResponse.json(null);
    }
}
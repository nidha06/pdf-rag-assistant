import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

type signinData = {
    name: string;
    email: string;
    password:string;
}
type signupData = {
    name: string;
    email: string;
    password: string;
}
export async function signinService(data:signinData) {
    console.log("This is service section")
    const user = await prisma.user.findUnique({
        where:{
            email:data.email
        }
    })
    if(!user){
        throw new Error("User not found");
    }

    const validPassword = await bcrypt.compare(
        data.password,
        user.password
    )

    if(!validPassword){
        throw new Error("invalid password");
    }
    return{
        id: user.id,
        name: user.name,
        email: user.email
    }
}
export async function signupService(data:signupData){
    console.log("this is sighnup service");
    const hashedPassword = await bcrypt.hash(data.password,10);
    const user = await prisma.user.create({
        data:{
            name:data.name,
            email:data.email,
            password:hashedPassword,
        }
    })
}
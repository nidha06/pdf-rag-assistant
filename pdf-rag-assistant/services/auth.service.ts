import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
type signupData = {
    name: string;
    email: string;
    password: string;
}
export async function signupService(data:signupData){
    const existingUser = await prisma.user.findUnique({
        where:{
            email: data.email,
        },
    })

    if(existingUser){
        throw new Error("User already exists")
    }
    const hashedPassword = await bcrypt.hash(data.password,10);

    const user = await prisma.user.create({
        data:{
            name:data.name,
            email:data.email,
            password:hashedPassword,
        }
    });

    return{
        user:{
            id: user.id,
            name: user.name,
            email: user.email,
            avatarSeed: user.avatarSeed,
            hasDocuments: false,

        },
    }
}

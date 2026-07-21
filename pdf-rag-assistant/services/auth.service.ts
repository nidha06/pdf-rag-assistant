import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/jwt";

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

    const token = generateToken({
        id: user.id,
        email: user.email,
    })
    return{
        user:{
            id: user.id,
        name: user.name,
        email: user.email,
        },
        token,
    }
}
export async function signupService(data:signupData){
    console.log("this is sighnup service");
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

    const token = generateToken({
        id: user.id,
        email: user.email,
    });

    return{
        user:{
            id: user.id,
            name: user.name,
            email: user.email,

        },
        token,
    }
}
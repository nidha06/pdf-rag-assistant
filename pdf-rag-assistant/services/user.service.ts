import { prisma } from "@/lib/prisma";

export async function getUser(userId:string){

       const user = await prisma.user.findUnique({
        where:{
            id:userId,
        },
        select:{
            id:true,
            name:true,
            email:true,
            avatarSeed: true,
            _count: {
                select: { documents: true },
            },
        }
       })
       if (!user) return null;

       const { _count, ...userDetails } = user;
       return {
           ...userDetails,
           hasDocuments: _count.documents > 0,
       };
};

import { prisma } from "@/lib/prisma";

export async function createDocument(data: {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  status: string;
  userId: string;
}) {
  return prisma.document.create({
    data,
  });
};

export async function getDocuments(userId:string){
    return prisma.document.findMany({
        where:{
            userId
        },
        orderBy:{
            uploadedAt:"desc"
        }
    })
}
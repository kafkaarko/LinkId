import { prisma } from "./lib/prisma";
import bcrypt from "bcrypt";


async function main()
{
    const user = await prisma.user.create({
        data:{
            name:"kafka",
            email:"kafka@email.com",
            password: await bcrypt.hash('admin',10)
        }
    })
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
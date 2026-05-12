import { clickQueue } from "../lib/clickQueue.js";
import { prisma } from "../lib/prisma.js";

export const flushClicks = async () => {
  try {
    if (clickQueue.length === 0) return;


    // 🔥 COPY dulu
    const batch = clickQueue.slice(0, 100);

    await prisma.click.createMany({
      data: batch,
    });

    // 🔥 HAPUS setelah sukses DB
    clickQueue.splice(0, batch.length);

    console.log(`🎃 flushed ${batch.length} clicks`);

  } catch (error) {
    console.log(`something went wrong ${error}`);
  }
};

setInterval(flushClicks, 2000);
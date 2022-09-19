import express from "express"
import cors from "cors"
import { PrismaClient } from "@prisma/client"
import {
  convertHourToMinutes,
  convertMinutesToHour,
} from "./utils/convert-time"

const app = express()
const prisma = new PrismaClient({
  log: ["query", "error"],
})

app.use(cors()) //todo alterar valor de origin em prod
app.use(express.json())

app.get("/games", async (request, response) => {
  const games = await prisma.game.findMany({
    include: {
      _count: {
        select: {
          ads: true,
        },
      },
    },
  })
  return response.json(games)
})

app.post("/games/:id/ads", async (request, response) => {
  const gameId = request.params.id
  const body = request.body
  const ad = await prisma.ad.create({
    data: {
      gameId,
      name: body.name,
      yearsPlaying: body.yearsPlaying,
      discord: body.discord,
      weekDays: body.weekDays.join(","),
      hourStart: convertHourToMinutes(body.hourStart),
      hourEnd: convertHourToMinutes(body.hourEnd),
      useVoiceChannel: body.useVoiceChannel,
    },
  })
  return response.json(ad)
})

app.get("/games/:id/ads", async (request, response) => {
  const gameId = request.params.id
  const ads = await prisma.ad.findMany({
    select: {
      id: true,
      name: true,
      weekDays: true,
      yearsPlaying: true,
      hourStart: true,
      hourEnd: true,
      useVoiceChannel: true,
    },
    where: {
      gameId,
    },
    orderBy: {
      createdAt: "desc",
    },
  })
  return response.json(
    ads.map((ad) => {
      return {
        ...ad,
        weekDays: ad.weekDays.split(","),
        hourStart: convertMinutesToHour(ad.hourStart),
        hourEnd: convertMinutesToHour(ad.hourEnd),
      }
    })
  )
})

app.get("/ads/:id/discord", async (request, response) => {
  const adId = request.params.id
  const ad = await prisma.ad.findUniqueOrThrow({
    select: {
      discord: true,
    },
    where: {
      id: adId,
    },
  })
  return response.json({
    discord: ad.discord,
  })
})

app.listen(process.env.PORT || 4800, () => {
  console.log("Server running on port 4800 🚀")
})

import dayjs from "dayjs";
import { google } from "googleapis";
import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { getGoogleOAuthToken } from "../../../../lib/google";

import { prisma } from "../../../../lib/prisma";

const createSchedulingBody = z.object({
    name: z.string(),
    email: z.string(),
    observations: z.string(),
    date: z.string().datetime()
})

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if(req.method !== "POST"){
        return res.status(405).end()
    }

    const username = String(req.query.username)

    const user = await prisma.user.findUnique({
        where: { username }
    })

    if(!user){
        return res.status(404).json({ message: "User does not exists" })
    }

    const { name, email, observations, date } = createSchedulingBody.parse(req.body)

    const schedulingDate = dayjs(date).startOf("hour")

    if(schedulingDate.isBefore(new Date())){
        return res.status(400).json({
            message: "Date is in the past"
        })
    }

    const conflictionScheduling = await prisma.scheduling.findFirst({
        where: { 
            user_id: user.id,
            date: schedulingDate.toDate()
        }
    })

    if(conflictionScheduling){
        return res.status(400).json({
            message: "There is another scheduling in the same time"
        })
    }

    const scheduling = await prisma.scheduling.create({
        data: {
            date: schedulingDate.toDate(),
            name,
            email,
            observations,
            user_id: user.id
        }
    })

    const calendar = google.calendar({
        version: "v3",
        auth: await getGoogleOAuthToken(user.id)
    })

    await calendar.events.insert({
        calendarId: "primary",
        conferenceDataVersion: 1,
        requestBody: {
            summary: `Ignite Call: ${name}`,
            description: observations,
            start: {
                dateTime: schedulingDate.format()
            },
            end: {
                dateTime: schedulingDate.add(1, "hour").format()
            },
            attendees: [
                { 
                    email: email, 
                    displayName: name 
                }
            ],
            conferenceData: {
                createRequest: {
                    requestId: scheduling.id,
                    conferenceSolutionKey: {
                        type: "hangoutsMeet"
                    }
                }
            }
        }
    })

    return res.status(201).end()
}
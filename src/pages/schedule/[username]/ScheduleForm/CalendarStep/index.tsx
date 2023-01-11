import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Calendar } from "../../../../../components/Calendar";
import { api } from "../../../../../lib/axios";
import { Container, TimePicker, TimePickerHeader, TimePickerItem, TimePickerList } from "./style";

interface Availability{
    possibleTimes: number[]
    availablity: number[]
}

export function CalendarStep(){

    const [selectedDate, setSelectedDate] = useState<Date | null>(null)

    const router = useRouter()
    const username = String(router.query.username)

    const isDateSelected = !!selectedDate

    const weekDay = selectedDate ? dayjs(selectedDate).format("dddd") : null
    const describedDate = selectedDate ? dayjs(selectedDate).format("DD[ de ]MMMM") : null
    const selectedDateWhitoutTime = selectedDate ? dayjs(selectedDate).format("YYYY-MM-DD") : null

    const { data: availability } = useQuery<Availability>([
        "availability",
        selectedDateWhitoutTime
    ], async() => {
        const response = await api.get(`/users/${username}/availability`, {
            params: {
                date: dayjs(selectedDate).format("YYYY-MM-DD")
            }
        })

        return response.data
    },{
        enabled: !!selectedDate
    })

    return (
        <Container isTimePickerOpen={ isDateSelected }>
            <Calendar 
                selectedDate={ selectedDate } 
                onDateSelected={setSelectedDate} 
            />
            { isDateSelected && (
                <TimePicker>
                    <TimePickerHeader>
                        { weekDay } <span>{ describedDate }</span>
                    </TimePickerHeader>
                    <TimePickerList>
                        { availability?.possibleTimes.map(hour => (
                            <TimePickerItem 
                                key={hour}
                                disabled={ !availability.availablity.includes(hour) }
                            >
                                { String(hour).padStart(2, "0") }:00h
                            </TimePickerItem>
                        )) }
                    </TimePickerList>
                </TimePicker>
            )}
        </Container>
    )
}
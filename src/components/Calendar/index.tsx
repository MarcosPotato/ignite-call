import { useMemo, useState } from "react";
import dayjs from "dayjs";

import { CaretLeft, CaretRight } from "phosphor-react";
import { getWeekDays } from "../../utils/get-week-days";

import { CalendarActions, CalendarBody, CalendarContainer, CalendarDay, CalendarHeader, CalendarTitle } from "./style";

interface CalendarWeek{
    week: number
    days: {
        date: dayjs.Dayjs
        disabled: boolean
    }[]
}

type CallendarWeeks = CalendarWeek[]

interface CalendarProps{
    selectedDate?: Date | null
    onDateSelected: (date: Date) => void 
}

export function Calendar({ onDateSelected, selectedDate }: CalendarProps){

    const [currentDate, setCurrentDate] = useState(() => (
        dayjs().set("date", 1)
    ))

    const shortWeekDays = getWeekDays({
        short: true
    }) 

    const currentMonth = currentDate.format("MMMM")
    const currentYear = currentDate.format("YYYY")

    const callendarWeeks = useMemo(() =>{
        const daysInMonthArray = Array.from({
            length: currentDate.daysInMonth()
        }).map((_, index) => {
            return currentDate.set("date", index + 1)
        })

        const firstWeekDay = currentDate.get("day")

        const previousMontFieldArray = Array.from({
            length: firstWeekDay
        }).map((_,index) => {
            return currentDate.subtract(index + 1, "day")
        }).reverse()

        const lastDayInCurrentMonth = currentDate.set("date", currentDate.daysInMonth())
        const lastWeekDay = lastDayInCurrentMonth.get("day")

        const nextMonthFieldArray = Array.from({
            length: 7 - (lastWeekDay + 1)
        }).map((_,index) => {
            return lastDayInCurrentMonth.add(index + 1, "day")
        }).reverse()

        const calendarDays = [
            ...previousMontFieldArray.map(date => ({
                date,
                disabled: true
            })),
            ...daysInMonthArray.map(date => ({
                date,
                disabled: date.endOf("day").isBefore(new Date())
            })),
            ...nextMonthFieldArray.map(date => ({
                date,
                disabled: true
            }))
        ]

        const calendarWeeks = calendarDays.reduce<CallendarWeeks>(
            (weeks, _, index, original) => {
                const isNewWeek = index % 7 === 0

                if(isNewWeek){
                    weeks.push({
                        week: index / 7 + 1,
                        days: original.slice(index, index + 7)
                    })
                }

                return weeks
            }
        ,[])

        return calendarWeeks
    },[currentDate])

    const handlePreviousMonth = () => {
        const previousMonthDate = currentDate.subtract(1, "month")
        setCurrentDate(previousMonthDate)
    }

    const handleNextMonth = () => {
        const nextMonthDate = currentDate.add(1, "month")
        setCurrentDate(nextMonthDate)
    }

    return (
        <CalendarContainer>
            <CalendarHeader>
                <CalendarTitle>{ currentMonth } <span>{ currentYear }</span></CalendarTitle>
                <CalendarActions>
                    <button 
                        title="previous-month"
                        onClick={ handlePreviousMonth }
                    >
                        <CaretLeft />
                    </button>
                    <button
                        title="next-month"
                        onClick={ handleNextMonth }
                    >
                        <CaretRight />
                    </button>
                </CalendarActions>
            </CalendarHeader>
            <CalendarBody>
                <thead>
                    <tr>
                        {shortWeekDays.map(weekDay => (
                            <th key={ weekDay }>{weekDay}.</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    { callendarWeeks.map(({ week, days }) => (
                        <tr key={ week }>
                            { days.map(({ date, disabled }) => (
                                <td key={date.toISOString()}>
                                    <CalendarDay 
                                        disabled={ disabled }
                                        onClick={() => onDateSelected(date.toDate())}
                                    >
                                        { date.get("date") }
                                    </CalendarDay>
                                </td>
                            )) }
                        </tr>
                    )) }
                </tbody>
            </CalendarBody>
        </CalendarContainer>
    )
}
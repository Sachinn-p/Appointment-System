from datetime import date, datetime, time, timedelta
from typing import List, Tuple

WORK_START = time(9, 0)
WORK_END = time(17, 0)
SLOT_STEP_MINUTES = 30


def overlaps(s1: datetime, e1: datetime, s2: datetime, e2: datetime) -> bool:
    return s1 < e2 and e1 > s2


def generate_slots(
    day: date,
    duration_minutes: int,
    booked: List[Tuple[datetime, datetime]],
) -> List[Tuple[datetime, datetime, bool]]:
    start_of_day = datetime.combine(day, WORK_START)
    end_of_day = datetime.combine(day, WORK_END)
    step = timedelta(minutes=SLOT_STEP_MINUTES)
    duration = timedelta(minutes=duration_minutes)

    slots = []
    start = start_of_day
    while start + duration <= end_of_day:
        end = start + duration
        available = not any(overlaps(start, end, b_start, b_end) for b_start, b_end in booked)
        slots.append((start, end, available))
        start += step
    return slots

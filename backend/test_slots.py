from datetime import date, datetime

from slots import generate_slots, overlaps

assert not overlaps(datetime(2026, 9, 25, 9), datetime(2026, 9, 25, 10), datetime(2026, 9, 25, 10), datetime(2026, 9, 25, 11))
assert overlaps(datetime(2026, 9, 25, 9), datetime(2026, 9, 25, 10), datetime(2026, 9, 25, 9, 30), datetime(2026, 9, 25, 10, 30))
assert overlaps(datetime(2026, 9, 25, 9, 30), datetime(2026, 9, 25, 10, 30), datetime(2026, 9, 25, 9), datetime(2026, 9, 25, 10))
assert not overlaps(datetime(2026, 9, 25, 9), datetime(2026, 9, 25, 10), datetime(2026, 9, 25, 10, 1), datetime(2026, 9, 25, 11))

free = generate_slots(date(2026, 9, 25), 60, [])
assert len(free) == 15, len(free)
assert free[0][0] == datetime(2026, 9, 25, 9)
assert free[-1][1] == datetime(2026, 9, 25, 17)
assert all(available for _, _, available in free)

busy = [(datetime(2026, 9, 25, 10), datetime(2026, 9, 25, 11))]
taken = generate_slots(date(2026, 9, 25), 60, busy)
assert [a for _, _, a in taken].count(False) == 3  # 09:30, 10:00, 10:30 start slots
assert taken[0][2] is True and taken[4][2] is True
assert taken[1][2] is False and taken[2][2] is False and taken[3][2] is False

print("ok")

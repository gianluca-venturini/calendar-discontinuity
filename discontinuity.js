const moment = require('moment');
require('moment-timezone');

const NY_TIMEZONE = 'America/New_York';

function toDateOpen(calendarDay) {
    return moment.tz(`${calendarDay.date} ${calendarDay.open}`, 'YYYY-MM-DD HH:mm', NY_TIMEZONE);
}

function toDateClose(calendarDay) {
    return moment.tz(`${calendarDay.date} ${calendarDay.close}`, 'YYYY-MM-DD HH:mm', NY_TIMEZONE);
}

function discontinuitySkipMarketClose (calendar) {
    const discontinuity = {};

    const isMarketOpen = (date) => {
        const d = moment(date);
        const calendarDay = calendar[d.format('YYYY-MM-DD')];
        if (!calendarDay) {
            return false;
        }
        const open = toDateOpen(calendarDay);
        const close = toDateClose(calendarDay);
        return open.diff(d) <= 0 && d.diff(close) <= 0;
    }

    discontinuity.clampDown = (date) => {
        if (!date || isMarketOpen(date)) {
            return date;
        }
        let d = moment(date);
        let calendarDay = calendar[d.format('YYYY-MM-DD')]
        if (!!calendarDay) {
            const close = toDateClose(calendarDay);
            const open = toDateOpen(calendarDay);
            if (open.diff(d) > 0) {
                // date before open
                d = d.subtract(1, 'day');
            }
            if (d.diff(close) > 0) {
                // date after close
                return close.toDate();
            }
        }
        while (!calendar[d.format('YYYY-MM-DD')]) {
            d = d.subtract(1, 'day');
        }
        calendarDay = calendar[d.format('YYYY-MM-DD')];
        return toDateClose(calendarDay).toDate();
    };

    discontinuity.clampUp = (date) => {
        if (!date || isMarketOpen(date)) {
            return date;
        }
        let d = moment(date);
        let calendarDay = calendar[d.format('YYYY-MM-DD')]
        if (!!calendarDay) {
            const close = toDateClose(calendarDay);
            const open = toDateOpen(calendarDay);
            if (open.diff(d) > 0) {
                // date before open
                return open.toDate();
            }
            if (d.diff(close) > 0) {
                // date after close
                d = d.add(1, 'day');
            }
        }
        while (!calendar[d.format('YYYY-MM-DD')]) {
            d = d.add(1, 'day');
        }
        calendarDay = calendar[d.format('YYYY-MM-DD')];
        return toDateOpen(calendarDay).toDate();
    };

    // returns the number of included milliseconds (i.e. those which do not fall)
    // within discontinuities, along this scale
    discontinuity.distance = function (startDate, endDate) {
        startDate = moment(discontinuity.clampUp(startDate));
        endDate = moment(discontinuity.clampDown(endDate));

        let distanceMs = 0;
        let d = startDate.add('day', 1);
        while (d.diff(endDate.subtract('day', 1)) < 0) {
            const calendarDay = calendar[d.format('YYYY-MM-DD')];
            if (!!calendarDay) {
                distanceMs += toDateClose(calendarDay).diff(toDateOpen(calendarDay));
            }
            d = d.add('day', 1);
        }
        const startCalendarDay = calendar[startDate.format('YYYY-MM-DD')];
        const endCalendarDay = calendar[endDate.format('YYYY-MM-DD')];
        if (startCalendarDay) {
            distanceMs += toDateClose(startCalendarDay).diff(startDate);
        }
        if (endCalendarDay) {
            distanceMs += endDate.diff(toDateOpen(endCalendarDay));
        }

        return distanceMs;
    };

    discontinuity.offset = function (startDate, ms) {
        const d = moment(isMarketOpen(startDate) ? discontinuity.clampUp(startDate) : startDate);
        
        while (ms > 0) {
            const calendarDay = calendar[d.format('YYYY-MM-DD')];
            if (!!calendarDay) {
                close = toDateClose(calendarDay);
                const newDate = d.add('millisecond', ms);
                if (close.diff(newDate) > 0) {
                    return newDate.toDate();
                }
                ms -= close.diff(d);
                d = discontinuity.clampUp(close.add('minute', 1));
            }
        }
    };

    discontinuity.copy = function () { return discontinuity; };

    return discontinuity;
};

module.exports = discontinuitySkipMarketClose;

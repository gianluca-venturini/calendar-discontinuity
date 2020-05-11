const moment = require('moment');
require('moment-timezone');

const NY_TIMEZONE = 'America/New_York';

const msInHour = 1000 * 60 * 60;
const msInDay = msInHour * 24;

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
                d.subtract(1, 'day');
            }
            if (d.diff(close) > 0) {
                // date after close
                return close.toDate();
            }
        }
        while (!calendar[d.format('YYYY-MM-DD')]) {
            d.subtract(1, 'day');
        }
        calendarDay = calendar[d.format('YYYY-MM-DD')];
        return toDateClose(calendarDay).toDate();
    };

    discontinuity.clampUp = (date) => {
        if (!date || isMarketOpen(date)) {
            return date;
        }
        let d = moment(date);
        let calendarDay = calendar[d.format('YYYY-MM-DD')];
        if (!!calendarDay) {
            const close = toDateClose(calendarDay);
            const open = toDateOpen(calendarDay);
            if (open.diff(d) > 0) {
                // date before open
                return open.toDate();
            }
            if (d.diff(close) > 0) {
                // date after close
                d.add(1, 'day');
            }
        }
        while (!calendar[d.format('YYYY-MM-DD')]) {
            d.add(1, 'day');
        }
        calendarDay = calendar[d.format('YYYY-MM-DD')];
        return toDateOpen(calendarDay).toDate();
    };

    // returns the number of included milliseconds (i.e. those which do not fall)
    // within discontinuities, along this scale
    discontinuity.distance = function (startDate, endDate) {
        startDate = moment(discontinuity.clampUp(startDate));
        endDate = moment(discontinuity.clampDown(endDate));

        if (endDate.diff(startDate) < 0) {
            return 0;
        }

        let distanceMs = 0;
        let d = startDate;
        while (endDate.diff(d) > msInDay) {
            let calendarDay = calendar[d.format('YYYY-MM-DD')];
            const close = toDateClose(calendarDay);
            distanceMs += close.diff(d);
            // Go to next trading day
            d = moment(discontinuity.clampUp(close.add(1, 'second').toDate()));
        }
        distanceMs += endDate.diff(d);

        return distanceMs;
    };

    discontinuity.offset = function (startDate, ms) {
        let d = moment(!isMarketOpen(startDate) ? discontinuity.clampUp(startDate) : startDate);
        while (ms > 0) {
            const calendarDay = calendar[d.format('YYYY-MM-DD')];
            if (!!calendarDay) {
                const close = toDateClose(calendarDay);
                const newDate = d.clone();
                newDate.add(ms, 'millisecond');
                if (close.diff(newDate) >= 0) {
                    return newDate.toDate();
                }
                ms -= close.diff(d);
                // Go to next trading day
                d = moment(discontinuity.clampUp(close.add(1, 'second').toDate()));
            }
        }
    };

    discontinuity.copy = function () { return discontinuity; };

    return discontinuity;
};

module.exports = discontinuitySkipMarketClose;
 
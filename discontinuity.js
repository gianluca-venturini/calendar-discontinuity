const msInHour = 1000 * 60 * 60;
const msInDay = msInHour * 24;

function toDateOpen(calendarDay) {
    const formattedHour = calendarDay.open.length === 5 ? calendarDay.open : `0${calendarDay.open}`;
    return new Date(`${calendarDay.date}T${formattedHour}:00-05:00`);
}

function toDateClose(calendarDay) {
    const formattedHour = calendarDay.close.length === 5 ? calendarDay.close : `0${calendarDay.close}`;
    return new Date(`${calendarDay.date}T${formattedHour}:00-05:00`);
}

function formatDate(d) {
    const offset = -5;
    const date = new Date( d.getTime() + offset * 60 * 60 * 1000);
    const dateString = date.toISOString();
    const fDay = dateString.slice(8, 10);
    const fMonth = dateString.slice(5, 7);
    const fYear = dateString.slice(0, 4);
    return `${fYear}-${fMonth}-${fDay}`;
}

function discontinuitySkipMarketClose (calendar) {
    const discontinuity = {};

    const isMarketOpen = (d) => {
        const calendarDay = calendar[formatDate(d)];
        if (!calendarDay) {
            return false;
        }
        const open = toDateOpen(calendarDay);
        const close = toDateClose(calendarDay);
        return open <= d && d <= close;
    }

    discontinuity.clampDown = (d) => {
        if (!d || isMarketOpen(d)) {
            return d;
        }
        let calendarDay = calendar[formatDate(d)]
        if (!!calendarDay) {
            const close = toDateClose(calendarDay);
            const open = toDateOpen(calendarDay);
            if (open > d) {
                // date before open
                d = new Date(d.getTime() - msInDay);
            }
            if (d > close) {
                // date after close
                return close;
            }
        }
        while (!calendar[formatDate(d)]) {
            d = new Date(d.getTime() - msInDay);
        }
        calendarDay = calendar[formatDate(d)];
        return toDateClose(calendarDay);
    };

    discontinuity.clampUp = (d) => {
        if (!d || isMarketOpen(d)) {
            return d;
        }
        let calendarDay = calendar[formatDate(d)];
        if (!!calendarDay) {
            const close = toDateClose(calendarDay);
            const open = toDateOpen(calendarDay);
            if (open > d) {
                // date before open
                return open;
            }
            if (d > close) {
                // date after close
                d = new Date(d.getTime() + msInDay);
            }
        }
        while (!calendar[formatDate(d)]) {
            d = new Date(d.getTime() + msInDay);
        }
        calendarDay = calendar[formatDate(d)];
        return toDateOpen(calendarDay);
    };

    // returns the number of included milliseconds (i.e. those which do not fall)
    // within discontinuities, along this scale
    discontinuity.distance = function (startDate, endDate) {
        startDate = discontinuity.clampUp(startDate);
        endDate = discontinuity.clampDown(endDate);

        if (endDate <= startDate) {
            return 0;
        }

        let distanceMs = 0;
        let d = startDate;
        while (endDate > d) {
            let calendarDay = calendar[formatDate(d)];
            const close = toDateClose(calendarDay);
            distanceMs += Math.min(close - d, endDate - d)
            // Go to next trading day
            d = discontinuity.clampUp(new Date(close.getTime() + 1));
        }

        return distanceMs;
    };

    discontinuity.offset = function (startDate, ms) {
        let d = !isMarketOpen(startDate) ? discontinuity.clampUp(startDate) : startDate;
        while (ms > 0) {
            const calendarDay = calendar[formatDate(d)];
            if (!!calendarDay) {
                const close = toDateClose(calendarDay);
                const newDate = new Date(d.getTime() + ms);
                if (close >= newDate) {
                    return newDate;
                }
                ms -= close - d;
                // Go to next trading day
                d = discontinuity.clampUp(new Date(close.getTime() + 1));
            }
        }
    };

    discontinuity.copy = function () { return discontinuity; };

    return discontinuity;
};

module.exports = {discontinuitySkipMarketClose, formatDate};
 
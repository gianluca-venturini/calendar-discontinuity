const {discontinuitySkipMarketClose, formatDate} = require('./discontinuity');

const calendar={
    '2020-01-06': {
        date: '2020-01-06',
        open: '9:30',
        close: '16:00',
    },
    '2020-01-07': {
        date: '2020-01-07',
        open: '9:30',
        close: '16:00',
    },
    '2020-01-08': {
        date: '2020-01-08',
        open: '9:30',
        close: '16:00',
    },
    '2020-01-09': {
        date: '2020-01-09',
        open: '9:30',
        close: '16:00',
    },
    '2020-01-10': {
        date: '2020-01-10',
        open: '9:30',
        close: '16:00',
    },
    '2020-01-13': {
        date: '2020-01-13',
        open: '9:30',
        close: '16:00',
    },
    '2020-01-14': {
        date: '2020-01-14',
        open: '9:30',
        close: '16:00',
    },
    '2020-01-15': {
        date: '2020-01-15',
        open: '9:30',
        close: '16:00',
    },
    '2020-01-16': {
        date: '2020-01-16',
        open: '9:30',
        close: '16:00',
    },
    '2020-01-17': {
        date: '2020-01-17',
        open: '9:30',
        close: '16:00',
    },
}

const msInMinute = 1000 * 60;
const msInHour = msInMinute * 60;
const msInDay = msInHour * 24;

const dis = discontinuitySkipMarketClose(calendar);

describe('formatDate', () => {
    test('Format the date correctly', () => {
        expect(formatDate(new Date('2020-01-07T01:00:00-05:00'))).toBe('2020-01-07');
    });
});

describe('clampDown', () => {
    test('Unchanged - market open', () => {
        expect(
            dis.clampDown(new Date('2020-01-07T10:00:00-05:00'))
        ).toEqual(new Date('2020-01-07T10:00:00-05:00'));
    });
    
    test('After market closed', () => {
        expect(
            dis.clampDown(new Date('2020-01-07T20:00:00-05:00'))
        ).toEqual(new Date('2020-01-07T16:00:00-05:00'));
    });
    
    test('Before market open', () => {
        expect(
            dis.clampDown(new Date('2020-01-07T03:00:00-05:00'))
        ).toEqual(new Date('2020-01-06T16:00:00-05:00'));
    });

    test('Before market open - skip days', () => {
        expect(
            dis.clampDown(new Date('2020-01-13T03:00:00-05:00'))
        ).toEqual(new Date('2020-01-10T16:00:00-05:00'));
    });
});

describe('clampUp', () => {
    test('Unchanged - market open', () => {
        expect(
            dis.clampUp(new Date('2020-01-07T10:00:00-05:00'))
        ).toEqual(new Date('2020-01-07T10:00:00-05:00'));
    });
    
    test('After market closed', () => {
        expect(
            dis.clampUp(new Date('2020-01-07T20:00:00-05:00'))
        ).toEqual(new Date('2020-01-08T09:30:00-05:00'));
    });
    
    test('Before market open', () => {
        expect(
            dis.clampUp(new Date('2020-01-07T03:00:00-05:00'))
        ).toEqual(new Date('2020-01-07T09:30:00-05:00'));
    });

    test('After market closed - skip days', () => {
        expect(
            dis.clampUp(new Date('2020-01-10T19:00:00-05:00'))
        ).toEqual(new Date('2020-01-13T09:30:00-05:00'));
    });
});

describe('distance', () => {
    test('Same day - end before start', () => {
        expect(
            dis.distance(new Date('2020-01-07T11:00:00-05:00'), new Date('2020-01-07T10:00:00-05:00'))
        ).toEqual(0);
    });

    test('Same day - market open', () => {
        expect(
            dis.distance(new Date('2020-01-07T10:00:00-05:00'), new Date('2020-01-07T11:00:00-05:00'))
        ).toEqual(msInHour);
    });

    test('Same day - start before market open', () => {
        expect(
            dis.distance(new Date('2020-01-07T02:00:00-05:00'), new Date('2020-01-07T10:00:00-05:00'))
        ).toEqual(30 * msInMinute);
    });

    test('Same day - end after market closes', () => {
        expect(
            dis.distance(new Date('2020-01-07T15:00:00-05:00'), new Date('2020-01-07T17:00:00-05:00'))
        ).toEqual(msInHour);
    });

    test('Same day - end at market close', () => {
        expect(
            dis.distance(new Date('2020-01-07T15:00:00-05:00'), new Date('2020-01-07T16:00:00-05:00'))
        ).toEqual(msInHour);
    });

    test('Same day - start before market open and end after market closes', () => {
        expect(
            dis.distance(new Date('2020-01-07T02:00:00-05:00'), new Date('2020-01-07T17:00:00-05:00'))
        ).toEqual((6 * 60 + 30) * msInMinute);
    });

    test('Following day - start before market open and end after market closes', () => {
        expect(
            dis.distance(new Date('2020-01-07T02:00:00-05:00'), new Date('2020-01-08T17:00:00-05:00'))
        ).toEqual((6 * 60 + 30) * msInMinute * 2);
    });

    test('Following day - start after market open and end after market closes', () => {
        expect(
            dis.distance(new Date('2020-01-07T10:00:00-05:00'), new Date('2020-01-08T17:00:00-05:00'))
        ).toEqual(6 * 60 * msInMinute * 2 + 30 * msInMinute);
    });

    test('Following day - start before market open and end before market closes', () => {
        expect(
            dis.distance(new Date('2020-01-07T02:00:00-05:00'), new Date('2020-01-08T15:00:00-05:00'))
        ).toEqual(6 * 60 * msInMinute * 2);
    });

    test('Following day - start at market open and end at market close', () => {
        expect(
            dis.distance(new Date('2020-01-07T09:30:00-05:00'), new Date('2020-01-08T16:00:00-05:00'))
        ).toEqual(2 * (6 * 60 + 30) * msInMinute);
    });

    test('Following day - start at market open and end at market open following day', () => {
        expect(
            dis.distance(new Date('2020-01-07T09:30:00-05:00'), new Date('2020-01-08T09:30:00-05:00'))
        ).toEqual((6 * 60 + 30) * msInMinute);
    });
});

describe('offset', () => {
    test('Same day - market open', () => {
        expect(
            dis.offset(new Date('2020-01-07T11:00:00-05:00'), msInHour)
        ).toEqual(new Date('2020-01-07T12:00:00-05:00'));
    });

    test('Same day - before market open', () => {
        expect(
            dis.offset(new Date('2020-01-07T02:00:00-05:00'), msInHour)
        ).toEqual(new Date('2020-01-07T10:30:00-05:00'));
    });

    test('Following day - after market closes', () => {
        expect(
            dis.offset(new Date('2020-01-07T18:00:00-05:00'), msInHour)
        ).toEqual(new Date('2020-01-08T10:30:00-05:00'));
    });

    test('Following day - before market opens', () => {
        expect(
            dis.offset(new Date('2020-01-07T02:00:00-05:00'), 10 * msInHour)
        ).toEqual(new Date('2020-01-08T13:00:00-05:00'));
    });

    test('Following days - before market opens', () => {
        expect(
            dis.offset(new Date('2020-01-07T02:00:00-05:00'), 20 * msInHour)
        ).toEqual(new Date('2020-01-10T10:00:00-05:00'));
    });

    test('Following days - market open', () => {
        expect(
            dis.offset(new Date('2020-01-07T10:00:00-05:00'), 20 * msInHour)
        ).toEqual(new Date('2020-01-10T10:30:00-05:00'));
    });

    test('Following days - market open, border', () => {
        expect(
            dis.offset(new Date('2020-01-07T09:30:00-05:00'), 20 * msInHour)
        ).toEqual(new Date('2020-01-10T10:00:00-05:00'));
    });
});

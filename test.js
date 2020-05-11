const discontinuitySkipMarketClose = require('./discontinuity');

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
const dis = discontinuitySkipMarketClose(calendar);

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

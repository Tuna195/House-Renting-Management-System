/** Response lỗi là dữ liệu không tin cậy; không được gây crash hoặc gắn lỗi nhầm phòng. */
import { AxiosError, AxiosHeaders } from 'axios';
import { expect, it } from 'vitest';
import { readMeterError } from './meterReadingErrors';

const readings = [{ roomId: 42, electricStart: 0, electricEnd: 10, waterStart: 0, waterEnd: 1 }];
function failure(data: unknown) {
  return new AxiosError('bad', undefined, undefined, undefined, {
    status: 400, statusText: 'Bad Request', headers: {}, config: { headers: new AxiosHeaders() }, data,
  });
}
it('ánh xạ readings[index] về roomId của request, không dùng index làm roomId', () => {
  const result = readMeterError(failure({ code: 'VALIDATION_ERROR', message: 'Sai chỉ số', details: [
    { path: ['readings', 0, 'waterEnd'], message: 'Nước mới sai' },
  ] }), readings);
  expect(result.fields).toEqual({ 42: { waterEnd: 'Nước mới sai' } });
  expect(result.message).toBe('Sai chỉ số');
});
it.each([null, 'bad', { message: [] }, { details: {} }, { details: [null, {}, {
  path: ['readings', -1, 'electricEnd'], message: 'bad',
}, { path: ['readings', 100, 'electricEnd'], message: 'bad' }, {
  path: ['readings', 0, '__proto__'], message: 'bad',
}, { path: ['readings', '0', 'electricEnd'], message: 'bad' }] }])
  ('không crash hoặc tạo field error với response sai %j', (data) => {
    expect(readMeterError(failure(data), readings).fields).toEqual({});
    expect(typeof readMeterError(failure(data), readings).message).toBe('string');
  });
it('lỗi mạng không có response vẫn có thông báo và không có field errors', () => {
  const result = readMeterError(new AxiosError('Network'), readings);
  expect(result.fields).toEqual({});
  expect(result.message).toBe('Không kết nối được máy chủ');
});

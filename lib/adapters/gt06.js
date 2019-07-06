/* Original code: https://github.com/cnberg/gps-tracking-nodejs/blob/master/lib/adapters/gt06.js */
f = require('../functions');
crc = require('crc');

exports.protocol = 'GT06';
exports.model_name = 'GT06';
exports.compatible_hardware = ['GT06/supplier'];

var adapter = function (device) {
  if (!(this instanceof adapter)) {
    return new adapter(device);
  }

  this.format = { 'start': '(', 'end': ')', 'separator': '' };
  this.device = device;
  this.__count = 1;

  /*******************************************
   PARSE THE INCOMING STRING FROM THE DECIVE
   You must return an object with a least: device_id, cmd and type.
   return device_id: The device_id
   return cmd: command from the device.
   return type: login_request, ping, etc.
   *******************************************/
  this.parse_data = function (data) {
    data = data.toString('hex');

    console.log('data', data);

    var parts = {
      'start': data.substr(0, 4)
    };

    if (parts['start'] == '7878') {
      parts['length'] = parseInt(data.substr(4, 2), 16);
      parts['finish'] = data.substr(6 + parts['length'] * 2, 4);

      parts['protocal_id'] = data.substr(6, 2);

      parts['serial_number'] = data.substr(12 * 2, 2 * 2);
      parts['error_check'] = data.substr(14 * 2, 2 * 2);

      if (parts['finish'] != '0d0a') {
        throw 'finish code incorrect!';
      }

      if (parts['protocal_id'] == '01') {
        parts['device_id'] = data.substr(8, 16);
        parts.cmd = 'login_request';
        parts.action = 'login_request';
      } else if (parts['protocal_id'] == '12') {
        parts['device_id'] = '';
        parts['data'] = data.substr(8, parts['length'] * 2);
        parts.cmd = 'ping';
        parts.action = 'ping';
      } else if (parts['protocal_id'] == '13') {
        parts['device_id'] = '';
        parts.cmd = 'heartbeat';
        parts.action = 'heartbeat';
      } else if (parts['protocal_id'] == '16' || parts['protocal_id'] == '18') {
        parts['device_id'] = '';
        parts['data'] = data.substr(8, parts['length'] * 2);
        parts.cmd = 'alert';
        parts.action = 'alert';
      } else {
        parts['device_id'] = '';
        parts.cmd = 'noop';
        parts.action = 'noop';
      }
    } else {
      parts['device_id'] = '';
      parts.cmd = 'noop';
      parts.action = 'noop';
    }
    return parts;
  };
  this.authorize = function (msg_parts) {
    // console.log('authorize', msg_parts);
    var buff = new Buffer.from('787805010001d9dc0d0a', 'hex');
    this.device.send(buff);
  };
  this.zeroPad = function (nNum, nPad) {
    return ('' + (Math.pow(10, nPad) + nNum)).slice(1);
  };
  this.synchronous_clock = function (msg_parts) {

  };
  this.receive_heartbeat = function (msg_parts) {
    var buff = new Buffer('787805130001d9dc0d0a', 'hex');
    this.device.send(buff);
  };
  this.run_other = function (cmd, msg_parts) {
  };

  this.request_login_to_device = function () {
    //@TODO: Implement this.
  };

  this.receive_alarm = function (msg_parts) {
    console.log('receive_alarm', msg_parts);
    var str = msg_parts.data;

    var data = {
      'date': str.substr(0, 12),
      'set_count': str.substr(12, 2),
      'latitude_raw': str.substr(14, 8),
      'longitude_raw': str.substr(22, 8),
      'latitude': this.dex_to_degrees(str.substr(14, 8)),
      'longitude': this.dex_to_degrees(str.substr(22, 8)),
      'speed': parseInt(str.substr(30, 2), 16),
      'orientation': str.substr(32, 4),
      'lbs': str.substr(36, 18),
      'device_info': f.str_pad(parseInt(str.substr(54, 2)).toString(2), 8, 0),
      'power': str.substr(56, 2),
      'gsm': str.substr(58, 2),
      'alert': str.substr(60, 4),
    };

    data['power_status'] = data['device_info'][0];
    data['gps_status'] = data['device_info'][1];
    data['charge_status'] = data['device_info'][5];
    data['acc_status'] = data['device_info'][6];
    data['defence_status'] = data['device_info'][7];
    console.log('alert');
    console.log(data);
  };

  this.dex_to_degrees = function (dex) {
    return parseInt(dex, 16) / 1800000;
  };

  this.get_ping_data = function (msg_parts) {
    console.log('get_ping_data', msg_parts);
    var str = msg_parts.data;



    //     get_ping_data { start: '7878',
    //   length: 35,
    //   finish: '0d0a',
    //   protocal_id: '12',
    //   serial_number: '8264',
    //   error_check: '7009',
    //   device_id: '',
    //   data:
    //    '1307060e2b18 cf 02826470 0927b280 08 d4cb 019534064d00fcdf 0000cc49 0071f1100d',
    //   cmd: 'ping',
    //   action: 'ping' }
    // protoData { date: '1307060e2b18',
    //   gps_count: 'cf',
    //   latitude: '02826470',
    //   longitude: '0927b280',
    //   speed: '08',
    //   orientation: 'd4cb',
    //   lbs: '019534064d00fcdf',
    //   mileage: '0000cc49' }


    // 7878 23 12 1307050a0223c70281977009273e30005480019534064b0090f7000044ce0000d9f80d0a
    //            1307050a0223 c7 02819770 09273e30 00 5480 019534064b0090f7 000044ce 0000d9f80d

    // protocol
    var protoData = {
      date: str.substr(0, 6 * 2),
      gps_count: str.substr(12, 1 * 2),
      latitude: str.substr(14, 4 * 2),
      longitude: str.substr(22, 4 * 2),
      speed: str.substr(30, 2 * 1),
      status: str.substr(32, 2 * 2),
      lbs: str.substr(36, 8 * 2),
      mileage: str.substr(52, 4 * 2)
    };

    console.log('protoData', protoData)
    let courseNstatus = f.parseCourseStatus(protoData.status);

    let res = {
      time: f.parseDateTime(protoData.date),
      latitude: this.dex_to_degrees(protoData.latitude),
      longitude: this.dex_to_degrees(protoData.longitude),
      speed: f.hex_to_int(protoData.speed),
      mile: f.hex_to_int(protoData.mileage),
      raw: str
    };

    res = Object.assign(res, courseNstatus);



    // var data = {
    //   'date': str.substr(0, 12),
    //   'set_count': str.substr(12, 2),
    //   'latitude_raw': str.substr(14, 8),
    //   'longitude_raw': str.substr(22, 8),
    //   'latitude': this.dex_to_degrees(str.substr(14, 8)),
    //   'longitude': this.dex_to_degrees(str.substr(22, 8)),
    //   'speed': parseInt(str.substr(30, 2), 16),
    //   'orientation': str.substr(32, 4),
    //   'lbs': str.substr(36, 16),
    // };

    /*
     "device_info"	: f.str_pad(parseInt(str.substr(54,2)).toString(2), 8, 0),
     "power"	        : str.substr(56,2),
     "gsm"	        : str.substr(58,2),
     "alert"	        : str.substr(60,4),
     data['power_status'] = data['device_info'][0];
     data['gps_status'] = data['device_info'][1];
     data['charge_status'] = data['device_info'][5];
     data['acc_status']= data['device_info'][6];
     data['defence_status'] = data['device_info'][7];
     */

    console.log(res);

    return res;
  };

  /* SET REFRESH TIME */
  this.set_refresh_time = function (interval, duration) {
  };
};
exports.adapter = adapter;
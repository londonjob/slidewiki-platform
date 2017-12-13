const log = require('../log/clog');

const MODI = 'sso_modi';
const NAME = 'sso_data';

export default function finalizeMergedUser(context, payload, done) {
    log.info(context);
    context.service.read('user.ssofinalize', payload, { timeout: 20 * 1000 }, (err, res) => {
        if (err) {
            console.log('ERROR', err, err.statusCode, err.message);
            //TODO
            done();
        } else {
            localStorage.setItem(NAME, decodeURIComponent(JSON.stringify(res)));

            try {
              window.close();
            } catch (e) {
              console.log('Window could not be closed.');
            }

            done();
        }
    });
}

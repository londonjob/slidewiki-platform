import { shortTitle } from '../configs/general';
import slideIdTypeError from './error/slideIdTypeError';
import { AllowedPattern } from './error/util/allowedPattern';
import UserProfileStore from '../stores/UserProfileStore';
import serviceUnavailable from './error/serviceUnavailable';
import log from'./log/clog';
import TranslationStore from '../stores/TranslationStore';

export default function loadDeckEdit(context, payload, done) {
    log.info(context);
    // console.log('action loadDeckEdit:', payload);

    if (!(AllowedPattern.SLIDE_ID.test(payload.params.sid) || payload.params.sid === undefined)) {
        context.executeAction(slideIdTypeError, payload, done);
        return;
    }

    payload.params.jwt = context.getStore(UserProfileStore).jwt;
    if (!payload.params.language) {
        payload.params.language = context.getStore(TranslationStore).currentLang || context.getStore(TranslationStore).treeLanguage;
    }

    context.service.read('deck.properties', payload, {timeout: 20 * 1000}, (err, res) => {
        if (err) {
            log.error(context, {filepath: __filename});
            // context.executeAction(serviceUnavailable, payload, done);
            context.dispatch('LOAD_DECK_PROPS_FAILURE', err);
            done();
            return;
        }

        context.dispatch('LOAD_DECK_PROPS_SUCCESS', res);
        done();
    });
}

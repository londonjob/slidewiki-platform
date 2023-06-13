import {shortTitle} from '../../configs/general';
import DeckTreeStore from '../../stores/DeckTreeStore';
import serviceUnavailable from '../error/serviceUnavailable';
import deckIdTypeError from '../error/deckIdTypeError';
import deckContentPathError from '../error/deckContentPathError';
import {AllowedPattern} from '../error/util/allowedPattern';
import UserProfileStore from '../../stores/UserProfileStore';
import TranslationStore from '../../stores/TranslationStore';
const log = require('../log/clog');
import Util from '../../components/common/Util';
import {navigateAction} from 'fluxible-router';

export default function loadDeckTree(context, payload, done) {
    log.info(context);
    if (!(AllowedPattern.DECK_ID.test(payload.params.id))) {
        context.executeAction(deckIdTypeError, payload, done);
        return;
    }

    if (!(payload.params.spath && (AllowedPattern.DECK_CONTENT_PATH.test(payload.params.spath)) || payload.params.spath === undefined || payload.params.spath === '')) {
        context.executeAction(deckContentPathError, payload, done);
        return;
    }
    let pageTitle = shortTitle + ' | Deck Tree | ' + payload.params.id;

    let currentSelector = context.getStore(DeckTreeStore).getSelector();

    let runFetchTree = 1;

    //runFetchTree flag may be passed through the navigate action to force deck tree fetch
    if (payload.navigate && !payload.navigate.runFetchTree && currentSelector.id === payload.params.id) {
        runFetchTree = 0;
    }
    // console.log('loadDeckTree runFetchTree', runFetchTree);
    if (runFetchTree) {
        //we need to load the whole tree for the first time
        payload.params.jwt = context.getStore(UserProfileStore).jwt;
        payload.params.language = context.getStore(TranslationStore).currentLang;
        context.service.read('decktree.nodes', payload, {timeout: 20 * 1000}, (err, res) => {
            if (err) {
                log.error(context, {filepath: __filename});
                context.executeAction(serviceUnavailable, payload, done);
            } else {
                context.dispatch('LOAD_DECK_TREE_SUCCESS', res);

                done();
            }
        });
    } else {
        //when we only select the node in tree, there is no need to call the external service
        context.dispatch('SELECT_TREE_NODE_SUCCESS', payload.params);
        done();
    }
}

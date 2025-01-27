import async from 'async';
import {shortTitle} from '../configs/general';
import { isEmpty } from '../common.js';
import DeckPageStore from '../stores/DeckPageStore';
import loadContent from './loadContent';
import loadDeckTree from './decktree/loadDeckTree';
import loadActivities from './activityfeed/loadActivities';
import loadContentModules from './loadContentModules';
import addActivity from './activityfeed/addActivity';
import deckContentTypeError from './error/deckContentTypeError';
import slideIdTypeError from './error/slideIdTypeError';
import deckContentPathError from './error/deckContentPathError';
import deckIdTypeError from './error/deckIdTypeError';
import deckModeError from './error/deckModeError';
import serviceUnavailable from './error/serviceUnavailable';
import { AllowedPattern } from './error/util/allowedPattern';
import fetchUser from './user/userprofile/fetchUser';
import UserProfileStore from '../stores/UserProfileStore';
import notFoundError from './error/notFoundError';
import DeckTreeStore from '../stores/DeckTreeStore';
import TranslationStore from '../stores/TranslationStore';
import loadPermissions from './permissions/loadPermissions';
import resetPermissions from './permissions/resetPermissions';
import loadQuestionsCount from './questions/loadQuestionsCount';
import loadLikes from './activityfeed/loadLikes';
import getFollowing from './following/getFollowing';
import PermissionsStore from '../stores/PermissionsStore';
import loadContributors from './loadContributors';
import loadForks from './permissions/loadForks';
import loadNodeTranslations from './translation/loadNodeTranslations';
import loadSimilarContentsSelector from './loadSimilarContentsSelector';
import loadSimilarContents from './loadSimilarContents';

import log from './log/clog';


export default function loadDeck(context, payload, done) {
    log.info(context); // do not remove such log messages. If you don't want to see them, change log level in config
    context.dispatch('UPDATE_MODE', {mode: 'loading'});

    // resets the deck view store
    // TODO (what other store to reset ???)
    context.dispatch('LOAD_DECK_PAGE_START');

    if (!(AllowedPattern.DECK_ID.test(payload.params.id))) {
        context.executeAction(deckIdTypeError, payload, done);
        return;
    }

    if (!(['deck', 'slide', 'question'].indexOf(payload.params.stype) > -1 || payload.params.stype === undefined)) {
        context.executeAction(deckContentTypeError, payload, done);
        return;
    }

    if (!(AllowedPattern.SLIDE_ID.test(payload.params.sid) || payload.params.sid === undefined)) {
        context.executeAction(slideIdTypeError, payload, done);
        return;
    }

    if (!(payload.params.spath && (AllowedPattern.DECK_CONTENT_PATH.test(payload.params.spath)) || payload.params.spath === undefined)) {
        context.executeAction(deckContentPathError, payload, done);
        return;
    }

    if (!(['view', 'edit', 'questions', 'datasources', 'markdownEdit'].indexOf(payload.params.mode) > -1 || payload.params.mode === undefined)) {
        context.executeAction(deckModeError, payload, done);
        return;
    }

    //language/translation stuff
    payload.params.language = payload.query.language;
    if (payload.params.language && payload.params.language.startsWith('_')) {
        payload.params.language = payload.params.language.substring(1);
    }
    if (payload.params.language && payload.params.language.length > 5)
        payload.params.language = payload.params.language.substring(0,5);

    //we should store the current content state in order to avoid duplicate load of actions
    let currentState = context.getStore(DeckPageStore).getState();
    let runNonContentActions = 1;
    let pageTitle = shortTitle + ' | Deck | ' + payload.params.id;
    let payloadCustom = payload;


    //if no specific content selector is given, use the deck type, view mode and root deck id as default selector
    if(!payload.params.stype) {
        payloadCustom.params.stype = 'deck';
    }
    if(!payload.params.sid) {
        payloadCustom.params.sid = payload.params.id;
    }
    //path is an optional parameter which might get confused with the mode, therefore we need to disambiguate it:
    if(payload.params.spath) {
        if(!payload.params.mode){
            //if spath does not have ';' and ':' as separator, it means it refers to the mode
            if(payload.params.spath.indexOf(':') === -1 && payload.params.spath.indexOf(';') === -1){
                payloadCustom.params.mode = payload.params.spath;
                payloadCustom.params.spath = '';
            }else{
                payloadCustom.params.mode = 'view';
            }
        }
    }else{
        payloadCustom.params.spath = '';
        payloadCustom.params.mode = 'view';
    }

    payload.params.jwt = context.getStore(UserProfileStore).getState().jwt;

    context.dispatch('UPDATE_DECK_PAGE_CONTENT', payloadCustom);
    pageTitle = pageTitle + ' | ' + payloadCustom.params.stype + ' | ' + payloadCustom.params.sid + ' | ' + payloadCustom.params.mode;
    if((currentState.selector.id === payloadCustom.params.id) && (currentState.selector.spath === payloadCustom.params.spath)){
        runNonContentActions = 0;
    }

    let currentLang = context.getStore(TranslationStore).getState().currentLang;
    let languageWillChange = (currentLang || '') !== (payload.params.language || '');
    // need to set this for some reason otherwise deck tree does not reload on language change
    if (languageWillChange) {
        if (payloadCustom.navigate) {
            payloadCustom.navigate.runFetchTree = true;
        } else {
            payloadCustom.navigate = { runFetchTree : true };
        }
    }

    // load translation stuff
    context.executeAction(loadNodeTranslations, payload.params, (err, results) => {
        if (err) {
            // log the error and return!!!
            log.error(context, {filepath: __filename, message: err.message});
            return done(err);
        }

        //load all required actions in parallel
        async.parallel([
            (callback) => {
                context.executeAction(fetchUser, {
                    params: {
                        username: context.getStore(UserProfileStore).getState().username
                    }
                }, callback);
            },
            (callback) => {
                let permissionsPromise;
                //if user is not logged in, only allow view mode and reset permissions, else load this user's permissions on the selected root deck
                if (!payload.params.jwt){
                    if (!payload.query.interestedUser) //NOTE should not be changed in the special case: Link from email for deck owner to add new editor
                        payloadCustom.params.mode = 'view';
                    permissionsPromise = context.executeAction(resetPermissions, payloadCustom);
                } else {
                    permissionsPromise = context.executeAction(loadPermissions, payloadCustom);
                }

                permissionsPromise.then(() => {
                    let permissions = context.getStore(PermissionsStore).getState().permissions;
                    //special handling for special case: Link from email for deck owner to add new editor
                    context.dispatch('DECKEDIT_START_QUERY_PARAMS', payload.query);
                    if (payloadCustom.params.mode === 'edit' && (!permissions.edit || permissions.readOnly)){
                        if (!(payloadCustom.params.stype === 'deck' && payload.query.interestedUser))
                            payloadCustom.params.mode = 'view';
                    }
                    
                    let editPermission = (permissions.admin || permissions.edit);
                    payloadCustom.params.nonExamQuestionsOnly = !editPermission;
                    context.executeAction(loadQuestionsCount, payloadCustom);
                    
                    // console.log('now mode is', payloadCustom.params.mode);
                    context.executeAction(loadContent, payloadCustom, callback);
                    
                });
            },
            (callback) => {
                if(runNonContentActions || languageWillChange){
                    context.executeAction(loadDeckTree, payloadCustom, callback);
                }else{
                    callback();
                }
            },
            (callback) => {
                if(runNonContentActions){
                    context.executeAction(loadActivities, payloadCustom, callback);
                }else{
                    callback();
                }
            },
            (callback) => {
                if(runNonContentActions){
                    context.executeAction(loadContentModules, payloadCustom, callback);
                }else{
                    callback();
                }
            },
            (callback) => {
                if(runNonContentActions){
                    context.executeAction(loadLikes, {selector: payload.params}, callback);
                }else{
                    callback();
                }
            },
            (callback) => {
                if(runNonContentActions){
                    const userId = context.getStore(UserProfileStore).getState().userid;
                    if (userId !== undefined && userId !== null && userId !== '') {
                        context.executeAction(getFollowing, {selector: payload.params, userId: userId, followed_type: 'deck'}, callback);
                    } else {
                        callback();
                    }
                }else{
                    callback();
                }
            },
            (callback) => {
                if(runNonContentActions || languageWillChange){
                    //this.context.executeAction(loadContributors, {params: this.props.ContentModulesStore.selector});
                    context.executeAction(loadContributors, payloadCustom, callback);
                }else{
                    callback();
                }
            },
            (callback) => {
                if(runNonContentActions){
                    context.executeAction(loadSimilarContentsSelector, payloadCustom, callback);
                }else{
                    callback();
                }
            },
            (callback) => {
                if(runNonContentActions){

                    if (payload.params.jwt){  //if user is logged
                        payloadCustom.userid = context.getStore(UserProfileStore).getState().userid;
                    }
                    context.executeAction(loadSimilarContents, payloadCustom, callback);
                }else{
                    callback();
                }
            },
            (callback) => {
                //if user is logged is and root deck changed load forks of this deck owned by the user
                if(payload.params.jwt && currentState.selector.id !== payloadCustom.params.id){
                    context.executeAction(loadForks, {
                        selector: payload.params,
                        user: context.getStore(UserProfileStore).getState().userid
                    }, callback);
                }else{
                    callback();
                }
            }
        ],
        // final callback
        (err, results) => {
            if (err) {
                log.error(context, {filepath: __filename});
                context.executeAction(serviceUnavailable, payload, done);
                return;
            }

            if (!context.getStore(DeckTreeStore).getState().isSelectorValid){
                // console.log('loadDeck isSelectorValid=false, selector ', context.getStore(DeckTreeStore).getState().selector, '\npayload: ', payload);
                context.executeAction(notFoundError, payload, done);
                return;
            }
            // context.dispatch('UPDATE_PAGE_TITLE', {
            //     pageTitle: pageTitle
            // });

            if (payload.query.interestedUser)
                context.executeAction(fetchUser, {
                    params: {
                        username: payload.query.interestedUser
                    }
                }, done);
            else {
                if (payload.params.mode !== 'edit') {
                    //Create activity
                    let userId = String(context.getStore(UserProfileStore).userid);
                    if (userId === '') {
                        userId = '0';//Unknown - not logged in
                    }
                    let activity = {
                        activity_type: 'view',
                        user_id: userId,
                        content_id: payload.params.sid,
                        content_kind: payload.params.stype
                    };
                    const contentRootId = payload.params.id;
                    if (!isEmpty(contentRootId)) {
                        activity.content_root_id = contentRootId;
                    }
                    context.executeAction(addActivity, {activity: activity});
                }

                done();
            }
        });
    });
}

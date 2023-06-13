import PropTypes from 'prop-types';
import React from 'react';
import {connectToStores} from 'fluxible-addons-react';
import classNames from 'classnames';
import DeckTreeStore from '../../../stores/DeckTreeStore';
import UserProfileStore from '../../../stores/UserProfileStore';
import Tree from './Tree';
import toggleTreeNode from '../../../actions/decktree/toggleTreeNode';
import focusTreeNode from '../../../actions/decktree/focusTreeNode';
import switchOnActionTreeNode from '../../../actions/decktree/switchOnActionTreeNode';
import renameTreeNode from '../../../actions/decktree/renameTreeNode';
import undoRenameTreeNode from '../../../actions/decktree/undoRenameTreeNode';
import saveTreeNode from '../../../actions/decktree/saveTreeNode';
import deleteTreeNodeAndNavigate from '../../../actions/decktree/deleteTreeNodeAndNavigate';
import addTreeNodeAndNavigate from '../../../actions/decktree/addTreeNodeAndNavigate';
import moveTreeNodeAndNavigate from '../../../actions/decktree/moveTreeNodeAndNavigate';
import PermissionsStore from '../../../stores/PermissionsStore';
import ForkModal from './ForkModal';
import NavigationPanel from './../NavigationPanel/NavigationPanel';
import TranslationStore from '../../../stores/TranslationStore';
import updateTrap from '../../../actions/loginModal/updateTrap';
import { makeNodeURL } from '../../common/Util';
import { Checkbox } from 'semantic-ui-react';
import {FormattedMessage, defineMessages} from 'react-intl';


class TreePanel extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            isForkModalOpen: false,
            showThumbnails: false
        };

        this.messages = defineMessages({
            treePanelHeading:{
                id: 'TreePanel.header',
                defaultMessage: 'List of all slides in this deck'
            },
            tooltipNewTab: {
                id: 'TreePanel.newTab',
                defaultMessage: 'Open slideshow in new tab'
            },
            tooltipForkDeck: {
                id: 'TreePanel.forkDeck',
                defaultMessage: 'Fork deck (create a copy)'
            },
            showThumbnails: {
                id: 'TreePanel.showThumbnails',
                defaultMessage: 'Show Thumbnails',
            }
        });
    }

    componentDidMount() {
        if (window.sessionStorage) {
            let showThumbnails = window.sessionStorage.getItem('DeckTree.ShowThumbnails');
            
            if (showThumbnails) {
                this.setState({showThumbnails: (showThumbnails === 'true')});
            } else {
                window.sessionStorage.setItem('DeckTree.ShowThumbnails', this.state.showThumbnails);
            }
        }
    }

    toggleShowThumbnails() {
        if(window.sessionStorage) {
            window.sessionStorage.setItem('DeckTree.ShowThumbnails', !this.state.showThumbnails);
        }

        this.setState({showThumbnails: !this.state.showThumbnails});
    }

    handleToggleNode(selector) {
        this.context.executeAction(toggleTreeNode, selector);
    }

    handleFocusNode(selector) {
        this.context.executeAction(focusTreeNode, selector);
    }

    handleSwitchOnAction(selector) {
        this.context.executeAction(switchOnActionTreeNode, selector);
    }

    handleRenameNode(selector) {
        this.context.executeAction(renameTreeNode, selector);
    }

    handleUndoRenameNode(selector) {
        this.context.executeAction(undoRenameTreeNode, selector);
    }

    handleSaveNode(selector, oldValue, newValue) {
        this.context.executeAction(saveTreeNode, {
            selector: selector,
            oldValue: oldValue,
            newValue: newValue
        });
    }

    handleAddNode(selector, nodeSpec) {
        this.context.executeAction(addTreeNodeAndNavigate, {selector: selector, nodeSpec: nodeSpec});
    }

    handleDeleteNode(selector) {
        this.context.executeAction(deleteTreeNodeAndNavigate, selector);
    }

    handleFork() {
        if (this.props.UserProfileStore.username !== '')
            this.setState({isForkModalOpen: true});
        else {
            //prepraring the modal
            context.executeAction(updateTrap,{activeTrap: true});
            //hidden the other page elements to readers
            $('#app').attr('aria-hidden','true');

            $('.ui.login.modal').modal('show');
        }
    }
    handlePresentationClick(){
        if(process.env.BROWSER){
            window.open(this.getPresentationHref());
        }
    }

    getPresentationHref(){
        let selector = this.props.DeckTreeStore.selector.toJS();
        selector.subdeck = this.getCurrentSubdeck(selector); //subdeck is not part of the selector from DeckTreeStore, so manually add it

        return makeNodeURL(selector, 'presentation', undefined, this.props.deckSlug, this.props.TranslationStore.currentLang);
    }

    getCurrentSubdeck(selector){
        let currentSubDeck;
        let splitSpath = selector.spath.split(';');

        if(!selector.spath || (splitSpath.length === 1 && selector.stype === 'slide')){
            return null;
        }
        else if(selector.stype === 'deck' && selector.sid){
            return selector.sid;
        }
        else{
            return splitSpath[0].split(':')[0];
        }
    }

    handleTheme() {
        swal({
            title: 'Themes',
            text: 'This feature is still under construction...',
            type: 'info',
            confirmButtonText: 'Confirmed',
            confirmButtonClass: 'positive ui button',
            buttonsStyling: false
        })
            .then(() => {/* Confirmed */}, (reason) => {/* Canceled */});
    }

    handleMoveNode(sourceNode, targetNode, targetIndex) {
        //only when logged in and having rights
        if (this.props.UserProfileStore.username !== '' && this.props.PermissionsStore.permissions.edit && !this.props.PermissionsStore.permissions.readOnly)
            this.context.executeAction(moveTreeNodeAndNavigate, {
                selector: this.props.DeckTreeStore.selector.toJS(),
                sourceNode: sourceNode,
                targetNode: targetNode,
                targetIndex: targetIndex
            });
    }

    handleKeyPress = (event, param, template) => {
        if(event.key === 'Enter'){
            switch (param) {
                case 'handlePresentation':
                    this.handlePresentationClick();
                    break;
                case 'handleFork':
                    this.handleFork();
                    break;
                default:
            }
        }
    }

    render() {
        const treeDIVStyles = {
            maxHeight: 600,
            minHeight: 320,
            overflowY: 'auto',
            padding: 5
        };

        let classes_playbtn = classNames({
            'ui': true,
            'basic': true,
            'attached': true,
            'disabled': false,
            'button': true
        });
        let classes_forksbtn = classNames({
            'ui': true,
            'basic': true,
            'attached': true,
            'disabled': (!this.props.PermissionsStore.permissions.fork && this.props.UserProfileStore.username !== ''),
            'button': true
        });

        let deckTree = this.props.DeckTreeStore.deckTree;
        let selector = this.props.DeckTreeStore.selector;
        let prevSelector = this.props.DeckTreeStore.prevSelector;
        let nextSelector = this.props.DeckTreeStore.nextSelector;
        let rootNode = {'title': deckTree.get('title'), 'id': deckTree.get('id'), 'slug': this.props.DeckTreeStore.slug};
        let rootNodeTitle = <strong>{rootNode.title} </strong>;
        // console.log('TreePanel render decktree infos (decktree, selector)', deckTree, '!!!\n!!!', selector);
        let decktreeError = this.props.DeckTreeStore.error ? this.props.DeckTreeStore.error.msg : 0;

        return (
            <div className="ui container" ref="treePanel" role="navigation">
                <NavigationPanel />

                    <div className="ui attached icon buttons menu">
                        <div 
                            className={classes_playbtn} 
                            aria-label={this.context.intl.formatMessage(this.messages.tooltipNewTab)}
                            tabIndex="0" 
                            role="button" 
                            data-tooltip={this.context.intl.formatMessage(this.messages.tooltipNewTab)}
                            onClick={this.handlePresentationClick.bind(this)} 
                            onKeyPress={(evt) => this.handleKeyPress(evt, 'handlePresentation')}
                        >
                            <i className="circle play large icon"></i>
                        </div>
                        <div 
                            className={classes_forksbtn} 
                            aria-label={this.context.intl.formatMessage(this.messages.tooltipForkDeck)}
                            tabIndex="0" 
                            role="button" 
                            data-tooltip={this.context.intl.formatMessage(this.messages.tooltipForkDeck)}
                            onClick={this.handleFork.bind(this)} 
                            onKeyPress={(evt) => this.handleKeyPress(evt, 'handleFork')}
                        >
                            <i className="large blue fork icon"></i>
                        </div>
                    </div>

                    <div className="ui attached segment" style={treeDIVStyles}>
                        {decktreeError ? <div className="ui error message" style={{
                            'wordBreak': 'break-all',
                            'wordWrap': 'break-word'
                        }}> {decktreeError} </div> : ''}

                        <h1 className="sr-only">
                            {this.context.intl.formatMessage(this.messages.treePanelHeading)}
                        </h1>

                        <Tree deckTree={deckTree} rootNode={rootNode} selector={selector} focusedSelector={this.props.DeckTreeStore.focusedSelector} nextSelector={nextSelector}
                            prevSelector={prevSelector} page={this.props.page}
                            mode={this.props.mode} onToggleNode={this.handleToggleNode.bind(this)} onFocusNode={this.handleFocusNode.bind(this)}
                            onSwitchOnAction={this.handleSwitchOnAction.bind(this)}
                            onRename={this.handleRenameNode.bind(this)}
                            onUndoRename={this.handleUndoRenameNode.bind(this)}
                            onSave={this.handleSaveNode.bind(this)}
                            onAddNode={this.handleAddNode.bind(this)} onDeleteNode={this.handleDeleteNode.bind(this)}
                            onMoveNode={this.handleMoveNode.bind(this)}
                            username={this.props.UserProfileStore.username}
                            permissions={this.props.PermissionsStore.permissions}
                            showThumbnails={this.state.showThumbnails}/>
                    </div>
                    <div className="ui bottom attached segment">
                        <Checkbox 
                            toggle 
                            label={this.context.intl.formatMessage(this.messages.showThumbnails)}
                            onChange={this.toggleShowThumbnails.bind(this)} 
                            checked={this.state.showThumbnails}
                        />
                    </div>

                <ForkModal selector={selector.toJS()} isOpen={this.state.isForkModalOpen} forks={this.props.PermissionsStore.ownedForks} handleClose={() => this.setState({isForkModalOpen: false})} />

            </div>
        );
    }
}

TreePanel.contextTypes = {
    executeAction: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired
};
TreePanel = connectToStores(TreePanel, [DeckTreeStore, UserProfileStore, PermissionsStore, TranslationStore], (context, props) => {
    return {
        DeckTreeStore: context.getStore(DeckTreeStore).getState(),
        UserProfileStore: context.getStore(UserProfileStore).getState(),
        PermissionsStore: context.getStore(PermissionsStore).getState(),
        TranslationStore: context.getStore(TranslationStore).getState()
    };
});
export default TreePanel;

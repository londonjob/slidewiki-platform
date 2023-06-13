import PropTypes from 'prop-types';
import React from 'react';
import {connectToStores} from 'fluxible-addons-react';
import SlideContentView from './SlideContentView';
import SlideViewStore from '../../../../../stores/SlideViewStore';
import DeckTreeStore from '../../../../../stores/DeckTreeStore';
import SlideEditStore from '../../../../../stores/SlideEditStore';
import setDocumentTitle from '../../../../../actions/setDocumentTitle';

class SlideViewPanel extends React.Component {
    constructor(props) {
        super(props);
        this.currentID;
        this.slideContentView = '';
    }
    componentDidMount(){
        this.setTitle();
    }
    componentWillReceiveProps(nextProps) {
        if (this.props.SlideViewStore.content !== nextProps.SlideViewStore.content) {
            this.slideContentView = '';
            this.forceUpdate();
        }
    }
    componentWillMount(){
        const selector = this.props.selector || this.props.DeckTreeStore.selector;
        if (selector && this.currentID !== selector.sid) {
            this.slideContentView = '';
            this.currentID = selector.sid;
            this.forceUpdate();
        }
    }
    componentDidUpdate(){
        const selector = this.props.selector || this.props.DeckTreeStore.selector;
        if (selector && this.currentID !== selector.sid) {
            this.setTitle();
            this.slideContentView = '';
            this.currentID = selector.sid;
        }
    }
    componentWillUnmount() {
    }
    setTitle() {
        const deckTitle = this.props.DeckTreeStore.deckTree.get('title');
        const slideTitle = this.props.SlideEditStore.title;

        this.context.executeAction(setDocumentTitle, { 
            title: `${deckTitle} | ${slideTitle}`
        });
    }
    render() {
        const selector = this.props.selector || this.props.DeckTreeStore.selector;
        let deckTheme = selector && selector.theme;
        if (!deckTheme) {
            // we need to locate the slide in the DeckTreeStore.flatTree and find the theme from there
            let treeNode = this.props.DeckTreeStore.flatTree
                .find((node) => node.get('id') === this.props.SlideViewStore.slideId && node.get('type') === 'slide');

            if (treeNode) {
                deckTheme = treeNode.get('theme');
            } else {
                // pick theme from deck root as a last resort
                deckTheme = this.props.DeckTreeStore.theme;
            }
        }
        if (this.currentID === selector.sid && this.props.SlideViewStore.slideId) {
            let hideSpeakerNotes = true;
            if (this.props.SlideViewStore.speakernotes !== '' && this.props.SlideViewStore.speakernotes !== ' '){hideSpeakerNotes = false;}

            this.slideContentView = (
                <div className="ui bottom attached segment">
                    <SlideContentView content={this.props.SlideViewStore.content}
                            speakernotes={this.props.SlideViewStore.speakernotes}
                            hideSpeakerNotes={hideSpeakerNotes}
                            theme={deckTheme}/>
                </div>);
        } else {
            this.slideContentView = null;
        }
        const loadStyle = {
            minWidth: '100%',
            minHeight: 610,
            overflowY: 'auto',
            overflowX: 'auto',
            position: 'relative'
        };
        return (
            <div className="ui bottom attached segment">
                {this.slideContentView || <div style={loadStyle} className="ui active dimmer"><div className="ui text loader">Loading</div></div>}
            </div>
        );
    }
}

SlideViewPanel.contextTypes = {
    executeAction: PropTypes.func.isRequired
};

SlideViewPanel = connectToStores(SlideViewPanel, [SlideViewStore, DeckTreeStore, SlideEditStore], (context, props) => {
    return {
        SlideViewStore: context.getStore(SlideViewStore).getState(),
        DeckTreeStore: context.getStore(DeckTreeStore).getState(),
        SlideEditStore: context.getStore(SlideEditStore).getState(),
    };
});

export default SlideViewPanel;

import React from 'react';
import ReactList from 'react-list';
import { isEmpty } from '../../../common';
import { makeNodeURL } from '../../common/Util';
import { Button, Icon } from 'semantic-ui-react';
import { connectToStores } from 'fluxible-addons-react';
import ContentStore from '../../../stores/ContentStore';
import ActivityFeedStore from '../../../stores/ActivityFeedStore';

class PresentationsPanel extends React.Component {

    handlePresentationRoomClick(e){
        if(process.env.BROWSER){
            e.preventDefault();
            swal({
                title: 'Please enter a room name',
                input: 'text',
                showCancelButton: true,
                confirmButtonText: 'Next',
                allowOutsideClick: false
            }).then((roomName) => {
                if ( !isEmpty(roomName) ) {
                    let presentationURL = makeNodeURL(this.props.ContentStore.selector, 'presentation', undefined, undefined, undefined);
                    window.open('/presentationbroadcast?room=' + roomName + '&presentation=' + presentationURL.replace('#', '%23'));
                } else
                    swal({title: 'Please enter a valid room name', showConfirmButton: false, timer: 2000}).catch(() => {return true;});
            }).catch((e) => {return true;});
        }
    }

    renderItem(index, key) {
        let url = '/presentationbroadcast?room='+this.props.ActivityFeedStore.presentations[index].roomName+'&presentation=/Presentation/'+this.props.ActivityFeedStore.selector.sid;
        return (
            <div className="ui item" key={key} style={{ margin: '1em 0'}}>
                <div className="ui feed">
                    <div className="event">
                        <div className="activity-icon">
                            <i className="ui large record icon"></i>
                        </div>
                        <div className="content" style={{marginLeft: '1em'}}>
                            <div className="summary">
                                <a target="_blank" href={url} rel="nofollow">{this.props.ActivityFeedStore.presentations[index].roomName} (opened at {new Date(this.props.ActivityFeedStore.presentations[index].openingTime).toLocaleTimeString()})</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    render() {
        const panelDIVStyles = {
            maxHeight: 280,
            overflowY: 'auto'
        };

        let toReturn;
        if(this.props.deckPage)
            toReturn = <Button basic fluid icon labelPosition='left' size='large' onClick={this.handlePresentationRoomClick.bind(this)}><Icon name='sitemap' color='blue'/>Live Session</Button>;
        else
            toReturn = <div ref="presentationPanel">
                <h5 className="ui small header" tabIndex="0">Beta features
                    <i className="yellow warning sign icon"></i>
                </h5>
                <div className="ui basic segment" style={panelDIVStyles}>
                    <h5 className="ui small header" tabIndex="0">Presentations Room
                    </h5>
                    <div className="two column grid">
                        <div className="column">
                            <button style={{marginLeft: '4em'}} onClick={this.handlePresentationRoomClick.bind(this)} className="ui button" type="button" aria-label="Presentation Room Mode, Beta" data-tooltip="Start Presentation Room (beta_)">
                                <i className="record large icon"></i>
                            </button>
                        </div>
                        <div className="column">Create a presentation room to broadcast your slideshow and invite participants</div>
                    </div>
                    <div className="ui divider"></div>
                    <div ref="presentationList">
                        {(this.props.ActivityFeedStore.presentations.length < 1)
                            ?
                            <div>There are currently no live presentations for this deck.</div>
                            :
                            <ReactList ref="infiniteList" className="ui list"
                                itemRenderer={this.renderItem.bind(this)}
                                length={this.props.ActivityFeedStore.presentations.length}
                                type={'simple'}>
                        </ReactList>
                        }
                    </div>
                </div>
            </div>;

        return (<div>
            {toReturn}
            </div>
        );
    }
}

PresentationsPanel = connectToStores(PresentationsPanel, [ActivityFeedStore, ContentStore], (context, props) => {
    return {
        ActivityFeedStore: context.getStore(ActivityFeedStore).getState(),
        ContentStore: context.getStore(ContentStore).getState(),
    };
});

export default PresentationsPanel;

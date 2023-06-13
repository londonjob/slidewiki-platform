import PropTypes from 'prop-types';
import React from 'react';
import { connectToStores } from 'fluxible-addons-react';
import classNames from 'classnames/bind';
import UserGroupsStore from '../../stores/UserGroupsStore';
import UserProfileStore from '../../stores/UserProfileStore';
import GroupStatsStore from '../../stores/GroupStatsStore';
import Info from './Info';
import Menu from './Menu';
import Details from './Details';
import Decks from './Decks';
import GroupStats from './GroupStats';
import GroupCollections from '../DeckCollection/GroupCollections';
import { FormattedMessage, defineMessages } from 'react-intl';
import {navigateAction} from 'fluxible-router';
import { NavLink } from 'fluxible-router';
import setDocumentTitle from '../../actions/setDocumentTitle'; 

class UserGroupPage extends React.Component {
    constructor(props){
        super(props);
    }

    componentDidMount() {
        const label = this.context.intl.formatMessage({
            id: 'UserGroupPage.title',
            defaultMessage: 'Details of user group'
        });
        const title = this.props.UserGroupsStore.currentUsergroup.name;
        this.context.executeAction(setDocumentTitle, { 
            title: `${label} | ${title}`
        });
    }

    showDecks(){
        let group = this.props.UserGroupsStore.currentUsergroup;
        const isCreator = group.creator && group.creator.userid === this.props.UserProfileStore.userid;
        const isAdmin = group.members && group.members.find((m) => {
            return m.userid === this.props.UserProfileStore.userid && (m.role === 'admin');
        });

        return <Decks decks={this.props.UserProfileStore.userDecks}
            decksMeta={this.props.UserProfileStore.userDecksMeta}
            loadMoreLoading={this.props.UserProfileStore.nextUserDecksLoading}
            loadMoreError={this.props.UserProfileStore.nextUserDecksError}
            user={this.props.UserProfileStore.user}
            loggedinuser={this.props.UserProfileStore.username}
            groupid={this.props.UserGroupsStore.currentUsergroup.id}
            isAdmin={ isAdmin }
            isCreator={ isCreator } />;
    }

    showCollections(){
        let group = this.props.UserGroupsStore.currentUsergroup;
        const isCreator = group.creator && group.creator.userid === this.props.UserProfileStore.userid;
        const isAdmin = group.members && group.members.find((m) => {
            return m.userid === this.props.UserProfileStore.userid && (m.role === 'admin');
        });

        return <GroupCollections group={this.props.UserGroupsStore.currentUsergroup}
            isAdmin={ isAdmin }
            isCreator={ isCreator } />;
    }

    showDetails(){
        let group = this.props.UserGroupsStore.currentUsergroup;
        const isCreator = group.creator && group.creator.userid === this.props.UserProfileStore.userid;
        const isAdmin = group.members && group.members.find((m) => {
            return m.userid === this.props.UserProfileStore.userid && (m.role === 'admin');
        });
        const isMember = group.members && group.members.find((m) => {
            return m.userid === this.props.UserProfileStore.userid;
        });

        // sort members by joined, current user first
        if (this.props.UserGroupsStore.currentUsergroup) {
            this.props.UserGroupsStore.currentUsergroup.members.sort((a, b) => {
                if (a.userid === this.props.UserProfileStore.userid) return -1;
                if (b.userid === this.props.UserProfileStore.userid) return 1;
                return a.joined < b.joined ? -1 : 1;
            });
        }

        return <Details currentUsergroup={ this.props.UserGroupsStore.currentUsergroup }
            isAdmin={ isAdmin } isCreator={ isCreator } isMember={isMember}
            saveUsergroupError={this.props.UserGroupsStore.saveUsergroupError}
            username={this.props.UserProfileStore.username}
            displayName={this.props.UserProfileStore.user.displayName}
            user={this.props.UserProfileStore.user}
            userid={this.props.UserProfileStore.userid}
            saveUsergroupIsLoading={this.props.UserGroupsStore.saveUsergroupIsLoading}
            picture={this.props.UserProfileStore.user.picture} />;
    }

    showStats(){
        let group = this.props.UserGroupsStore.currentUsergroup;
        return <GroupStats groupid={this.props.UserGroupsStore.currentUsergroup._id} groupStats={this.props.GroupStatsStore} />;
    }

    chooseView(){
        // console.log('chooseView', this.props.UserGroupsStore.category);
        switch(this.props.UserGroupsStore.category){
            case 'settings':
                return this.showDetails();
            case 'decks':
            case undefined:
                return this.showDecks();
            case 'playlists':
                return this.showCollections();
            case 'stats':
                return this.showStats();
            default:
                return this.showDetails();
        }
    }

    handleGoBack() {
        this.context.executeAction(navigateAction, {url: `/user/${this.props.UserProfileStore.username}/groups/overview`});
    }

    render() {
        let profileClasses = classNames({
            'tablet': true,
            'computer': true,
            'only': true,
            'sixteen': true,
            'wide': true,
            'column': true
        });
        const messages = defineMessages({
            goBack: {
                id: 'UserGroupPage.goBack',
                defaultMessage: 'Return to My Groups List',
            },
        });
        let group = this.props.UserGroupsStore.currentUsergroup;
        const isCreator = group.creator && group.creator.userid === this.props.UserProfileStore.userid;
        const isAdmin = group.members && group.members.find((m) => {
            return m.userid === this.props.UserProfileStore.userid && (m.role === 'admin');
        });
        return (
          <div className = "ui vertically padded stackable grid container" >
              <div className = "four wide column" >
                <div className = "ui stackable grid ">
                  <div className = {profileClasses}>
                      <Info group={ this.props.UserGroupsStore.currentUsergroup } />
                  </div>
                  <div className = "sixteen wide column">
                      {(this.props.UserGroupsStore.currentUsergroup._id && this.props.UserGroupsStore.currentUsergroup._id > 0) ?
                        (<div>
                          <Menu group={ this.props.UserGroupsStore.currentUsergroup }
                            username={this.props.UserProfileStore.username}
                            hasEditRights={isCreator || isAdmin} />
                          <br />
                        </div>)
                      : ''}
                      <div className="ui vertical fluid menu">
                        <NavLink className="item" href={`/user/${this.props.UserProfileStore.username}/groups/overview`} activeStyle={this.styles}>
                          <p>
                            <i className="icon users"/>
                            {this.context.intl.formatMessage(messages.goBack)}
                          </p>
                        </NavLink>
                      </div>
                  </div>
                </div>
              </div>
              <div className = "twelve wide column" >
                  {this.chooseView()}
              </div>
              <div className="ui tab" data-tab="activity"></div>
          </div>
        );
    }
}

UserGroupPage.contextTypes = {
    executeAction: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired
};

UserGroupPage = connectToStores(UserGroupPage, [UserGroupsStore, UserProfileStore, GroupStatsStore], (context, props) => {
    return {
        UserGroupsStore: context.getStore(UserGroupsStore).getState(),
        UserProfileStore: context.getStore(UserProfileStore).getState(),
        GroupStatsStore: context.getStore(GroupStatsStore).getState(),

    };
});

export default UserGroupPage;

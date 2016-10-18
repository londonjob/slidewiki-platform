import React from 'react';
import CategoryBox from './CategoryBox';
import UserSettings from './UserSettings';
import PublicUserData from './PublicUserData';
import PopularDecks from './PopularDecks';
import { navigateAction } from 'fluxible-router';
import { connectToStores } from 'fluxible-addons-react';
import UserProfileStore from '../../../stores/UserProfileStore';
import { isEmpty } from '../../../common';
import { fetchUserDecks } from '../../../actions/user/userprofile/fetchUserDecks';

class UserProfile extends React.Component {
    componentDidMount() {
        //$('.menu .item').tab();
    }

    componentDidUpdate() {
        //$('.menu .item').tab();
    }

    publicOrPrivateProfile() {
        if(this.props.UserProfileStore.toShow !== ''  && this.props.UserProfileStore.username !== ''){
            return (
                <div className = "ui stackable grid page" >
                    <div className = "four wide column" >
                        <CategoryBox toShow = { this.props.UserProfileStore.toShow } username = { this.props.UserProfileStore.user.uname }/>
                        <div className = "ui hidden divider" />
                    </div>
                    <div className = "twelve wide column" >
                        { this.props.UserProfileStore.toShow === 'settings' ? <UserSettings user = { this.props.UserProfileStore.user } dimmer =  {this.props.UserProfileStore.dimmer} failures = { this.props.UserProfileStore.failures }/> : '' }
                        { this.props.UserProfileStore.toShow === 'stats' ? <h3>This feature is curently not implemented. Please wait for future realeses of SlideWiki</h3> : '' }
                    </div>
                </div>
            );
        } else { // just an id
            //<h3>This feature is curently not implemented. Please wait for future realeses of SlideWiki</h3>
            return (
                <div className = "ui stackable grid page" >
                    <div className = "four wide column" >
                        <PublicUserData user={ this.props.UserProfileStore.user }/>
                    </div>
                    <div className = "twelve wide column" >
                        <div className="ui segments">
                            {(this.props.UserProfileStore.userDecks === undefined) ? <div className="ui active dimmer"><div className="ui text loader">Loading</div></div> : ''}
                            <div className="ui secondary segment">
                                <h2>My Decks</h2>
                            </div>
                            <div className="ui segment">
                                <PopularDecks size={0}/>
                            </div>
                        </div>
                    </div>
                    <div className="ui tab" data-tab="activity">
                </div>
            </div>
            );
        }
    }

    render() {
        return (this.publicOrPrivateProfile());
    }
}

UserProfile.contextTypes = {
    executeAction: React.PropTypes.func.isRequired
};
UserProfile = connectToStores(UserProfile, [UserProfileStore], (context, props) => {
    return {
        UserProfileStore: context.getStore(UserProfileStore).getState()
    };
});

export default UserProfile;

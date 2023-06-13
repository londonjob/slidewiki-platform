import React, { Component } from 'react';
import Identicon from 'react-identicons';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import {defineMessages} from 'react-intl';

/**
 * Properties:
 *   picture: either empty or a URL
 *   username: the username, the picture belongs to
 *   link:  true|false - link to the user profile
 *   private: true|false - used on a private page or not
 *   centered: true|false
 *   size: semantic-ui size classes, like mini, tiny, small, medium, large, big, huge, massive
 *   width: positive integer - width of the identicon
 *   avatar:
 */

//change by Ted for testing framework
//class UserPicture extends Component {

class UserPicture extends React.Component {
    render() {
        let classes = classNames({
            'ui': true,
            'mini': this.props.size === 'mini',
            'tiny': this.props.size === 'tiny',
            'small': this.props.size === 'small',
            'medium': this.props.size === 'medium',
            'large': this.props.size === 'large',
            'big': this.props.size === 'big',
            'huge': this.props.size === 'huge',
            'massive': this.props.size === 'massive',
            'centered': this.props.centered,
            'avatar': this.props.avatar,
            'rounded': true,
            'bordered': this.props.bordered !== null ? this.props.bordered : true, //bordered by default
            'image': true,
        });
        let picture = '';
        let messages = defineMessages({
            userPictureAlt : {
                id: 'userPicture.alt',
                defaultMessage:'User profile image'
        }});

        let width = this.props.width;
        if (this.props.picture === '' || !this.props.picture) {
            let styles = {width: width, height: width};
            picture = <div className={ classes } style={ styles }><Identicon string={this.props.username} size={width} count={5} /></div>;
        } else if (this.props.picture.includes('gravatar')) {
            if (this.props.private)
                picture = <div data-tooltip="Not your picture? Please use your gravatar email." data-position="top center" data-inverted=""><img src={ this.props.picture } className={ classes } alt={this.context.intl.formatMessage(messages.userPictureAlt)} /></div>;
            else
                picture = <img src={ this.props.picture } className={ classes } alt={this.context.intl.formatMessage(messages.userPictureAlt)} />;
        } else
            picture = <img src={ this.props.picture } className={ classes } alt={this.context.intl.formatMessage(messages.userPictureAlt)} />;
        return (
        <div > { this.props.link ? <a href={ '/user/' + this.props.username }>picture</a> : picture}</div>
        );
    }
}

UserPicture.contextTypes = {
    intl: PropTypes.object.isRequired
};

export default UserPicture;

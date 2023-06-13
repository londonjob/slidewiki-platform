import React from 'react';
import {Card} from 'semantic-ui-react';;
import { NavLink } from 'fluxible-router';
import { Grid, Divider, Button, Header, Image, Icon, Item, Label, Menu, Segment, Container } from 'semantic-ui-react';
import PropTypes from 'prop-types';

import { connectToStores } from 'fluxible-addons-react';
import ContentStore from '../../stores/ContentStore';
import DeckPageStore from '../../stores/DeckPageStore';
import DeckViewStore from '../../stores/DeckViewStore';
import ContentLikeStore from '../../stores/ContentLikeStore';
import ContentModulesStore from '../../stores/ContentModulesStore';
import TranslationStore from '../../stores/TranslationStore';
import SimilarContentStore from '../../stores/SimilarContentStore';

import CustomDate from './util/CustomDate';
import {getLanguageDisplayName, getLanguageName, isEmpty} from '../../common';
import { flagForLocale } from '../../configs/locales';
import { Microservices } from '../../configs/microservices';

import CCBYSA from '../common/CC-BY-SA';
import ReportModal from '../Report/ReportModal';
import openReportModal from '../../actions/report/openReportModal';
import TagList from './ContentModulesPanel/TagsPanel/TagList';
import PresentationsPanel from './InfoPanel/PresentationsPanel';
import ActivityFeedPanel from './ActivityFeedPanel/ActivityFeedPanel';

import { getEducationLevel } from '../../lib/isced';
import lodash from 'lodash';
import slugify from 'slugify';
import {FormattedMessage, defineMessages} from 'react-intl';
import setDocumentTitle from '../../actions/setDocumentTitle';

class DeckLandingPage extends React.Component {

    getPresentationHref() {
        let selector = this.props.DeckPageStore.selector;
        let presentationUrlParts = ['/presentation', selector.id, this.props.DeckPageStore.deckSlug || '_'];

        if (selector.spath.search(';') !== -1) {
            // if a subdeck is selected - use its selector
            presentationUrlParts.push(selector.spath.substring(0, selector.spath.search(';')));
        } else {
            // if it is the main/root deck - use that id
            presentationUrlParts.push(selector.id);
        }

        if (selector.stype === 'slide'){
            // if it is a slide, also add ID of slide
            presentationUrlParts.push(selector.sid);
        }

        let presLocation = presentationUrlParts.join('/');

        if (this.props.TranslationStore.currentLang) {
            presLocation += '?language=' + (this.props.TranslationStore.currentLang);
        }

        return presLocation;
    }

    getPlaceholder() {
        return (
            <Container fluid>
                <Divider hidden/>
                <Grid padded='vertically' divided='vertically' stackable>
                    <Grid.Column only="tablet computer" tablet={1} computer={2}>
                    </Grid.Column>

                    <Grid.Column mobile={16} tablet={14} computer={12}>
                        <Grid.Row>
                            <Segment>
                                <Grid stackable>
                                    <Grid.Column width={4}>
                                        <div className="ui placeholder">
                                            <div className="rectangular image"></div>
                                        </div>
                                    </Grid.Column>
                                    <Grid.Column width={12}>
                                        <Grid.Row>
                                            <div className="ui placeholder">
                                                <div className="header">
                                                    <div className="long line"></div>
                                                    <div className="long line"></div>
                                                </div>
                                            </div>
                                        </Grid.Row>
                                        <Divider hidden />
                                        <Grid stackable>
                                            <Grid.Row columns={2}>
                                                <Grid.Column>
                                                    <div className="ui placeholder">
                                                        <div className="line"></div>
                                                        <div className="line"></div>
                                                        <div className="line"></div>
                                                    </div>
                                                </Grid.Column>
                                                <Grid.Column>
                                                    <div className="ui placeholder">
                                                        <div className="line"></div>
                                                        <div className="line"></div>
                                                    </div>
                                                </Grid.Column>
                                            </Grid.Row>
                                            <Divider hidden />
                                            <Grid.Row>
                                                <Grid.Column>
                                                    <div className="ui placeholder">
                                                        <div className="header">
                                                            <div className="line"></div>
                                                        </div>
                                                        <div className="paragraph">
                                                            <div className="line"></div>
                                                            <div className="line"></div>
                                                        </div>
                                                    </div>
                                                </Grid.Column>
                                            </Grid.Row>
                                            <Divider hidden />
                                            <Grid.Row>
                                                <Grid.Column>
                                                    <div className="ui placeholder">
                                                        <div className="header">
                                                            <div className="line"></div>
                                                        </div>
                                                        <div className="paragraph">
                                                            <div className="line"></div>
                                                        </div>
                                                    </div>
                                                </Grid.Column>
                                            </Grid.Row>
                                        </Grid>
                                    </Grid.Column>
                                </Grid>
                            </Segment>
                        </Grid.Row>
                        <Grid.Row>
                            <div className="ui bottom attached tabular menu" style={{'background': '#e0e1e2'}}>
                                <div className="ui icon buttons huge attached">
                                    <Button icon size="huge">
                                        <Icon name="line graph" />
                                    </Button>
                                    <Button icon size="huge">
                                        <Icon name="warning circle" />
                                    </Button>
                                </div>

                                <div className="right inverted menu">
                                    <div className="ui icon buttons huge attached">
                                        <Button icon size="huge">
                                            <Icon name="open folder" />
                                        </Button>
                                        <Button icon size="huge">
                                            <Icon name="play circle" />
                                        </Button>
                                        <Button icon size="huge">
                                            <Icon name="record" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Grid.Row>

                        <Divider hidden />

                        <Grid divided='vertically' stackable>
                            <Grid.Column only="tablet computer" width={12}>
                                <Segment attached='top' >
                                    <div className="ui placeholder">
                                        <div className="header">
                                            <div className="line"></div>
                                        </div>
                                        <div className="paragraph">
                                            <div className="long line"></div>
                                        </div>
                                    </div>
                                </Segment>
                                <Segment attached>
                                    <div className="ui placeholder">
                                        <div className="header">
                                            <div className="line"></div>
                                        </div>
                                        <div className="paragraph">
                                            <div className="long line"></div>
                                        </div>
                                    </div>
                                </Segment>
                                <Segment attached='bottom'>
                                    <div className="ui placeholder">
                                        <div className="header">
                                            <div className="line"></div>
                                        </div>
                                        <div className="paragraph">
                                            <div className="long line"></div>
                                        </div>
                                    </div>
                                </Segment>
                            </Grid.Column>
                            <Grid.Column only="tablet computer" width={4}>
                                <Segment>
                                    <div className="ui fluid placeholder">
                                    </div>
                                </Segment>
                                <Segment attached='bottom'>
                                    <a href='https://creativecommons.org/licenses/by-sa/4.0/' target='_blank' role="img" aria-label="Creative Commons License logo">
                                        <CCBYSA size='small' />
                                    </a>
                                    <FormattedMessage id='deck.landingpage.license_text' defaultMessage='This work is licensed under'/> <a href='https://creativecommons.org/licenses/by-sa/4.0/' target='_blank'>Creative Commons Attribution-ShareAlike 4.0 International License</a>
                                </Segment>
                            </Grid.Column>
                        </Grid>

                    </Grid.Column>

                    <Grid.Column only="tablet computer" tablet={1} computer={2}>
                    </Grid.Column>

                </Grid>
            </Container>
        );
    }

    componentDidMount() {
        this.setTitle();
    }

    componentDidUpdate(prevProps) {
        if (this.props.DeckViewStore.deckData.title !== prevProps.DeckViewStore.deckData.title) {
            this.setTitle();
        }
    }

    setTitle = () => {
        this.context.executeAction(setDocumentTitle, { 
            title: this.context.intl.formatMessage({
                id: 'DeckLandingPage.title',
                defaultMessage: 'Presentation information'
            }) + ' | ' + this.props.DeckViewStore.deckData.title
        });
    }

    render() {
        let deckData = this.props.DeckViewStore.deckData;
        if (lodash.isEmpty(deckData)) return this.getPlaceholder();

        let firstSlide = (this.props.DeckViewStore.slidesData && this.props.DeckViewStore.slidesData.children && this.props.DeckViewStore.slidesData.children[0]);
        const totalSlides = lodash.get(this.props.DeckViewStore.slidesData, 'children.length', undefined);

        let deckThumbURL = firstSlide && `${Microservices.file.uri}/thumbnail/slide/${firstSlide.id}`;
        if (deckThumbURL && firstSlide.theme) {
            deckThumbURL += '/' + firstSlide.theme;
        }
        //let deckThumbAlt = firstSlide && (firstSlide.title ? firstSlide.title + ' | ' + firstSlide.id : firstSlide.id);
        let deckThumbAlt = `Example of presentation: ${deckData.title}`;

        let deckSlug = this.props.DeckPageStore.deckSlug || '_';
        let selector = this.props.DeckPageStore.selector;
        let openDeckUrl = ['', 'deck', selector.id , deckSlug, 'deck', selector.id].join('/');
        if (this.props.TranslationStore.currentLang) {
            openDeckUrl += '?language=' + (this.props.TranslationStore.currentLang);
        }

        let presentationUrl = this.getPresentationHref();

        let deckStatsUrl = ['', 'deck', selector.id , deckSlug, 'stats'].join('/');

        let deckTags = deckData.tags || [];
        let deckTopics = deckData.topics || [];

        let deckVariantSlugs = this.props.TranslationStore.nodeVariants.reduce((result, variant) => {
            result[variant.language] = variant.title ? slugify(variant.title).toLowerCase() : deckSlug;
            return result;
        }, {});

        let deckLanguages = [this.props.TranslationStore.treeLanguage, ...this.props.TranslationStore.treeTranslations];

        let owner = this.props.DeckViewStore.ownerData;
        let creator = this.props.DeckViewStore.creatorData;

        let originInfo = null;
        let originCreator = this.props.DeckViewStore.originCreatorData;
        if (deckData.origin) {
            originInfo = (
                <div className="meta" tabIndex="0">
                    <strong>Origin: </strong>
                    <NavLink href={['/deck', deckData.origin.id + '-' + deckData.origin.revision, deckData.origin.slug].join('/')}>{deckData.origin.title}</NavLink>
                    {originCreator ? ' by ' : ''}
                    {originCreator && <a href={'/user/' + originCreator.username}>{originCreator.displayName || originCreator.username}</a>}
                    {/* TODO check if this URL is working with languages! */}
                </div>
            );
        }

        const ColPadding = {
            paddingLeft: '0px'
        };

        let interestedInDecks = 'No decks to show';
        if (this.props.SimilarContentStore.contents && this.props.SimilarContentStore.contents.length >= 1) {
            interestedInDecks =  this.props.SimilarContentStore.contents.map((deck, i) => {
                return <Grid.Column key={i} width={5}>
                    <div className="ui card">
                        <NavLink href={`/deck/${deck.deckId}`}>
                                <div className="ui image fluid bordered">
                                    <img src={`${Microservices.file.uri}/thumbnail/slide/${deck.firstSlideId}`}  aria-hidden="true" tabIndex="-1" alt=' ' />
                                </div>
                                <h4 className="header">
                                    {deck.title}
                                </h4>
                        </NavLink>
                    </div>
                </Grid.Column>;
            });
            interestedInDecks = <Grid stackable> {interestedInDecks} </Grid>;
        }
        const messages = defineMessages({
            tooltipStats: {
                id: 'deck.landing.tooltip.stats',
                defaultMessage: 'Deck Stats'
            },
            tooltipOpen: {
                id: 'deck.landing.tooltip.open',
                defaultMessage: 'Open Deck'
            },
            tooltipSlideshow: {
                id: 'deck.landing.tooltip.slideshow',
                defaultMessage: 'Open Slideshow'
            },
        });
        return (
            <div>
                <Container fluid>

                    <Grid padded='vertically' divided='vertically' stackable>
                        <Grid.Column only="tablet computer" tablet={1} computer={2}>
                        </Grid.Column>

                        <Grid.Column mobile={16} tablet={14} computer={12}>
                            <Grid.Row>
                                <Segment attached="top">
                                    <Grid stackable>
                                        <Grid.Column width={4}>
                                            <NavLink className="image" aria-hidden tabIndex='-1' href={openDeckUrl}>
                                                <Image src={deckThumbURL} alt={deckThumbAlt}
                                                       size='large' bordered spaced />
                                            </NavLink>
                                        </Grid.Column>
                                        <Grid.Column width={12}>
                                            <div className="row">
                                                <Header as="h1" id="main">
                                                    <NavLink href={openDeckUrl}>{deckData.title}</NavLink>
                                                    <span className="sr-only"><FormattedMessage id='deck.landing.deckStatus.text' defaultMessage='Deck status'/>: </span>
                                                    {(!deckData.hidden) ? <Label as="span" color='green'><FormattedMessage id='deck.landing.deckStatus.published' defaultMessage='Published'/></Label> : <Label as="span" color='pink'>Unlisted</Label>}</Header>
                                            </div>
                                            <Divider hidden />
                                            <div className="ui stackable grid container">
                                                <div className="two column row">
                                                    <div className="column" style={ColPadding}>
                                                        <div className="item">
                                                            <div className="meta"><strong><FormattedMessage id='deck.landing.creator' defaultMessage='Creator'/>:</strong> <NavLink href={'/user/' + creator.username}>{creator.displayName || creator.username}</NavLink></div>
                                                            {originInfo}
                                                            <div className="meta"><strong><FormattedMessage id='deck.landing.lastModified' defaultMessage='Last Modified'/>:&nbsp;</strong>{CustomDate.format(deckData.lastUpdate, 'Do MMMM YYYY')}</div>
                                                        </div>
                                                    </div>
                                                    <div className="column">
                                                        <h2 className="sr-only"><FormattedMessage id='deck.landing.deckMetadata' defaultMessage='Deck metadata'/></h2>
                                                        <div className="row">
                                                            <div className="ui medium labels" >
                                                                <div className="ui label" >
                                                                    <i className="comments icon" aria-label="Default language"></i>{getLanguageDisplayName(deckData.language)}
                                                                </div>
                                                                <div className="ui label" >
                                                                    <i className="block layout icon" aria-label="Number of slides"></i>{totalSlides}
                                                                </div>
                                                                { deckData.educationLevel &&
                                                                <div className="ui label" >
                                                                    <i className="university icon" aria-label="Education Level"></i>{getEducationLevel(deckData.educationLevel)}
                                                                </div>
                                                                }
                                                            </div>
                                                        </div>
                                                        <div className="row">
                                                            <div className="ui medium labels">
                                                                <div className="ui label" >
                                                                    <i className="fork icon" aria-label="Number of forks"></i>{deckData.forkCount}</div>
                                                                <div className="ui label" >
                                                                    <i className="thumbs up icon" aria-label="Number of likes"></i>{this.props.ContentLikeStore.usersWhoLikedDeck.length}</div>
                                                                <div className="ui label" >
                                                                    <i className="share alternate icon" aria-label="Number of shares"></i>{deckData.shareCount}</div>
                                                                <div className="ui label" >
                                                                    <i className="download icon" aria-label="Number of downloads"></i>{deckData.downloadCount}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="row" >
                                                    <div className="item">
                                                        <div className="meta"><strong><FormattedMessage id='deck.landing.description' defaultMessage='Description'/>:</strong>
                                                            <div className="description" >{deckData.description}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="row" >
                                                    { deckTopics.length > 0 &&
                                                    <div className="item">
                                                        <div className="meta"><strong><FormattedMessage id='deck.landing.subject' defaultMessage='Subject'/>:&nbsp;</strong></div>
                                                        <div className="description">{ deckTopics.map((t, i) =>
                                                            <span key={i}>
                                                              { !!i && ',\xa0' }
                                                                <a target="_blank" href={`/deckfamily/${t.tagName}`}>{t.defaultName || t.tagName}</a>
                                                          </span>
                                                        ) }
                                                        </div>
                                                    </div>
                                                    }
                                                </div>
                                            </div>
                                        </Grid.Column>
                                    </Grid>
                                </Segment>
                                <div className="ui bottom attached menu" style={{'background': '#e0e1e2'}} id="navigation">
                                    <div className="ui icon buttons huge attached">
                                        <NavLink href={deckStatsUrl} tabIndex={-1} >
                                            <Button icon size="huge" aria-label="Deck Stats" data-tooltip={this.context.intl.formatMessage(messages.tooltipStats)}>
                                                <Icon name="line graph" />
                                            </Button>
                                        </NavLink>
                                    </div>
                                    <ReportModal/>
                                    <div className="right inverted menu">
                                        <div className="ui icon buttons huge attached">
                                            <NavLink href={openDeckUrl} tabIndex={-1} >
                                                <Button icon size="huge" aria-label="Open Deck" data-tooltip={this.context.intl.formatMessage(messages.tooltipOpen)}>
                                                    <Icon name="open folder" />
                                                </Button>
                                            </NavLink>
                                            <a target="_blank" href={presentationUrl} tabIndex={-1} >
                                                <Button icon size="huge" aria-label="Open slideshow in new tab" data-speech-id="openSlideshow" data-tooltip={this.context.intl.formatMessage(messages.tooltipSlideshow)}>
                                                    <Icon name="play circle" />
                                                </Button>
                                            </a>
                                            <PresentationsPanel deckPage={true} />
                                        </div>
                                    </div>
                                </div>
                            </Grid.Row>

                            <Divider hidden />

                            <Grid divided='vertically' stackable>
                                <Grid.Column only="tablet computer" width={12}>
                                    <Segment attached='top' >
                                        <Header size="small" as="h3"><FormattedMessage id='deck.landing.available_languages.text' defaultMessage='Available in the following languages'/>:</Header>
                                        { deckLanguages.map((lang, i) =>
                                            <span key={i}>
                                                {!!i && ',\xa0'}
                                                <NavLink href={['', 'deck', selector.id , deckVariantSlugs[lang] || '_'].join('/') + '?language=' + lang}>
                                                    <i className={ (flagForLocale(lang) || 'icon') + ' flag' }/>
                                                    { getLanguageDisplayName(lang) }
                                                </NavLink>
                                            </span>
                                        ) }
                                    </Segment>
                                    <Segment attached>
                                        <Header size="small" as="h3"><FormattedMessage id='deck.landing.tags.text' defaultMessage='Tags'/>:</Header>
                                        {(deckTags.length === 0) ? <div><FormattedMessage id='deck.landing.tags.not_available' defaultMessage='There are no tags assigned to this deck.'/></div> : <TagList items={deckTags} editable={false}/>}
                                    </Segment>
                                    <Segment attached='bottom'>
                                        <Header size="small" as="h3"><FormattedMessage id='deck.other_interesting.text' defaultMessage='You may also be interested in'/>:</Header>
                                        {interestedInDecks}
                                    </Segment>
                                </Grid.Column>
                                <Grid.Column only="tablet computer" width={4}>
                                    <Segment>
                                        <ActivityFeedPanel /></Segment>
                                    <Segment attached='bottom'>
                                        <a href='https://creativecommons.org/licenses/by-sa/4.0/' target='_blank' role="img" aria-label="Creative Commons License logo">
                                            <CCBYSA size='small' />
                                        </a>
                                        <FormattedMessage id='deck.landing.landingpage.license_text' defaultMessage='This work is licensed under'/> <a href='https://creativecommons.org/licenses/by-sa/4.0/' target='_blank'>Creative Commons Attribution-ShareAlike 4.0 International License</a>
                                    </Segment>
                                </Grid.Column>
                            </Grid>

                        </Grid.Column>

                        <Grid.Column only="tablet computer" tablet={1} computer={2}>
                        </Grid.Column>

                    </Grid>
                </Container>
            </div>
        );
    }
}

DeckLandingPage.contextTypes = {
    intl: PropTypes.object.isRequired,
    executeAction: PropTypes.func.isRequired
};

DeckLandingPage = connectToStores(DeckLandingPage, [
    ContentStore,
    ContentLikeStore,
    DeckPageStore,
    DeckViewStore,
    TranslationStore,
    ContentModulesStore,
    SimilarContentStore,
], (context, props) => {
    return {
        ContentStore: context.getStore(ContentStore).getState(),
        ContentLikeStore: context.getStore(ContentLikeStore).getState(),
        DeckPageStore: context.getStore(DeckPageStore).getState(),
        DeckViewStore: context.getStore(DeckViewStore).getState(),
        TranslationStore: context.getStore(TranslationStore).getState(),
        ContentModulesStore: context.getStore(ContentModulesStore).getState(),
        SimilarContentStore: context.getStore(SimilarContentStore).getState(),
    };
});

export default DeckLandingPage;

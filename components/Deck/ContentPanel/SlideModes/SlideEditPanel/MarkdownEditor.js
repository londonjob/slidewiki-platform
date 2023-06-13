import PropTypes from 'prop-types';
import React from 'react';
import {NavLink, navigateAction} from 'fluxible-router';
import {connectToStores} from 'fluxible-addons-react';
import SlideContentView from '../SlideViewPanel/SlideContentView';
import SlideEditStore from '../../../../../stores/SlideEditStore';
import DataSourceStore from '../../../../../stores/DataSourceStore';
import SlideViewStore from '../../../../../stores/SlideViewStore';
import UserProfileStore from '../../../../../stores/UserProfileStore';
import DeckTreeStore from '../../../../../stores/DeckTreeStore';
import showdown from 'showdown';
import turndown from 'turndown';
import Util from '../../../../common/Util';
import saveSlide from '../../../../../actions/slide/saveSlide';
import { Button, Icon, Dropdown, Dimmer, Loader } from 'semantic-ui-react';
import registerChange from '../../../../../actions/slide/registerChange';
import ReactDOMServer from 'react-dom/server';
import uploadMediaFiles from '../../../../../actions/media/uploadMediaFiles';
import MediaStore from '../../../../../stores/MediaStore';
import { defineMessages } from 'react-intl';

let converter = new showdown.Converter();
converter.setOption('tables', true);
converter.setOption('tasklists', 'true');
converter.setOption('smoothLivePreview', 'true');
converter.setOption('ghMentions', 'true');
converter.setOption('openLinksInNewWindow', 'true');
converter.setOption('emoji', 'true');
converter.setOption('underline', 'true');
converter.setOption('strikethrough', 'true');
converter.setOption('literalMidWordUnderscores', 'true');
converter.setOption('simplifiedAutoLink', 'true');
converter.setOption('simpleLineBreaks', 'true');
let t_converter = new turndown();

class MarkdownEditor extends React.Component {
    constructor(props) {
        super(props);
        let htmlContent = this.props.content;
        let markdownContent = this.props.markdown.trim();

        //if no markdown is provided, we can try to make an estimate
        if(htmlContent && (!markdownContent || markdownContent==='')){
            markdownContent = t_converter.turndown(htmlContent);
        }

        this.state = {
            markdownContent: markdownContent, 
            htmlContent: htmlContent, 
            title: this.props.title,
            loading: false,
        };
        this.messages = defineMessages({
            markdown_area:{
                id:'markdownArea.text_area',
                defaultMessage:'Markdown Editor'
            }});
    }
    handleChange(event) {
        let value = this.state.markdownContent;
        if (event) {
            value = event.target.value;
        }
        this.setChanges(true);

        if(value.trim()){
            let html = converter.makeHtml(value);
            //add especial classes for Neo4j Cypher language
            html = html.replace(/<pre>(.*?)<code class="cypher language-cypher">/g, '<pre mode="cypher" class="highlight pre-scrollable code runnable standalone-example ng-binding"><code class="cypher language-cypher">');
            this.setState({markdownContent: value, htmlContent: html, title: (this.props.title === this.state.title ? this.state.title : this.props.title)});
        }
    }
    componentDidMount(){
        //to re-scale
        this.forceUpdate();
    }
    handleSaveButton(){
        if (this.props.UserProfileStore.username !== '') {
            //update store
            let title = this.props.title;
            let content = this.state.htmlContent;
            let markdown = this.state.markdownContent;
            let speakernotes = this.props.speakernotes;
            this.props.SlideEditStore.title = title;
            this.props.SlideEditStore.content = content;
            this.props.SlideEditStore.speakernotes = speakernotes;
            let currentSelector = this.props.selector;
            let deckID = currentSelector.id;
            let dataSources = (this.props.DataSourceStore.dataSources !== undefined) ? this.props.DataSourceStore.dataSources : [];
            let tags = this.props.SlideViewStore.tags? this.props.SlideViewStore: [];

            this.context.executeAction(saveSlide, {
                id: currentSelector.sid,
                deckID: deckID,
                title: title,
                content: content,
                markdown: markdown,
                speakernotes: speakernotes,
                dataSources: dataSources,
                selector: currentSelector,
                tags: tags
            });
        }
        return false;
    }
    componentWillReceiveProps(nextProps) {
        if (nextProps.content !== this.props.content) {
            let htmlContent = nextProps.content;
            let markdownContent = nextProps.markdown.trim();
            
            if(nextProps.content && (!markdownContent || markdownContent==='')){
                markdownContent = t_converter.turndown(htmlContent);
            }

            this.setState({
                htmlContent: htmlContent,
                markdownContent: markdownContent,
            });
        }
        if (nextProps.SlideEditStore.saveSlideClick === 'true')
        {
            this.handleSaveButton();
        }
        if (nextProps.SlideEditStore.cancelClick === 'true')
        {
            const nodeURL = Util.makeNodeURL(nextProps.SlideEditStore.selector, nextProps.SlideEditStore.selector.page, 'view');
            this.context.executeAction(navigateAction, {
                url: nodeURL
            });
        }
        if (nextProps.MediaStore.file.thumbnailUrl && nextProps.MediaStore.file.thumbnailUrl !== this.props.MediaStore.file.thumbnailUrl) {
            this.wrapText(`![Image description](${nextProps.MediaStore.file.thumbnailUrl} =150x*)`);

            this.setState({
                loading: false
            });
        }
    }
    // TODO: ensure this is tested in other browsers then Chrome (probably some changes are needed for IE)
    wrapText = (openTag, closeTag = '') => {
        let textArea = this.refs.markdownTextarea;
        let len = textArea.value.length;
        let start = textArea.selectionStart;
        let end = textArea.selectionEnd;
        let selectedText = textArea.value.substring(start, end);
        let replacement = openTag + selectedText + closeTag;
        let value = textArea.value.substring(0, start) + replacement + textArea.value.substring(end, len);

        this.setState({
            markdownContent: value
        }, () => {
            // set selection when state has changed
            textArea.focus();
            textArea.setSelectionRange(start + openTag.length, end + openTag.length);
            this.handleChange();
        });
    }

    setChanges = (value) => {
        this.context.executeAction(registerChange, { hasChanges: value });
    };

    openCheatSheet = () => {
        let dialogContent = <div style={{textAlign:'left', marginTop: 20}}>
            <div className="ui grid">
                <hr style={{width:'100%'}} />
                <div className="eight wide column">
                    <h4>Headings</h4>
                    <ul>
                        <li><strong>#</strong> Large heading</li>
                        <li><strong>###</strong> Middle heading</li>
                        <li><strong>#####</strong> Small heading</li>
                    </ul>

                    <h4>Lists</h4>
                    <ul>
                        <li>Unordered: <br /><ul><li><strong>* Item</strong></li><li><strong>* Item</strong></li></ul></li>
                        <li>Ordered: <br /><ul><li><strong>1. Item</strong></li><li><strong>2. Item</strong></li></ul></li>
                    </ul>
                </div>
                <div className="eight wide column">
                    <h4>Text formatting</h4>
                    <ul>
                        <li><strong>**Strong**</strong></li>
                        <li><strong>*Italic*</strong></li>
                        <li><strong>__Underline__</strong></li>
                        <li><strong>~~Strikethrough~~</strong></li>
                    </ul>

                    <h4>Miscellaneous</h4>
                    <ul>
                        <li>Link: <strong>[Link text](www.example.com)</strong></li>
                        <li>Image: <strong>*[Alt description](www.example.com/img.png)</strong></li>
                        <li>Quote: <strong>&gt; Text</strong></li>
                        <li>Code block: <strong>&#96;Code&#96;</strong></li>
                        <li>Horizontal line: <strong>---</strong></li>
                    </ul>
                </div>
            </div>
        </div>;

        swal({
            title: 'Markdown cheat sheet',
            html: ReactDOMServer.renderToStaticMarkup(dialogContent), //swal doesn't support jsx, so use React function to convert to HTML
            //type: 'question',
            confirmButtonText: 'Close',
            confirmButtonClass: 'grey ui button',
            allowEscapeKey: false,
            allowOutsideClick: false,
            buttonsStyling: false,
            showCloseButton: true,
            showCancelButton: false,
            width: 900,
        })
        .then(() => {
            //nothing
        });
    }

    handleOnDrop = (e) => {
        e.stopPropagation();
        e.preventDefault();

        let dt = e.dataTransfer;
        let files = dt.files;

        if (files.length !== 1) {
            return;
        }

        this.setState({
            loading: true
        });

        let file = files[0];
        let fileType = file.type;
        let reader = new FileReader();

        reader.onloadend = (evt) => {
            if (evt.target.readyState === FileReader.DONE) {
                let payload = {
                    type: file.type,
                    license: '',
                    copyrightHolder: '',
                    title: file.name,
                    text: '',
                    filesize: file.size,
                    filename: file.name,
                    checkbox_backgroundImage: false,
                    bytes: null
                };

                if (fileType === 'image/svg+xml') {
                    payload.bytes = atob(reader.result.split('base64,')[1]);
                    payload.svg = payload.bytes;
                } else {
                    payload.bytes = reader.result;
                }

                this.context.executeAction(uploadMediaFiles, payload);
            }
        };

        reader.onerror = (err) => {
            swal({
                title: this.context.intl.formatMessage('Error'),
                text: this.context.intl.formatMessage('Error'),
                type: 'error',
                confirmButtonText: 'Close',
                confirmButtonClass: 'negative ui button',
                allowEscapeKey: false,
                allowOutsideClick: false,
                buttonsStyling: false
            })
            .then(() => {
                return true;
            });
        };

        reader.readAsDataURL(file);
    }

    handleOnDragOver = (e) => {
        e.stopPropagation();
        e.preventDefault();
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
        deckTheme = deckTheme ? deckTheme : ''; // no theme has been found, used empty string for the default theme
        
        return (
            <div ref='markdownEditor' id='markdownEditor' style={{minHeight: '500px'}}>
                <div className="ui stackable equal width left aligned padded grid">
                  <div className="row" style={{paddingBottom:5}}>
                    <div className="column form field ui">
                        <Button.Group>
                            <Dropdown button icon="heading" className="icon small" aria-label="Insert heading">
                                <Dropdown.Menu>
                                    <Dropdown.Item text='Heading 1' onClick={(e) => this.wrapText('# ')}/>
                                    <Dropdown.Item text='Heading 2' onClick={(e) => this.wrapText('## ')}/>
                                    <Dropdown.Item text='Heading 3' onClick={(e) => this.wrapText('##### ')}/>
                                </Dropdown.Menu>
                            </Dropdown>
                            <Button onClick={(e) => this.wrapText('**', '**')} icon size="small" aria-label="Make selected text bold"><Icon name="bold" /></Button>
                            <Button onClick={(e) => this.wrapText('*', '*')} icon size="small" aria-label="Make selected text italic"><Icon name="italic" /></Button>
                            <Button onClick={(e) => this.wrapText('__', '__')} icon size="small" aria-label="Make selected text underlined"><Icon name="underline" /></Button>
                        </Button.Group>
                        {' '}
                        <Button.Group>
                            <Button onClick={(e) => this.wrapText('* ')} icon size="small" aria-label="Make an unordered list"><Icon name="list" /></Button>
                            <Button onClick={(e) => this.wrapText('1. ')} icon size="small" aria-label="Make an ordered list"><Icon name="list ol" /></Button>
                        </Button.Group>
                        {' '}
                        <Button.Group>
                            <Button onClick={(e) => this.wrapText('[', '](url)')} icon size="small" aria-label="Insert a link"><Icon name="linkify" /></Button>
                            <Button onClick={(e) => this.wrapText('![', '](https://example.com/img.png)')} icon size="small" aria-label="Insert an image"><Icon name="file image" /></Button>
                            <Button onClick={(e) => this.wrapText('> ',)} icon size="small" aria-label="Insert a quote block"><Icon name="quote left" /></Button>
                            <Button onClick={(e) => this.wrapText('`', '`')} icon size="small" aria-label="Insert a code block"><Icon name="code" /></Button>
                        </Button.Group>
                        {' '}
                        <Button.Group>
                            <Button onClick={this.openCheatSheet} icon size="small" aria-label="Open the help guide"><Icon name="question circle" /></Button>
                        </Button.Group>
                    </div>
                </div>
                <div className="row" style={{paddingTop:0}}>
                    <div className="column form field ui">
                        <Dimmer active={this.state.loading} inverted>
                            <Loader>Uploading image</Loader>
                        </Dimmer>

                        <textarea 
                            style={{fontFamily: 'Courier New', fontWeight:'bold', height:'100%', maxHeight: 'initial'}}
                            ref="markdownTextarea"
                            aria-label={this.context.intl.formatMessage(this.messages.markdown_area)} 
                            onChange={this.handleChange.bind(this)} 
                            value={this.props.title === this.state.title ? this.state.markdownContent: ((!this.props.markdown.trim() || this.props.markdown.trim() === '') && this.props.content ? t_converter.turndown(this.props.content) : this.props.markdown)}
                            onDrop={this.handleOnDrop} 
                            onDragOver={this.handleOnDragOver} 
                        />
                    </div>
                    <div className="column" style={{boxShadow: 'rgba(0, 0, 0, 0.25) 0px 0px 12px', padding:0, margin: '0 20px'}}>
                        <SlideContentView content={this.props.title === this.state.title ? this.state.htmlContent: this.props.content}
                        speakernotes='' hideSpeakerNotes={true} theme={deckTheme} hideBorder={true} markdownEditorView={true} />
                    </div>
                  </div>
                </div>
            </div>
        );
    }

}

MarkdownEditor.contextTypes = {
    executeAction: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired
};

MarkdownEditor = connectToStores(MarkdownEditor, [SlideEditStore, UserProfileStore, DataSourceStore, SlideViewStore, DeckTreeStore, MediaStore], (context, props) => {

    return {
        SlideEditStore: context.getStore(SlideEditStore).getState(),
        SlideViewStore: context.getStore(SlideViewStore).getState(),
        UserProfileStore: context.getStore(UserProfileStore).getState(),
        DataSourceStore: context.getStore(DataSourceStore).getState(),
        DeckTreeStore: context.getStore(DeckTreeStore).getState(),
        MediaStore: context.getStore(MediaStore).getState()
    };
});
export default MarkdownEditor;

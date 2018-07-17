import {BaseStore} from 'fluxible/addons';

class SlideViewStore extends BaseStore {
    constructor(dispatcher) {
        super(dispatcher);
        //this.dispatcher = dispatcher; // Provides access to waitFor and getStore methods
        this.id = '';
        this.slideId = '';
        this.title = '';
        this.content = '';
        this.speakernotes = '';
        this.tags = [];
        this.scaleRatio = 1;
    }

    updateContent(payload) {
        if (payload.slide.revisions !== undefined)
        {
            //this.id = payload.slide.id;
            this.slideId = payload.selector.sid;
            let lastRevision = payload.slide.revisions[payload.slide.revisions.length-1];
            this.title = lastRevision.title;
            this.content = lastRevision.content;
            this.speakernotes = lastRevision.speakernotes;
            this.tags = lastRevision.tags? lastRevision.tags: [];
            this.emitChange();
        }
        else
        {
            this.slideId = '';
            this.title = 'title not found';
            this.content = 'content not found';
            this.tags = [];
            this.emitChange();
        }
    }

    getState() {
        return {
            id: this.id,
            slideId: this.slideId,
            title: this.title,
            content: this.content,
            tags: this.tags,
            speakernotes: this.speakernotes,
            scaleRatio: this.scaleRatio
        };
    }

    dehydrate() {
        return this.getState();
    }

    rehydrate(state) {
        this.id = state.id;
        this.slideId = state.slideId;
        this.title = state.title;
        this.content = state.content;
        this.tags = state.tags;
        this.speakernotes = state.speakernotes;
        this.scaleRatio = state.scaleRatio;
    }

    zoomContent(payload) {
        if (payload.mode === 'view') {
            switch (payload.direction) {
                case 'in':
                    this.scaleRatio += 0.25;
                    break;

                case 'out':
                    this.scaleRatio -= 0.25;
                    break;

                case 'reset':
                    this.scaleRatio = 1;
                    break;
            }
        }
        this.emitChange();
    }
}

SlideViewStore.storeName = 'SlideViewStore';
SlideViewStore.handlers = {
    'LOAD_SLIDE_CONTENT_SUCCESS': 'updateContent',
    'ZOOM': 'zoomContent'
};

export default SlideViewStore;

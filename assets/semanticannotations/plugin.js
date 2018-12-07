'use strict'; 

CKEDITOR.plugins.add('semanticannotations', {
    icons: 'automaticAnnotation',
    //collectionId: null,
    annotationsFromServer: [],
    annotationsToStore: [],
    onLoad: function() {
       CKEDITOR.addCss(
           `annotation {
               background: #0e75de82;
           	   color: #fff;
               padding: 0;
           	   border-radius: 3px;
               cursor:pointer;
               margin:0 -1px;
               display:inline-block;
            }`
        );
    },
    init: function(editor) {
        let annotationHandler = new AnnotationHandler;
        var pluginDirectory = this.path;
            
        editor.addCommand('editAnnotation', new CKEDITOR.dialogCommand('annotationDialog'));
        
        editor.addCommand('createManualAnnotation', {
            exec: function(editor) {
                /*
                DEPRECATED, changed how new annotations are created
                var annotation = editor.document.createElement('annotation', {
                    'attributes': {
                        'annotation-id': annotationId
                    }
                });
                var selectedText = editor.getSelection().getSelectedText();
                annotationHandler.createJsonLd('', '', selectedText, annotationId, false); //createJsonLd(resource, types, name, id, autoGenerated) {
                
                annotation.setText(selectedText);
                editor.insertElement(annotation);
                */
               
                editor.execCommand('editAnnotation');
            }
        });
        
        editor.addCommand('deleteAnnotation', {
            exec: function(editor) {
                let selectedAnnotation = editor.plugins.semanticannotations.getSelectedAnnotation(editor);
                
                if (selectedAnnotation != null) {
                    selectedAnnotation.remove(true);
                }
                editor.execCommand('getAnnotationsToStore');
            }
        });
                
        editor.addCommand('automaticAnnotation', {
            exec: function(editor) {
                // remove all auto generated annotations to prevent annotations being added twice
                editor.execCommand('removeAutoGeneratedAnnotations');
                annotationHandler.removeAutoGeneratedAnnotations();
                
                let textToAnnotate = editor.getData();
                annotationHandler.automaticAnnotation(textToAnnotate).then((annotatedText) => {
                    editor.setData(annotatedText, {noSnapshot: true});
                    editor.execCommand('getAnnotationsToStore');
                });
            }
        });
        
        editor.addCommand('removeAutoGeneratedAnnotations', {
            exec: function(editor) {
                let annotations = annotationHandler.getAutoGeneratedAnnotations();
                
                for (let i=0; i<annotations.length; i++) {
                    let id = annotations[i];
                    let annotation = editor.document.findOne('annotation[annotation-id="' + id +'"]');
                    
                    if (annotation != null) {
                        annotation.remove(true);
                    }
                }
            }
        });
        
        editor.addCommand('loadAnnotations', {
            exec: function(editor) {
                //annotationHandler.annotationsFromServer = editor.plugins.semanticannotations.annotationsFromServer;
                if (!annotationHandler.inlineAnnotations) {
                    // load annotations from server
                    //annotationHandler.loadAnnotationsFromServer();
                    var annotations = editor.plugins.semanticannotations.annotationsFromServer;
                    //console.log('ADD!', annotations);
                    annotationHandler.loadAnnotations(annotations);
                } else {
                    // load annotations from inline script 
                    editor.plugins.semanticannotations.loadAnnotationsInlineJsonLd(editor);
                }
            }
        });
        
        editor.addCommand('getAnnotationsToStore', {
            exec: function(editor) {
                if (!annotationHandler.inlineAnnotations) {
                    let annotationIds = editor.plugins.semanticannotations.getAllAnnotationIds(editor);
                    let annotationsToStore = annotationHandler.getAnnotationsToStore(annotationIds);
                    
                    editor.plugins.semanticannotations.annotationsToStore = annotationsToStore;
                } else {
                    editor.plugins.semanticannotations.updateInlineJsonLd(editor, annotationHandler);
                }                
            }
        });
        
        editor.ui.addButton('createManualAnnotation', {
            label: 'Create annotation',
            command: 'createManualAnnotation',
            toolbar: 'insert'
        });
        
        editor.ui.addButton('deleteAnnotation', {
            label: 'Delete annotation',
            command: 'deleteAnnotation',
            toolbar: 'insert'
        });
        
        editor.ui.addButton('automaticAnnotation', {
            label: 'Automatically annotate text',
            command: 'automaticAnnotation',
            toolbar: 'insert'
        });
        
        CKEDITOR.dialog.add( 'annotationDialog', function( editor ) {
            return {
                title: 'Annotation Properties',
                minWidth: 400,
                minHeight: 200,
                contents: [
                    {
                        id: 'tab-basic',
                        label: 'Settings',
                        elements: [
                            {
                                type: 'text',
                                id: 'uri',
                                label: 'Resource URI'
                            },
                            {
                                type: 'text',
                                id: 'types',
                                label: 'Types'
                            },
                            {
                                type: 'html',
                                html: '<input type="hidden" id="Schema:name" value="">'
                            }
                        ]
                    },
                    {
                        id: 'tab-search',
                        label: 'Find resource',
                        elements: [
                            {
                                type: 'text',
                                id: 'query',
                                label: 'Search term'
                            },
                            {
                                type: 'button',
                                id: 'submit',
                                label: 'Search',
                                title: 'Search now',
                                onClick: function() {
                                    let query = this.getDialog().getValueOf('tab-search', 'query');
                                    let document = this.getDialog().getElement().getDocument();
                                    let results = document.getById('search-results');
                                    let getDialogData = this.getDialog();
                                    
                                    results.setHtml('Loading...');

                                    fetch('http://lookup.dbpedia.org/api/search.asmx/KeywordSearch?QueryString=' + query +'&MaxHits=10', {
                                            method: 'GET',
                                            headers: {
                                              'Accept': 'application/json',
                                            },
                                        })
                                        .then(function(response) {
                                            return response.json();
                                        })
                                        .then(function(jsonResponse) {
                                            let resultsItem = '';
                                            
                                            if (jsonResponse.results.length > 0) {
                                                resultsItem = '<ul>';
                                                
                                                for (let i=0; i<jsonResponse.results.length; i++) {
                                                    let result = jsonResponse.results[i];
                                                    let types = result.classes;
                                                    let annotationTypes = [];
                                                    
                                                    for (let j=0;j<types.length;j++) {
                                                        let type = types[j];
                                                        
                                                        if (type['uri'].startsWith('http://dbpedia.org/ontology/') || type['uri'].startsWith('http://schema.org/')) {
                                                            let abbrType = type['uri'].replace('http://dbpedia.org/ontology/', 'DBpedia:').replace('http://schema.org/', 'Schema:');
                                                            annotationTypes.push(abbrType);
                                                        }
                                                    }
                                                    annotationTypes = annotationTypes.join(',');
                                                    
                                                    resultsItem += `<li style="margin:8px;display:flex">
                                                        <div>
                                                        <strong>${result.label}</strong> <br />
                                                        <p style="overflow: hidden;text-overflow: ellipsis;display: -webkit-box;-webkit-line-clamp: 2;-webkit-box-orient: vertical;white-space:normal">
                                                            ${result.description}
                                                        </p>
                                                        </div>
                                                        <div>
                                                            <a class="cke_dialog_ui_button" data-id="select-resource" data-uri="${result.uri}" data-types="${annotationTypes}" style="margin:5px 10px 0;padding:4px 4px;">Select</a>
                                                        </div>
                                                    </li>`;
                                                }
                                                
                                                resultsItem += '</ul>';
                                            } else {
                                                resultsItem = 'No results';
                                            }
                                
                                            results.setHtml(resultsItem);

                                            let buttons = CKEDITOR.document.find('a[data-id="select-resource"]');

                                            for (let i=0;i<buttons.$.length;i++) {
                                                buttons.getItem(i).on('click', function(e) {
                                                    let newUri = e.data.$.target.getAttribute('data-uri');
                                                    let newTypes = e.data.$.target.getAttribute('data-types');
                                                    
                                                    getDialogData.getContentElement('tab-basic', 'uri').setValue(newUri);
                                                    getDialogData.getContentElement('tab-basic', 'types').setValue(newTypes);
                                                    getDialogData.selectPage('tab-basic');
                                                });
                                            }
                                        });
                                }
                            },
                            {
                                type: 'html',
                                html: '<div id="search-results" style="max-height:200px;width:400px;overflow-y:auto;"></div>'
                            }
                        ]
                    }
                ],
                onShow: function(e) {
                    let annotationData = editor.plugins.semanticannotations.getAnnotationData(editor, annotationHandler);
                    var document = this.getElement().getDocument();
                    
                    // clear results 
                    let results = document.getById('search-results').setHtml('');
                    
                    // check if it is an new annotation or an existing one
                    if (annotationData != null) {
                        this.getContentElement('tab-basic', 'uri').setValue(annotationData['@id']);
                        this.getContentElement('tab-basic', 'types').setValue(annotationData['@type']);
                                                
                        var name = document.getById('Schema:name');
                        name.setValue(annotationData['Schema:name']);
                    } /*else {
                        // there is no json-ld data yet for newly created annotations,
                        // thus get the text of the selected word 
                        
                        var selection = editor.plugins.semanticannotations.getSelectedAnnotation(editor);
                        var selectionText = selection.getText();
                        var name = document.getById('Schema:name');
                        name.setValue(selectionText);
                        
                    }*/
                },
                onOk: function() {
                    var dialog = this;
                    var document = this.getElement().getDocument();
        
                    let annotationData = editor.plugins.semanticannotations.getAnnotationData(editor, annotationHandler);

                    if (annotationData === null) {
                        var annotationId = annotationHandler.createAnnotationId();
                        var annotation = editor.document.createElement('annotation', {
                            'attributes': {
                                'annotation-id': annotationId
                            }
                        });
                        var selectedText = editor.getSelection().getSelectedText();
                        annotationHandler.createJsonLd('', '', selectedText, annotationId, false); //createJsonLd(resource, types, name, id, autoGenerated) {
                        
                        annotation.setText(selectedText);
                        editor.insertElement(annotation);
                        
                        var newName = document.getById('Schema:name');
                        newName.setValue(selectedText);
                    } else {
                        var annotationId = annotationData['Schema:identifier'];
                    }
                    
                    let uri = dialog.getValueOf('tab-basic', 'uri');
                    let name = document.getById('Schema:name').getValue();
                    let types = dialog.getValueOf('tab-basic', 'types');
                    
                    let data = {
                        '@id': uri,
                        'Schema:name': name,
                        '@type': annotationHandler.typesStringToArray(types)
                    };
                    
                    editor.plugins.semanticannotations.setAnnotationData(editor, annotationHandler, data, annotationId);
                    editor.execCommand('getAnnotationsToStore');
                }
            };
        });
        
        if (editor.contextMenu) {
            editor.addMenuGroup('annotationGroup');
            
            editor.addMenuItem('createAnnotation', {
                label: 'Create annotation',
                command: 'createManualAnnotation',
                group: 'annotationGroup'
            });
            
            editor.addMenuItem('editAnnotation', {
                label: 'Edit annotation',
                command: 'editAnnotation',
                group: 'annotationGroup'
            });
            
            editor.addMenuItem('deleteAnnotation', {
                label: 'Delete annotation',
                command: 'deleteAnnotation',
                group: 'annotationGroup'
            });

            editor.contextMenu.addListener( function( element ) {
                if ( element.getAscendant( 'annotation', true ) ) {
                    return { 
                        editAnnotation: CKEDITOR.TRISTATE_OFF,
                        deleteAnnotation: CKEDITOR.TRISTATE_OFF,
                    };
                } else {
                    return { createAnnotation: CKEDITOR.TRISTATE_OFF };
                }
            });
        }
    },
    
    getAllAnnotationIds: function(editor) {
        let allAnnotations = editor.document.find('annotation');
        let returnIds = [];

        for (let i=0; i<allAnnotations.$.length; i++) {
            let annotationId = allAnnotations.$[i].getAttribute('annotation-id');
            returnIds.push(annotationId);
        }
        return returnIds;
    },
    
    getAnnotationData: function(editor, annotationHandler) {
        let selectedAnnotation = editor.plugins.semanticannotations.getSelectedAnnotation(editor);
        if (selectedAnnotation !== null) {
            let annotationId = selectedAnnotation.getAttribute('annotation-id');
            return annotationHandler.getJsonLd(annotationId);
        }
        return null;
    },
    
    setAnnotationData: function(editor, annotationHandler, data, annotationId) {
        //let selectedAnnotation = editor.plugins.semanticannotations.getSelectedAnnotation(editor);
        //let annotationId = selectedAnnotation.getAttribute('annotation-id');
        return annotationHandler.updateJsonLd(annotationId, data);
    },
    
    getSelectedAnnotation: function(editor) {
        var editorSelection = editor.getSelection().getStartElement();
        var parents = editorSelection.getParents();
        
        for (let i=0; i<parents.length; i++) {
            if (parents[i].is('annotation')) {
                return parents[i];
            }
        }
        
        return null;
    },
    
    updateInlineJsonLd: function(editor, annotationHandler) {
        let annotations = editor.plugins.semanticannotations.getAllAnnotationIds(editor);
        
        let jsonLd = annotationHandler.getInlineJsonLd(annotations);
        
        // if exists: remove the existing json-ld script tag
        let existingJsonLd = editor.document.findOne('#jsonLd'); 

        if (existingJsonLd != null) {
            existingJsonLd.remove();
        }
        
        // move the cursur to the end of the editor, to insert json-ld at the end of the document
        var range = editor.createRange();
        range.moveToElementEditEnd(range.root);
        editor.getSelection().selectRanges([ range ]);
        
        // insert the newly generated json-ld
        var element = new CKEDITOR.dom.element('script').setAttribute('type', 'application/ld+json').setAttribute('id', 'jsonLd');
        element.setHtml(JSON.stringify(jsonLd));
        editor.insertElement(element, range);
    },
    
    // TOOD: currently it is not possible to get the script tag, because ckeditor is wrapping it in cke_protected
    // needs to be fixed in order to use inline json-ld in the editor 
    loadAnnotationsInlineJsonLd: function(editor) {
        let existingJsonLd = editor.document.findOne('#jsonLd'); 
        
        if (existingJsonLd != null) {
            
        } else {
            
        }
    }
});

class AnnotationHandler {
    constructor(){
        this.jsonLdStore = {};
        this.inlineAnnotations = false; 
        //this.collectionId = null;
    }
    
    automaticAnnotation(textToAnnotate) {
        return fetch('https://api.dbpedia-spotlight.org/en/annotate', {
                method: 'POST',
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: 'text=' + encodeURIComponent(textToAnnotate) + '&confidence=0.6'
            })
            .then(function(response) {
                return response.json();
            })
            .then(function(jsonResponse) {
                let data = jsonResponse;
                
                let resources = data.Resources;
                let originalText = data['@text'];
                let annotatedTextReturn = [];
                let start = 0;
                
                for (let i=0; i<resources.length; i++) {
                    let resource = resources[i],
                        word = resource['@surfaceForm'],
                        wordLength = parseInt(resource['@surfaceForm'].length),
                        offset = parseInt(resource['@offset']),
                        url = resource['@URI'],
                        types = resource['@types'],
                        randomId = this.createAnnotationId();
                    
                    const annotatedWord = (
                        `<annotation annotation-id="${randomId}">${word}</annotation>`
                    );
                    
                    let addText = originalText.substring(start, offset);
                    
                    // do not replace html tags or attributes
                    if (!this.isTextNode(addText)) {
                        continue;
                    }
                    
                    // create the json ld
                    let jsonLd = this.createJsonLd(url, types, word, randomId, true);
                    
                    annotatedTextReturn.push(addText); // don't add + wordLength, because the word is being added below
                    annotatedTextReturn.push(annotatedWord);
                    
                    start = offset + wordLength; 
                }
                annotatedTextReturn.push(originalText.substring(start)); // add the last part of the text, in case the last word is not an annotated word
                
                return annotatedTextReturn.join('');
            }.bind(this));
    }
    
    // Check if a certain input is text or an HTML tag/attribute
    isTextNode(input) {
        let openingTagAmount = input.match(/</g) ? input.match(/</g).length : 0;
        let closingTagAmount = input.match(/>/g) ? input.match(/>/g).length : 0;
    
        if (openingTagAmount > closingTagAmount) {
            return false;
        }
        return true;
    }
    
    createJsonLd(resource, types, name, id, autoGenerated) {
        types = this.typesStringToArray(types);
        
        let jsonLd = {
        	//"_collectionId": this.collectionId, // == slide id 
        	"@context": {
                "Schema": "http://schema.org/",
                "Wikidata": "http://www.wikidata.org/entity/",
                "DBpedia": "http://dbpedia.org/ontology/"
        	},
        	"@id": resource,
        	"@type": types,
        	"Schema:name": name,
        	"Schema:identifier": id,
            "_autoGenerated": autoGenerated
        }

        this.jsonLdStore[id] = jsonLd;
    }
    
    // ensure that 'types' is always an array
    typesStringToArray(types) {
        types = types.indexOf(',') > -1 ? types.split(',') : types;
        types = Array.isArray(types) ? types : types != '' ? [types] : [];
        return types;
    }
    
    removeJsonLd(id) {
        delete this.jsonLdStore[id];
    }
    
    getJsonLd(id) {
        return typeof this.jsonLdStore[id] !== 'undefined' ? this.jsonLdStore[id] : null;
    }
    
    updateJsonLd(id, data) {
        this.jsonLdStore[id] = {...this.jsonLdStore[id], ...data}; //update
    }
    
    getAutoGeneratedAnnotations() {
        let returnIds = [];
        
        for (var jsonLd in this.jsonLdStore) {
            if (this.jsonLdStore[jsonLd]['_autoGenerated']) {
                returnIds.push(jsonLd);
            }
        }
        
        return returnIds;
    }
    
    removeAutoGeneratedAnnotations() {
        let autoGeneratedAnnotations = this.getAutoGeneratedAnnotations();
        
        for (let i=0; i<autoGeneratedAnnotations.length; i++) {
            let id = autoGeneratedAnnotations[i];
            this.removeJsonLd(id);
        }
    }
    
    createAnnotationId() {
        return Math.random().toString(36).substr(2, 9);
    }
    
    getAnnotationsToStore(annotationIds) {
        var jsonToStore = [];
        
        for (let i=0; i<annotationIds.length; i++) {
            let json = this.getJsonLd(annotationIds[i]);
            if (typeof json !== 'undefined' && json !== null) {
                jsonToStore.push(json);
            }
        }
        
        return jsonToStore;
    }
    
    getInlineJsonLd(annotationIds) {
        if (this.inlineAnnotations) {
            var inlineJson = [];
            
            for (let i=0; i<annotationIds.length; i++) {
                let json = this.getJsonLd(annotationIds[i]);
                if (typeof json !== 'undefined') {
                    inlineJson.push(json);
                }
            }
            
            return inlineJson;
        }
    }
    
    loadAnnotations(annotations) {
        for (let i=0; i<annotations.length; i++) {
            this.jsonLdStore[annotations[i]['Schema:identifier']] = annotations[i];
        }
    }
    
    /*loadAnnotationsFromServer() {        
        fetch('http://localhost:3030/annotations/' + this.collectionId)
            .then(function(response) {
                return response.json();
            })
            .then(function(jsonResponse) {
                let annotations = jsonResponse;

                for (let i=0; i<annotations.length; i++) {
                    delete annotations[i]['_id']; // remove the ids, on save new ids will be generated
                    this.jsonLdStore[annotations[i]['Schema:identifier']] = annotations[i];
                }
            }.bind(this));
    }*/
}